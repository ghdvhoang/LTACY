const assert = require('node:assert/strict');
const test = require('node:test');
const { loadYC, memoryStorage } = require('../helpers/load-runtime.cjs');

const FIXED_NOW = '2026-09-05T02:00:00.000Z';

function runtime() {
  const YC = loadYC(['seed', 'store', 'commands', 'router', 'actions', 'remedial']);
  const storage = memoryStorage();
  const store = YC.store.create({ storage, clock: () => FIXED_NOW });
  store.transact((draft) => {
    const learner = draft.learners.find((item) => item.id === 'student-canonical');
    learner.status = 'ACTIVE';
    learner.classId = 'class-6a';
    if (!draft.enrollments.some((item) => item.learnerId === learner.id && item.classId === 'class-6a')) draft.enrollments.push({ id: 'enrollment-canonical-ui', learnerId: learner.id, classId: 'class-6a', courseVersionId: 'course-v6', status: 'ACTIVE', startsAt: FIXED_NOW, endsAt: null });
    if (!draft.teacherAssignments.some((item) => item.teacherProfileId === 'teacher-profile-1' && item.classId === 'class-6a')) draft.teacherAssignments.push({ id: 'assignment-canonical-ui', teacherProfileId: 'teacher-profile-1', classId: 'class-6a', role: 'PRIMARY', startsAt: '2026-01-01T00:00:00.000Z', endsAt: '2027-01-01T00:00:00.000Z', workloadMinutes: 720, status: 'ACTIVE' });
  });
  return { YC, storage, store, bus: YC.commands.create(store), state: () => store.getState() };
}

function renderAs(YC, state, path, actorId) {
  return YC.router.render(path, { state, actor: state.users.find((item) => item.id === actorId), learnerId: 'student-canonical', path });
}

function createRemedialWithTarget(runtimeValue) {
  const { bus, store, state } = runtimeValue;
  store.transact((draft) => { draft.sessions.find((item) => item.id === 'session-canonical').status = 'COMPLETED'; });
  assert.equal(bus.dispatch('FINALIZE_ATTENDANCE', { sessionId: 'session-canonical', records: [{ learnerId: 'student-canonical', status: 'ABSENT', reasonCode: 'SICK' }] }, 'teacher-1').ok, true);
  const caseId = state().remedialCases[0].id;
  store.transact((draft) => {
    draft.sessions.push({ id: 'session-ui-target', classId: 'class-6b', lessonTemplateId: 'lesson-past-simple', startsAt: '2026-09-10T11:00:00.000Z', endsAt: '2026-09-10T12:30:00.000Z', room: 'P.204', mode: 'OFFLINE', status: 'CONFIRMED', version: 1 });
    draft.teacherAssignments.push({ id: 'assignment-ui-target', teacherProfileId: 'teacher-profile-1', classId: 'class-6b', role: 'PRIMARY', startsAt: '2026-01-01T00:00:00.000Z', endsAt: '2027-01-01T00:00:00.000Z', workloadMinutes: 720, status: 'ACTIVE' });
  });
  assert.equal(bus.dispatch('CONFIRM_MAKE_UP_BOOKING', { caseId, targetSessionId: 'session-ui-target' }, 'service-1').ok, true);
  return caseId;
}

