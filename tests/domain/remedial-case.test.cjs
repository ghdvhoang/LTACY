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

function addTargetSession(store, overrides = {}) {
  const session = {
    id: overrides.id || 'session-equivalent',
    classId: 'class-6b',
    lessonTemplateId: 'lesson-past-simple',
    startsAt: '2026-09-10T11:00:00.000Z',
    endsAt: '2026-09-10T12:30:00.000Z',
    room: 'P.204',
    mode: 'OFFLINE',
    status: 'CONFIRMED',
    version: 1,
    ...overrides,
  };
  store.transact((draft) => {
    draft.sessions.push(session);
    if (!draft.teacherAssignments.some((item) => item.classId === session.classId && ['ACTIVE', 'ACCEPTED'].includes(item.status))) {
      draft.teacherAssignments.push({ id: `assignment-${session.id}`, teacherProfileId: 'teacher-profile-1', classId: session.classId, role: 'PRIMARY', startsAt: '2026-01-01T00:00:00.000Z', endsAt: '2027-01-01T00:00:00.000Z', workloadMinutes: 720, status: 'ACTIVE' });
    }
  });
  return session;
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

test('live target ranking prioritizes the same Course Version and lesson while exposing every hard gate', () => {
  const { YC, bus, store, state } = runtimeWithTeacherAssignment();
  finalizeAbsent(bus);
  const remedialCase = state().remedialCases[0];
  addTargetSession(store);
  addTargetSession(store, { id: 'session-wrong-course', classId: 'class-7b', lessonTemplateId: 'lesson-future', startsAt: '2026-09-11T11:00:00.000Z', endsAt: '2026-09-11T12:30:00.000Z', room: 'P.105' });
  const ranked = YC.remedial.rankMakeUpTargets(state(), remedialCase.id);
  assert.equal(ranked[0].sessionId, 'session-equivalent');
  assert.equal(ranked[0].eligible, true);
  assert.ok(ranked[0].hardGates.every((gate) => gate.passed));
  assert.equal(ranked.find((item) => item.sessionId === 'session-wrong-course').hardGates.find((gate) => gate.key === 'COURSE_VERSION').passed, false);
});

test('booking adds a make-up guest without changing the learner primary class', () => {
  const { bus, store, state } = runtimeWithTeacherAssignment();
  finalizeAbsent(bus);
  const caseId = state().remedialCases[0].id;
  addTargetSession(store);
  const beforeClass = state().learners.find((item) => item.id === 'student-canonical').classId;
  const result = bus.dispatch('CONFIRM_MAKE_UP_BOOKING', { caseId, targetSessionId: 'session-equivalent' }, 'service-1');
  assert.equal(result.ok, true, result.message);
  assert.equal(state().learners.find((item) => item.id === 'student-canonical').classId, beforeClass);
  assert.equal(state().makeUpBookings.at(-1).rosterRole, 'MAKE_UP_GUEST');
  assert.equal(state().makeUpBookings.at(-1).originalSessionId, 'session-canonical');
  assert.equal(state().makeUpBookings.at(-1).targetClassId, 'class-6b');
});

test('a held seat counts toward capacity and blocks a second learner from the target session', () => {
  const { YC, bus, store, state } = runtimeWithTeacherAssignment();
  finalizeAbsent(bus);
  const caseId = state().remedialCases[0].id;
  addTargetSession(store);
  store.transact((draft) => { draft.classes.find((item) => item.id === 'class-6b').capacity = 1; });
  const held = bus.dispatch('HOLD_MAKE_UP_SEAT', { caseId, targetSessionId: 'session-equivalent' }, 'service-1');
  assert.equal(held.ok, true, held.message);
  assert.equal(state().makeUpBookings.at(-1).status, 'HELD');
  store.transact((draft) => {
    draft.remedialCases.push({ ...draft.remedialCases[0], id: 'remedial-case-other', learnerId: 'student-02', sourceAttendanceId: 'attendance-other' });
  });
  const other = YC.remedial.rankMakeUpTargets(state(), 'remedial-case-other').find((item) => item.sessionId === 'session-equivalent');
  assert.equal(other.hardGates.find((gate) => gate.key === 'CAPACITY').passed, false);
});

test('learner schedule conflicts and a second active booking are rejected', () => {
  const { YC, bus, store, state } = runtimeWithTeacherAssignment();
  finalizeAbsent(bus);
  const caseId = state().remedialCases[0].id;
  addTargetSession(store);
  addTargetSession(store, { id: 'session-alternative', startsAt: '2026-09-12T11:00:00.000Z', endsAt: '2026-09-12T12:30:00.000Z' });
  store.transact((draft) => {
    draft.sessions.push({ id: 'session-primary-conflict', classId: 'class-6a', lessonTemplateId: 'lesson-past-simple', startsAt: '2026-09-10T11:30:00.000Z', endsAt: '2026-09-10T13:00:00.000Z', room: 'P.302', mode: 'OFFLINE', status: 'CONFIRMED', version: 1 });
  });
  const conflicted = YC.remedial.rankMakeUpTargets(state(), caseId).find((item) => item.sessionId === 'session-equivalent');
  assert.equal(conflicted.hardGates.find((gate) => gate.key === 'LEARNER_SCHEDULE').passed, false);
  assert.equal(bus.dispatch('CONFIRM_MAKE_UP_BOOKING', { caseId, targetSessionId: 'session-alternative' }, 'service-1').ok, true);
  const duplicate = bus.dispatch('CONFIRM_MAKE_UP_BOOKING', { caseId, targetSessionId: 'session-equivalent' }, 'service-1');
  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.code, 'ACTIVE_MAKE_UP_BOOKING_EXISTS');
});

