(function defineCommands(root) {
  'use strict';

  const { clone, uid } = root.YC.utils;

  class CommandError extends Error {
    constructor(code, message, details = {}) {
      super(message);
      this.name = 'CommandError';
      this.code = code;
      Object.assign(this, details);
    }
  }

  function required(value, code, message) {
    if (!value) throw new CommandError(code, message);
    return value;
  }

  function requireRole(actor, roles) {
    required(actor, 'AUTH_REQUIRED', 'Cần đăng nhập để thực hiện thao tác này.');
    if (!roles.includes(actor.role) && actor.role !== 'ADMIN') {
      throw new CommandError('FORBIDDEN', 'Vai trò hiện tại không có quyền thực hiện thao tác này.');
    }
  }

  function create(store) {
    function nowIso() {
      return new Date(store.clock()).toISOString();
    }

    function appendEvent(draft, context, type, resourceType, resourceId, summary, extra = {}) {
      const event = {
        id: uid('event'),
        type,
        resourceType,
        resourceId,
        actorId: context.actor.id,
        occurredAt: nowIso(),
        summary,
        ...extra,
      };
      draft.domainEvents.unshift(event);
      context.eventIds.push(event.id);
      return event;
    }

    function appendAudit(draft, context, action, resourceType, resourceId, detail) {
      draft.auditLogs.unshift({
        id: uid('audit'),
        actorId: context.actor.id,
        action,
        resourceType,
        resourceId,
        detail,
        occurredAt: nowIso(),
      });
    }

    function notifyRole(draft, role, title, body, link = '') {
      const recipient = draft.users.find((item) => item.role === role && item.status === 'ACTIVE');
      if (!recipient) return;
      draft.notifications.unshift({ id: uid('notification'), userId: recipient.id, title, body, link, read: false, createdAt: nowIso() });
    }

    function requirePermission(draft, context, permissionId) {
      required(context.actor, 'AUTH_REQUIRED', 'Cần đăng nhập để thực hiện thao tác này.');
      const organizationId = draft.organizations[0]?.id;
      if (!root.YC.policy.can(context.actor, permissionId, { organizationId }, draft)) {
        throw new CommandError('FORBIDDEN', 'Tài khoản hiện tại không có quyền thực hiện thao tác này.');
      }
    }

    function requireReason(payload) {
      const reason = String(payload.reason || '').trim();
      if (!reason) throw new CommandError('REASON_REQUIRED', 'Cần ghi rõ lý do thay đổi quyền.');
      return reason;
    }

    function validatePermissionInput(draft, payload) {
      const permissionId = String(payload.permissionId || '').trim();
      required(draft.permissionDefinitions.find((item) => item.id === permissionId && item.status === 'ACTIVE'), 'PERMISSION_NOT_FOUND', 'Không tìm thấy quyền đang hoạt động.');
      const effect = String(payload.effect || '').toUpperCase();
      if (!['ALLOW', 'DENY'].includes(effect)) throw new CommandError('INVALID_PERMISSION_EFFECT', 'Hiệu lực quyền phải là Cho phép hoặc Từ chối.');
      const scopeType = String(payload.scopeType || 'ORGANIZATION').toUpperCase();
      if (!['ORGANIZATION', 'BRANCH', 'CLASS', 'SESSION', 'ASSIGNED_CLASS', 'OWN_LEARNER', 'LINKED_LEARNER'].includes(scopeType)) {
        throw new CommandError('INVALID_PERMISSION_SCOPE', 'Phạm vi quyền không hợp lệ.');
      }
      return { permissionId, effect, scopeType, scopeIds: Array.isArray(payload.scopeIds) ? payload.scopeIds.filter(Boolean) : [] };
    }

    function ensureAdminContinuity(draft) {
      const organizationId = draft.organizations[0]?.id;
      const safe = draft.users.filter((item) => item.role === 'ADMIN' && item.status === 'ACTIVE').some((admin) => (
        root.YC.policy.can(admin, 'access.manage_role', { organizationId }, draft)
        && root.YC.policy.can(admin, 'approval.decide', { organizationId }, draft)
      ));
      if (!safe) throw new CommandError('LAST_ADMIN_GUARD', 'Phải còn ít nhất một Quản trị viên có quyền quản lý truy cập và phê duyệt.');
    }

    function approvalCall(callback) {
      try {
        return callback();
      } catch (error) {
        throw new CommandError(error.code || 'APPROVAL_ERROR', error.message || 'Không thể xử lý yêu cầu phê duyệt.');
      }
    }

    function notifyUser(draft, userId, title, body, link) {
      if (!draft.users.some((item) => item.id === userId && item.status === 'ACTIVE')) return;
      draft.notifications.unshift({ id: uid('notification'), userId, title, body, link, read: false, createdAt: nowIso() });
    }

    function findLead(draft, leadId) {
      return required(draft.leads.find((item) => item.id === leadId), 'LEAD_NOT_FOUND', 'Không tìm thấy khách hàng.');
    }

    function latestForLead(collection, leadId) {
      return collection.filter((item) => item.leadId === leadId).at(-1) || null;
    }

    const handlers = {
      SET_ROLE_PERMISSION(draft, payload, context) {
        requirePermission(draft, context, 'access.manage_role');
        const reason = requireReason(payload);
        const role = String(payload.role || '').toUpperCase();
        required(draft.users.find((item) => item.role === role) || root.YC.permissions.roleDefaults.find((item) => item.role === role), 'ROLE_NOT_FOUND', 'Không tìm thấy vai trò.');
        const input = validatePermissionInput(draft, payload);
        const changedAt = nowIso();
        draft.rolePermissions.filter((item) => item.role === role
          && item.permissionId === input.permissionId
          && item.status !== 'REVOKED'
          && (!item.effectiveTo || new Date(item.effectiveTo).getTime() > new Date(changedAt).getTime()))
          .forEach((item) => {
            item.effectiveTo = changedAt;
            item.status = 'REPLACED';
          });
        const record = {
          id: uid('role-permission'), role, permissionId: input.permissionId, effect: input.effect,
          scopeType: input.scopeType, scopeIds: input.scopeIds,
          effectiveFrom: payload.effectiveFrom || changedAt, effectiveTo: payload.effectiveTo || null,
          status: 'ACTIVE', changedBy: context.actor.id, changedAt, reason,
        };
        draft.rolePermissions.push(record);
        ensureAdminContinuity(draft);
        appendEvent(draft, context, 'ROLE_PERMISSION_SET', 'ROLE_PERMISSION', record.id, `${role} · ${input.permissionId} · ${input.effect}.`);
        appendAudit(draft, context, 'ROLE_PERMISSION_SET', 'ROLE_PERMISSION', record.id, reason);
        return { message: 'Đã cập nhật quyền của vai trò.', rolePermissionId: record.id };
      },

      SET_USER_PERMISSION_OVERRIDE(draft, payload, context) {
        requirePermission(draft, context, 'access.manage_user_override');
        const reason = requireReason(payload);
        const user = required(draft.users.find((item) => item.id === payload.userId), 'USER_NOT_FOUND', 'Không tìm thấy tài khoản.');
        const input = validatePermissionInput(draft, payload);
        const grantedAt = nowIso();
        draft.userPermissionOverrides.filter((item) => item.userId === user.id
          && item.permissionId === input.permissionId
          && item.status !== 'REVOKED'
          && (!item.effectiveTo || new Date(item.effectiveTo).getTime() > new Date(grantedAt).getTime()))
          .forEach((item) => {
            item.effectiveTo = grantedAt;
            item.status = 'REPLACED';
          });
        const record = {
          id: uid('user-permission'), userId: user.id, permissionId: input.permissionId, effect: input.effect,
          scopeType: input.scopeType, scopeIds: input.scopeIds,
          effectiveFrom: payload.effectiveFrom || grantedAt, effectiveTo: payload.effectiveTo || null,
          status: 'ACTIVE', grantedBy: context.actor.id, grantedAt, reason,
        };
        draft.userPermissionOverrides.push(record);
        ensureAdminContinuity(draft);
        appendEvent(draft, context, 'USER_PERMISSION_OVERRIDE_SET', 'USER_PERMISSION_OVERRIDE', record.id, `${user.name} · ${input.permissionId} · ${input.effect}.`);
        appendAudit(draft, context, 'USER_PERMISSION_OVERRIDE_SET', 'USER_PERMISSION_OVERRIDE', record.id, reason);
        return { message: 'Đã lưu ngoại lệ quyền của tài khoản.', overrideId: record.id };
      },

      REVOKE_USER_PERMISSION_OVERRIDE(draft, payload, context) {
        requirePermission(draft, context, 'access.manage_user_override');
        const reason = requireReason(payload);
        const record = required(draft.userPermissionOverrides.find((item) => item.id === payload.overrideId), 'OVERRIDE_NOT_FOUND', 'Không tìm thấy ngoại lệ quyền.');
        if (record.status === 'REVOKED') throw new CommandError('OVERRIDE_ALREADY_REVOKED', 'Ngoại lệ quyền đã được thu hồi trước đó.');
        record.status = 'REVOKED';
        record.effectiveTo = nowIso();
        record.revokedBy = context.actor.id;
        record.revokedAt = nowIso();
        record.revokeReason = reason;
        ensureAdminContinuity(draft);
        appendEvent(draft, context, 'USER_PERMISSION_OVERRIDE_REVOKED', 'USER_PERMISSION_OVERRIDE', record.id, reason);
        appendAudit(draft, context, 'USER_PERMISSION_OVERRIDE_REVOKED', 'USER_PERMISSION_OVERRIDE', record.id, reason);
        return { message: 'Đã thu hồi ngoại lệ quyền.', overrideId: record.id };
      },

      SUBMIT_CHANGE_REQUEST(draft, payload, context) {
        required(context.actor, 'AUTH_REQUIRED', 'Cần đăng nhập để gửi yêu cầu.');
        const reason = String(payload.reason || '').trim();
        if (!reason) throw new CommandError('REASON_REQUIRED', 'Cần ghi rõ lý do đề xuất thay đổi.');
        const resourceType = String(payload.resourceType || '').toUpperCase();
        const operation = String(payload.operation || '').toUpperCase();
        const permissionId = approvalCall(() => root.YC.approval.permissionFor(resourceType, operation));
        const scope = root.YC.approval.resourceScope(payload, draft);
        if (!root.YC.policy.can(context.actor, permissionId, scope, draft)) {
          throw new CommandError('FORBIDDEN', 'Tài khoản hiện tại không có quyền gửi đề xuất này.');
        }
        const request = approvalCall(() => root.YC.approval.buildRequest({ ...payload, reason }, {
          actorId: context.actor.id,
          now: nowIso(),
          state: draft,
        }));
        draft.changeRequests.push(request);
        const event = appendEvent(draft, context, 'CHANGE_REQUEST_SUBMITTED', 'CHANGE_REQUEST', request.id, `${request.resourceType} · ${request.operation} · ${reason}.`);
        request.eventIds.push(event.id);
        appendAudit(draft, context, 'CHANGE_REQUEST_SUBMITTED', 'CHANGE_REQUEST', request.id, reason);
        notifyRole(draft, 'ADMIN', 'Có yêu cầu chờ phê duyệt', `${context.actor.name}: ${request.resourceType} · ${request.operation}.`, `/app/admin/approvals/${request.id}`);
        return {
          message: 'Đã gửi yêu cầu và đang chờ Quản trị viên duyệt.',
          requestId: request.id,
          provisionalResourceId: request.provisionalResourceId,
          status: request.status,
        };
      },

      REVIEW_CHANGE_REQUEST(draft, payload, context) {
        requirePermission(draft, context, 'approval.decide');
        const request = required(draft.changeRequests.find((item) => item.id === payload.requestId), 'REQUEST_NOT_FOUND', 'Không tìm thấy yêu cầu phê duyệt.');
        const inputDecision = String(payload.decision || '').toUpperCase();
        const decisionMap = { APPROVE: 'APPROVED', REJECT: 'REJECTED', REQUEST_CHANGES: 'CHANGES_REQUESTED', CHANGES_REQUESTED: 'CHANGES_REQUESTED' };
        const nextStatus = decisionMap[inputDecision];
        if (!nextStatus) throw new CommandError('INVALID_REVIEW_DECISION', 'Quyết định duyệt không hợp lệ.');
        if (request.status === nextStatus && ['APPROVED', 'REJECTED', 'CHANGES_REQUESTED'].includes(nextStatus)) {
          return { message: 'Quyết định này đã được ghi nhận trước đó.', requestId: request.id, status: request.status, idempotent: true, applied: request.status === 'APPROVED' };
        }
        if (request.submittedBy === context.actor.id) throw new CommandError('SELF_REVIEW_FORBIDDEN', 'Người gửi không được tự duyệt yêu cầu của mình.');
        const note = String(payload.note || '').trim();
        if (['REJECTED', 'CHANGES_REQUESTED'].includes(nextStatus) && !note) {
          throw new CommandError('REVIEW_NOTE_REQUIRED', 'Từ chối hoặc yêu cầu chỉnh sửa phải có ghi chú.');
        }
        approvalCall(() => root.YC.approval.assertReviewable(request, draft));
        request.reviewerId = context.actor.id;
        request.reviewNote = note || null;
        request.reviewedAt = nowIso();

        if (nextStatus === 'APPROVED' && root.YC.approval.stale(request, draft)) {
          root.YC.approval.transition(request, 'CONFLICTED');
          const event = appendEvent(draft, context, 'CHANGE_REQUEST_CONFLICTED', 'CHANGE_REQUEST', request.id, 'Dữ liệu gốc đã thay đổi; yêu cầu cần được cập nhật lại.');
          request.eventIds.push(event.id);
          appendAudit(draft, context, 'CHANGE_REQUEST_CONFLICTED', 'CHANGE_REQUEST', request.id, note || 'Phát hiện sai khác phiên bản dữ liệu gốc.');
          notifyUser(draft, request.submittedBy, 'Yêu cầu cần cập nhật lại', `${request.resourceType} · dữ liệu gốc đã thay đổi.`, `/app/teacher/requests/${request.id}`);
          return { message: 'Yêu cầu bị xung đột phiên bản và chưa được áp dụng.', requestId: request.id, status: request.status, applied: false };
        }

        if (nextStatus === 'APPROVED') {
          const canonical = approvalCall(() => root.YC.approval.applyChange(request, draft));
          root.YC.approval.transition(request, 'APPROVED');
          request.appliedAt = nowIso();
          request.resourceId = canonical.id;
        } else {
          root.YC.approval.transition(request, nextStatus);
        }
        const type = `CHANGE_REQUEST_${request.status}`;
        const event = appendEvent(draft, context, type, 'CHANGE_REQUEST', request.id, `${request.resourceType} · ${request.status}${note ? ` · ${note}` : ''}.`);
        request.eventIds.push(event.id);
        appendAudit(draft, context, type, 'CHANGE_REQUEST', request.id, note || 'Đã duyệt và áp dụng dữ liệu trong cùng transaction.');
        notifyUser(draft, request.submittedBy, `Yêu cầu: ${request.status}`, `${request.resourceType} · ${request.operation}.`, `/app/teacher/requests/${request.id}`);
        return { message: nextStatus === 'APPROVED' ? 'Đã duyệt và áp dụng thay đổi.' : 'Đã ghi nhận quyết định.', requestId: request.id, resourceId: request.resourceId, status: request.status, applied: nextStatus === 'APPROVED' };
      },

      WITHDRAW_CHANGE_REQUEST(draft, payload, context) {
        const request = required(draft.changeRequests.find((item) => item.id === payload.requestId), 'REQUEST_NOT_FOUND', 'Không tìm thấy yêu cầu phê duyệt.');
        if (request.submittedBy !== context.actor.id) throw new CommandError('FORBIDDEN', 'Chỉ người gửi mới được rút yêu cầu.');
        const reason = String(payload.reason || '').trim();
        if (!reason) throw new CommandError('REASON_REQUIRED', 'Cần ghi rõ lý do rút yêu cầu.');
        approvalCall(() => root.YC.approval.transition(request, 'WITHDRAWN'));
        request.withdrawnAt = nowIso();
        request.withdrawnBy = context.actor.id;
        request.withdrawReason = reason;
        const event = appendEvent(draft, context, 'CHANGE_REQUEST_WITHDRAWN', 'CHANGE_REQUEST', request.id, reason);
        request.eventIds.push(event.id);
        appendAudit(draft, context, 'CHANGE_REQUEST_WITHDRAWN', 'CHANGE_REQUEST', request.id, reason);
        return { message: 'Đã rút yêu cầu và giữ lại lịch sử.', requestId: request.id, status: request.status };
      },

      CREATE_PUBLIC_LEAD(draft, payload, context) {
        requireRole(context.actor, ['PUBLIC', 'VISITOR']);
        const type = String(payload.type || 'B2C').toUpperCase();
        if (!['B2C', 'B2B', 'SUPPORT'].includes(type)) throw new CommandError('INVALID_LEAD_TYPE', 'Loại yêu cầu không hợp lệ.');
        const name = String(payload.name || '').trim();
        const phone = String(payload.phone || '').trim();
        const email = String(payload.email || '').trim();
        const message = String(payload.message || '').trim();
        if (!name || (!phone && !email) || !message) throw new CommandError('CONTACT_REQUIRED', 'Cần họ tên, thông tin liên hệ và nội dung yêu cầu.');
        const count = draft.leads.filter((item) => item.type === type).length + 1;
        const lead = {
          id: uid('lead'), code: `YC-${type}-${String(count).padStart(4, '0')}`, type, name,
          studentName: String(payload.studentName || '').trim(), organization: String(payload.organization || '').trim(),
          phone, email, message, goal: String(payload.goal || message).trim(), availability: [],
          branchId: payload.branchId || 'branch-q3', learnerId: null, visitorUserId: context.actor.role === 'VISITOR' ? context.actor.id : null,
          status: 'NEW', ownerId: 'admissions-1', createdAt: nowIso(),
        };
        draft.leads.unshift(lead);
        draft.outboundMessages.unshift({ id: uid('outbound'), channel: 'IN_APP', recipient: email || phone, template: type === 'SUPPORT' ? 'SUPPORT_ACKNOWLEDGED' : 'CONTACT_ACKNOWLEDGED', status: 'MOCKED', createdAt: nowIso() });
        appendEvent(draft, context, 'PUBLIC_REQUEST_CREATED', 'LEAD', lead.id, `${lead.code} · ${lead.name}.`);
        appendAudit(draft, context, 'PUBLIC_REQUEST_CREATED', 'LEAD', lead.id, `${type} · ${message}`);
        notifyRole(draft, 'ADMISSIONS', 'Có yêu cầu mới', `${lead.code} · ${lead.name}.`, '/app/admissions/leads');
        if (context.actor.role === 'VISITOR') {
          draft.notifications.unshift({ id: uid('notification'), userId: context.actor.id, title: 'Đã tiếp nhận yêu cầu', body: `${lead.code} · Trung tâm sẽ liên hệ với bạn.`, link: '/tai-khoan', read: false, createdAt: nowIso() });
        }
        return { message: `Đã tiếp nhận yêu cầu ${lead.code}.`, code: lead.code, leadId: lead.id };
      },

      CREATE_LEARNER(draft, payload, context) {
        requireRole(context.actor, ['ADMIN']);
        const code = String(payload.code || '').trim().toUpperCase();
        const name = String(payload.name || '').trim();
        if (!code || !name) throw new CommandError('LEARNER_REQUIRED', 'Cần mã và họ tên học viên.');
        if (draft.learners.some((item) => item.code === code)) throw new CommandError('LEARNER_CODE_EXISTS', 'Mã học viên đã tồn tại.');
        const cohort = payload.classId ? required(draft.classes.find((item) => item.id === payload.classId), 'CLASS_NOT_FOUND', 'Không tìm thấy lớp.') : null;
        const learner = { id: uid('student'), code, name, phone: String(payload.phone || '').trim(), birthDate: '', status: 'ACTIVE', classId: cohort?.id || null, branchId: cohort?.branchId || 'branch-q3', goal: String(payload.goal || 'Bổ sung từ Quản trị viên').trim() };
        draft.learners.push(learner);
        if (cohort) draft.enrollments.push({ id: uid('enrollment'), learnerId: learner.id, classId: cohort.id, courseVersionId: cohort.courseVersionId, status: 'ACTIVE', startsAt: nowIso(), endsAt: null });
        appendEvent(draft, context, 'LEARNER_CREATED', 'LEARNER', learner.id, `${learner.name} · ${learner.code}.`, { learnerId: learner.id });
        appendAudit(draft, context, 'LEARNER_CREATED', 'LEARNER', learner.id, cohort ? `Xếp lớp ${cohort.name}.` : 'Chưa xếp lớp.');
        return { message: 'Đã thêm học viên.', learnerId: learner.id };
      },

      UPDATE_LEAD_STATUS(draft, payload, context) {
        requireRole(context.actor, ['ADMISSIONS']);
        const lead = findLead(draft, payload.leadId);
        const status = String(payload.status || '').toUpperCase();
        if (!['NEW', 'CONTACTED', 'PLACEMENT_BOOKED', 'PLACED', 'WON', 'LOST'].includes(status)) throw new CommandError('INVALID_LEAD_STATUS', 'Trạng thái yêu cầu không hợp lệ.');
        const previous = lead.status;
        lead.status = status;
        appendEvent(draft, context, 'LEAD_STATUS_UPDATED', 'LEAD', lead.id, `${previous} → ${status}.`, { learnerId: lead.learnerId });
        appendAudit(draft, context, 'LEAD_STATUS_UPDATED', 'LEAD', lead.id, `${previous} → ${status}.`);
        return { message: 'Đã cập nhật trạng thái yêu cầu.' };
      },

      MARK_NOTIFICATIONS_READ(draft, _payload, context) {
        const rows = draft.notifications.filter((item) => item.userId === context.actor.id && !item.read);
        rows.forEach((item) => { item.read = true; item.readAt = nowIso(); });
        appendAudit(draft, context, 'NOTIFICATIONS_MARKED_READ', 'USER', context.actor.id, `${rows.length} thông báo.`);
        return { message: `Đã đánh dấu ${rows.length} thông báo là đã đọc.`, count: rows.length };
      },

      RUN_MOCK_SYNC(draft, _payload, context) {
        requireRole(context.actor, ['ADMIN']);
        const sync = { id: uid('sync'), adapter: 'GOOGLE_SHEETS_MOCK', status: 'COMPLETED', createdAt: nowIso(), createdBy: context.actor.id };
        draft.integrationRuns ||= [];
        draft.integrationRuns.unshift(sync);
        appendEvent(draft, context, 'MOCK_SYNC_COMPLETED', 'INTEGRATION_RUN', sync.id, 'Đồng bộ Google Sheets mô phỏng đã hoàn tất.');
        appendAudit(draft, context, 'MOCK_SYNC_COMPLETED', 'INTEGRATION_RUN', sync.id, 'Không gửi dữ liệu ra ngoài.');
        return { message: 'Đã chạy đồng bộ mô phỏng.' };
      },

      UPDATE_SETTINGS(draft, payload, context) {
        requireRole(context.actor, ['ADMIN']);
        const rules = {
          minimumVideoProgress: { min: 1, max: 100 },
          defaultPassingScore: { min: 1, max: 100 },
          remedialDeadlineDays: { min: 1, max: 60 },
        };
        const next = {};
        for (const [key, limits] of Object.entries(rules)) {
          if (payload[key] === undefined || payload[key] === '') continue;
          const value = Number(payload[key]);
          if (!Number.isInteger(value) || value < limits.min || value > limits.max) {
            throw new CommandError('INVALID_SETTING', `Giá trị ${key} không hợp lệ.`);
          }
          next[key] = value;
        }
        if (!Object.keys(next).length) throw new CommandError('INVALID_SETTING', 'Cần nhập ít nhất một thiết lập hợp lệ.');
        Object.assign(draft.settings, next);
        appendEvent(draft, context, 'DEMO_SETTINGS_UPDATED', 'SETTINGS', draft.settings.organizationId, 'Đã cập nhật quy tắc học tập của bản demo.');
        appendAudit(draft, context, 'DEMO_SETTINGS_UPDATED', 'SETTINGS', draft.settings.organizationId, Object.entries(next).map(([key, value]) => `${key}=${value}`).join(' · '));
        return { message: 'Đã lưu thiết lập demo.' };
      },

      REGISTER_VISITOR(draft, payload, context) {
        requireRole(context.actor, ['PUBLIC']);
        const name = String(payload.name || '').trim();
        const email = String(payload.email || '').trim().toLowerCase();
        const phone = String(payload.phone || '').replace(/\s+/g, '');
        const secret = String(payload.secret || '');
        if (!name || !email || !phone || !secret) throw new CommandError('REGISTRATION_REQUIRED', 'Cần nhập đầy đủ họ tên, email, số điện thoại và mật khẩu.');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new CommandError('INVALID_EMAIL', 'Email không hợp lệ.');
        if (secret.length < 6) throw new CommandError('WEAK_SECRET', 'Mật khẩu cần có ít nhất 6 ký tự.');
        const identifiers = [email, phone];
        const duplicate = draft.users.some((user) => (user.identifiers || []).some((value) => identifiers.includes(String(value).toLowerCase())));
        if (duplicate) throw new CommandError('IDENTIFIER_EXISTS', 'Email hoặc số điện thoại đã được sử dụng.');
        const visitor = {
          id: uid('visitor'), role: 'VISITOR', name, identifiers, secret, status: 'ACTIVE', branchIds: [],
          savedProgramIds: [], registeredEventIds: [], createdAt: nowIso(),
        };
        draft.users.push(visitor);
        draft.notifications.unshift({ id: uid('notification'), userId: visitor.id, title: 'Chào mừng đến Yen Center', body: 'Bạn có thể lưu chương trình, đăng ký sự kiện và theo dõi yêu cầu tư vấn tại đây.', link: '/tai-khoan', read: false, createdAt: nowIso() });
        appendEvent(draft, context, 'VISITOR_REGISTERED', 'USER', visitor.id, `${visitor.name} đã tạo tài khoản khách.`);
        appendAudit(draft, context, 'VISITOR_REGISTERED', 'USER', visitor.id, 'Tài khoản được tạo trong bộ nhớ trình duyệt.');
        return { message: 'Đăng ký tài khoản thành công.', actorId: visitor.id };
      },

      TOGGLE_PROGRAM_INTEREST(draft, payload, context) {
        requireRole(context.actor, ['VISITOR']);
        const program = required(draft.programs.find((item) => item.id === payload.programId && item.status === 'PUBLISHED'), 'PROGRAM_NOT_FOUND', 'Không tìm thấy chương trình.');
        context.actor.savedProgramIds ||= [];
        const index = context.actor.savedProgramIds.indexOf(program.id);
        const saved = index === -1;
        if (saved) context.actor.savedProgramIds.push(program.id);
        else context.actor.savedProgramIds.splice(index, 1);
        appendEvent(draft, context, saved ? 'PROGRAM_INTEREST_SAVED' : 'PROGRAM_INTEREST_REMOVED', 'PROGRAM', program.id, `${context.actor.name} · ${program.name}.`);
        return { message: saved ? 'Đã lưu chương trình quan tâm.' : 'Đã bỏ lưu chương trình.', saved };
      },

      REGISTER_PUBLIC_EVENT(draft, payload, context) {
        requireRole(context.actor, ['VISITOR']);
        const event = required(draft.publicContent.events.find((item) => item.id === payload.eventId && item.status === 'PUBLISHED'), 'EVENT_NOT_FOUND', 'Không tìm thấy sự kiện.');
        context.actor.registeredEventIds ||= [];
        if (!context.actor.registeredEventIds.includes(event.id)) context.actor.registeredEventIds.push(event.id);
        draft.notifications.unshift({ id: uid('notification'), userId: context.actor.id, title: 'Đăng ký sự kiện thành công', body: event.title, link: '/tai-khoan', read: false, createdAt: nowIso() });
        appendEvent(draft, context, 'PUBLIC_EVENT_REGISTERED', 'EVENT', event.id, `${context.actor.name} · ${event.title}.`);
        return { message: 'Đã đăng ký sự kiện.', eventId: event.id };
      },

      CONTACT_LEAD(draft, payload, context) {
        requireRole(context.actor, ['ADMISSIONS']);
        const lead = findLead(draft, payload.leadId);
        if (lead.status !== 'NEW') throw new CommandError('INVALID_LEAD_STATE', 'Khách hàng chỉ được liên hệ lần đầu từ trạng thái Mới.');
        lead.status = 'CONTACTED';
        lead.contactedAt = nowIso();
        draft.consultations.push({ id: uid('consultation'), leadId: lead.id, ownerId: context.actor.id, note: payload.note || 'Đã xác nhận nhu cầu.', occurredAt: nowIso() });
        appendEvent(draft, context, 'LEAD_CONTACTED', 'LEAD', lead.id, `${lead.name} đã được liên hệ.` , { learnerId: lead.learnerId });
        appendAudit(draft, context, 'LEAD_CONTACTED', 'LEAD', lead.id, payload.note || 'Xác nhận nhu cầu học.');
        return { message: 'Đã liên hệ và ghi nhận nhu cầu.' };
      },

      BOOK_PLACEMENT(draft, payload, context) {
        requireRole(context.actor, ['ADMISSIONS']);
        const lead = findLead(draft, payload.leadId);
        if (lead.status !== 'CONTACTED') throw new CommandError('LEAD_NOT_CONTACTED', 'Cần liên hệ khách hàng trước khi đặt lịch kiểm tra đầu vào.');
        lead.status = 'PLACEMENT_BOOKED';
        const booking = { id: uid('placement-booking'), leadId: lead.id, learnerId: lead.learnerId, branchId: lead.branchId, startsAt: payload.startsAt, mode: payload.mode || 'OFFLINE', status: 'BOOKED', createdBy: context.actor.id };
        draft.placementBookings.push(booking);
        appendEvent(draft, context, 'PLACEMENT_BOOKED', 'PLACEMENT_BOOKING', booking.id, `Đặt lịch kiểm tra đầu vào cho ${lead.name}.`, { learnerId: lead.learnerId });
        appendAudit(draft, context, 'PLACEMENT_BOOKED', 'PLACEMENT_BOOKING', booking.id, `${payload.startsAt} · ${booking.mode}`);
        notifyRole(draft, 'ACADEMIC_MANAGER', 'Có lịch kiểm tra đầu vào mới', `${lead.name} cần được đánh giá đầu vào.`, '/app/academic/dashboard');
        return { message: 'Đã đặt lịch kiểm tra đầu vào.' };
      },

      RECORD_PLACEMENT(draft, payload, context) {
        requireRole(context.actor, ['ACADEMIC_MANAGER']);
        const lead = findLead(draft, payload.leadId);
        const booking = latestForLead(draft.placementBookings, lead.id);
        if (!booking || booking.status !== 'BOOKED') throw new CommandError('PLACEMENT_NOT_BOOKED', 'Cần có lịch kiểm tra đầu vào hợp lệ trước khi ghi kết quả.');
        if (draft.placementResults.some((item) => item.leadId === lead.id)) throw new CommandError('PLACEMENT_EXISTS', 'Khách hàng đã có kết quả đầu vào.');
        booking.status = 'COMPLETED';
        const result = {
          id: uid('placement'),
          leadId: lead.id,
          learnerId: lead.learnerId,
          status: 'REVIEWED',
          frameworkLevel: payload.frameworkLevel,
          centerLevelId: payload.centerLevelId,
          skills: { ...payload.skills },
          recommendation: payload.recommendation,
          reviewedBy: context.actor.id,
          recordedAt: nowIso(),
        };
        draft.placementResults.push(result);
        appendEvent(draft, context, 'PLACEMENT_RECORDED', 'PLACEMENT_RESULT', result.id, `${lead.name}: ${result.frameworkLevel} · ${result.recommendation}.`, { learnerId: lead.learnerId });
        appendAudit(draft, context, 'PLACEMENT_RECORDED', 'PLACEMENT_RESULT', result.id, 'Kết quả đa kỹ năng đã được ghi nhận.');
        return { message: 'Đã ghi kết quả đầu vào.' };
      },

      RELEASE_PLACEMENT(draft, payload, context) {
        requireRole(context.actor, ['ACADEMIC_MANAGER']);
        const lead = findLead(draft, payload.leadId);
        const result = latestForLead(draft.placementResults, lead.id);
        if (!result || result.status !== 'REVIEWED') throw new CommandError('PLACEMENT_NOT_REVIEWED', 'Kết quả đầu vào chưa được duyệt để phát hành.');
        result.status = 'RELEASED';
        result.releasedAt = nowIso();
        lead.status = 'PLACED';
        appendEvent(draft, context, 'PLACEMENT_RELEASED', 'PLACEMENT_RESULT', result.id, `Đã phát hành khuyến nghị ${result.recommendation}.`, { learnerId: lead.learnerId });
        appendAudit(draft, context, 'PLACEMENT_RELEASED', 'PLACEMENT_RESULT', result.id, 'Quản lý học thuật phê duyệt kết quả.');
        notifyRole(draft, 'ADMISSIONS', 'Kết quả đầu vào đã được phát hành', `${lead.name}: ${result.recommendation}.`, '/app/admissions/offers');
        return { message: 'Đã phát hành kết quả đầu vào.' };
      },

      CREATE_OFFER(draft, payload, context) {
        requireRole(context.actor, ['ADMISSIONS']);
        const lead = findLead(draft, payload.leadId);
        const placement = latestForLead(draft.placementResults, lead.id);
        if (!placement || placement.status !== 'RELEASED') throw new CommandError('PLACEMENT_NOT_RELEASED', 'Cần kết quả đầu vào đã phát hành trước khi tạo gói đề xuất.');
        const packageItem = required(draft.packages.find((item) => item.id === payload.packageId), 'PACKAGE_NOT_FOUND', 'Không tìm thấy gói học.');
        const discount = Math.max(0, Number(payload.discount || 0));
        const offer = { id: uid('offer'), leadId: lead.id, learnerId: lead.learnerId, packageId: packageItem.id, listPrice: packageItem.price, discount, total: packageItem.price - discount, currency: packageItem.currency, status: 'DRAFT', createdBy: context.actor.id, createdAt: nowIso() };
        draft.offers.push(offer);
        lead.status = 'OFFERED';
        appendEvent(draft, context, 'OFFER_CREATED', 'OFFER', offer.id, `Gói đề xuất ${offer.total.toLocaleString('vi-VN')} ${offer.currency}.`, { learnerId: lead.learnerId });
        appendAudit(draft, context, 'OFFER_CREATED', 'OFFER', offer.id, `Giảm ${discount.toLocaleString('vi-VN')} ${offer.currency}.`);
        return { message: 'Đã tạo gói đề xuất nháp.' };
      },

      SEND_OFFER(draft, payload, context) {
        requireRole(context.actor, ['ADMISSIONS']);
        const lead = findLead(draft, payload.leadId);
        const offer = required(latestForLead(draft.offers, lead.id), 'OFFER_NOT_FOUND', 'Không tìm thấy gói đề xuất.');
        if (offer.status !== 'DRAFT') throw new CommandError('INVALID_OFFER_STATE', 'Chỉ gói đề xuất nháp mới được gửi.');
        offer.status = 'SENT';
        offer.sentAt = nowIso();
        draft.outboundMessages.unshift({ id: uid('outbound'), channel: 'EMAIL', recipient: lead.email || lead.phone, template: 'OFFER_SENT', status: 'MOCKED', mode: 'MOCK', createdAt: nowIso() });
        appendEvent(draft, context, 'OFFER_SENT', 'OFFER', offer.id, `Đã gửi gói đề xuất mô phỏng cho ${lead.parentName || lead.name}.`, { learnerId: lead.learnerId });
        appendAudit(draft, context, 'OFFER_SENT_MOCK', 'OFFER', offer.id, 'Gửi ra ngoài ở chế độ mô phỏng, không gọi nhà cung cấp thật.');
        return { message: 'Đã gửi gói đề xuất ở chế độ mô phỏng.' };
      },

      ACCEPT_OFFER(draft, payload, context) {
        requireRole(context.actor, ['ADMISSIONS']);
        const lead = findLead(draft, payload.leadId);
        const offer = required(latestForLead(draft.offers, lead.id), 'OFFER_NOT_FOUND', 'Không tìm thấy gói đề xuất.');
        if (offer.status !== 'SENT') throw new CommandError('OFFER_NOT_SENT', 'Gói đề xuất phải được gửi trước khi ghi nhận chấp nhận.');
        offer.status = 'ACCEPTED';
        offer.acceptedAt = nowIso();
        appendEvent(draft, context, 'OFFER_ACCEPTED', 'OFFER', offer.id, `${lead.parentName || lead.name} đã chấp nhận gói đề xuất.`, { learnerId: lead.learnerId });
        appendAudit(draft, context, 'OFFER_ACCEPTED', 'OFFER', offer.id, 'Tuyển sinh ghi nhận xác nhận trong bản mẫu.');
        notifyRole(draft, 'FINANCE', 'Gói đề xuất chờ xuất hóa đơn', `${lead.name} đã chấp nhận gói đề xuất.`, '/app/finance/invoices');
        return { message: 'Đã ghi nhận gói đề xuất được chấp nhận.' };
      },

      ISSUE_INVOICE(draft, payload, context) {
        requireRole(context.actor, ['FINANCE']);
        const lead = findLead(draft, payload.leadId);
        const offer = required(latestForLead(draft.offers, lead.id), 'OFFER_NOT_FOUND', 'Không tìm thấy gói đề xuất.');
        if (offer.status !== 'ACCEPTED') throw new CommandError('OFFER_NOT_ACCEPTED', 'Gói đề xuất chưa được chấp nhận.');
        const invoice = { id: uid('invoice'), leadId: lead.id, learnerId: lead.learnerId, offerId: offer.id, amount: offer.total, currency: offer.currency, status: 'ISSUED', mode: 'MOCK', issuedAt: nowIso(), dueAt: new Date(new Date(nowIso()).getTime() + 3 * 86400000).toISOString() };
        draft.invoices.push(invoice);
        appendEvent(draft, context, 'INVOICE_ISSUED', 'INVOICE', invoice.id, `Hóa đơn mô phỏng ${invoice.amount.toLocaleString('vi-VN')} ${invoice.currency}.`, { learnerId: lead.learnerId });
        appendAudit(draft, context, 'MOCK_INVOICE_ISSUED', 'INVOICE', invoice.id, 'Hóa đơn bản mẫu, không phải chứng từ tài chính thật.');
        return { message: 'Đã phát hành hóa đơn mô phỏng.' };
      },

      RECORD_MOCK_PAYMENT(draft, payload, context) {
        requireRole(context.actor, ['FINANCE']);
        const lead = findLead(draft, payload.leadId);
        const invoice = required(latestForLead(draft.invoices, lead.id), 'INVOICE_NOT_FOUND', 'Không tìm thấy hóa đơn.');
        if (invoice.status !== 'ISSUED') throw new CommandError('INVOICE_NOT_PAYABLE', 'Hóa đơn không ở trạng thái chờ thanh toán.');
        invoice.status = 'PAID';
        invoice.paidAt = nowIso();
        const payment = { id: uid('payment'), invoiceId: invoice.id, leadId: lead.id, learnerId: lead.learnerId, amount: invoice.amount, currency: invoice.currency, reference: payload.reference || uid('MOCK'), provider: 'DEMO_LEDGER', mode: 'MOCK', status: 'PAID', paidAt: nowIso() };
        draft.payments.push(payment);
        lead.status = 'WON';
        appendEvent(draft, context, 'PAYMENT_RECORDED', 'PAYMENT', payment.id, `Đã ghi nhận thanh toán mô phỏng cho ${lead.name}.`, { learnerId: lead.learnerId });
        appendAudit(draft, context, 'MOCK_PAYMENT_RECORDED', 'PAYMENT', payment.id, `${payment.reference} · Sổ mô phỏng.`);
        notifyRole(draft, 'STUDENT_SERVICE', 'Học viên đã đủ điều kiện xếp lớp', `${lead.name} đã hoàn tất thanh toán mô phỏng.`, '/app/service/allocation');
        return { message: 'Đã ghi nhận thanh toán mô phỏng.' };
      },

      ALLOCATE_CLASS(draft, payload, context) {
        requireRole(context.actor, ['STUDENT_SERVICE']);
        const lead = findLead(draft, payload.leadId);
        const classItem = required(draft.classes.find((item) => item.id === payload.classId), 'CLASS_NOT_FOUND', 'Không tìm thấy lớp.');
        const activeCount = draft.enrollments.filter((item) => item.classId === classItem.id && item.status === 'ACTIVE').length;
        if (activeCount >= classItem.capacity || classItem.status === 'FULL') {
          const alternatives = draft.classes
            .filter((item) => item.id !== classItem.id && item.courseVersionId === classItem.courseVersionId && ['OPEN', 'ACTIVE'].includes(item.status))
            .map((item) => ({ classId: item.id, name: item.name, seats: item.capacity - draft.enrollments.filter((enrollment) => enrollment.classId === item.id && enrollment.status === 'ACTIVE').length, scheduleLabel: item.scheduleLabel }))
            .filter((item) => item.seats > 0)
            .sort((a, b) => b.seats - a.seats);
          throw new CommandError('NO_SEAT', 'Lớp đã hết chỗ; cần chọn phương án thay thế.', { alternatives });
        }
        const learner = required(draft.learners.find((item) => item.id === lead.learnerId), 'LEARNER_NOT_FOUND', 'Khách hàng chưa có hồ sơ học viên.');
        const paid = draft.payments.some((item) => item.leadId === lead.id && item.status === 'PAID');
        if (!paid) throw new CommandError('PAYMENT_REQUIRED', 'Cần ghi nhận thanh toán trước khi xếp lớp.');
        if (draft.enrollments.some((item) => item.learnerId === learner.id && item.status === 'ACTIVE')) throw new CommandError('ACTIVE_ENROLLMENT_EXISTS', 'Học viên đã có ghi danh đang hoạt động.');
        const enrollment = { id: uid('enrollment'), learnerId: learner.id, classId: classItem.id, courseVersionId: classItem.courseVersionId, status: 'ACTIVE', startsAt: nowIso(), endsAt: null, allocatedBy: context.actor.id };
        draft.enrollments.push(enrollment);
        learner.classId = classItem.id;
        learner.branchId = classItem.branchId;
        learner.status = 'ACTIVE';
        appendEvent(draft, context, 'LEARNER_ALLOCATED', 'ENROLLMENT', enrollment.id, `${learner.name} vào lớp ${classItem.name}.`, { learnerId: learner.id });
        appendAudit(draft, context, 'CLASS_ALLOCATED', 'ENROLLMENT', enrollment.id, `Đã xác nhận thanh toán · ${classItem.code}.`);
        notifyRole(draft, 'ACADEMIC_MANAGER', 'Lớp cần gán giáo viên', `${classItem.name} có học viên mới.`, '/app/academic/assignments');
        return { message: 'Đã xếp lớp và tạo ghi danh.' };
      },

      TRANSFER_ENROLLMENT(draft, payload, context) {
        requireRole(context.actor, ['STUDENT_SERVICE']);
        if (!String(payload.reason || '').trim()) throw new CommandError('REASON_REQUIRED', 'Chuyển lớp cần có lý do.');
        const current = required(draft.enrollments.find((item) => item.learnerId === payload.learnerId && item.status === 'ACTIVE'), 'ACTIVE_ENROLLMENT_NOT_FOUND', 'Không tìm thấy ghi danh đang hoạt động.');
        const nextClass = required(draft.classes.find((item) => item.id === payload.toClassId), 'CLASS_NOT_FOUND', 'Không tìm thấy lớp đích.');
        const occupied = draft.enrollments.filter((item) => item.classId === nextClass.id && item.status === 'ACTIVE').length;
        if (occupied >= nextClass.capacity) throw new CommandError('NO_SEAT', 'Lớp đích đã hết chỗ.', { alternatives: [] });
        current.status = 'TRANSFERRED';
        current.endsAt = nowIso();
        current.transferReason = payload.reason.trim();
        const replacement = { id: uid('enrollment'), learnerId: payload.learnerId, classId: nextClass.id, courseVersionId: nextClass.courseVersionId, status: 'ACTIVE', startsAt: nowIso(), endsAt: null, transferredFromId: current.id, allocatedBy: context.actor.id };
        draft.enrollments.push(replacement);
        const learner = draft.learners.find((item) => item.id === payload.learnerId);
        learner.classId = nextClass.id;
        learner.branchId = nextClass.branchId;
        appendEvent(draft, context, 'ENROLLMENT_TRANSFERRED', 'ENROLLMENT', replacement.id, `${learner.name} chuyển sang ${nextClass.name}.`, { learnerId: learner.id });
        appendAudit(draft, context, 'ENROLLMENT_TRANSFERRED', 'ENROLLMENT', replacement.id, payload.reason.trim());
        return { message: 'Đã chuyển lớp và giữ nguyên lịch sử ghi danh cũ.' };
      },

      CREATE_RENEWAL(draft, payload, context) {
        requireRole(context.actor, ['ADMISSIONS']);
        const learner = required(draft.learners.find((item) => item.id === payload.learnerId), 'LEARNER_NOT_FOUND', 'Không tìm thấy học viên.');
        const promotion = draft.promotionDecisions.find((item) => item.learnerId === learner.id && item.decision === 'PROMOTE' && item.status === 'FINAL');
        if (!promotion) throw new CommandError('PROMOTION_REQUIRED', 'Cần quyết định lên lớp đã chốt trước khi tạo gia hạn.');
        const packageItem = required(draft.packages.find((item) => item.id === payload.packageId), 'PACKAGE_NOT_FOUND', 'Không tìm thấy gói học.');
        const renewal = { id: uid('renewal'), learnerId: learner.id, nextCourseVersionId: promotion.nextCourseVersionId, packageId: packageItem.id, status: 'OFFERED', outcome: promotion.decision, nextGoal: 'Tiếp tục A2.2 và tăng sự tự tin khi nói', offeredAt: nowIso(), ownerId: context.actor.id };
        draft.renewals.push(renewal);
        appendEvent(draft, context, 'RENEWAL_OFFERED', 'RENEWAL', renewal.id, `Đã tạo gói gia hạn cho ${learner.name}.`, { learnerId: learner.id });
        appendAudit(draft, context, 'RENEWAL_OFFERED', 'RENEWAL', renewal.id, `Khóa tiếp theo: ${promotion.nextCourseVersionId}.`);
        return { message: 'Đã tạo gói gia hạn.' };
      },

      ACCEPT_RENEWAL(draft, payload, context) {
        requireRole(context.actor, ['ADMISSIONS']);
        const renewal = required(draft.renewals.find((item) => item.learnerId === payload.learnerId && item.status === 'OFFERED'), 'RENEWAL_NOT_FOUND', 'Không tìm thấy gói gia hạn đang chờ.');
        renewal.status = 'ACCEPTED';
        renewal.acceptedAt = nowIso();
        appendEvent(draft, context, 'RENEWAL_ACCEPTED', 'RENEWAL', renewal.id, 'Phụ huynh đã chấp nhận lộ trình tiếp theo.', { learnerId: renewal.learnerId });
        appendAudit(draft, context, 'RENEWAL_ACCEPTED', 'RENEWAL', renewal.id, 'Tuyển sinh ghi nhận xác nhận trong bản mẫu.');
        return { message: 'Đã hoàn tất gia hạn.' };
      },

      REQUEST_CREATE_COURSE(draft, payload, context) {
        const branchId = payload.branchId || context.actor.branchIds?.[0];
        const proposal = {
          provisionalId: payload.provisionalId || uid('course-proposed'),
          code: String(payload.code || '').trim().toUpperCase(),
          name: String(payload.name || '').trim(),
          programId: payload.programId,
          levelId: payload.levelId,
          ageBand: payload.ageBand,
          modes: Array.isArray(payload.modes) ? payload.modes : [payload.mode || 'OFFLINE'],
          description: String(payload.description || '').trim(),
          branchId,
          branchIds: Array.isArray(payload.branchIds) ? payload.branchIds : branchId ? [branchId] : [],
          status: 'DRAFT',
          version: 1,
        };
        return handlers.SUBMIT_CHANGE_REQUEST(draft, {
          resourceType: 'COURSE', operation: 'CREATE', baseVersion: 0,
          proposedSnapshot: proposal, reason: payload.reason,
        }, context);
      },

      REQUEST_UPDATE_COURSE(draft, payload, context) {
        const course = required(draft.courses.find((item) => item.id === payload.courseId), 'COURSE_NOT_FOUND', 'Không tìm thấy khóa học.');
        const branchId = payload.branchId || course.branchIds?.[0] || context.actor.branchIds?.[0];
        const proposal = { ...payload, branchId };
        delete proposal.courseId;
        delete proposal.reason;
        return handlers.SUBMIT_CHANGE_REQUEST(draft, {
          resourceType: 'COURSE', operation: 'UPDATE', resourceId: course.id, baseVersion: course.version,
          proposedSnapshot: proposal, reason: payload.reason,
        }, context);
      },

      CREATE_COURSE_VERSION(draft, payload, context) {
        requirePermission(draft, context, 'course.review');
        const course = required(draft.courses.find((item) => item.id === payload.courseId), 'COURSE_NOT_FOUND', 'Không tìm thấy khóa học.');
        const base = required(draft.courseVersions.find((item) => item.id === payload.baseVersionId && item.courseId === course.id), 'BASE_VERSION_NOT_FOUND', 'Không tìm thấy phiên bản gốc của khóa học.');
        const nextNumber = Math.max(0, ...draft.courseVersions.filter((item) => item.courseId === course.id).map((item) => Number(item.version || 0))) + 1;
        const version = {
          ...clone(base), id: uid('course-version'), version: nextNumber, recordVersion: 1,
          title: String(payload.title || `${course.name} · v${nextNumber}`).trim(),
          baseVersionId: base.id, changeSummary: String(payload.changeSummary || '').trim(),
          status: 'DRAFT', immutable: false, publishedAt: null, publishedBy: null,
          createdAt: nowIso(), createdBy: context.actor.id,
        };
        draft.courseVersions.push(version);

        const unitMap = new Map();
        const lessonMap = new Map();
        draft.units.filter((item) => item.courseVersionId === base.id).forEach((item) => {
          const cloned = { ...clone(item), id: uid('unit'), courseVersionId: version.id };
          unitMap.set(item.id, cloned.id);
          draft.units.push(cloned);
        });
        const baseUnitIds = [...unitMap.keys()];
        draft.lessonTemplates.filter((item) => baseUnitIds.includes(item.unitId)).forEach((item) => {
          const cloned = { ...clone(item), id: uid('lesson'), unitId: unitMap.get(item.unitId), version: 1, status: 'DRAFT' };
          lessonMap.set(item.id, cloned.id);
          draft.lessonTemplates.push(cloned);
        });
        const baseLessonIds = [...lessonMap.keys()];
        draft.learningItems.filter((item) => baseLessonIds.includes(item.lessonTemplateId)).forEach((item) => {
          draft.learningItems.push({ ...clone(item), id: uid('learning-item'), lessonTemplateId: lessonMap.get(item.lessonTemplateId), status: 'DRAFT' });
        });
        draft.assessments.filter((item) => item.courseVersionId === base.id || baseLessonIds.includes(item.lessonTemplateId)).forEach((item) => {
          draft.assessments.push({
            ...clone(item), id: uid('assessment'),
            courseVersionId: item.courseVersionId === base.id ? version.id : item.courseVersionId,
            lessonTemplateId: lessonMap.get(item.lessonTemplateId) || item.lessonTemplateId,
            status: 'DRAFT',
          });
        });
        appendEvent(draft, context, 'COURSE_VERSION_FORKED', 'COURSE_VERSION', version.id, `${base.title} → v${nextNumber}.`);
        appendAudit(draft, context, 'COURSE_VERSION_FORKED', 'COURSE_VERSION', version.id, version.changeSummary || 'Tạo bản nháp từ phiên bản đã công bố.');
        return { message: 'Đã tạo phiên bản khóa học mới để chỉnh sửa.', courseVersionId: version.id };
      },

      SUBMIT_COURSE_VERSION(draft, payload, context) {
        requirePermission(draft, context, 'course.review');
        const version = required(draft.courseVersions.find((item) => item.id === payload.courseVersionId), 'COURSE_VERSION_NOT_FOUND', 'Không tìm thấy phiên bản khóa học.');
        if (version.immutable || version.status !== 'DRAFT') throw new CommandError('INVALID_COURSE_VERSION_STATE', 'Chỉ bản nháp chưa khóa mới có thể gửi duyệt.');
        const validation = root.YC.selectors.coursePublishValidation(draft, version.id);
        if (!validation.valid) throw new CommandError('COURSE_VERSION_INVALID', 'Phiên bản khóa học chưa đủ điều kiện gửi duyệt.', { evidence: validation });
        version.status = 'SUBMITTED';
        version.submittedAt = nowIso();
        version.submittedBy = context.actor.id;
        version.submitReason = String(payload.reason || '').trim();
        appendEvent(draft, context, 'COURSE_VERSION_SUBMITTED', 'COURSE_VERSION', version.id, `${version.title} đang chờ phát hành.`);
        appendAudit(draft, context, 'COURSE_VERSION_SUBMITTED', 'COURSE_VERSION', version.id, version.submitReason || 'Đã vượt qua kiểm tra cấu trúc.');
        return { message: 'Đã gửi phiên bản khóa học để phát hành.', validation };
      },

      ARCHIVE_COURSE(draft, payload, context) {
        requirePermission(draft, context, 'course.request_archive');
        const course = required(draft.courses.find((item) => item.id === payload.courseId), 'COURSE_NOT_FOUND', 'Không tìm thấy khóa học.');
        const reason = String(payload.reason || '').trim();
        if (!reason) throw new CommandError('REASON_REQUIRED', 'Lưu trữ khóa học cần có lý do.');
        const versionIds = draft.courseVersions.filter((item) => item.courseId === course.id).map((item) => item.id);
        const inUse = draft.classes.some((item) => versionIds.includes(item.courseVersionId));
        course.status = inUse ? 'RETIRED' : 'ARCHIVED';
        course.version = Number(course.version || 0) + 1;
        course.archivedAt = nowIso();
        course.archivedBy = context.actor.id;
        appendEvent(draft, context, 'COURSE_ARCHIVED', 'COURSE', course.id, `${course.name} → ${course.status}.`);
        appendAudit(draft, context, 'COURSE_ARCHIVED', 'COURSE', course.id, reason);
        return { message: inUse ? 'Đã ngừng mở mới; lịch sử lớp vẫn được giữ.' : 'Đã lưu trữ khóa học.', status: course.status };
      },

      CREATE_CONTENT_DRAFT(draft, payload, context) {
        requireRole(context.actor, ['TEACHER', 'ACADEMIC_MANAGER']);
        const version = required(draft.courseVersions.find((item) => item.id === payload.courseVersionId), 'COURSE_VERSION_NOT_FOUND', 'Không tìm thấy phiên bản khóa học.');
        const lesson = required(draft.lessonTemplates.find((item) => item.id === payload.lessonTemplateId), 'LESSON_NOT_FOUND', 'Không tìm thấy bài học.');
        const unit = required(draft.units.find((item) => item.id === lesson.unitId && item.courseVersionId === version.id), 'LESSON_COURSE_MISMATCH', 'Bài học không thuộc phiên bản khóa học đã chọn.');
        const title = String(payload.title || '').trim();
        if (!title) throw new CommandError('TITLE_REQUIRED', 'Cần nhập tên nội dung.');
        const draftItem = {
          id: uid('content-draft'),
          courseVersionId: version.id,
          unitId: unit.id,
          lessonTemplateId: lesson.id,
          type: payload.type || 'PRACTICE',
          title,
          status: 'DRAFT',
          createdBy: context.actor.id,
          createdAt: nowIso(),
        };
        draft.contentDrafts ||= [];
        draft.contentDrafts.unshift(draftItem);
        appendEvent(draft, context, 'CONTENT_DRAFT_CREATED', 'CONTENT_DRAFT', draftItem.id, `${title} · ${version.title}.`);
        appendAudit(draft, context, 'CONTENT_DRAFT_CREATED', 'CONTENT_DRAFT', draftItem.id, `Bài ${lesson.title}.`);
        return { message: 'Đã tạo bản nháp nội dung.', contentDraftId: draftItem.id };
      },

      PUBLISH_COURSE_VERSION(draft, payload, context) {
        const version = required(draft.courseVersions.find((item) => item.id === payload.courseVersionId), 'COURSE_VERSION_NOT_FOUND', 'Không tìm thấy phiên bản khóa học.');
        if (version.status === 'PUBLISHED' && version.immutable) throw new CommandError('COURSE_VERSION_IMMUTABLE', 'Phiên bản khóa học đã công bố thì không thể sửa.');
        requirePermission(draft, context, 'course.publish');
        if (!['SUBMITTED', 'APPROVED'].includes(version.status)) throw new CommandError('INVALID_COURSE_VERSION_STATE', 'Phiên bản khóa học chưa sẵn sàng để công bố.');
        const validation = root.YC.selectors.coursePublishValidation(draft, version.id);
        if (!validation.valid) throw new CommandError('COURSE_VERSION_INVALID', 'Phiên bản khóa học chưa đủ điều kiện công bố.', { evidence: validation });
        version.status = 'PUBLISHED';
        version.immutable = true;
        version.publishedAt = nowIso();
        version.publishedBy = context.actor.id;
        version.recordVersion = Number(version.recordVersion || 0) + 1;
        appendEvent(draft, context, 'COURSE_VERSION_PUBLISHED', 'COURSE_VERSION', version.id, `${version.title} đã được công bố.`);
        appendAudit(draft, context, 'COURSE_VERSION_PUBLISHED', 'COURSE_VERSION', version.id, String(payload.reason || 'Đã khóa bản chụp chương trình học.'));
        return { message: 'Đã công bố phiên bản khóa học.' };
      },

      PROPOSE_TEACHER_ASSIGNMENT(draft, payload, context) {
        requireRole(context.actor, ['ACADEMIC_MANAGER']);
        const profile = required(draft.teacherProfiles.find((item) => item.userId === payload.teacherId), 'TEACHER_NOT_FOUND', 'Không tìm thấy hồ sơ giáo viên.');
        const cohort = required(draft.classes.find((item) => item.id === payload.classId), 'CLASS_NOT_FOUND', 'Không tìm thấy lớp.');
        const evidence = root.YC.selectors.teacherEligibility(draft, payload.teacherId, cohort.id, Number(payload.workloadMinutes || 720));
        if (!evidence.eligible) throw new CommandError('TEACHER_INELIGIBLE', 'Giáo viên không đạt điều kiện bắt buộc.', { evidence });
        if (draft.teacherAssignments.some((item) => item.classId === cohort.id && ['PROPOSED', 'ACCEPTED', 'ACTIVE'].includes(item.status))) {
          throw new CommandError('CLASS_ALREADY_ASSIGNED', 'Lớp đã có phân công giáo viên đang hiệu lực.');
        }
        const assignment = {
          id: uid('teacher-assignment'),
          teacherProfileId: profile.id,
          classId: cohort.id,
          role: 'PRIMARY',
          startsAt: nowIso(),
          endsAt: new Date(new Date(nowIso()).getTime() + 120 * 86400000).toISOString(),
          workloadMinutes: Number(payload.workloadMinutes || 720),
          status: 'PROPOSED',
          proposedAt: nowIso(),
          assignedBy: context.actor.id,
          eligibilityEvidence: evidence,
        };
        draft.teacherAssignments.push(assignment);
        appendEvent(draft, context, 'TEACHER_ASSIGNMENT_PROPOSED', 'TEACHER_ASSIGNMENT', assignment.id, `${draft.users.find((item) => item.id === payload.teacherId)?.name} được đề xuất cho ${cohort.name}.`);
        appendAudit(draft, context, 'TEACHER_ASSIGNMENT_PROPOSED', 'TEACHER_ASSIGNMENT', assignment.id, 'Đã đạt mọi điều kiện bắt buộc.');
        draft.notifications.unshift({ id: uid('notification'), userId: payload.teacherId, title: 'Có đề xuất nhận lớp mới', body: cohort.name, link: '/app/teacher/dashboard', read: false, createdAt: nowIso() });
        return { message: 'Đã gửi đề xuất phân công cho giáo viên.', evidence };
      },

      ACCEPT_TEACHER_ASSIGNMENT(draft, payload, context) {
        requireRole(context.actor, ['TEACHER']);
        const profile = required(draft.teacherProfiles.find((item) => item.userId === context.actor.id), 'TEACHER_NOT_FOUND', 'Không tìm thấy hồ sơ giáo viên.');
        const assignment = required(draft.teacherAssignments.find((item) => item.teacherProfileId === profile.id && item.classId === payload.classId && item.status === 'PROPOSED'), 'ASSIGNMENT_NOT_FOUND', 'Không tìm thấy đề xuất phân công.');
        assignment.status = 'ACTIVE';
        assignment.acceptedAt = nowIso();
        draft.sessionAssignments.push(...draft.sessions.filter((item) => item.classId === assignment.classId).map((session) => ({ id: uid('session-assignment'), sessionId: session.id, teacherProfileId: profile.id, role: assignment.role, status: 'ACTIVE', startsAt: assignment.startsAt, endsAt: assignment.endsAt })));
        appendEvent(draft, context, 'TEACHER_ASSIGNMENT_ACCEPTED', 'TEACHER_ASSIGNMENT', assignment.id, 'Giáo viên đã nhận lớp.');
        appendAudit(draft, context, 'TEACHER_ASSIGNMENT_ACTIVATED', 'TEACHER_ASSIGNMENT', assignment.id, 'Quyền lớp có hiệu lực theo thời hạn phân công.');
        notifyRole(draft, 'ACADEMIC_MANAGER', 'Giáo viên đã nhận lớp', `${context.actor.name} đã nhận phân công.`, '/app/academic/assignments');
        return { message: 'Đã nhận lớp và kích hoạt quyền theo phân công.' };
      },

      CONFIRM_SESSION(draft, payload, context) {
        requireRole(context.actor, ['ACADEMIC_MANAGER', 'STUDENT_SERVICE']);
        const session = required(draft.sessions.find((item) => item.id === payload.sessionId), 'SESSION_NOT_FOUND', 'Không tìm thấy buổi học.');
        if (session.status !== 'PLANNED') throw new CommandError('INVALID_SESSION_STATE', 'Chỉ buổi ở trạng thái Đã lên lịch mới được xác nhận.');
        const cohort = draft.classes.find((item) => item.id === session.classId);
        const conflicts = root.YC.selectors.scheduleConflicts(draft, { teacherId: payload.teacherId, branchId: cohort.branchId, room: session.room, startsAt: session.startsAt, endsAt: session.endsAt });
        if (conflicts.length) throw new CommandError('SCHEDULE_CONFLICT', 'Lịch bị trùng giáo viên hoặc phòng.', { evidence: conflicts });
        session.status = 'CONFIRMED';
        appendEvent(draft, context, 'SESSION_CONFIRMED', 'SESSION', session.id, 'Buổi học đã được xác nhận.');
        appendAudit(draft, context, 'SESSION_CONFIRMED', 'SESSION', session.id, 'Đã vượt qua kiểm tra trùng lịch.');
        return { message: 'Đã xác nhận buổi học.' };
      },

      MARK_SESSION_READY(draft, payload, context) {
        requireRole(context.actor, ['TEACHER']);
        const session = required(draft.sessions.find((item) => item.id === payload.sessionId), 'SESSION_NOT_FOUND', 'Không tìm thấy buổi học.');
        const profile = draft.teacherProfiles.find((item) => item.userId === context.actor.id);
        const assigned = profile && draft.teacherAssignments.some((item) => item.teacherProfileId === profile.id && item.classId === session.classId && item.status === 'ACTIVE');
        if (!assigned) throw new CommandError('SESSION_NOT_ASSIGNED', 'Giáo viên chưa được phân công vào lớp này.');
        const plan = required(draft.lessonPlans.find((item) => item.sessionId === session.id), 'LESSON_PLAN_NOT_FOUND', 'Buổi học chưa có giáo án.');
        plan.adaptations = payload.adaptations || plan.adaptations;
        plan.readiness = 'READY';
        plan.readyAt = nowIso();
        appendEvent(draft, context, 'SESSION_READY', 'LESSON_PLAN', plan.id, 'Giáo viên xác nhận sẵn sàng trước buổi học.');
        appendAudit(draft, context, 'SESSION_READY', 'LESSON_PLAN', plan.id, `${plan.adaptations.length} điều chỉnh.`);
        return { message: 'Đã xác nhận giáo án sẵn sàng.' };
      },

      START_SESSION(draft, payload, context) {
        requireRole(context.actor, ['TEACHER']);
        const session = required(draft.sessions.find((item) => item.id === payload.sessionId), 'SESSION_NOT_FOUND', 'Không tìm thấy buổi học.');
        const plan = draft.lessonPlans.find((item) => item.sessionId === session.id);
        if (!plan || plan.readiness !== 'READY') throw new CommandError('SESSION_NOT_READY', 'Cần xác nhận giáo án sẵn sàng trước khi bắt đầu.');
        if (session.status !== 'CONFIRMED') throw new CommandError('INVALID_SESSION_STATE', 'Chỉ buổi đã xác nhận mới được bắt đầu.');
        session.status = 'IN_PROGRESS';
        session.actualStartsAt = nowIso();
        appendEvent(draft, context, 'SESSION_STARTED', 'SESSION', session.id, 'Giáo viên xác nhận có mặt và bắt đầu buổi học.');
        appendAudit(draft, context, 'TEACHER_CHECKED_IN', 'SESSION', session.id, context.actor.name);
        return { message: 'Buổi học đã bắt đầu.' };
      },

      COMPLETE_SESSION(draft, payload, context) {
        requireRole(context.actor, ['TEACHER']);
        const session = required(draft.sessions.find((item) => item.id === payload.sessionId), 'SESSION_NOT_FOUND', 'Không tìm thấy buổi học.');
        if (session.status !== 'IN_PROGRESS') throw new CommandError('INVALID_SESSION_STATE', 'Buổi học phải đang diễn ra trước khi hoàn tất.');
        const taughtItemIds = payload.taughtItemIds || [];
        if (!taughtItemIds.length) throw new CommandError('DELIVERY_EVIDENCE_REQUIRED', 'Cần ghi nhận ít nhất một nội dung học tập đã dạy.');
        const delivery = {
          id: uid('delivery'),
          sessionId: session.id,
          teacherId: context.actor.id,
          actualStartsAt: session.actualStartsAt,
          actualEndsAt: nowIso(),
          taughtItemIds,
          deferredItemIds: payload.deferredItemIds || [],
          note: payload.note || '',
          coverageStatus: (payload.deferredItemIds || []).length ? 'GAP' : 'COMPLETE',
          status: 'RECORDED',
        };
        draft.deliveryRecords.push(delivery);
        session.status = 'COMPLETED';
        session.actualEndsAt = delivery.actualEndsAt;
        appendEvent(draft, context, 'DELIVERY_RECORDED', 'DELIVERY_RECORD', delivery.id, `${taughtItemIds.length} item đã dạy, ${delivery.deferredItemIds.length} item deferred.`);
        appendAudit(draft, context, 'SESSION_COMPLETED', 'SESSION', session.id, payload.note || 'Đã đủ bằng chứng giảng dạy.');
        if (delivery.coverageStatus === 'GAP') notifyRole(draft, 'ACADEMIC_MANAGER', 'Có nội dung chưa dạy cần theo dõi', payload.note || 'Buổi học có nội dung được chuyển sang sau.', '/app/academic/dashboard');
        return { message: 'Đã hoàn tất buổi học và lưu bằng chứng giảng dạy.' };
      },

      CORRECT_ATTENDANCE(draft, payload, context) {
        requireRole(context.actor, ['STUDENT_SERVICE', 'ACADEMIC_MANAGER']);
        if (!String(payload.reason || '').trim()) throw new CommandError('REASON_REQUIRED', 'Sửa điểm danh cần lý do để ghi nhật ký.');
        const record = required(draft.attendanceRecords.find((item) => item.id === payload.attendanceId), 'ATTENDANCE_NOT_FOUND', 'Không tìm thấy bản ghi điểm danh.');
        const previous = record.status;
        record.status = payload.status;
        record.correctedAt = nowIso();
        record.correctedBy = context.actor.id;
        record.correctionReason = payload.reason.trim();
        appendEvent(draft, context, 'ATTENDANCE_CORRECTED', 'ATTENDANCE', record.id, `${previous} → ${record.status}.`, { learnerId: record.learnerId });
        appendAudit(draft, context, 'ATTENDANCE_CORRECTED', 'ATTENDANCE', record.id, payload.reason.trim());
        return { message: 'Đã sửa điểm danh với đầy đủ lý do.' };
      },

      REQUEST_SUBSTITUTION(draft, payload, context) {
        requireRole(context.actor, ['STUDENT_SERVICE', 'ACADEMIC_MANAGER']);
        if (!String(payload.reason || '').trim()) throw new CommandError('REASON_REQUIRED', 'Yêu cầu dạy thay cần lý do.');
        const session = required(draft.sessions.find((item) => item.id === payload.sessionId), 'SESSION_NOT_FOUND', 'Không tìm thấy buổi học.');
        if (draft.substitutions.some((item) => item.sessionId === session.id && !['CLOSED', 'CANCELLED'].includes(item.status))) throw new CommandError('SUBSTITUTION_EXISTS', 'Buổi học đã có yêu cầu dạy thay đang xử lý.');
        const primary = draft.teacherAssignments.find((item) => item.classId === session.classId && item.status === 'ACTIVE');
        const substitution = { id: uid('substitution'), sessionId: session.id, originalTeacherProfileId: primary?.teacherProfileId || null, replacementTeacherProfileId: null, reason: payload.reason.trim(), status: 'REQUESTED', handover: null, requestedBy: context.actor.id, requestedAt: nowIso(), accessStartsAt: null, accessEndsAt: null };
        draft.substitutions.push(substitution);
        appendEvent(draft, context, 'SUBSTITUTION_REQUESTED', 'SUBSTITUTION', substitution.id, payload.reason.trim());
        appendAudit(draft, context, 'SUBSTITUTION_REQUESTED', 'SUBSTITUTION', substitution.id, payload.reason.trim());
        return { message: 'Đã mở yêu cầu tìm giáo viên dạy thay.' };
      },

      CONFIRM_SUBSTITUTE(draft, payload, context) {
        requireRole(context.actor, ['STUDENT_SERVICE', 'ACADEMIC_MANAGER']);
        const substitution = required(draft.substitutions.find((item) => item.sessionId === payload.sessionId && item.status === 'REQUESTED'), 'SUBSTITUTION_NOT_FOUND', 'Không tìm thấy yêu cầu dạy thay.');
        const session = draft.sessions.find((item) => item.id === payload.sessionId);
        const eligibility = root.YC.selectors.teacherEligibility(draft, payload.replacementTeacherId, session.classId, 90);
        if (!eligibility.eligible) throw new CommandError('TEACHER_INELIGIBLE', 'Giáo viên dạy thay không đạt điều kiện bắt buộc.', { evidence: eligibility });
        const replacement = draft.teacherProfiles.find((item) => item.userId === payload.replacementTeacherId);
        substitution.replacementTeacherProfileId = replacement.id;
        substitution.status = 'CONFIRMED';
        substitution.confirmedAt = nowIso();
        substitution.accessStartsAt = new Date(new Date(session.startsAt).getTime() - 86400000).toISOString();
        substitution.accessEndsAt = new Date(new Date(session.endsAt).getTime() + 86400000).toISOString();
        appendEvent(draft, context, 'SUBSTITUTE_CONFIRMED', 'SUBSTITUTION', substitution.id, `${draft.users.find((item) => item.id === payload.replacementTeacherId)?.name} đã được chọn.`);
        appendAudit(draft, context, 'SUBSTITUTE_ACCESS_GRANTED', 'SUBSTITUTION', substitution.id, 'Quyền theo buổi học trong thời gian bàn giao.');
        return { message: 'Đã xác nhận giáo viên dạy thay.' };
      },

      MARK_HANDOVER_READY(draft, payload, context) {
        requireRole(context.actor, ['TEACHER', 'STUDENT_SERVICE']);
        const substitution = required(draft.substitutions.find((item) => item.sessionId === payload.sessionId && item.status === 'CONFIRMED'), 'SUBSTITUTION_NOT_CONFIRMED', 'Yêu cầu dạy thay chưa được xác nhận.');
        if (!String(payload.note || '').trim()) throw new CommandError('HANDOVER_REQUIRED', 'Cần nội dung bàn giao.');
        substitution.handover = { note: payload.note.trim(), lessonTemplateId: draft.sessions.find((item) => item.id === payload.sessionId)?.lessonTemplateId, openHomeworkIds: draft.homeworkAssignments.filter((item) => item.classId === draft.sessions.find((session) => session.id === payload.sessionId)?.classId).map((item) => item.id), preparedBy: context.actor.id, preparedAt: nowIso() };
        substitution.status = 'HANDOVER_READY';
        appendEvent(draft, context, 'SUBSTITUTION_HANDOVER_READY', 'SUBSTITUTION', substitution.id, payload.note.trim());
        appendAudit(draft, context, 'SUBSTITUTION_HANDOVER_READY', 'SUBSTITUTION', substitution.id, 'Bài học, rủi ro và bài tập đã được bàn giao.');
        return { message: 'Gói bàn giao đã sẵn sàng.' };
      },

      CLOSE_SUBSTITUTION(draft, payload, context) {
        requireRole(context.actor, ['STUDENT_SERVICE', 'ACADEMIC_MANAGER']);
        const substitution = required(draft.substitutions.find((item) => item.sessionId === payload.sessionId && !['CLOSED', 'CANCELLED'].includes(item.status)), 'SUBSTITUTION_NOT_FOUND', 'Không tìm thấy yêu cầu dạy thay.');
        if (substitution.status !== 'HANDOVER_READY') throw new CommandError('HANDOVER_NOT_READY', 'Cần hoàn tất bàn giao trước khi đóng yêu cầu dạy thay.');
        substitution.status = 'CLOSED';
        substitution.closedAt = nowIso();
        appendEvent(draft, context, 'SUBSTITUTION_CLOSED', 'SUBSTITUTION', substitution.id, 'Đã đóng yêu cầu dạy thay và giới hạn thời gian truy cập.');
        appendAudit(draft, context, 'SUBSTITUTION_CLOSED', 'SUBSTITUTION', substitution.id, 'Đã giữ lại bằng chứng bàn giao.');
        return { message: 'Đã đóng yêu cầu dạy thay.' };
      },

      BOOK_MAKE_UP(draft, payload, context) {
        requireRole(context.actor, ['STUDENT_SERVICE']);
        const attendance = required(draft.attendanceRecords.find((item) => item.id === payload.attendanceId && ['ABSENT', 'EXCUSED'].includes(item.status)), 'MAKE_UP_NOT_ELIGIBLE', 'Bản ghi điểm danh chưa đủ điều kiện học bù.');
        const session = required(draft.sessions.find((item) => item.id === payload.makeUpSessionId), 'SESSION_NOT_FOUND', 'Không tìm thấy buổi học bù.');
        const booking = { id: uid('make-up'), learnerId: attendance.learnerId, sourceAttendanceId: attendance.id, sessionId: session.id, status: 'BOOKED', bookedBy: context.actor.id, bookedAt: nowIso() };
        draft.makeUpBookings.push(booking);
        appendEvent(draft, context, 'MAKE_UP_BOOKED', 'MAKE_UP', booking.id, 'Đã đặt buổi học bù.', { learnerId: booking.learnerId });
        appendAudit(draft, context, 'MAKE_UP_BOOKED', 'MAKE_UP', booking.id, `Buổi học ${session.id}.`);
        return { message: 'Đã đặt buổi học bù.' };
      },

      FINALIZE_ATTENDANCE(draft, payload, context) {
        requireRole(context.actor, ['TEACHER', 'TA']);
        const session = required(draft.sessions.find((item) => item.id === payload.sessionId), 'SESSION_NOT_FOUND', 'Không tìm thấy buổi học.');
        if (!['IN_PROGRESS', 'COMPLETED'].includes(session.status)) throw new CommandError('INVALID_SESSION_STATE', 'Chỉ điểm danh khi buổi học đang hoặc đã diễn ra.');
        if (!root.YC.policy.can(context.actor, 'ATTENDANCE_EDIT', { classId: session.classId }, draft)) throw new CommandError('FORBIDDEN', 'Không có phân công hiệu lực cho lớp này.');
        const records = payload.records || [];
        if (!records.length) throw new CommandError('ATTENDANCE_REQUIRED', 'Cần ít nhất một bản ghi điểm danh.');
        let createdAssignments = 0;
        for (const input of records) {
          const learner = required(draft.learners.find((item) => item.id === input.learnerId), 'LEARNER_NOT_FOUND', 'Không tìm thấy học viên trong danh sách điểm danh.');
          let record = draft.attendanceRecords.find((item) => item.sessionId === session.id && item.learnerId === learner.id);
          if (!record) {
            record = { id: uid('attendance'), sessionId: session.id, learnerId: learner.id };
            draft.attendanceRecords.push(record);
          }
          record.status = input.status;
          record.reasonCode = input.reasonCode || null;
          record.markedBy = context.actor.id;
          record.markedAt = nowIso();
          if (input.status === 'ABSENT' && !draft.remedialAssignments.some((item) => item.sessionId === session.id && item.learnerId === learner.id && item.status !== 'CANCELLED')) {
            const assignment = {
              id: uid('remedial'), learnerId: learner.id, sessionId: session.id, lessonTemplateId: session.lessonTemplateId,
              assessmentId: 'assessment-remedial', status: 'ASSIGNED', assignedAt: nowIso(),
              dueAt: new Date(new Date(nowIso()).getTime() + draft.settings.remedialDeadlineDays * 86400000).toISOString(),
              videoProgress: 0, highestScore: null, completionMode: null, completedAt: null,
              accessToken: uid('access'), accessStatus: 'ACTIVE', linkVersion: 1,
              accessExpiresAt: new Date(new Date(nowIso()).getTime() + draft.settings.remedialDeadlineDays * 86400000).toISOString(),
            };
            draft.remedialAssignments.push(assignment);
            createdAssignments += 1;
            appendEvent(draft, context, 'REMEDIAL_ASSIGNED', 'REMEDIAL_ASSIGNMENT', assignment.id, `${learner.name} nhận bài học bù.`, { learnerId: learner.id });
            const studentUser = draft.users.find((item) => item.role === 'STUDENT' && (item.linkedLearnerIds || []).includes(learner.id));
            if (studentUser) draft.notifications.unshift({ id: uid('notification'), userId: studentUser.id, title: 'Bạn có bài học bù mới', body: 'Hoàn tất video và bài kiểm tra trước hạn.', link: '/app/student/remedial', read: false, createdAt: nowIso() });
          }
        }
        session.attendanceFinalized = true;
        appendEvent(draft, context, 'ATTENDANCE_FINALIZED', 'SESSION', session.id, `${records.length} bản ghi · ${createdAssignments} bài học bù mới.`);
        appendAudit(draft, context, 'ATTENDANCE_FINALIZED', 'SESSION', session.id, `Không tạo trùng · ${createdAssignments} nhiệm vụ mới.`);
        return { message: `Đã lưu điểm danh; tạo ${createdAssignments} bài học bù.`, createdAssignments };
      },

      START_REMEDIAL(draft, payload, context) {
        requireRole(context.actor, ['STUDENT']);
        const assignment = required(draft.remedialAssignments.find((item) => item.id === payload.assignmentId), 'REMEDIAL_NOT_FOUND', 'Không tìm thấy bài học bù.');
        if (!(context.actor.linkedLearnerIds || []).includes(assignment.learnerId)) throw new CommandError('FORBIDDEN', 'Bài học bù không thuộc tài khoản này.');
        if (assignment.status === 'ASSIGNED') assignment.status = 'IN_PROGRESS';
        appendEvent(draft, context, 'REMEDIAL_STARTED', 'REMEDIAL_ASSIGNMENT', assignment.id, 'Học viên bắt đầu bài học bù.', { learnerId: assignment.learnerId });
        return { message: 'Đã bắt đầu bài học bù.' };
      },

      REGENERATE_REMEDIAL_LINK(draft, payload, context) {
        requireRole(context.actor, ['TEACHER', 'TA']);
        const assignment = required(draft.remedialAssignments.find((item) => item.id === payload.assignmentId), 'REMEDIAL_NOT_FOUND', 'Không tìm thấy bài học bù.');
        assignment.accessToken = uid('access');
        assignment.accessStatus = 'ACTIVE';
        assignment.linkVersion = Number(assignment.linkVersion || 1) + 1;
        assignment.accessExpiresAt = assignment.dueAt;
        appendEvent(draft, context, 'REMEDIAL_LINK_REGENERATED', 'REMEDIAL_ASSIGNMENT', assignment.id, `Đã tạo liên kết phiên bản ${assignment.linkVersion}.`, { learnerId: assignment.learnerId });
        appendAudit(draft, context, 'REMEDIAL_LINK_REGENERATED', 'REMEDIAL_ASSIGNMENT', assignment.id, `Phiên bản ${assignment.linkVersion}.`);
        return { message: 'Đã tạo lại liên kết bài học bù.', linkVersion: assignment.linkVersion };
      },

      REVOKE_REMEDIAL_LINK(draft, payload, context) {
        requireRole(context.actor, ['TEACHER', 'TA']);
        const assignment = required(draft.remedialAssignments.find((item) => item.id === payload.assignmentId), 'REMEDIAL_NOT_FOUND', 'Không tìm thấy bài học bù.');
        const reason = String(payload.reason || '').trim();
        if (!reason) throw new CommandError('REASON_REQUIRED', 'Thu hồi liên kết cần có lý do.');
        assignment.accessStatus = 'REVOKED';
        assignment.revokedAt = nowIso();
        assignment.revokedBy = context.actor.id;
        assignment.revocationReason = reason;
        appendEvent(draft, context, 'REMEDIAL_LINK_REVOKED', 'REMEDIAL_ASSIGNMENT', assignment.id, reason, { learnerId: assignment.learnerId });
        appendAudit(draft, context, 'REMEDIAL_LINK_REVOKED', 'REMEDIAL_ASSIGNMENT', assignment.id, reason);
        return { message: 'Đã thu hồi liên kết bài học bù.' };
      },

      EXTEND_REMEDIAL_DEADLINE(draft, payload, context) {
        requireRole(context.actor, ['TEACHER', 'TA']);
        const assignment = required(draft.remedialAssignments.find((item) => item.id === payload.assignmentId), 'REMEDIAL_NOT_FOUND', 'Không tìm thấy bài học bù.');
        const reason = String(payload.reason || '').trim();
        const days = Number(payload.days || 0);
        if (!reason) throw new CommandError('REASON_REQUIRED', 'Gia hạn cần có lý do.');
        if (!Number.isInteger(days) || days < 1 || days > 30) throw new CommandError('INVALID_EXTENSION', 'Số ngày gia hạn phải từ 1 đến 30.');
        assignment.dueAt = new Date(new Date(assignment.dueAt).getTime() + days * 86400000).toISOString();
        if (assignment.accessStatus === 'ACTIVE') assignment.accessExpiresAt = assignment.dueAt;
        appendEvent(draft, context, 'REMEDIAL_DEADLINE_EXTENDED', 'REMEDIAL_ASSIGNMENT', assignment.id, `Gia hạn ${days} ngày.`, { learnerId: assignment.learnerId });
        appendAudit(draft, context, 'REMEDIAL_DEADLINE_EXTENDED', 'REMEDIAL_ASSIGNMENT', assignment.id, `${days} ngày · ${reason}`);
        return { message: `Đã gia hạn ${days} ngày.`, dueAt: assignment.dueAt };
      },

      UPDATE_VIDEO_PROGRESS(draft, payload, context) {
        requireRole(context.actor, ['STUDENT']);
        const assignment = required(draft.remedialAssignments.find((item) => item.id === payload.assignmentId), 'REMEDIAL_NOT_FOUND', 'Không tìm thấy bài học bù.');
        if (!(context.actor.linkedLearnerIds || []).includes(assignment.learnerId)) throw new CommandError('FORBIDDEN', 'Bài học bù không thuộc tài khoản này.');
        assignment.videoProgress = Math.max(0, Math.min(100, Number(payload.progress || 0)));
        if (assignment.status === 'ASSIGNED') assignment.status = 'IN_PROGRESS';
        let progressRecord = draft.videoProgressRecords.find((item) => item.assignmentId === assignment.id);
        if (!progressRecord) {
          progressRecord = { id: uid('video-progress'), assignmentId: assignment.id, learnerId: assignment.learnerId };
          draft.videoProgressRecords.push(progressRecord);
        }
        progressRecord.progress = assignment.videoProgress;
        progressRecord.updatedAt = nowIso();
        appendEvent(draft, context, 'VIDEO_PROGRESS_UPDATED', 'VIDEO_PROGRESS', progressRecord.id, `${assignment.videoProgress}%`, { learnerId: assignment.learnerId });
        return { message: `Đã lưu ${assignment.videoProgress}% tiến độ video.` };
      },

      SUBMIT_AUTO_ASSESSMENT(draft, payload, context) {
        requireRole(context.actor, ['STUDENT']);
        const assignment = required(draft.remedialAssignments.find((item) => item.id === payload.assignmentId), 'REMEDIAL_NOT_FOUND', 'Không tìm thấy bài học bù.');
        if (!(context.actor.linkedLearnerIds || []).includes(assignment.learnerId)) throw new CommandError('FORBIDDEN', 'Bài kiểm tra không thuộc tài khoản này.');
        const assessment = required(draft.assessments.find((item) => item.id === assignment.assessmentId), 'ASSESSMENT_NOT_FOUND', 'Không tìm thấy bài kiểm tra.');
        const previous = draft.attempts.filter((item) => item.assignmentId === assignment.id);
        if (previous.length >= assessment.maxAttempts) throw new CommandError('MAX_ATTEMPTS_REACHED', 'Đã hết số lượt làm bài.');
        const answers = payload.answers || [];
        if (answers.length !== assessment.questionIds.length) throw new CommandError('INCOMPLETE_ATTEMPT', 'Cần trả lời đầy đủ trước khi nộp.');
        const correct = assessment.questionIds.reduce((total, questionId, index) => {
          const question = draft.questions.find((item) => item.id === questionId);
          return total + (Number(answers[index]) === Number(question.correctIndex) ? 1 : 0);
        }, 0);
        const score = Math.round((correct / assessment.questionIds.length) * 100);
        const attempt = { id: uid('attempt'), assignmentId: assignment.id, learnerId: assignment.learnerId, assessmentId: assessment.id, attemptNumber: previous.length + 1, answers: answers.slice(), correct, score, status: 'RELEASED', startedAt: nowIso(), submittedAt: nowIso(), releasedAt: nowIso(), gradingMode: 'AUTO' };
        draft.attempts.push(attempt);
        assignment.highestScore = Math.max(Number(assignment.highestScore || 0), score);
        const completion = root.YC.selectors.completionStatus(draft, assignment.id);
        if (completion.completed) {
          assignment.status = 'COMPLETED';
          assignment.completedAt = nowIso();
          assignment.completionMode = 'AUTO';
          appendEvent(draft, context, 'REMEDIAL_COMPLETED', 'REMEDIAL_ASSIGNMENT', assignment.id, `${score}/100 · tiến độ video ${assignment.videoProgress}%.`, { learnerId: assignment.learnerId });
          draft.notifications.unshift({ id: uid('notification'), userId: context.actor.id, title: 'Bạn đã bù xong', body: `Kết quả ${score}/100 đã được ghi nhận.`, link: '/app/student/progress', read: false, createdAt: nowIso() });
          notifyRole(draft, 'TEACHER', 'Học viên đã bù xong', `${draft.learners.find((item) => item.id === assignment.learnerId)?.name}: ${score}/100.`, '/app/teacher/dashboard');
        } else {
          assignment.status = 'NOT_PASSED';
          appendEvent(draft, context, 'ASSESSMENT_ATTEMPT_RELEASED', 'ATTEMPT', attempt.id, `${score}/100 · chưa đủ điều kiện hoàn thành.`, { learnerId: assignment.learnerId });
        }
        appendAudit(draft, context, 'AUTO_ASSESSMENT_SUBMITTED', 'ATTEMPT', attempt.id, `${correct}/${assessment.questionIds.length} câu đúng.`);
        return { message: completion.completed ? 'Đã hoàn tất bài học bù.' : 'Đã lưu kết quả; còn thiếu điều kiện hoàn thành.', score, completed: completion.completed };
      },

      ASSIGN_HOMEWORK(draft, payload, context) {
        requireRole(context.actor, ['TEACHER']);
        const learner = required(draft.learners.find((item) => item.id === payload.learnerId), 'LEARNER_NOT_FOUND', 'Không tìm thấy học viên.');
        if (!root.YC.policy.can(context.actor, 'HOMEWORK_EDIT', { classId: payload.classId, learnerId: learner.id }, draft)) throw new CommandError('FORBIDDEN', 'Không có quyền giao bài cho lớp này.');
        const homework = { id: uid('homework'), classId: payload.classId, learnerId: learner.id, title: payload.title, objective: payload.objective || 'Thực hành và củng cố', status: 'ASSIGNED', assignedBy: context.actor.id, assignedAt: nowIso(), dueAt: new Date(new Date(nowIso()).getTime() + 3 * 86400000).toISOString(), currentSubmissionId: null };
        draft.homeworkAssignments.push(homework);
        appendEvent(draft, context, 'HOMEWORK_ASSIGNED', 'HOMEWORK', homework.id, homework.title, { learnerId: learner.id });
        return { message: 'Đã giao bài tập.' };
      },

      SUBMIT_HOMEWORK(draft, payload, context) {
        requireRole(context.actor, ['STUDENT']);
        const homework = required(draft.homeworkAssignments.find((item) => item.id === payload.homeworkId), 'HOMEWORK_NOT_FOUND', 'Không tìm thấy bài tập.');
        if (!(context.actor.linkedLearnerIds || []).includes(homework.learnerId)) throw new CommandError('FORBIDDEN', 'Bài tập không thuộc tài khoản này.');
        if (!['ASSIGNED', 'REVISION_REQUIRED'].includes(homework.status)) throw new CommandError('INVALID_HOMEWORK_STATE', 'Bài tập chưa sẵn sàng để nộp.');
        const submission = { id: uid('homework-submission'), homeworkId: homework.id, learnerId: homework.learnerId, version: draft.homeworkSubmissions.filter((item) => item.homeworkId === homework.id).length + 1, evidence: payload.evidence, status: 'SUBMITTED', submittedAt: nowIso() };
        draft.homeworkSubmissions.push(submission);
        homework.currentSubmissionId = submission.id;
        homework.status = homework.status === 'REVISION_REQUIRED' ? 'RESUBMITTED' : 'SUBMITTED';
        appendEvent(draft, context, 'HOMEWORK_SUBMITTED', 'HOMEWORK_SUBMISSION', submission.id, `${homework.title} · v${submission.version}.`, { learnerId: homework.learnerId });
        notifyRole(draft, 'TEACHER', 'Có bài tập chờ chấm', homework.title, '/app/teacher/grading');
        return { message: 'Đã nộp bài tập.' };
      },

      RESUBMIT_HOMEWORK(draft, payload, context) {
        return handlers.SUBMIT_HOMEWORK(draft, payload, context);
      },

      GRADE_HOMEWORK(draft, payload, context) {
        requireRole(context.actor, ['TEACHER']);
        const homework = required(draft.homeworkAssignments.find((item) => item.id === payload.homeworkId), 'HOMEWORK_NOT_FOUND', 'Không tìm thấy bài tập.');
        if (!['SUBMITTED', 'RESUBMITTED'].includes(homework.status)) throw new CommandError('INVALID_HOMEWORK_STATE', 'Bài tập chưa có bài nộp chờ chấm.');
        const submission = draft.homeworkSubmissions.find((item) => item.id === homework.currentSubmissionId);
        submission.score = Number(payload.score);
        submission.feedback = payload.feedback;
        submission.gradedBy = context.actor.id;
        submission.gradedAt = nowIso();
        submission.status = 'FEEDBACK_READY';
        homework.status = 'FEEDBACK_READY';
        appendEvent(draft, context, 'HOMEWORK_GRADED', 'HOMEWORK_SUBMISSION', submission.id, `${submission.score}/100.`, { learnerId: homework.learnerId });
        return { message: 'Đã chấm bài tập và chuẩn bị nhận xét.' };
      },

      RELEASE_HOMEWORK_FEEDBACK(draft, payload, context) {
        requireRole(context.actor, ['TEACHER']);
        const homework = required(draft.homeworkAssignments.find((item) => item.id === payload.homeworkId), 'HOMEWORK_NOT_FOUND', 'Không tìm thấy bài tập.');
        if (homework.status !== 'FEEDBACK_READY') throw new CommandError('FEEDBACK_NOT_READY', 'Nhận xét chưa sẵn sàng để phát hành.');
        const submission = draft.homeworkSubmissions.find((item) => item.id === homework.currentSubmissionId);
        submission.status = 'RELEASED';
        submission.releasedAt = nowIso();
        homework.status = 'RELEASED';
        appendEvent(draft, context, 'HOMEWORK_FEEDBACK_RELEASED', 'HOMEWORK', homework.id, 'Nhận xét đã phát hành.', { learnerId: homework.learnerId });
        return { message: 'Đã phát hành nhận xét bài tập.' };
      },

      REQUEST_REVISION(draft, payload, context) {
        requireRole(context.actor, ['TEACHER']);
        const homework = required(draft.homeworkAssignments.find((item) => item.id === payload.homeworkId), 'HOMEWORK_NOT_FOUND', 'Không tìm thấy bài tập.');
        if (homework.status !== 'RELEASED') throw new CommandError('FEEDBACK_NOT_RELEASED', 'Cần phát hành nhận xét trước khi yêu cầu sửa bài.');
        homework.status = 'REVISION_REQUIRED';
        homework.nextAction = payload.nextAction;
        appendEvent(draft, context, 'HOMEWORK_REVISION_REQUIRED', 'HOMEWORK', homework.id, payload.nextAction, { learnerId: homework.learnerId });
        return { message: 'Đã yêu cầu nộp lại bài tập.' };
      },

      ACCEPT_HOMEWORK(draft, payload, context) {
        requireRole(context.actor, ['TEACHER']);
        const homework = required(draft.homeworkAssignments.find((item) => item.id === payload.homeworkId), 'HOMEWORK_NOT_FOUND', 'Không tìm thấy bài tập.');
        if (homework.status !== 'RELEASED') throw new CommandError('FEEDBACK_NOT_RELEASED', 'Cần phát hành nhận xét trước khi chấp nhận bài.' );
        homework.status = 'ACCEPTED';
        homework.acceptedAt = nowIso();
        appendEvent(draft, context, 'HOMEWORK_ACCEPTED', 'HOMEWORK', homework.id, 'Bài tập đã đạt mục tiêu.', { learnerId: homework.learnerId });
        return { message: 'Đã chấp nhận bài tập.' };
      },

      SUBMIT_MANUAL_GRADE(draft, payload, context) {
        requireRole(context.actor, ['TEACHER', 'ACADEMIC_MANAGER']);
        const assessment = required(draft.assessments.find((item) => item.id === payload.assessmentId), 'ASSESSMENT_NOT_FOUND', 'Không tìm thấy bài kiểm tra.');
        const learner = required(draft.learners.find((item) => item.id === payload.learnerId), 'LEARNER_NOT_FOUND', 'Không tìm thấy học viên.');
        const values = Object.values(payload.skills || {}).map(Number);
        if (values.length !== 6) throw new CommandError('SKILL_EVIDENCE_REQUIRED', 'Cần đủ điểm của sáu kỹ năng.');
        const score = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
        const attempt = { id: uid('attempt-final'), learnerId: learner.id, assessmentId: assessment.id, score, status: 'SUBMITTED_FOR_REVIEW', gradingMode: 'MANUAL', submittedAt: nowIso(), moderationRequired: assessment.purpose === 'FINAL' || values.some((value) => Math.abs(value - 60) <= 3) };
        draft.attempts.push(attempt);
        const grading = { id: uid('grading'), attemptId: attempt.id, learnerId: learner.id, graderId: context.actor.id, skills: { ...payload.skills }, score, feedback: payload.feedback, status: 'SUBMITTED_FOR_REVIEW', gradedAt: nowIso() };
        draft.gradingRecords.push(grading);
        const skillMap = { listening: 'LISTENING', reading: 'READING', spokenInteraction: 'SPOKEN_INTERACTION', spokenProduction: 'SPOKEN_PRODUCTION', writing: 'WRITING', language: 'LANGUAGE' };
        Object.entries(payload.skills).forEach(([key, value]) => draft.skillResults.push({ id: uid('skill-result'), learnerId: learner.id, assessmentId: assessment.id, attemptId: attempt.id, skill: skillMap[key], score: Number(value), status: 'PENDING_REVIEW', recordedAt: nowIso() }));
        appendEvent(draft, context, 'MANUAL_GRADE_SUBMITTED', 'GRADING_RECORD', grading.id, `${score}/100 · kiểm duyệt ${attempt.moderationRequired ? 'bắt buộc' : 'không bắt buộc'}.`, { learnerId: learner.id });
        notifyRole(draft, 'ACADEMIC_MANAGER', 'Có kết quả cần kiểm duyệt', `${learner.name} · ${assessment.title}.`, '/app/academic/moderation');
        return { message: 'Đã gửi điểm và bằng chứng để duyệt.', attemptId: attempt.id, score };
      },

      START_MODERATION(draft, payload, context) {
        requireRole(context.actor, ['ACADEMIC_MANAGER']);
        const attempt = required(draft.attempts.find((item) => item.id === payload.attemptId), 'ATTEMPT_NOT_FOUND', 'Không tìm thấy lượt làm bài.');
        if (!attempt.moderationRequired) throw new CommandError('MODERATION_NOT_REQUIRED', 'Lượt làm này không cần kiểm duyệt.');
        if (draft.moderationCases.some((item) => item.attemptId === attempt.id)) throw new CommandError('MODERATION_EXISTS', 'Hồ sơ kiểm duyệt đã tồn tại.');
        const moderation = { id: uid('moderation'), attemptId: attempt.id, learnerId: attempt.learnerId, status: 'MODERATION', variance: 2, reviewerId: context.actor.id, openedAt: nowIso() };
        draft.moderationCases.push(moderation);
        appendEvent(draft, context, 'MODERATION_STARTED', 'MODERATION_CASE', moderation.id, 'Bắt đầu đối chiếu thang điểm và bằng chứng.', { learnerId: attempt.learnerId });
        return { message: 'Đã mở hồ sơ kiểm duyệt.' };
      },

      APPROVE_MODERATION(draft, payload, context) {
        requireRole(context.actor, ['ACADEMIC_MANAGER']);
        const moderation = required(draft.moderationCases.find((item) => item.attemptId === payload.attemptId && item.status === 'MODERATION'), 'MODERATION_NOT_FOUND', 'Không tìm thấy hồ sơ kiểm duyệt đang mở.');
        if (!String(payload.note || '').trim()) throw new CommandError('EVIDENCE_NOTE_REQUIRED', 'Phê duyệt cần ghi chú bằng chứng.');
        moderation.status = 'APPROVED';
        moderation.note = payload.note.trim();
        moderation.approvedAt = nowIso();
        appendEvent(draft, context, 'MODERATION_APPROVED', 'MODERATION_CASE', moderation.id, moderation.note, { learnerId: moderation.learnerId });
        appendAudit(draft, context, 'MODERATION_APPROVED', 'MODERATION_CASE', moderation.id, moderation.note);
        return { message: 'Đã phê duyệt kiểm duyệt.' };
      },

      RELEASE_RESULT(draft, payload, context) {
        requireRole(context.actor, ['TEACHER', 'ACADEMIC_MANAGER']);
        const attempt = required(draft.attempts.find((item) => item.id === payload.attemptId), 'ATTEMPT_NOT_FOUND', 'Không tìm thấy lượt làm bài.');
        const grading = required(draft.gradingRecords.find((item) => item.attemptId === attempt.id), 'GRADING_NOT_FOUND', 'Không tìm thấy bản ghi chấm điểm.');
        if (attempt.moderationRequired && !draft.moderationCases.some((item) => item.attemptId === attempt.id && item.status === 'APPROVED')) throw new CommandError('MODERATION_REQUIRED', 'Kết quả cuối khóa hoặc sát ngưỡng cần được kiểm duyệt trước khi phát hành.');
        grading.status = 'RELEASED';
        grading.releasedAt = nowIso();
        attempt.status = 'RELEASED';
        attempt.releasedAt = nowIso();
        draft.skillResults.filter((item) => item.attemptId === attempt.id).forEach((item) => { item.status = 'RELEASED'; });
        appendEvent(draft, context, 'RESULT_RELEASED', 'ATTEMPT', attempt.id, `${attempt.score}/100.`, { learnerId: attempt.learnerId });
        appendAudit(draft, context, 'RESULT_RELEASED', 'ATTEMPT', attempt.id, attempt.moderationRequired ? 'Đã phát hành sau khi kiểm duyệt.' : 'Đã phát hành theo quy tắc chấm điểm.');
        return { message: 'Đã phát hành kết quả.' };
      },

      OPEN_INTERVENTION(draft, payload, context) {
        requireRole(context.actor, ['ACADEMIC_MANAGER', 'TEACHER', 'STUDENT_SERVICE']);
        if (!String(payload.plan || '').trim() || !payload.followUpAt) throw new CommandError('INTERVENTION_PLAN_REQUIRED', 'Can thiệp cần kế hoạch hành động và ngày theo dõi tiếp theo.');
        const learner = required(draft.learners.find((item) => item.id === payload.learnerId), 'LEARNER_NOT_FOUND', 'Không tìm thấy học viên.');
        const owner = draft.users.find((item) => item.role === payload.ownerRole && item.status === 'ACTIVE');
        const intervention = { id: uid('intervention'), learnerId: learner.id, signal: payload.signal, ownerRole: payload.ownerRole, ownerId: owner?.id || context.actor.id, status: 'OPEN', plan: payload.plan.trim(), followUpAt: payload.followUpAt, outcome: null, openedBy: context.actor.id, openedAt: nowIso() };
        draft.interventionCases.push(intervention);
        appendEvent(draft, context, 'INTERVENTION_OPENED', 'INTERVENTION', intervention.id, `${payload.signal} → ${payload.ownerRole}.`, { learnerId: learner.id });
        appendAudit(draft, context, 'INTERVENTION_OPENED', 'INTERVENTION', intervention.id, intervention.plan);
        notifyRole(draft, payload.ownerRole, 'Có can thiệp cần xử lý', `${learner.name}: ${payload.signal}.`, '/app/service/cases');
        return { message: 'Đã mở can thiệp và giao người phụ trách.' };
      },

      PUBLISH_PROGRESS_REPORT(draft, payload, context) {
        requireRole(context.actor, ['ACADEMIC_MANAGER']);
        const learner = required(draft.learners.find((item) => item.id === payload.learnerId), 'LEARNER_NOT_FOUND', 'Không tìm thấy học viên.');
        const evidence = root.YC.selectors.progressReportEvidence(draft, learner.id);
        if (evidence.skillProfile.some((item) => item.score === null)) throw new CommandError('SKILL_EVIDENCE_INCOMPLETE', 'Cần đủ kết quả sáu kỹ năng đã phát hành.');
        const report = { id: uid('progress-report'), learnerId: learner.id, status: 'PUBLISHED', snapshot: { attendanceRate: evidence.attendanceRate, homeworkCompletion: evidence.homeworkCompletion }, skillProfile: evidence.skillProfile, narrative: payload.narrative, nextActions: payload.nextActions || [], evidenceIds: [...evidence.interventionIds, ...evidence.remedialIds, ...evidence.skillProfile.map((item) => item.evidenceId)], approvedBy: context.actor.id, publishedAt: nowIso() };
        draft.progressReports.push(report);
        appendEvent(draft, context, 'PROGRESS_REPORT_PUBLISHED', 'PROGRESS_REPORT', report.id, learner.name, { learnerId: learner.id });
        appendAudit(draft, context, 'PROGRESS_REPORT_PUBLISHED', 'PROGRESS_REPORT', report.id, 'Bằng chứng đã công bố hiển thị cho học viên và phụ huynh.');
        const parent = draft.users.find((item) => item.role === 'PARENT' && (item.linkedLearnerIds || []).includes(learner.id));
        if (parent) draft.notifications.unshift({ id: uid('notification'), userId: parent.id, title: 'Báo cáo tiến bộ đã phát hành', body: `${learner.name}: xem kết quả và việc cần làm tiếp theo.`, link: '/app/parent/progress', read: false, createdAt: nowIso() });
        return { message: 'Đã phát hành báo cáo tiến bộ.', reportId: report.id };
      },

      DECIDE_PROMOTION(draft, payload, context) {
        requireRole(context.actor, ['ACADEMIC_MANAGER']);
        const learner = required(draft.learners.find((item) => item.id === payload.learnerId), 'LEARNER_NOT_FOUND', 'Không tìm thấy học viên.');
        const report = required(draft.progressReports.find((item) => item.learnerId === learner.id && item.status === 'PUBLISHED'), 'PROGRESS_REPORT_REQUIRED', 'Cần báo cáo tiến bộ đã công bố.');
        const enrollment = draft.enrollments.find((item) => item.learnerId === learner.id && item.status === 'ACTIVE');
        const courseVersion = draft.courseVersions.find((item) => item.id === enrollment?.courseVersionId) || draft.courseVersions.find((item) => item.id === 'course-v6');
        const minimum = courseVersion.completionRule.skillMinimum;
        const skillThresholds = report.skillProfile.map((item) => ({ skill: item.skill, score: item.score, minimum, passed: item.score >= minimum }));
        const overall = Math.round(report.skillProfile.reduce((sum, item) => sum + item.score, 0) / report.skillProfile.length);
        const evidence = { skillThresholds, attendanceRate: report.snapshot.attendanceRate, overall, rule: courseVersion.completionRule };
        const thresholdsPassed = skillThresholds.every((item) => item.passed)
          && report.snapshot.attendanceRate >= courseVersion.completionRule.attendanceMinimum
          && overall >= courseVersion.completionRule.finalScoreMinimum;
        const overrideReason = String(payload.overrideReason || '').trim();
        const overrideEvidence = Array.isArray(payload.overrideEvidence) ? payload.overrideEvidence.filter(Boolean) : [];
        if (payload.decision === 'PROMOTE' && !thresholdsPassed && (!overrideReason || overrideEvidence.length === 0)) {
          throw new CommandError('PROMOTION_THRESHOLDS_NOT_MET', 'Bằng chứng chưa đạt quy tắc lên lớp; ngoại lệ cần lý do và bằng chứng.', { evidence });
        }
        const decision = { id: uid('promotion'), learnerId: learner.id, progressReportId: report.id, decision: payload.decision, nextCourseVersionId: payload.nextCourseVersionId || null, evidence, status: 'FINAL', decidedBy: context.actor.id, decidedAt: nowIso(), overrideReason: overrideReason || null, overrideEvidence };
        draft.promotionDecisions.unshift(decision);
        appendEvent(draft, context, 'PROMOTION_DECIDED', 'PROMOTION', decision.id, `${learner.name}: ${decision.decision}.`, { learnerId: learner.id });
        appendAudit(draft, context, 'PROMOTION_DECIDED', 'PROMOTION', decision.id, `${decision.decision} · tổng thể ${overall}${overrideReason ? ` · ngoại lệ: ${overrideReason}` : ''}.`);
        notifyRole(draft, 'ADMISSIONS', 'Học viên sẵn sàng gia hạn', `${learner.name}: ${decision.decision}.`, '/app/admissions/renewals');
        return { message: 'Đã chốt quyết định lên lớp.', evidence };
      },

      ACKNOWLEDGE_PARENT_PROGRESS(draft, payload, context) {
        requireRole(context.actor, ['PARENT']);
        if (!(context.actor.linkedLearnerIds || []).includes(payload.learnerId)) throw new CommandError('FORBIDDEN', 'Học viên không thuộc tài khoản phụ huynh.');
        const report = required(draft.progressReports.find((item) => item.learnerId === payload.learnerId && item.status === 'PUBLISHED'), 'PROGRESS_REPORT_REQUIRED', 'Chưa có báo cáo tiến bộ được công bố.');
        appendEvent(draft, context, 'PARENT_PROGRESS_VIEWED', 'PROGRESS_REPORT', report.id, 'Phụ huynh đã xem báo cáo và việc cần làm tiếp theo.', { learnerId: payload.learnerId });
        appendAudit(draft, context, 'PARENT_PROGRESS_VIEWED', 'PROGRESS_REPORT', report.id, 'Đã lọc nội dung theo quyền xem của phụ huynh.');
        return { message: 'Đã ghi nhận phụ huynh xem báo cáo.' };
      },
    };

    function dispatch(name, payload = {}, actorId) {
      const handler = handlers[name];
      if (!handler) return { ok: false, code: 'UNKNOWN_COMMAND', message: `Command không tồn tại: ${name}` };
      const eventIds = [];
      try {
        let output;
        store.transact((draft) => {
          const actor = required(draft.users.find((item) => item.id === actorId), 'ACTOR_NOT_FOUND', 'Không tìm thấy người thực hiện.');
          const context = { actor, eventIds };
          output = handler(draft, payload, context) || {};
        });
        return { ok: true, eventIds, message: output.message || 'Đã cập nhật.', ...output };
      } catch (error) {
        if (error instanceof CommandError) {
          return { ok: false, code: error.code, message: error.message, alternatives: error.alternatives || [], evidence: error.evidence || null };
        }
        throw error;
      }
    }

    return Object.freeze({ dispatch, registered: Object.freeze(Object.keys(handlers)) });
  }

  root.YC.define('commands', Object.freeze({ CommandError, create }));
})(globalThis);
