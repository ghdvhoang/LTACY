const assert = require('node:assert/strict');
const test = require('node:test');
const { loadYC, memoryStorage } = require('../helpers/load-runtime.cjs');

const FIXED_NOW = '2026-09-05T02:00:00.000Z';

function runtimeWithTeacherAssignment() {
  const YC = loadYC(['seed', 'store', 'commands', 'selectors', 'router']);
  const store = YC.store.create({ storage: memoryStorage(), clock: () => FIXED_NOW });
  store.transact((draft) => {
    const learner = draft.learners.find((item) => item.id === 'student-canonical');
    learner.status = 'ACTIVE';
    learner.classId = 'class-6a';
    if (!draft.enrollments.some((item) => item.learnerId === learner.id && item.classId === 'class-6a')) {
      draft.enrollments.push({ id: 'enrollment-canonical-ops', learnerId: learner.id, classId: 'class-6a', courseVersionId: 'course-v6', status: 'ACTIVE', startsAt: FIXED_NOW, endsAt: null });
    }
    if (!draft.teacherAssignments.some((item) => item.teacherProfileId === 'teacher-profile-1' && item.classId === 'class-6a')) {
      draft.teacherAssignments.push({ id: 'assignment-canonical-ops', teacherProfileId: 'teacher-profile-1', classId: 'class-6a', role: 'PRIMARY', startsAt: '2026-01-01T00:00:00.000Z', endsAt: '2027-01-01T00:00:00.000Z', workloadMinutes: 720, status: 'ACTIVE' });
    }
    draft.sessions.find((item) => item.id === 'session-canonical').status = 'COMPLETED';
  });
  return { YC, store, bus: YC.commands.create(store), state: () => store.getState() };
}

function approve(bus, requestId) {
  return bus.dispatch('REVIEW_CHANGE_REQUEST', { requestId, decision: 'APPROVE', note: 'Đã kiểm tra dữ liệu và xung đột.' }, 'admin-1');
}

function requestSession(bus) {
  return bus.dispatch('REQUEST_CREATE_SESSION', {
    classId: 'class-6a', lessonTemplateId: 'lesson-past-simple',
    startsAt: '2026-09-08T11:00:00.000Z', endsAt: '2026-09-08T12:30:00.000Z',
    room: 'P.304', mode: 'OFFLINE', reason: 'Bổ sung buổi ôn tập',
  }, 'teacher-1');
}

function finalizeAbsent(bus) {
  return bus.dispatch('FINALIZE_ATTENDANCE', { sessionId: 'session-canonical', records: [{ learnerId: 'student-canonical', status: 'ABSENT', reasonCode: 'SICK' }] }, 'teacher-1');
}

function renderAs(YC, state, path, actorId) {
  return YC.router.render(path, { state, actor: state.users.find((item) => item.id === actorId), learnerId: 'student-canonical', path });
}

test('Teacher course create is pending while Admin approval creates canonical Course', () => {
  const { bus, state } = runtimeWithTeacherAssignment();
  const requested = bus.dispatch('REQUEST_CREATE_COURSE', {
    code: 'YEN-KIDS-A2', name: 'Tiếng Anh thiếu nhi A2', programId: 'program-foundation',
    levelId: 'level-a2-1', ageBand: 'YOUNG_LEARNER', mode: 'OFFLINE', reason: 'Mở lộ trình mới',
  }, 'teacher-1');
  assert.equal(requested.ok, true, requested.message);
  assert.equal(state().courses.some((item) => item.code === 'YEN-KIDS-A2'), false);
  const approved = approve(bus, requested.requestId);
  assert.equal(approved.ok, true, approved.message);
  const course = state().courses.find((item) => item.code === 'YEN-KIDS-A2');
  assert.equal(course.name, 'Tiếng Anh thiếu nhi A2');
  assert.equal(course.changeRequestId, requested.requestId);
  assert.equal(course.version, 1);
});

test('duplicate course code is rejected before a request enters the approval queue', () => {
  const { bus, state } = runtimeWithTeacherAssignment();
  const result = bus.dispatch('REQUEST_CREATE_COURSE', {
    code: 'ENG-FND-6', name: 'Tên trùng', programId: 'program-foundation', levelId: 'level-a2-1',
    ageBand: 'YOUNG_LEARNER', mode: 'OFFLINE', reason: 'Thử mã trùng',
  }, 'teacher-1');
  assert.equal(result.ok, false);
  assert.equal(result.code, 'COURSE_CODE_EXISTS');
  assert.equal(state().changeRequests.length, 0);
});

