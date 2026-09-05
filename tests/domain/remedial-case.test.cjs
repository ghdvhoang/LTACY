const assert = require('node:assert/strict');
const test = require('node:test');
const { loadYC, memoryStorage } = require('../helpers/load-runtime.cjs');

const FIXED_NOW = '2026-09-05T02:00:00.000Z';

function runtimeWithTeacherAssignment() {
  const YC = loadYC(['seed', 'store', 'commands', 'selectors', 'remedial']);
  const store = YC.store.create({ storage: memoryStorage(), clock: () => FIXED_NOW });
  store.transact((draft) => {
    const learner = draft.learners.find((item) => item.id === 'student-canonical');
    learner.status = 'ACTIVE';
    learner.classId = 'class-6a';
    if (!draft.enrollments.some((item) => item.learnerId === learner.id && item.classId === 'class-6a')) draft.enrollments.push({ id: 'enrollment-canonical-ops', learnerId: learner.id, classId: 'class-6a', courseVersionId: 'course-v6', status: 'ACTIVE', startsAt: FIXED_NOW, endsAt: null });
    if (!draft.teacherAssignments.some((item) => item.teacherProfileId === 'teacher-profile-1' && item.classId === 'class-6a')) draft.teacherAssignments.push({ id: 'assignment-canonical-ops', teacherProfileId: 'teacher-profile-1', classId: 'class-6a', role: 'PRIMARY', startsAt: '2026-01-01T00:00:00.000Z', endsAt: '2027-01-01T00:00:00.000Z', workloadMinutes: 720, status: 'ACTIVE' });
    draft.sessions.find((item) => item.id === 'session-canonical').status = 'COMPLETED';
  });
  return { YC, store, bus: YC.commands.create(store), state: () => store.getState() };
}

function finalizeAbsent(bus) {
  return bus.dispatch('FINALIZE_ATTENDANCE', { sessionId: 'session-canonical', records: [{ learnerId: 'student-canonical', status: 'ABSENT', reasonCode: 'SICK' }] }, 'teacher-1');
}

test('finalized absence creates one case and one online child idempotently', () => {
  const { bus, state } = runtimeWithTeacherAssignment();
  assert.equal(finalizeAbsent(bus).ok, true);
  assert.equal(finalizeAbsent(bus).ok, true);
  const attendance = state().attendanceRecords.find((item) => item.sessionId === 'session-canonical' && item.learnerId === 'student-canonical');
  assert.equal(state().remedialCases.filter((item) => item.sourceAttendanceId === attendance.id).length, 1);
  const remedialCase = state().remedialCases[0];
  assert.equal(state().remedialAssignments.filter((item) => item.remedialCaseId === remedialCase.id).length, 1);
  assert.equal(remedialCase.sourceClassId, 'class-6a');
  assert.equal(remedialCase.sourceCourseVersionId, 'course-v6');
});

test('Remedial Case snapshots policy from the source Course Version', () => {
  const { bus, store, state } = runtimeWithTeacherAssignment();
  finalizeAbsent(bus);
  const remedialCase = state().remedialCases[0];
  assert.equal(remedialCase.policySnapshot.passingScore, 80);
  assert.deepEqual(Array.from(remedialCase.requiredModes), ['ONLINE']);
  store.transact((draft) => { draft.courseVersions.find((item) => item.id === 'course-v6').remedialPolicy.passingScore = 95; });
  assert.equal(state().remedialCases[0].policySnapshot.passingScore, 80);
});

test('online evidence completes an ONLINE-only Remedial Case', () => {
  const { YC, bus, state } = runtimeWithTeacherAssignment();
  finalizeAbsent(bus);
  const remedialCase = state().remedialCases[0];
  const assignment = state().remedialAssignments.find((item) => item.remedialCaseId === remedialCase.id);
  assert.equal(bus.dispatch('UPDATE_VIDEO_PROGRESS', { assignmentId: assignment.id, progress: 100 }, 'student-login-1').ok, true);
  assert.equal(bus.dispatch('SUBMIT_AUTO_ASSESSMENT', { assignmentId: assignment.id, answers: [1, 1, 0, 1, 1, 1, 1, 1, 0, 2] }, 'student-login-1').ok, true);
  assert.equal(YC.remedial.caseStatus(state(), remedialCase.id).status, 'COMPLETED');
});

