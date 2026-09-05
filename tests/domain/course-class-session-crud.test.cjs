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

module.exports = { FIXED_NOW, approve, finalizeAbsent, renderAs, requestSession, runtimeWithTeacherAssignment };