test('course version publish validation reports incomplete structure', () => {
  const { YC, store, state } = runtimeWithTeacherAssignment();
  store.transact((draft) => {
    draft.courseVersions.push({
      id: 'course-v-empty', courseId: 'course-6', version: 4, recordVersion: 1,
      title: 'Bản trống', status: 'DRAFT', immutable: false, totalHours: 0,
      completionRule: null, remedialPolicy: null,
    });
  });
  const validation = YC.selectors.coursePublishValidation(state(), 'course-v-empty');
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((item) => item.code === 'UNIT_REQUIRED'));
  assert.ok(validation.errors.some((item) => item.code === 'COMPLETION_RULE_REQUIRED'));
  assert.ok(validation.errors.some((item) => item.code === 'REMEDIAL_POLICY_REQUIRED'));
});

test('published Course Version is immutable and can be forked into a complete draft', () => {
  const { YC, bus, state } = runtimeWithTeacherAssignment();
  const immutable = bus.dispatch('PUBLISH_COURSE_VERSION', { courseVersionId: 'course-v6' }, 'academic-1');
  assert.equal(immutable.ok, false);
  assert.equal(immutable.code, 'COURSE_VERSION_IMMUTABLE');

  const forked = bus.dispatch('CREATE_COURSE_VERSION', {
    courseId: 'course-6', baseVersionId: 'course-v6', title: 'Tiếng Anh nền tảng 6 · bản cập nhật', changeSummary: 'Bổ sung luyện nói',
  }, 'academic-1');
  assert.equal(forked.ok, true, forked.message);
  const draft = state().courseVersions.find((item) => item.id === forked.courseVersionId);
  assert.equal(draft.status, 'DRAFT');
  assert.equal(draft.immutable, false);
  assert.equal(draft.baseVersionId, 'course-v6');
  assert.equal(draft.version, 4);
  assert.equal(YC.selectors.coursePublishValidation(state(), draft.id).valid, true);
  assert.ok(state().units.some((item) => item.courseVersionId === draft.id));
});

test('only a validated submitted Course Version can be published by Admin', () => {
  const { bus, state } = runtimeWithTeacherAssignment();
  const forked = bus.dispatch('CREATE_COURSE_VERSION', {
    courseId: 'course-6', baseVersionId: 'course-v6', title: 'Tiếng Anh nền tảng 6 · v4', changeSummary: 'Cập nhật hoạt động',
  }, 'academic-1');
  assert.equal(forked.ok, true);
  const submitted = bus.dispatch('SUBMIT_COURSE_VERSION', { courseVersionId: forked.courseVersionId, reason: 'Đã rà soát cấu trúc' }, 'academic-1');
  assert.equal(submitted.ok, true, submitted.message);
  const published = bus.dispatch('PUBLISH_COURSE_VERSION', { courseVersionId: forked.courseVersionId, reason: 'Duyệt phát hành' }, 'admin-1');
  assert.equal(published.ok, true, published.message);
  const version = state().courseVersions.find((item) => item.id === forked.courseVersionId);
  assert.equal(version.status, 'PUBLISHED');
  assert.equal(version.immutable, true);
  assert.equal(version.publishedBy, 'admin-1');
});

test('archiving a Course already used by a class retires it without deleting history', () => {
  const { bus, state } = runtimeWithTeacherAssignment();
  const result = bus.dispatch('ARCHIVE_COURSE', { courseId: 'course-6', reason: 'Ngừng mở lớp mới' }, 'admin-1');
  assert.equal(result.ok, true, result.message);
  assert.equal(state().courses.find((item) => item.id === 'course-6').status, 'RETIRED');
  assert.ok(state().courseVersions.some((item) => item.courseId === 'course-6'));
  assert.ok(state().classes.some((item) => item.courseVersionId === 'course-v6'));
});

test('class capacity includes active enrollment and held make-up seats', () => {
  const { YC, store, state: current } = runtimeWithTeacherAssignment();
  store.transact((draft) => {
    draft.makeUpBookings.push({ id: 'held-seat-1', targetSessionId: 'session-canonical', learnerId: 'student-04', status: 'HELD' });
  });
  const result = YC.selectors.classCapacity(current(), 'class-6a');
  assert.equal(result.used, result.activeEnrollments + result.makeUpReservations);
  assert.equal(result.makeUpReservations, 1);
  assert.equal(result.remaining, result.capacity - result.used);
});

