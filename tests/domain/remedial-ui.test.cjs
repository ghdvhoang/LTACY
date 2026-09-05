const assert = require('node:assert/strict');
const test = require('node:test');
const { loadYC, memoryStorage } = require('../helpers/load-runtime.cjs');

function preparedRuntime() {
  const YC = loadYC(['seed', 'store', 'commands', 'router', 'actions']);
  const storage = memoryStorage({ 'yc.demo.actorId': 'teacher-1' });
  const store = YC.store.create({ storage, clock: () => '2026-09-05T02:00:00.000Z' });
  const state = store.getState();
  const learner = state.learners.find((item) => item.id === 'student-canonical');
  learner.status = 'ACTIVE'; learner.classId = 'class-6a';
  state.enrollments.push({ id: 'enrollment-remedial-ui', learnerId: learner.id, classId: 'class-6a', courseVersionId: 'course-v6', status: 'ACTIVE', startsAt: state.currentAt, endsAt: null });
  state.teacherAssignments.push({ id: 'assignment-remedial-ui', teacherProfileId: 'teacher-profile-1', classId: 'class-6a', role: 'PRIMARY', startsAt: state.currentAt, endsAt: '2027-01-01T00:00:00.000Z', workloadMinutes: 720, status: 'ACTIVE' });
  state.sessions.find((item) => item.id === 'session-canonical').status = 'COMPLETED';
  store.replace(state);
  const bus = YC.commands.create(store);
  const attendance = bus.dispatch('FINALIZE_ATTENDANCE', { sessionId: 'session-canonical', records: [{ learnerId: learner.id, status: 'ABSENT' }] }, 'teacher-1');
  assert.equal(attendance.ok, true, attendance.message);
  return { YC, store, bus, storage, assignment: store.getState().remedialAssignments[0] };
}

test('student remedial detail restores player progress and real quiz navigation', () => {
  const runtime = preparedRuntime();
  const actor = runtime.store.getState().users.find((item) => item.id === 'student-login-1');
  const ctx = { state: runtime.store.getState(), actor, learnerId: 'student-canonical', path: `/app/student/remedial/${runtime.assignment.id}` };
  const html = runtime.YC.router.render(ctx.path, ctx);

  assert.match(html, /Chi tiết bài học bù/);
  assert.match(html, /data-action="toggle-video"/);
  assert.match(html, /data-action="video-progress"/);
  assert.match(html, new RegExp(`/app/student/quiz/${runtime.assignment.id}`));
});

test('student dashboard shows the real zero progress for a new remedial assignment', () => {
  const runtime = preparedRuntime();
  const actor = runtime.store.getState().users.find((item) => item.id === 'student-login-1');
  const path = '/app/student/dashboard';
  const html = runtime.YC.router.render(path, { state: runtime.store.getState(), actor, learnerId: 'student-canonical', path });
  assert.match(html, /Tiến độ bài hiện tại[\s\S]*?0%/);
  assert.doesNotMatch(html, /Tiến độ bài hiện tại[\s\S]*?42%/);
});

test('quiz route renders every question, timer, demo-fill and submit controls', () => {
  const runtime = preparedRuntime();
  const actor = runtime.store.getState().users.find((item) => item.id === 'student-login-1');
  const path = `/app/student/quiz/${runtime.assignment.id}`;
  const html = runtime.YC.router.render(path, { state: runtime.store.getState(), actor, learnerId: 'student-canonical', path });

  assert.match(html, /data-form="quiz"/);
  assert.equal((html.match(/class="question-card"/g) || []).length, 10);
  assert.match(html, /data-quiz-timer/);
  assert.match(html, /data-action="fill-demo-quiz"/);
  assert.match(html, /Nộp bài/);
});

test('real answer submission records score and renders result history', () => {
  const runtime = preparedRuntime();
  const answers = runtime.store.getState().questions.map((question, index) => index < 8 ? question.correctIndex : (question.correctIndex + 1) % question.options.length);
  const result = runtime.bus.dispatch('UPDATE_VIDEO_PROGRESS', { assignmentId: runtime.assignment.id, progress: 100 }, 'student-login-1');
  assert.equal(result.ok, true);
  const submitted = runtime.bus.dispatch('SUBMIT_AUTO_ASSESSMENT', { assignmentId: runtime.assignment.id, answers }, 'student-login-1');
  assert.equal(submitted.score, 80);

  const actor = runtime.store.getState().users.find((item) => item.id === 'student-login-1');
  const html = runtime.YC.router.render('/app/student/results', { state: runtime.store.getState(), actor, learnerId: 'student-canonical', path: '/app/student/results' });
  assert.match(html, /Kết quả học tập/);
  assert.match(html, /80\/100/);
  assert.match(html, /Lượt 1/);
});

test('remedial link regeneration, revocation and extension are audited', () => {
  const runtime = preparedRuntime();
  const originalToken = runtime.assignment.accessToken;
  const originalDue = runtime.assignment.dueAt;

  assert.equal(runtime.bus.dispatch('REGENERATE_REMEDIAL_LINK', { assignmentId: runtime.assignment.id }, 'teacher-1').ok, true);
  assert.notEqual(runtime.store.getState().remedialAssignments[0].accessToken, originalToken);
  assert.equal(runtime.store.getState().remedialAssignments[0].linkVersion, 2);
  assert.equal(runtime.bus.dispatch('REVOKE_REMEDIAL_LINK', { assignmentId: runtime.assignment.id, reason: 'Phát hiện link cũ được chia sẻ nhầm.' }, 'teacher-1').ok, true);
  assert.equal(runtime.store.getState().remedialAssignments[0].accessStatus, 'REVOKED');
  assert.equal(runtime.bus.dispatch('EXTEND_REMEDIAL_DEADLINE', { assignmentId: runtime.assignment.id, days: 3, reason: 'Học viên cần thêm thời gian.' }, 'teacher-1').ok, true);
  assert.ok(new Date(runtime.store.getState().remedialAssignments[0].dueAt) > new Date(originalDue));
  assert.deepEqual(runtime.store.getState().auditLogs.slice(0, 3).map((item) => item.action), ['REMEDIAL_DEADLINE_EXTENDED', 'REMEDIAL_LINK_REVOKED', 'REMEDIAL_LINK_REGENERATED']);
});

test('teacher remedial view exposes the complete link lifecycle', () => {
  const runtime = preparedRuntime();
  const actor = runtime.store.getState().users.find((item) => item.id === 'teacher-1');
  const path = '/app/teacher/remedial';
  const html = runtime.YC.router.render(path, { state: runtime.store.getState(), actor, learnerId: 'student-canonical', path });

  for (const action of ['copy-remedial-link', 'regenerate-remedial-link', 'revoke-remedial-link', 'extend-remedial-deadline']) assert.match(html, new RegExp(`data-action="${action}"`));
});