test('absence corrected to present cancels unfinished remediation but preserves history', () => {
  const { YC, bus, state } = runtimeWithTeacherAssignment();
  finalizeAbsent(bus);
  const attendance = state().attendanceRecords.find((item) => item.sessionId === 'session-canonical' && item.learnerId === 'student-canonical');
  const remedialCase = state().remedialCases[0];
  const corrected = bus.dispatch('CORRECT_ATTENDANCE', { attendanceId: attendance.id, status: 'PRESENT', reason: 'Đối chiếu lại camera lớp học' }, 'service-1');
  assert.equal(corrected.ok, true, corrected.message);
  assert.equal(state().remedialAssignments.find((item) => item.remedialCaseId === remedialCase.id).status, 'CANCELLED');
  assert.equal(YC.remedial.caseStatus(state(), remedialCase.id).status, 'NOT_REQUIRED');
  assert.ok(state().remedialCases.find((item) => item.id === remedialCase.id).reconciliationHistory.some((item) => item.toStatus === 'PRESENT'));
});

test('present corrected to absent creates remediation once', () => {
  const { bus, state } = runtimeWithTeacherAssignment();
  const finalized = bus.dispatch('FINALIZE_ATTENDANCE', { sessionId: 'session-canonical', records: [{ learnerId: 'student-canonical', status: 'PRESENT' }] }, 'teacher-1');
  assert.equal(finalized.ok, true);
  const attendance = state().attendanceRecords.find((item) => item.sessionId === 'session-canonical' && item.learnerId === 'student-canonical');
  assert.equal(state().remedialCases.length, 0);
  assert.equal(bus.dispatch('CORRECT_ATTENDANCE', { attendanceId: attendance.id, status: 'ABSENT', reason: 'Xác nhận học viên vắng' }, 'service-1').ok, true);
  assert.equal(state().remedialCases.length, 1);
  assert.equal(bus.dispatch('CORRECT_ATTENDANCE', { attendanceId: attendance.id, status: 'ABSENT', reason: 'Lưu lại cùng kết quả' }, 'service-1').ok, true);
  assert.equal(state().remedialCases.length, 1);
  assert.equal(state().remedialAssignments.length, 1);
});

test('v3 migration wraps an existing online assignment in a Remedial Case', () => {
  const YC = loadYC(['seed', 'store', 'remedial']);
  const v3 = YC.seed.createSeed(() => FIXED_NOW);
  v3.schemaVersion = 3;
  delete v3.remedialCases;
  v3.attendanceRecords.push({ id: 'attendance-v3', sessionId: 'session-canonical', learnerId: 'student-canonical', status: 'ABSENT', markedAt: FIXED_NOW });
  v3.remedialAssignments.push({ id: 'assignment-v3', learnerId: 'student-canonical', sessionId: 'session-canonical', lessonTemplateId: 'lesson-past-simple', assessmentId: 'assessment-remedial', status: 'ASSIGNED', dueAt: '2026-09-12T02:00:00.000Z', videoProgress: 0 });
  const storage = memoryStorage({ [YC.store.V3_STORAGE_KEY]: JSON.stringify(v3) });
  const state = YC.store.create({ storage, clock: () => FIXED_NOW }).getState();
  assert.equal(state.remedialCases.length, 1);
  assert.equal(state.remedialAssignments[0].remedialCaseId, state.remedialCases[0].id);
  assert.equal(state.remedialCases[0].sourceAttendanceId, 'attendance-v3');
});

test('completed online evidence is retained after attendance correction', () => {
  const { YC, bus, state } = runtimeWithTeacherAssignment();
  finalizeAbsent(bus);
  const remedialCase = state().remedialCases[0];
  const assignment = state().remedialAssignments[0];
  bus.dispatch('UPDATE_VIDEO_PROGRESS', { assignmentId: assignment.id, progress: 100 }, 'student-login-1');
  bus.dispatch('SUBMIT_AUTO_ASSESSMENT', { assignmentId: assignment.id, answers: [1, 1, 0, 1, 1, 1, 1, 1, 0, 2] }, 'student-login-1');
  const attendance = state().attendanceRecords.find((item) => item.id === remedialCase.sourceAttendanceId);
  bus.dispatch('CORRECT_ATTENDANCE', { attendanceId: attendance.id, status: 'PRESENT', reason: 'Cập nhật bằng chứng mới' }, 'service-1');
  assert.equal(state().remedialAssignments[0].status, 'COMPLETED');
  assert.equal(state().attempts.filter((item) => item.assignmentId === assignment.id).length, 1);
  assert.equal(YC.remedial.caseStatus(state(), remedialCase.id).status, 'COMPLETED');
});