test('Teacher class create stays pending and OPEN generates future sessions once', () => {
  const { bus, state } = runtimeWithTeacherAssignment();
  const requested = bus.dispatch('REQUEST_CREATE_CLASS', {
    code: 'YEN-A2-MW-1730', name: 'A2 Thứ 2 & 4', branchId: 'branch-q3', courseVersionId: 'course-v6',
    ageBand: 'YOUNG_LEARNER', mode: 'OFFLINE', capacity: 12, minCapacity: 2, room: 'P.306',
    startDate: '2026-09-07', endDate: '2026-10-01', timezone: 'Asia/Ho_Chi_Minh',
    recurrence: ['MON_1730', 'WED_1730'], durationMinutes: 90, reason: 'Mở lớp theo nhu cầu đầu vào',
  }, 'teacher-1');
  assert.equal(requested.ok, true, requested.message);
  assert.equal(state().classes.some((item) => item.code === 'YEN-A2-MW-1730'), false);
  assert.equal(approve(bus, requested.requestId).ok, true);
  const cohort = state().classes.find((item) => item.code === 'YEN-A2-MW-1730');
  assert.equal(cohort.status, 'DRAFT');
  assert.ok(state().timetableRules.some((item) => item.classId === cohort.id));

  const opened = bus.dispatch('OPEN_CLASS', { classId: cohort.id, reason: 'Sẵn sàng nhận học viên' }, 'admin-1');
  assert.equal(opened.ok, true, opened.message);
  const generated = state().sessions.filter((item) => item.classId === cohort.id);
  assert.ok(generated.length >= 2);
  assert.equal(new Set(generated.map((item) => item.startsAt)).size, generated.length);
});

test('a Class can only pin a published Course Version', () => {
  const { bus, store, state } = runtimeWithTeacherAssignment();
  store.transact((draft) => {
    draft.courseVersions.push({ id: 'course-v-draft', courseId: 'course-6', version: 4, recordVersion: 1, title: 'Bản nháp', status: 'DRAFT', immutable: false, totalHours: 48, completionRule: {}, remedialPolicy: {} });
  });
  const result = bus.dispatch('REQUEST_CREATE_CLASS', {
    code: 'YEN-DRAFT-CLASS', name: 'Lớp dùng bản nháp', branchId: 'branch-q3', courseVersionId: 'course-v-draft',
    ageBand: 'YOUNG_LEARNER', mode: 'OFFLINE', capacity: 12, minCapacity: 2, room: 'P.307',
    startDate: '2026-09-07', endDate: '2026-10-01', recurrence: ['TUE_1800'], durationMinutes: 90,
    reason: 'Kiểm tra phiên bản',
  }, 'teacher-1');
  assert.equal(result.ok, false);
  assert.equal(result.code, 'COURSE_VERSION_NOT_PUBLISHED');
  assert.equal(state().changeRequests.length, 0);
});

test('class readiness enforces minimum capacity unless Admin records an override', () => {
  const { YC, bus, store, state } = runtimeWithTeacherAssignment();
  store.transact((draft) => {
    const cohort = draft.classes.find((item) => item.id === 'class-6a');
    cohort.status = 'OPEN';
    cohort.minCapacity = 10;
    cohort.timezone = 'Asia/Ho_Chi_Minh';
  });
  const readiness = YC.selectors.classReadiness(state(), 'class-6a');
  assert.equal(readiness.ready, false);
  assert.ok(readiness.errors.some((item) => item.code === 'MINIMUM_CAPACITY'));

  const blocked = bus.dispatch('MARK_CLASS_READY', { classId: 'class-6a' }, 'admin-1');
  assert.equal(blocked.ok, false);
  assert.equal(blocked.code, 'CLASS_NOT_READY');
  const overridden = bus.dispatch('MARK_CLASS_READY', { classId: 'class-6a', overrideReason: 'Khai giảng nhóm nhỏ theo cam kết phụ huynh' }, 'admin-1');
  assert.equal(overridden.ok, true, overridden.message);
  assert.equal(state().classes.find((item) => item.id === 'class-6a').status, 'READY');
  assert.match(state().classes.find((item) => item.id === 'class-6a').readinessOverride.reason, /Khai giảng nhóm nhỏ/);
});

