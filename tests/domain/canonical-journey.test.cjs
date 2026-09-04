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

function mustDispatch(runtime, name, payload, actorId) {
  const result = runtime.dispatch(name, payload, actorId);
  assert.equal(result.ok, true, `${name}: ${result.code || ''} ${result.message}`);
  return result;
}

test('canonical journey reaches renewal through evidence-backed commands', () => {
  const runtime = createRuntime();
  const initialAuditCount = runtime.state().auditLogs.length;

  mustDispatch(runtime, 'CONTACT_LEAD', { leadId: 'lead-canonical', note: 'Mục tiêu giao tiếp A2.' }, 'admissions-1');
  mustDispatch(runtime, 'BOOK_PLACEMENT', { leadId: 'lead-canonical', startsAt: '2026-09-05T02:00:00.000Z', mode: 'OFFLINE' }, 'admissions-1');
  mustDispatch(runtime, 'RECORD_PLACEMENT', {
    leadId: 'lead-canonical', frameworkLevel: 'A2', centerLevelId: 'level-a2-1',
    skills: { listening: 74, reading: 78, spokenInteraction: 69, spokenProduction: 66, writing: 72, language: 75 },
    recommendation: 'English Foundation 6 · A2.1',
  }, 'academic-1');
  mustDispatch(runtime, 'RELEASE_PLACEMENT', { leadId: 'lead-canonical' }, 'academic-1');
  mustDispatch(runtime, 'CREATE_OFFER', { leadId: 'lead-canonical', packageId: 'package-a2-1', discount: 300000 }, 'admissions-1');
  mustDispatch(runtime, 'SEND_OFFER', { leadId: 'lead-canonical' }, 'admissions-1');
  mustDispatch(runtime, 'ACCEPT_OFFER', { leadId: 'lead-canonical' }, 'admissions-1');
  mustDispatch(runtime, 'ISSUE_INVOICE', { leadId: 'lead-canonical' }, 'finance-1');
  mustDispatch(runtime, 'RECORD_MOCK_PAYMENT', { leadId: 'lead-canonical', reference: 'MOCK-CANONICAL' }, 'finance-1');
  mustDispatch(runtime, 'ALLOCATE_CLASS', { leadId: 'lead-canonical', classId: 'class-6a' }, 'service-1');
  mustDispatch(runtime, 'PROPOSE_TEACHER_ASSIGNMENT', { teacherId: 'teacher-1', classId: 'class-6a', workloadMinutes: 720 }, 'academic-1');
  mustDispatch(runtime, 'ACCEPT_TEACHER_ASSIGNMENT', { classId: 'class-6a' }, 'teacher-1');
  mustDispatch(runtime, 'MARK_SESSION_READY', { sessionId: 'session-canonical', adaptations: ['Thêm visual timeline'] }, 'teacher-1');
  mustDispatch(runtime, 'START_SESSION', { sessionId: 'session-canonical' }, 'teacher-1');
  mustDispatch(runtime, 'COMPLETE_SESSION', {
    sessionId: 'session-canonical',
    taughtItemIds: ['item-past-simple-video', 'item-speaking-pairs'],
    deferredItemIds: ['item-pronunciation'],
    note: 'Pronunciation chuyển sang practice có hướng dẫn.',
  }, 'teacher-1');
  mustDispatch(runtime, 'FINALIZE_ATTENDANCE', {
    sessionId: 'session-canonical',
    records: [{ learnerId: 'student-canonical', status: 'ABSENT', reasonCode: 'SICK' }],
  }, 'teacher-1');
  const remedial = runtime.state().remedialAssignments.find((item) => item.learnerId === 'student-canonical');
  mustDispatch(runtime, 'UPDATE_VIDEO_PROGRESS', { assignmentId: remedial.id, progress: 100 }, 'student-login-1');
  mustDispatch(runtime, 'SUBMIT_AUTO_ASSESSMENT', { assignmentId: remedial.id, answers: [1, 1, 0, 1, 1, 1, 1, 1, 0, 2] }, 'student-login-1');
  mustDispatch(runtime, 'ASSIGN_HOMEWORK', { classId: 'class-6a', learnerId: 'student-canonical', title: 'Audio story: last weekend' }, 'teacher-1');
  const homework = runtime.state().homeworkAssignments.find((item) => item.learnerId === 'student-canonical');
  mustDispatch(runtime, 'SUBMIT_HOMEWORK', { homeworkId: homework.id, evidence: 'audio-demo.webm' }, 'student-login-1');
  mustDispatch(runtime, 'GRADE_HOMEWORK', { homeworkId: homework.id, score: 58, feedback: 'Cần dùng past tense nhất quán.' }, 'teacher-1');
  mustDispatch(runtime, 'RELEASE_HOMEWORK_FEEDBACK', { homeworkId: homework.id }, 'teacher-1');
  mustDispatch(runtime, 'REQUEST_REVISION', { homeworkId: homework.id, nextAction: 'Thu lại đoạn 2' }, 'teacher-1');
  mustDispatch(runtime, 'RESUBMIT_HOMEWORK', { homeworkId: homework.id, evidence: 'audio-demo-v2.webm' }, 'student-login-1');
  mustDispatch(runtime, 'GRADE_HOMEWORK', { homeworkId: homework.id, score: 86, feedback: 'Past tense rõ và chính xác.' }, 'teacher-1');
  mustDispatch(runtime, 'RELEASE_HOMEWORK_FEEDBACK', { homeworkId: homework.id }, 'teacher-1');
  mustDispatch(runtime, 'ACCEPT_HOMEWORK', { homeworkId: homework.id }, 'teacher-1');
  const grade = mustDispatch(runtime, 'SUBMIT_MANUAL_GRADE', {
    assessmentId: 'assessment-final-canonical', learnerId: 'student-canonical',
    skills: { listening: 76, reading: 78, spokenInteraction: 62, spokenProduction: 61, writing: 72, language: 74 },
    feedback: 'Đủ evidence; speaking sát ngưỡng.',
  }, 'teacher-1');
  mustDispatch(runtime, 'START_MODERATION', { attemptId: grade.attemptId }, 'academic-1');
  mustDispatch(runtime, 'APPROVE_MODERATION', { attemptId: grade.attemptId, note: 'Rubric và speaking sample nhất quán.' }, 'academic-1');
  mustDispatch(runtime, 'RELEASE_RESULT', { attemptId: grade.attemptId }, 'academic-1');
  mustDispatch(runtime, 'PUBLISH_PROGRESS_REPORT', {
    learnerId: 'student-canonical', narrative: 'Đã đạt chuẩn đầu ra A2.1.', nextActions: ['Tăng speaking fluency ở A2.2'],
  }, 'academic-1');
  mustDispatch(runtime, 'DECIDE_PROMOTION', {
    learnerId: 'student-canonical', decision: 'PROMOTE', nextCourseVersionId: 'course-v7',
    overrideReason: 'Demo tăng tốc: absence đã được hoàn tất bằng remedial có evidence.',
    overrideEvidence: [remedial.id],
  }, 'academic-1');
  mustDispatch(runtime, 'ACKNOWLEDGE_PARENT_PROGRESS', { learnerId: 'student-canonical' }, 'parent-1');
  mustDispatch(runtime, 'CREATE_RENEWAL', { learnerId: 'student-canonical', packageId: 'package-a2-2' }, 'admissions-1');
  mustDispatch(runtime, 'ACCEPT_RENEWAL', { learnerId: 'student-canonical' }, 'admissions-1');

  assert.equal(runtime.YC.selectors.journey(runtime.state()).status, 'RENEWED');
  assert.equal(runtime.state().renewals[0].nextCourseVersionId, 'course-v7');
  assert.equal(runtime.state().homeworkAssignments[0].status, 'ACCEPTED');
  assert.ok(runtime.state().domainEvents.length >= 20);
  assert.ok(runtime.state().auditLogs.length > initialAuditCount);
  assert.equal(runtime.state().promotionDecisions[0].overrideEvidence[0], remedial.id);
});
