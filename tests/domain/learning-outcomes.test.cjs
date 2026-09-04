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

function prepareCompletedSession(runtime) {
  runtime.store.transact((draft) => {
    const learner = draft.learners.find((item) => item.id === 'student-canonical');
    learner.classId = 'class-6a';
    learner.status = 'ACTIVE';
    draft.enrollments.push({ id: 'enrollment-canonical-learning', learnerId: learner.id, classId: 'class-6a', courseVersionId: 'course-v6', status: 'ACTIVE', startsAt: FIXED_NOW, endsAt: null });
    draft.teacherAssignments.push({ id: 'teacher-assignment-learning', teacherProfileId: 'teacher-profile-1', classId: 'class-6a', role: 'PRIMARY', startsAt: FIXED_NOW, endsAt: '2027-01-02T02:00:00.000Z', workloadMinutes: 720, status: 'ACTIVE', acceptedAt: FIXED_NOW, assignedBy: 'academic-1' });
    draft.sessions.find((item) => item.id === 'session-canonical').status = 'COMPLETED';
    draft.deliveryRecords.push({ id: 'delivery-canonical-test', sessionId: 'session-canonical', teacherId: 'teacher-1', taughtItemIds: ['item-past-simple-video', 'item-speaking-pairs'], deferredItemIds: ['item-pronunciation'], coverageStatus: 'GAP', status: 'RECORDED' });
  });
}

function createRemedial(runtime) {
  prepareCompletedSession(runtime);
  return runtime.dispatch('FINALIZE_ATTENDANCE', {
    sessionId: 'session-canonical',
    records: [{ learnerId: 'student-canonical', status: 'ABSENT', reasonCode: 'SICK' }]
  }, 'teacher-1');
}

test('finalizing the same absence twice creates one remedial assignment', () => {
  const runtime = createRuntime();
  prepareCompletedSession(runtime);
  const payload = { sessionId: 'session-canonical', records: [{ learnerId: 'student-canonical', status: 'ABSENT', reasonCode: 'SICK' }] };

  assert.equal(runtime.dispatch('FINALIZE_ATTENDANCE', payload, 'teacher-1').ok, true);
  assert.equal(runtime.dispatch('FINALIZE_ATTENDANCE', payload, 'teacher-1').ok, true);

  assert.equal(runtime.state().remedialAssignments.filter((item) => item.sessionId === 'session-canonical' && item.learnerId === 'student-canonical').length, 1);
});

test('passing quiz completes remedial only after configured video evidence', () => {
  const runtime = createRuntime();
  createRemedial(runtime);
  const assignment = runtime.state().remedialAssignments[0];
  const answers = [1, 1, 0, 1, 1, 1, 1, 1, 0, 2];

  const tooEarly = runtime.dispatch('SUBMIT_AUTO_ASSESSMENT', { assignmentId: assignment.id, answers }, 'student-login-1');
  assert.equal(tooEarly.ok, true);
  assert.equal(runtime.state().remedialAssignments[0].status, 'NOT_PASSED');

  assert.equal(runtime.dispatch('UPDATE_VIDEO_PROGRESS', { assignmentId: assignment.id, progress: 100 }, 'student-login-1').ok, true);
  const passed = runtime.dispatch('SUBMIT_AUTO_ASSESSMENT', { assignmentId: assignment.id, answers }, 'student-login-1');

  assert.equal(passed.ok, true);
  assert.equal(passed.score, 80);
  assert.equal(runtime.state().remedialAssignments[0].status, 'COMPLETED');
  assert.ok(runtime.state().notifications.some((item) => item.title.includes('bù xong')));
});