test('Course Version cannot be swapped after a Class has its first Session', () => {
  const { bus, state } = runtimeWithTeacherAssignment();
  const result = bus.dispatch('REQUEST_UPDATE_CLASS', {
    classId: 'class-6a', courseVersionId: 'course-v7', reason: 'Thử đổi chương trình giữa khóa',
  }, 'teacher-1');
  assert.equal(result.ok, false);
  assert.equal(result.code, 'COURSE_VERSION_PINNED');
  assert.equal(state().classes.find((item) => item.id === 'class-6a').courseVersionId, 'course-v6');
});

test('archiving a used Class preserves its enrollments and Sessions', () => {
  const { bus, state } = runtimeWithTeacherAssignment();
  const enrollmentCount = state().enrollments.filter((item) => item.classId === 'class-6a').length;
  const sessionCount = state().sessions.filter((item) => item.classId === 'class-6a').length;
  const result = bus.dispatch('ARCHIVE_CLASS', { classId: 'class-6a', reason: 'Kết thúc vận hành lớp' }, 'admin-1');
  assert.equal(result.ok, true, result.message);
  assert.equal(state().classes.find((item) => item.id === 'class-6a').status, 'ARCHIVED');
  assert.equal(state().enrollments.filter((item) => item.classId === 'class-6a').length, enrollmentCount);
  assert.equal(state().sessions.filter((item) => item.classId === 'class-6a').length, sessionCount);
});

test('approved Teacher session request appears in class and learner schedules', () => {
  const { YC, bus, state } = runtimeWithTeacherAssignment();
  const request = requestSession(bus);
  assert.equal(request.ok, true, request.message);
  assert.equal(state().sessions.some((item) => item.provisionalId === request.provisionalResourceId), false);
  assert.equal(approve(bus, request.requestId).ok, true);
  const session = state().sessions.find((item) => item.changeRequestId === request.requestId);
  assert.equal(session.classId, 'class-6a');
  const trace = YC.selectors.sessionTrace(state(), session.id);
  assert.equal(trace.courseVersion.id, 'course-v6');
  assert.equal(trace.course.id, 'course-6');
  assert.ok(trace.learnerIds.includes('student-canonical'));
  assert.equal(state().auditLogs[0].action, 'CHANGE_REQUEST_APPROVED');
  assert.ok(state().notifications.some((item) => item.userId === 'teacher-1' && item.link.includes(request.requestId)));
});

test('session validation catches room teacher and learner conflicts', () => {
  const { YC, store, state } = runtimeWithTeacherAssignment();
  store.transact((draft) => {
    draft.enrollments.push({ id: 'cross-enrollment', learnerId: 'student-canonical', classId: 'class-6b', courseVersionId: 'course-v6', status: 'ACTIVE', startsAt: FIXED_NOW, endsAt: null });
    draft.sessions.push({ id: 'session-conflict', classId: 'class-6b', lessonTemplateId: 'lesson-past-simple', startsAt: '2026-09-08T11:00:00.000Z', endsAt: '2026-09-08T12:30:00.000Z', room: 'P.304', mode: 'OFFLINE', status: 'CONFIRMED', version: 1 });
    draft.teacherAssignments.push({ id: 'assignment-conflict', teacherProfileId: 'teacher-profile-1', classId: 'class-6b', role: 'PRIMARY', startsAt: '2026-01-01T00:00:00.000Z', endsAt: '2027-01-01T00:00:00.000Z', workloadMinutes: 90, status: 'ACTIVE' });
  });
  const validation = YC.selectors.sessionValidation(state(), {
    classId: 'class-6a', lessonTemplateId: 'lesson-past-simple', startsAt: '2026-09-08T11:15:00.000Z', endsAt: '2026-09-08T12:00:00.000Z', room: 'P.304', mode: 'OFFLINE',
  });
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((item) => item.code === 'ROOM_CONFLICT'));
  assert.ok(validation.errors.some((item) => item.code === 'TEACHER_CONFLICT'));
  assert.ok(validation.errors.some((item) => item.code === 'LEARNER_CONFLICT'));
});

