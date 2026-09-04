const assert = require('node:assert/strict');
const test = require('node:test');
const { loadYC, memoryStorage } = require('../helpers/load-runtime.cjs');

const FIXED_NOW = '2026-09-04T02:00:00.000Z';

function createRuntime() {
  const YC = loadYC(['seed', 'store', 'commands', 'selectors']);
  const store = YC.store.create({ storage: memoryStorage(), clock: () => FIXED_NOW });
  const bus = YC.commands.create(store);
  return { YC, store, state: () => store.getState(), dispatch: bus.dispatch };
}

function activateCanonicalClass(runtime) {
  runtime.store.transact((draft) => {
    const learner = draft.learners.find((item) => item.id === 'student-canonical');
    learner.classId = 'class-6a';
    learner.status = 'ACTIVE';
    draft.enrollments.push({ id: 'enrollment-canonical-test', learnerId: learner.id, classId: 'class-6a', courseVersionId: 'course-v6', status: 'ACTIVE', startsAt: FIXED_NOW, endsAt: null });
  });
}

function assignCanonicalTeacher(runtime) {
  assert.equal(runtime.dispatch('PROPOSE_TEACHER_ASSIGNMENT', { teacherId: 'teacher-1', classId: 'class-6a', workloadMinutes: 720 }, 'academic-1').ok, true);
  assert.equal(runtime.dispatch('ACCEPT_TEACHER_ASSIGNMENT', { classId: 'class-6a' }, 'teacher-1').ok, true);
}

test('teacher eligibility separates hard gates from ranking signals', () => {
  const runtime = createRuntime();

  const eligible = runtime.YC.selectors.teacherEligibility(runtime.state(), 'teacher-1', 'class-6a');
  const ineligible = runtime.YC.selectors.teacherEligibility(runtime.state(), 'teacher-ineligible', 'class-6a');

  assert.equal(eligible.eligible, true);
  assert.equal(ineligible.eligible, false);
  assert.ok(ineligible.hardGates.some((item) => item.key === 'AGE_BAND' && item.passed === false));
  assert.ok(ineligible.hardGates.some((item) => item.key === 'MODE' && item.passed === false));
  assert.ok(eligible.rankingSignals.some((item) => item.key === 'BRANCH_CONTINUITY'));
});

test('ineligible teacher cannot be proposed for a young learner class', () => {
  const runtime = createRuntime();

  const result = runtime.dispatch('PROPOSE_TEACHER_ASSIGNMENT', {
    teacherId: 'teacher-ineligible', classId: 'class-6a', workloadMinutes: 720
  }, 'academic-1');

  assert.equal(result.ok, false);
  assert.equal(result.code, 'TEACHER_INELIGIBLE');
  assert.ok(result.evidence.hardGates.some((item) => item.passed === false));
});

test('accepted assignment grants class access and contributes to total workload', () => {
  const runtime = createRuntime();
  activateCanonicalClass(runtime);
  assignCanonicalTeacher(runtime);

  const assignment = runtime.state().teacherAssignments.find((item) => item.classId === 'class-6a');
  const workload = runtime.YC.selectors.teacherWorkload(runtime.state(), 'teacher-1');

  assert.equal(assignment.status, 'ACTIVE');
  assert.equal(workload.teachingMinutes, 720);
  assert.equal(workload.totalMinutes, 1152);
  assert.equal(runtime.YC.policy.can(runtime.state().users.find((item) => item.id === 'teacher-1'), 'CLASS_VIEW', { classId: 'class-6a' }, runtime.state()), true);
});

test('completed session stores planned-versus-taught evidence and a coverage gap', () => {
  const runtime = createRuntime();
  activateCanonicalClass(runtime);
  assignCanonicalTeacher(runtime);
  assert.equal(runtime.dispatch('MARK_SESSION_READY', { sessionId: 'session-canonical', adaptations: ['Thêm timeline trực quan'] }, 'teacher-1').ok, true);
  assert.equal(runtime.dispatch('START_SESSION', { sessionId: 'session-canonical' }, 'teacher-1').ok, true);

  const result = runtime.dispatch('COMPLETE_SESSION', {
    sessionId: 'session-canonical',
    taughtItemIds: ['item-past-simple-video', 'item-speaking-pairs'],
    deferredItemIds: ['item-pronunciation'],
    note: 'Chuyển pronunciation sang buổi tiếp theo'
  }, 'teacher-1');

  assert.equal(result.ok, true, result.message);
  const delivery = runtime.state().deliveryRecords.find((item) => item.sessionId === 'session-canonical');
  assert.deepEqual(JSON.parse(JSON.stringify(delivery.deferredItemIds)), ['item-pronunciation']);
  assert.equal(delivery.coverageStatus, 'GAP');
  assert.ok(runtime.state().domainEvents.some((item) => item.type === 'DELIVERY_RECORDED'));
});

test('schedule conflict reports both teacher and room collisions', () => {
  const runtime = createRuntime();

  const conflicts = runtime.YC.selectors.scheduleConflicts(runtime.state(), {
    teacherId: 'teacher-2', branchId: 'branch-td', room: 'P.105', startsAt: runtime.state().sessions.find((item) => item.id === 'session-7b').startsAt, endsAt: runtime.state().sessions.find((item) => item.id === 'session-7b').endsAt
  });

  assert.ok(conflicts.some((item) => item.type === 'TEACHER'));
  assert.ok(conflicts.some((item) => item.type === 'ROOM'));
});

test('late attendance correction and substitution require explicit reasons', () => {
  const runtime = createRuntime();
  activateCanonicalClass(runtime);
  assignCanonicalTeacher(runtime);
  runtime.store.transact((draft) => draft.attendanceRecords.push({ id: 'attendance-test', sessionId: 'session-canonical', learnerId: 'student-canonical', status: 'ABSENT', markedAt: '2026-09-01T02:00:00.000Z', markedBy: 'teacher-1' }));

  const correction = runtime.dispatch('CORRECT_ATTENDANCE', { attendanceId: 'attendance-test', status: 'PRESENT', reason: '' }, 'service-1');
  const substitution = runtime.dispatch('REQUEST_SUBSTITUTION', { sessionId: 'session-canonical', reason: '' }, 'service-1');

  assert.equal(correction.code, 'REASON_REQUIRED');
  assert.equal(substitution.code, 'REASON_REQUIRED');
});

test('substitution closes only after a handover package is ready', () => {
  const runtime = createRuntime();
  activateCanonicalClass(runtime);
  assignCanonicalTeacher(runtime);
  assert.equal(runtime.dispatch('REQUEST_SUBSTITUTION', { sessionId: 'session-canonical', reason: 'Giáo viên chính nghỉ ốm' }, 'service-1').ok, true);
  assert.equal(runtime.dispatch('CONFIRM_SUBSTITUTE', { sessionId: 'session-canonical', replacementTeacherId: 'teacher-3' }, 'service-1').ok, true);

  const premature = runtime.dispatch('CLOSE_SUBSTITUTION', { sessionId: 'session-canonical' }, 'service-1');
  assert.equal(premature.code, 'HANDOVER_NOT_READY');

  assert.equal(runtime.dispatch('MARK_HANDOVER_READY', { sessionId: 'session-canonical', note: 'Đã bàn giao lesson plan, learner risks và homework mở.' }, 'teacher-1').ok, true);
  assert.equal(runtime.dispatch('CLOSE_SUBSTITUTION', { sessionId: 'session-canonical' }, 'service-1').ok, true);
  assert.equal(runtime.state().substitutions.find((item) => item.sessionId === 'session-canonical').status, 'CLOSED');
});