test('homework supports released feedback, revision, resubmission, and acceptance', () => {
  const runtime = createRuntime();
  prepareCompletedSession(runtime);

  assert.equal(runtime.dispatch('ASSIGN_HOMEWORK', { classId: 'class-6a', learnerId: 'student-canonical', title: 'Audio story: last weekend' }, 'teacher-1').ok, true);
  const homework = runtime.state().homeworkAssignments.at(-1);
  assert.equal(runtime.dispatch('SUBMIT_HOMEWORK', { homeworkId: homework.id, evidence: 'audio-demo.webm' }, 'student-login-1').ok, true);
  assert.equal(runtime.dispatch('GRADE_HOMEWORK', { homeworkId: homework.id, score: 58, feedback: 'Cần dùng past tense nhất quán.' }, 'teacher-1').ok, true);
  assert.equal(runtime.dispatch('RELEASE_HOMEWORK_FEEDBACK', { homeworkId: homework.id }, 'teacher-1').ok, true);
  assert.equal(runtime.dispatch('REQUEST_REVISION', { homeworkId: homework.id, nextAction: 'Thu lại đoạn 2' }, 'teacher-1').ok, true);
  assert.equal(runtime.dispatch('RESUBMIT_HOMEWORK', { homeworkId: homework.id, evidence: 'audio-demo-v2.webm' }, 'student-login-1').ok, true);
  assert.equal(runtime.dispatch('GRADE_HOMEWORK', { homeworkId: homework.id, score: 86, feedback: 'Past tense rõ và chính xác.' }, 'teacher-1').ok, true);
  assert.equal(runtime.dispatch('RELEASE_HOMEWORK_FEEDBACK', { homeworkId: homework.id }, 'teacher-1').ok, true);
  assert.equal(runtime.dispatch('ACCEPT_HOMEWORK', { homeworkId: homework.id }, 'teacher-1').ok, true);

  assert.equal(runtime.state().homeworkAssignments.at(-1).status, 'ACCEPTED');
  assert.equal(runtime.state().homeworkSubmissions.filter((item) => item.homeworkId === homework.id).length, 2);
});

test('borderline final assessment cannot release before moderation approval', () => {
  const runtime = createRuntime();
  prepareCompletedSession(runtime);
  assert.equal(runtime.dispatch('SUBMIT_MANUAL_GRADE', {
    assessmentId: 'assessment-final-canonical',
    learnerId: 'student-canonical',
    skills: { listening: 76, reading: 78, spokenInteraction: 62, spokenProduction: 61, writing: 72, language: 74 },
    feedback: 'Đủ evidence, speaking sát ngưỡng.'
  }, 'teacher-1').ok, true);
  const attempt = runtime.state().attempts.find((item) => item.assessmentId === 'assessment-final-canonical');

  const premature = runtime.dispatch('RELEASE_RESULT', { attemptId: attempt.id }, 'teacher-1');

  assert.equal(premature.ok, false);
  assert.equal(premature.code, 'MODERATION_REQUIRED');
  assert.equal(runtime.dispatch('START_MODERATION', { attemptId: attempt.id }, 'academic-1').ok, true);
  assert.equal(runtime.dispatch('APPROVE_MODERATION', { attemptId: attempt.id, note: 'Rubric và speaking sample nhất quán.' }, 'academic-1').ok, true);
  assert.equal(runtime.dispatch('RELEASE_RESULT', { attemptId: attempt.id }, 'academic-1').ok, true);
  assert.equal(runtime.state().gradingRecords.find((item) => item.attemptId === attempt.id).status, 'RELEASED');
});

test('promotion uses every skill threshold and creates next-level evidence', () => {
  const runtime = createRuntime();
  prepareCompletedSession(runtime);
  runtime.store.transact((draft) => {
    draft.skillResults.push(...[
      ['LISTENING', 76], ['READING', 78], ['SPOKEN_INTERACTION', 66], ['SPOKEN_PRODUCTION', 63], ['WRITING', 72], ['LANGUAGE', 74]
    ].map(([skill, score], index) => ({ id: `skill-test-${index}`, learnerId: 'student-canonical', assessmentId: 'assessment-final-canonical', skill, score, status: 'RELEASED', recordedAt: FIXED_NOW })));
  });
  assert.equal(runtime.dispatch('PUBLISH_PROGRESS_REPORT', { learnerId: 'student-canonical', narrative: 'Đã đạt A2.1.', nextActions: ['Duy trì speaking clinic'] }, 'academic-1').ok, true);

  const result = runtime.dispatch('DECIDE_PROMOTION', { learnerId: 'student-canonical', decision: 'PROMOTE', nextCourseVersionId: 'course-v7' }, 'academic-1');

  assert.equal(result.ok, true, result.message);
  assert.ok(result.evidence.skillThresholds.every((item) => item.passed));
  assert.equal(runtime.state().promotionDecisions[0].status, 'FINAL');
});

test('risk signal opens an owned intervention with follow-up evidence', () => {
  const runtime = createRuntime();

  const result = runtime.dispatch('OPEN_INTERVENTION', {
    learnerId: 'student-canonical', signal: 'ABSENT_TWO_SESSIONS', ownerRole: 'STUDENT_SERVICE', plan: 'Liên hệ phụ huynh và kiểm tra lịch.', followUpAt: '2026-09-08T02:00:00.000Z'
  }, 'academic-1');

  assert.equal(result.ok, true);
  const intervention = runtime.state().interventionCases.find((item) => item.learnerId === 'student-canonical');
  assert.equal(intervention.ownerRole, 'STUDENT_SERVICE');
  assert.equal(intervention.status, 'OPEN');
});
