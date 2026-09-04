const assert = require('node:assert/strict');
const test = require('node:test');
const { loadYC, memoryStorage } = require('../helpers/load-runtime.cjs');

function preparedState(YC) {
  const state = YC.seed.createSeed(() => '2026-09-05T02:00:00.000Z');
  const learner = state.learners.find((item) => item.id === 'student-canonical');
  learner.status = 'ACTIVE';
  learner.classId = 'class-6a';
  state.enrollments.push({ id: 'enrollment-canonical-ui', learnerId: learner.id, classId: 'class-6a', courseVersionId: 'course-v6', status: 'ACTIVE', startsAt: state.currentAt, endsAt: null });
  state.teacherAssignments.push({ id: 'teacher-assignment-ui', teacherProfileId: 'teacher-profile-1', classId: 'class-6a', role: 'PRIMARY', startsAt: state.currentAt, endsAt: '2027-01-01T00:00:00.000Z', workloadMinutes: 720, status: 'ACTIVE', acceptedAt: state.currentAt, assignedBy: 'academic-1' });
  state.sessions.find((item) => item.id === 'session-canonical').status = 'COMPLETED';
  return state;
}

function context(YC, path, draft = {}) {
  const state = preparedState(YC);
  return { state, actor: state.users.find((item) => item.id === 'teacher-1'), learnerId: 'student-canonical', attendanceDraft: draft, path };
}

test('teacher legacy class, remedial and report routes render useful content', () => {
  const YC = loadYC(['seed', 'router']);
  const paths = ['/app/teacher/classes', '/app/teacher/classes/class-6a', '/app/teacher/remedial', '/app/teacher/reports'];
  for (const path of paths) {
    const html = YC.router.render(path, context(YC, path));
    assert.ok(html.length > 300, path);
    assert.doesNotMatch(html, /Không tìm thấy trang/, path);
  }
});

test('attendance editor supports individual status, all-present, reset and save', () => {
  const YC = loadYC(['seed', 'router']);
  const path = '/app/teacher/sessions/session-canonical/attendance';
  const html = YC.router.render(path, context(YC, path, { 'student-canonical': 'ABSENT' }));

  assert.match(html, /Điểm danh lớp học/);
  assert.match(html, /Nguyễn Minh Anh/);
  assert.match(html, /data-action="set-attendance"/);
  assert.match(html, /data-status="ABSENT"[^>]*aria-pressed="true"/);
  assert.match(html, /data-action="attendance-all-present"/);
  assert.match(html, /data-action="reset-attendance-draft"/);
  assert.match(html, /data-action="save-attendance"/);
});

test('saving an absent canonical learner creates one assignment visible to the student account', () => {
  const YC = loadYC(['seed', 'store', 'commands', 'actions']);
  const storage = memoryStorage({ 'yc.demo.actorId': 'teacher-1' });
  const store = YC.store.create({ storage, clock: () => '2026-09-05T02:00:00.000Z' });
  store.replace(preparedState(YC));
  const controller = YC.actions.create({ store, bus: YC.commands.create(store), storage, location: { hash: '' } });

  assert.equal(controller.execute('set-attendance', { sessionId: 'session-canonical', learnerId: 'student-canonical', status: 'ABSENT' }).ok, true);
  const result = controller.execute('save-attendance', { sessionId: 'session-canonical' });

  assert.equal(result.ok, true, result.message);
  assert.equal(store.getState().remedialAssignments.filter((item) => item.learnerId === 'student-canonical').length, 1);
  assert.ok(store.getState().notifications.some((item) => item.userId === 'student-login-1' && item.link === '/app/student/remedial'));
  assert.equal(controller.execute('save-attendance', { sessionId: 'session-canonical' }).ok, true);
  assert.equal(store.getState().remedialAssignments.filter((item) => item.learnerId === 'student-canonical').length, 1);
});

test('all-present and reset mutate only the controller attendance draft', () => {
  const YC = loadYC(['seed', 'store', 'commands', 'actions']);
  const storage = memoryStorage({ 'yc.demo.actorId': 'teacher-1' });
  const store = YC.store.create({ storage, clock: () => '2026-09-05T02:00:00.000Z' });
  store.replace(preparedState(YC));
  const controller = YC.actions.create({ store, bus: YC.commands.create(store), storage, location: { hash: '' } });

  assert.equal(controller.execute('attendance-all-present', { sessionId: 'session-canonical' }).ok, true);
  assert.equal(controller.getAttendanceDraft('session-canonical')['student-canonical'], 'PRESENT');
  assert.equal(store.getState().attendanceRecords.length, 0);
  assert.equal(controller.execute('reset-attendance-draft', { sessionId: 'session-canonical' }).ok, true);
  assert.deepEqual(Object.keys(controller.getAttendanceDraft('session-canonical')), []);
});

