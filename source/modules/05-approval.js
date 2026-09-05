(function defineApproval(root) {
  'use strict';

  const { clone, uid } = root.YC.utils;

  const REQUEST_TRANSITIONS = Object.freeze({
    DRAFT: Object.freeze(['SUBMITTED', 'WITHDRAWN']),
    SUBMITTED: Object.freeze(['IN_REVIEW', 'APPROVED', 'CHANGES_REQUESTED', 'REJECTED', 'CONFLICTED', 'WITHDRAWN']),
    IN_REVIEW: Object.freeze(['APPROVED', 'CHANGES_REQUESTED', 'REJECTED', 'CONFLICTED']),
    CHANGES_REQUESTED: Object.freeze(['SUBMITTED', 'WITHDRAWN']),
    APPROVED: Object.freeze([]),
    REJECTED: Object.freeze([]),
    CONFLICTED: Object.freeze([]),
    WITHDRAWN: Object.freeze([]),
  });

  const RESOURCES = Object.freeze({
    COURSE: Object.freeze({ collection: 'courses', versionKey: 'version' }),
    COURSE_VERSION: Object.freeze({ collection: 'courseVersions', versionKey: 'recordVersion' }),
    CLASS: Object.freeze({ collection: 'classes', versionKey: 'version' }),
    SESSION: Object.freeze({ collection: 'sessions', versionKey: 'version' }),
  });

  const PERMISSIONS = Object.freeze({
    'COURSE.CREATE': 'course.request_create',
    'COURSE.UPDATE': 'course.request_update',
    'COURSE.ARCHIVE': 'course.request_archive',
    'COURSE_VERSION.CREATE': 'course.request_update',
    'COURSE_VERSION.UPDATE': 'course.request_update',
    'COURSE_VERSION.PUBLISH': 'course.publish',
    'CLASS.CREATE': 'class.request_create',
    'CLASS.UPDATE': 'class.request_update',
    'CLASS.ARCHIVE': 'class.request_archive',
    'SESSION.CREATE': 'session.request_create',
    'SESSION.UPDATE': 'session.request_reschedule',
    'SESSION.RESCHEDULE': 'session.request_reschedule',
    'SESSION.CANCEL': 'session.request_cancel',
  });

  function approvalError(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
  }

  function definition(resourceType) {
    const result = RESOURCES[resourceType];
    if (!result) throw approvalError('UNSUPPORTED_RESOURCE', 'Loại dữ liệu chưa được hỗ trợ trong luồng phê duyệt.');
    return result;
  }

  function permissionFor(resourceType, operation) {
    const permissionId = PERMISSIONS[`${resourceType}.${operation}`];
    if (!permissionId) throw approvalError('UNSUPPORTED_OPERATION', 'Thao tác chưa được hỗ trợ trong luồng phê duyệt.');
    return permissionId;
  }

  function diff(before, after) {
    const left = before || {};
    const right = after || {};
    return [...new Set([...Object.keys(left), ...Object.keys(right)])].sort().filter((field) => (
      JSON.stringify(left[field]) !== JSON.stringify(right[field])
    )).map((field) => ({ field, before: clone(left[field] ?? null), after: clone(right[field] ?? null) }));
  }

  function validateSession(snapshot, state, operation, excludeSessionId = null) {
    if (operation === 'CREATE') {
      if (!state.classes.some((item) => item.id === snapshot.classId)) throw approvalError('CLASS_NOT_FOUND', 'Không tìm thấy lớp của buổi học.');
      if (!state.lessonTemplates.some((item) => item.id === snapshot.lessonTemplateId)) throw approvalError('LESSON_NOT_FOUND', 'Không tìm thấy bài học mẫu.');
    }
    if (['CREATE', 'RESCHEDULE', 'UPDATE'].includes(operation)) {
      const startsAt = new Date(snapshot.startsAt).getTime();
      const endsAt = new Date(snapshot.endsAt).getTime();
      if (!Number.isFinite(startsAt) || !Number.isFinite(endsAt) || endsAt <= startsAt) {
        throw approvalError('INVALID_SESSION_TIME', 'Thời gian kết thúc phải sau thời gian bắt đầu.');
      }
    }
    if (['CREATE', 'RESCHEDULE', 'UPDATE'].includes(operation) && root.YC.selectors?.sessionValidation) {
      const validation = root.YC.selectors.sessionValidation(state, { ...snapshot, excludeSessionId });
      if (!validation.valid) throw approvalError(validation.errors[0].code, validation.errors[0].message);
    }
  }

  function validateCourse(snapshot, state, excludeId = null) {
    const code = String(snapshot.code || '').trim().toUpperCase();
    if (!code || !String(snapshot.name || '').trim()) throw approvalError('COURSE_REQUIRED', 'Cần mã và tên khóa học.');
    if (!state.programs.some((item) => item.id === snapshot.programId)) throw approvalError('PROGRAM_NOT_FOUND', 'Không tìm thấy chương trình.');
    if (!state.levels.some((item) => item.id === snapshot.levelId && item.programId === snapshot.programId)) throw approvalError('LEVEL_PROGRAM_MISMATCH', 'Cấp độ không thuộc chương trình đã chọn.');
    if (state.courses.some((item) => item.id !== excludeId && String(item.code).toUpperCase() === code)) throw approvalError('COURSE_CODE_EXISTS', 'Mã khóa học đã tồn tại.');
  }

  function validateClass(snapshot, state, excludeId = null) {
    const code = String(snapshot.code || '').trim().toUpperCase();
    if (!code || !String(snapshot.name || '').trim()) throw approvalError('CLASS_REQUIRED', 'Cần mã và tên lớp học.');
    if (!state.branches.some((item) => item.id === snapshot.branchId && item.status === 'ACTIVE')) throw approvalError('BRANCH_NOT_FOUND', 'Không tìm thấy chi nhánh đang hoạt động.');
    const version = state.courseVersions.find((item) => item.id === snapshot.courseVersionId);
    if (!version || version.status !== 'PUBLISHED' || !version.immutable) throw approvalError('COURSE_VERSION_NOT_PUBLISHED', 'Lớp chỉ được gắn với phiên bản khóa học đã công bố.');
    const capacity = Number(snapshot.capacity || 0);
    const minimum = Number(snapshot.minCapacity || 1);
    if (!Number.isInteger(capacity) || capacity < 1 || !Number.isInteger(minimum) || minimum < 1 || minimum > capacity) throw approvalError('INVALID_CLASS_CAPACITY', 'Sức chứa tối thiểu và tối đa của lớp không hợp lệ.');
    if (state.classes.some((item) => item.id !== excludeId && String(item.code).toUpperCase() === code)) throw approvalError('CLASS_CODE_EXISTS', 'Mã lớp đã tồn tại.');
    if (snapshot.startDate && snapshot.endDate && new Date(snapshot.endDate).getTime() < new Date(snapshot.startDate).getTime()) throw approvalError('INVALID_CLASS_DATES', 'Ngày kết thúc phải sau ngày bắt đầu.');
  }

  function buildRequest(input, context) {
    const resourceType = String(input.resourceType || '').toUpperCase();
    const operation = String(input.operation || '').toUpperCase();
    const config = definition(resourceType);
    permissionFor(resourceType, operation);
    const collection = context.state[config.collection];
    const resourceId = input.resourceId || null;
    const before = resourceId ? collection.find((item) => item.id === resourceId) || null : null;
    if (operation !== 'CREATE' && !before) throw approvalError('RESOURCE_NOT_FOUND', 'Không tìm thấy dữ liệu gốc cần thay đổi.');
    const proposedSnapshot = clone(input.proposedSnapshot || {});
    if (!Object.keys(proposedSnapshot).length && !['ARCHIVE', 'CANCEL'].includes(operation)) {
      throw approvalError('PROPOSAL_REQUIRED', 'Cần có nội dung thay đổi được đề xuất.');
    }
    if (resourceType === 'SESSION') validateSession({ ...(before || {}), ...proposedSnapshot }, context.state, operation, resourceId);
    if (resourceType === 'COURSE' && !['ARCHIVE'].includes(operation)) validateCourse({ ...(before || {}), ...proposedSnapshot }, context.state, resourceId);
    if (resourceType === 'CLASS' && !['ARCHIVE'].includes(operation)) validateClass({ ...(before || {}), ...proposedSnapshot }, context.state, resourceId);
    const provisionalResourceId = operation === 'CREATE'
      ? proposedSnapshot.provisionalId || proposedSnapshot.id || uid(resourceType.toLowerCase())
      : null;
    return {
      id: uid('change-request'),
      resourceType,
      operation,
      resourceId,
      provisionalResourceId,
      baseVersion: Number(input.baseVersion ?? 0),
      beforeSnapshot: clone(before),
      proposedSnapshot,
      diff: diff(before, proposedSnapshot),
      reason: String(input.reason || '').trim(),
      submittedBy: context.actorId,
      submittedAt: context.now,
      status: 'SUBMITTED',
      revision: Number(input.revision || 1),
      reviewerId: null,
      reviewNote: null,
      reviewedAt: null,
      appliedAt: null,
      eventIds: [],
    };
  }

  function assertReviewable(request) {
    if (!request) throw approvalError('REQUEST_NOT_FOUND', 'Không tìm thấy yêu cầu phê duyệt.');
    if (!['SUBMITTED', 'IN_REVIEW'].includes(request.status)) {
      throw approvalError('REQUEST_NOT_REVIEWABLE', 'Yêu cầu không còn ở trạng thái có thể duyệt.');
    }
    return request;
  }

  function transition(request, nextStatus) {
    if (!(REQUEST_TRANSITIONS[request.status] || []).includes(nextStatus)) {
      throw approvalError('INVALID_REQUEST_TRANSITION', `Không thể chuyển yêu cầu từ ${request.status} sang ${nextStatus}.`);
    }
    request.status = nextStatus;
    return request;
  }

  function stale(request, state) {
    const config = definition(request.resourceType);
    const collection = state[config.collection];
    if (request.operation === 'CREATE') {
      return request.baseVersion !== 0 || collection.some((item) => item.id === request.provisionalResourceId);
    }
    const canonical = collection.find((item) => item.id === request.resourceId);
    return !canonical || Number(canonical[config.versionKey] || 0) !== Number(request.baseVersion);
  }

  function applyChange(request, state) {
    const config = definition(request.resourceType);
    const collection = state[config.collection];
    if (request.operation === 'CREATE') {
      const proposed = clone(request.proposedSnapshot);
      delete proposed.provisionalId;
      const record = {
        ...proposed,
        id: request.provisionalResourceId,
        [config.versionKey]: Number(proposed[config.versionKey] || 1),
        changeRequestId: request.id,
      };
      if (request.resourceType === 'SESSION') validateSession(record, state, request.operation);
      if (request.resourceType === 'COURSE') validateCourse(record, state);
      if (request.resourceType === 'CLASS') validateClass(record, state);
      collection.push(record);
      if (request.resourceType === 'CLASS' && Array.isArray(record.recurrence) && record.recurrence.length) {
        state.timetableRules.push({
          id: uid('timetable'), classId: record.id, recurrence: clone(record.recurrence),
          durationMinutes: Number(record.durationMinutes || 90), room: record.room,
          branchId: record.branchId, timezone: record.timezone || 'Asia/Ho_Chi_Minh', status: 'ACTIVE',
        });
      }
      if (request.resourceType === 'SESSION') {
        state.lessonPlans.push({ id: uid('lesson-plan'), sessionId: record.id, lessonTemplateId: record.lessonTemplateId, adaptations: [], readiness: 'DRAFT', ownerId: request.submittedBy });
        const assignments = state.teacherAssignments.filter((item) => item.classId === record.classId && ['ACCEPTED', 'ACTIVE'].includes(item.status));
        assignments.forEach((assignment) => state.sessionAssignments.push({ id: uid('session-assignment'), sessionId: record.id, teacherProfileId: assignment.teacherProfileId, role: assignment.role, status: 'ACTIVE', startsAt: record.startsAt, endsAt: record.endsAt }));
      }
      return record;
    }

    const canonical = collection.find((item) => item.id === request.resourceId);
    if (!canonical) throw approvalError('RESOURCE_NOT_FOUND', 'Không tìm thấy dữ liệu gốc cần áp dụng.');
    if (request.resourceType === 'COURSE' && !['ARCHIVE'].includes(request.operation)) validateCourse({ ...canonical, ...request.proposedSnapshot }, state, canonical.id);
    if (request.resourceType === 'CLASS' && !['ARCHIVE'].includes(request.operation)) validateClass({ ...canonical, ...request.proposedSnapshot }, state, canonical.id);
    if (request.resourceType === 'SESSION' && ['RESCHEDULE', 'UPDATE'].includes(request.operation)) {
      validateSession({ ...canonical, ...request.proposedSnapshot }, state, request.operation, canonical.id);
      canonical.scheduleRevisions ||= [];
      canonical.scheduleRevisions.push({
        startsAt: canonical.startsAt, endsAt: canonical.endsAt, room: canonical.room, mode: canonical.mode,
        version: canonical[config.versionKey], changedByRequestId: request.id, changedAt: request.reviewedAt,
      });
    }
    if (request.operation === 'ARCHIVE') canonical.status = 'ARCHIVED';
    else if (request.operation === 'CANCEL') canonical.status = 'CANCELLED';
    else Object.assign(canonical, clone(request.proposedSnapshot));
    canonical.id = request.resourceId;
    canonical[config.versionKey] = Number(canonical[config.versionKey] || 0) + 1;
    canonical.changeRequestId = request.id;
    return canonical;
  }

  function resourceScope(input, state) {
    const proposed = input.proposedSnapshot || {};
    const resourceType = String(input.resourceType || '').toUpperCase();
    const config = RESOURCES[resourceType];
    const canonical = config && input.resourceId ? state[config.collection].find((item) => item.id === input.resourceId) : null;
    return {
      classId: proposed.classId || canonical?.classId || null,
      sessionId: resourceType === 'SESSION' ? input.resourceId || null : null,
      branchId: proposed.branchId || canonical?.branchId || null,
      organizationId: state.organizations[0]?.id,
    };
  }

  root.YC.define('approval', Object.freeze({
    REQUEST_TRANSITIONS,
    applyChange,
    assertReviewable,
    buildRequest,
    diff,
    permissionFor,
    resourceScope,
    stale,
    transition,
  }));
})(globalThis);