test('session lesson must belong to the Class pinned Course Version', () => {
  const { bus, state } = runtimeWithTeacherAssignment();
  const result = bus.dispatch('REQUEST_CREATE_SESSION', {
    classId: 'class-6a', lessonTemplateId: 'lesson-future', startsAt: '2026-09-08T11:00:00.000Z', endsAt: '2026-09-08T12:30:00.000Z', room: 'P.304', mode: 'OFFLINE', reason: 'Dùng thử bài khác khóa',
  }, 'teacher-1');
  assert.equal(result.ok, false);
  assert.equal(result.code, 'LESSON_COURSE_MISMATCH');
  assert.equal(state().changeRequests.length, 0);
});

test('roster stays dynamic before start and is snapshotted when the Session starts', () => {
  const { bus, store, state } = runtimeWithTeacherAssignment();
  store.transact((draft) => {
    const session = draft.sessions.find((item) => item.id === 'session-canonical');
    session.status = 'CONFIRMED';
    delete session.rosterSnapshot;
    draft.lessonPlans.find((item) => item.sessionId === session.id).readiness = 'READY';
    draft.learners.push({ id: 'student-late-roster', code: 'HSLATE', name: 'Học viên mới', status: 'ACTIVE', classId: 'class-6a', branchId: 'branch-q3' });
    draft.enrollments.push({ id: 'enrollment-late-roster', learnerId: 'student-late-roster', classId: 'class-6a', courseVersionId: 'course-v6', status: 'ACTIVE', startsAt: FIXED_NOW, endsAt: null });
  });
  assert.equal(state().sessions.find((item) => item.id === 'session-canonical').rosterSnapshot, undefined);
  const started = bus.dispatch('START_SESSION', { sessionId: 'session-canonical' }, 'teacher-1');
  assert.equal(started.ok, true, started.message);
  assert.ok(state().sessions.find((item) => item.id === 'session-canonical').rosterSnapshot.learnerIds.includes('student-late-roster'));
});

test('rescheduling is blocked after start and approved changes preserve revision history', () => {
  const first = runtimeWithTeacherAssignment();
  first.store.transact((draft) => { draft.sessions.find((item) => item.id === 'session-canonical').status = 'IN_PROGRESS'; });
  const blocked = first.bus.dispatch('REQUEST_RESCHEDULE_SESSION', {
    sessionId: 'session-canonical', startsAt: '2026-09-10T11:00:00.000Z', endsAt: '2026-09-10T12:30:00.000Z', room: 'P.401', reason: 'Đổi lịch sau khi bắt đầu',
  }, 'teacher-1');
  assert.equal(blocked.ok, false);
  assert.equal(blocked.code, 'SESSION_ALREADY_STARTED');

  const second = runtimeWithTeacherAssignment();
  second.store.transact((draft) => { draft.sessions.find((item) => item.id === 'session-canonical').status = 'CONFIRMED'; });
  const requested = second.bus.dispatch('REQUEST_RESCHEDULE_SESSION', {
    sessionId: 'session-canonical', startsAt: '2026-09-10T11:00:00.000Z', endsAt: '2026-09-10T12:30:00.000Z', room: 'P.401', reason: 'Điều chỉnh theo lịch thi',
  }, 'teacher-1');
  assert.equal(requested.ok, true, requested.message);
  assert.equal(approve(second.bus, requested.requestId).ok, true);
  const updated = second.state().sessions.find((item) => item.id === 'session-canonical');
  assert.equal(updated.room, 'P.401');
  assert.equal(updated.scheduleRevisions.length, 1);
  assert.notEqual(updated.scheduleRevisions[0].startsAt, updated.startsAt);
});

test('cancelling a Session uses approval and keeps the canonical record', () => {
  const { bus, state } = runtimeWithTeacherAssignment();
  const requested = bus.dispatch('REQUEST_CANCEL_SESSION', { sessionId: 'session-canonical', reason: 'Trung tâm nghỉ do thời tiết' }, 'teacher-1');
  assert.equal(requested.ok, true, requested.message);
  assert.notEqual(state().sessions.find((item) => item.id === 'session-canonical').status, 'CANCELLED');
  assert.equal(approve(bus, requested.requestId).ok, true);
  assert.equal(state().sessions.find((item) => item.id === 'session-canonical').status, 'CANCELLED');
});

module.exports = { FIXED_NOW, approve, finalizeAbsent, renderAs, requestSession, runtimeWithTeacherAssignment };