test('Admin course pages expose create form, hierarchy, versions and lifecycle guards', () => {
  const { YC, state } = runtime();
  const list = renderAs(YC, state(), '/app/admin/courses', 'admin-1');
  assert.match(list, /Tạo khóa học/);
  assert.match(list, /#\/app\/admin\/courses\/course-6/);
  const create = renderAs(YC, state(), '/app/admin/courses/new', 'admin-1');
  assert.match(create, /data-form="request-course"/);
  assert.match(create, /Tiếng Anh nền tảng/);
  assert.match(create, /Foundation A2\.1/);
  const detail = renderAs(YC, state(), '/app/admin/courses/course-6', 'admin-1');
  assert.match(detail, /Phiên bản khóa học/);
  assert.match(detail, /Lớp sử dụng/);
  assert.match(detail, /#\/app\/admin\/course-versions\/course-v6/);
  const version = renderAs(YC, state(), '/app/admin/course-versions/course-v6', 'admin-1');
  assert.match(version, /Quy tắc hoàn thành/);
  assert.match(version, /Chính sách học bù/);
  assert.match(version, /Đã khóa, không thể sửa trực tiếp/);
});

test('Admin class and session pages preserve the Course to Attendance trace', () => {
  const { YC, state } = runtime();
  const classes = renderAs(YC, state(), '/app/admin/classes', 'admin-1');
  assert.match(classes, /Tạo lớp học/);
  assert.match(classes, /#\/app\/admin\/classes\/class-6a/);
  const create = renderAs(YC, state(), '/app/admin/classes/new', 'admin-1');
  assert.match(create, /data-form="request-class"/);
  assert.match(create, /Tiếng Anh nền tảng 6 · A2\.1/);
  const detail = renderAs(YC, state(), '/app/admin/classes/class-6a', 'admin-1');
  assert.match(detail, /Phiên bản khóa học gắn cố định/);
  assert.match(detail, /#\/app\/admin\/course-versions\/course-v6/);
  assert.match(detail, /#\/app\/admin\/sessions\/session-canonical/);
  const session = renderAs(YC, state(), '/app/admin/sessions/session-canonical', 'admin-1');
  assert.match(session, /Khóa học.*Phiên bản.*Lớp gốc.*Buổi học/s);
  assert.match(session, /Điểm danh/);
  assert.match(session, /Nguyễn Minh Anh/);
});

test('remedial detail exposes source and target chains without leaking Admin actions', () => {
  const value = runtime();
  const caseId = createRemedialWithTarget(value);
  const adminHtml = renderAs(value.YC, value.state(), `/app/admin/remedial/${caseId}`, 'admin-1');
  assert.match(adminHtml, /Nguồn phát sinh/);
  assert.match(adminHtml, /Tiếng Anh nền tảng 6A/);
  assert.match(adminHtml, /Buổi học đích/);
  assert.match(adminHtml, /Tiếng Anh nền tảng 6B/);
  assert.match(adminHtml, /Duyệt ngoại lệ/);
  const teacherHtml = renderAs(value.YC, value.state(), `/app/teacher/remedial/${caseId}`, 'teacher-1');
  assert.match(teacherHtml, /Chuỗi truy vết/);
  assert.match(teacherHtml, /Nguồn phát sinh/);
  const studentHtml = renderAs(value.YC, value.state(), `/app/student/remedial/${caseId}`, 'student-login-1');
  assert.match(studentHtml, /Nguồn bài học bù/);
  assert.match(studentHtml, /Lịch học bù tại lớp/);
  assert.doesNotMatch(studentHtml, /Duyệt ngoại lệ/);
});

test('Teacher creation forms use canonical options and clearly state Admin approval', () => {
  const { YC, state } = runtime();
  const courses = renderAs(YC, state(), '/app/teacher/courses', 'teacher-1');
  assert.match(courses, /data-form="request-course"/);
  assert.match(courses, /Chờ Admin duyệt/);
  const classes = renderAs(YC, state(), '/app/teacher/classes', 'teacher-1');
  assert.match(classes, /data-form="request-class"/);
  assert.match(classes, /course-v6/);
  const sessions = renderAs(YC, state(), '/app/teacher/sessions', 'teacher-1');
  assert.match(sessions, /data-form="request-session"/);
  assert.match(sessions, /lesson-past-simple/);
});

test('Teacher operational controls follow session state while master-data submits remain pending', () => {
  const { YC, state } = runtime();
  const detail = renderAs(YC, state(), '/app/teacher/sessions/session-canonical', 'teacher-1');
  assert.match(detail, /data-action="mark-session-ready"/);
  assert.doesNotMatch(detail, /data-action="start-session"/);
});

test('academic UI actions dispatch as the signed-in actor and retain pending canonical data', () => {
  const { YC, storage, store, bus } = runtime();
  storage.setItem(YC.actions.ACTOR_KEY, 'teacher-1');
  const controller = YC.actions.create({ store, bus, storage });
  const course = controller.execute('request-course', { code: 'YEN-UI-A2', name: 'Khóa A2 từ giao diện', programId: 'program-foundation', levelId: 'level-a2-1', ageBand: 'YOUNG_LEARNER', mode: 'OFFLINE', description: 'Đề xuất qua biểu mẫu', reason: 'Bổ sung lộ trình A2' });
  assert.equal(course.ok, true, course.message);
  assert.equal(store.getState().courses.some((item) => item.code === 'YEN-UI-A2'), false);
  assert.equal(store.getState().changeRequests.find((item) => item.id === course.requestId).submittedBy, 'teacher-1');
  const session = controller.execute('request-session', { classId: 'class-6a', lessonTemplateId: 'lesson-past-simple', startsAt: '2026-09-08T11:00:00.000Z', endsAt: '2026-09-08T12:30:00.000Z', room: 'P.304', mode: 'OFFLINE', reason: 'Bổ sung buổi ôn tập' });
  assert.equal(session.ok, true, session.message);
  assert.equal(store.getState().sessions.some((item) => item.provisionalId === session.provisionalResourceId), false);
});

test('Admin create actions apply canonical Course and Class immediately with audit evidence', () => {
  const { YC, storage, store, bus } = runtime();
  storage.setItem(YC.actions.ACTOR_KEY, 'admin-1');
  const controller = YC.actions.create({ store, bus, storage });
  const course = controller.execute('request-course', { code: 'YEN-ADMIN-A2', name: 'Khóa A2 do Admin tạo', programId: 'program-foundation', levelId: 'level-a2-1', ageBand: 'YOUNG_LEARNER', mode: 'OFFLINE', description: 'Khóa chính thức', reason: 'Đã duyệt kế hoạch mở khóa' });
  assert.equal(course.ok, true, course.message);
  assert.ok(store.getState().courses.some((item) => item.code === 'YEN-ADMIN-A2'));
  assert.equal(store.getState().changeRequests.find((item) => item.id === course.requestId).direct, true);
  const cohort = controller.execute('request-class', { code: 'YEN-ADMIN-01', name: 'Lớp A2 do Admin tạo', branchId: 'branch-q3', courseVersionId: 'course-v6', ageBand: 'YOUNG_LEARNER', mode: 'OFFLINE', capacity: 12, minCapacity: 4, room: 'P.204', recurrence: ['TUE_1800'], startDate: '2026-09-15', endDate: '2026-12-15', durationMinutes: 90, reason: 'Đã đối chiếu kế hoạch lớp' });
  assert.equal(cohort.ok, true, cohort.message);
  const createdClass = store.getState().classes.find((item) => item.code === 'YEN-ADMIN-01');
  assert.ok(createdClass);
  assert.ok(store.getState().timetableRules.some((item) => item.classId === createdClass.id));
});

test('Student Service can rank and confirm a live make-up target from its workspace', () => {
  const value = runtime();
  value.store.transact((draft) => { draft.sessions.find((item) => item.id === 'session-canonical').status = 'COMPLETED'; });
  value.bus.dispatch('FINALIZE_ATTENDANCE', { sessionId: 'session-canonical', records: [{ learnerId: 'student-canonical', status: 'ABSENT' }] }, 'teacher-1');
  const caseId = value.state().remedialCases[0].id;
  value.store.transact((draft) => {
    draft.sessions.push({ id: 'session-service-target', classId: 'class-6b', lessonTemplateId: 'lesson-past-simple', startsAt: '2026-09-10T11:00:00.000Z', endsAt: '2026-09-10T12:30:00.000Z', room: 'P.204', mode: 'OFFLINE', status: 'CONFIRMED', version: 1 });
    draft.teacherAssignments.push({ id: 'assignment-service-target', teacherProfileId: 'teacher-profile-1', classId: 'class-6b', role: 'PRIMARY', startsAt: '2026-01-01T00:00:00.000Z', endsAt: '2027-01-01T00:00:00.000Z', workloadMinutes: 720, status: 'ACTIVE' });
  });
  const html = renderAs(value.YC, value.state(), '/app/service/make-up', 'service-1');
  assert.match(html, /Xếp hạng buổi học đích/);
  assert.match(html, /data-form="make-up-booking"/);
  assert.match(html, /session-service-target/);
  value.storage.setItem(value.YC.actions.ACTOR_KEY, 'service-1');
  const controller = value.YC.actions.create({ store: value.store, bus: value.bus, storage: value.storage });
  const result = controller.execute('confirm-make-up-booking', { caseId, targetSessionId: 'session-service-target' });
  assert.equal(result.ok, true, result.message);
  assert.equal(value.state().makeUpBookings.at(-1).rosterRole, 'MAKE_UP_GUEST');
});