test('no-show keeps the old attempt and permits rebooking under the same case', () => {
  const { bus, store, state } = runtimeWithTeacherAssignment();
  finalizeAbsent(bus);
  const caseId = state().remedialCases[0].id;
  addTargetSession(store);
  addTargetSession(store, { id: 'session-rebook', startsAt: '2026-09-12T11:00:00.000Z', endsAt: '2026-09-12T12:30:00.000Z' });
  assert.equal(bus.dispatch('CONFIRM_MAKE_UP_BOOKING', { caseId, targetSessionId: 'session-equivalent' }, 'service-1').ok, true);
  const firstBookingId = state().makeUpBookings.at(-1).id;
  store.transact((draft) => { draft.sessions.find((item) => item.id === 'session-equivalent').status = 'COMPLETED'; });
  const noShow = bus.dispatch('RECORD_MAKE_UP_ATTENDANCE', { bookingId: firstBookingId, attendanceStatus: 'NO_SHOW', note: 'Học viên không đến lớp' }, 'teacher-1');
  assert.equal(noShow.ok, true, noShow.message);
  assert.equal(state().makeUpBookings.find((item) => item.id === firstBookingId).status, 'NO_SHOW');
  assert.equal(bus.dispatch('CONFIRM_MAKE_UP_BOOKING', { caseId, targetSessionId: 'session-rebook' }, 'service-1').ok, true);
  assert.equal(state().makeUpBookings.filter((item) => item.remedialCaseId === caseId).length, 2);
  assert.equal(state().makeUpBookings.at(-1).status, 'BOOKED');
});

test('different lesson mapping requires Admin approval and a coverage note', () => {
  const { bus, store, state } = runtimeWithTeacherAssignment();
  finalizeAbsent(bus);
  const caseId = state().remedialCases[0].id;
  store.transact((draft) => {
    draft.lessonTemplates.push({ id: 'lesson-equivalent-admin', unitId: 'unit-v6-4', version: 1, title: 'Ôn tập quá khứ trong giao tiếp', durationMinutes: 90, objectives: ['Ôn tập cấu trúc quá khứ'], status: 'PUBLISHED' });
  });
  addTargetSession(store, { id: 'session-admin-mapping', lessonTemplateId: 'lesson-equivalent-admin' });
  const serviceResult = bus.dispatch('CONFIRM_MAKE_UP_BOOKING', { caseId, targetSessionId: 'session-admin-mapping', overrideNote: 'Nội dung tương đương' }, 'service-1');
  assert.equal(serviceResult.ok, false);
  assert.equal(serviceResult.code, 'CONTENT_MAPPING_APPROVAL_REQUIRED');
  const withoutNote = bus.dispatch('CONFIRM_MAKE_UP_BOOKING', { caseId, targetSessionId: 'session-admin-mapping' }, 'admin-1');
  assert.equal(withoutNote.ok, false);
  assert.equal(withoutNote.code, 'OVERRIDE_NOTE_REQUIRED');
  const approved = bus.dispatch('CONFIRM_MAKE_UP_BOOKING', { caseId, targetSessionId: 'session-admin-mapping', overrideNote: 'Bao phủ cùng mục tiêu ngữ pháp và giao tiếp.' }, 'admin-1');
  assert.equal(approved.ok, true, approved.message);
  assert.equal(state().makeUpBookings.at(-1).contentMapping.type, 'ADMIN_EQUIVALENT');
  assert.match(state().makeUpBookings.at(-1).contentMapping.coverageNote, /mục tiêu ngữ pháp/);
});

test('cancelling preserves booking history and requires a reason', () => {
  const { bus, store, state } = runtimeWithTeacherAssignment();
  finalizeAbsent(bus);
  const caseId = state().remedialCases[0].id;
  addTargetSession(store);
  bus.dispatch('CONFIRM_MAKE_UP_BOOKING', { caseId, targetSessionId: 'session-equivalent' }, 'service-1');
  const bookingId = state().makeUpBookings.at(-1).id;
  assert.equal(bus.dispatch('CANCEL_MAKE_UP_BOOKING', { bookingId }, 'service-1').code, 'REASON_REQUIRED');
  assert.equal(bus.dispatch('CANCEL_MAKE_UP_BOOKING', { bookingId, reason: 'Phụ huynh xin đổi lịch' }, 'service-1').ok, true);
  const booking = state().makeUpBookings.find((item) => item.id === bookingId);
  assert.equal(booking.status, 'CANCELLED');
  assert.ok(booking.history.some((item) => item.toStatus === 'CANCELLED'));
});
