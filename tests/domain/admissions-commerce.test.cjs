const assert = require('node:assert/strict');
const test = require('node:test');
const { loadYC, memoryStorage } = require('../helpers/load-runtime.cjs');

const FIXED_NOW = '2026-09-04T02:00:00.000Z';

function createRuntime() {
  const YC = loadYC(['seed', 'store', 'commands']);
  const store = YC.store.create({ storage: memoryStorage(), clock: () => FIXED_NOW });
  const bus = YC.commands.create(store);
  return { YC, store, state: () => store.getState(), dispatch: bus.dispatch };
}

function advanceCanonicalToPayment(runtime) {
  const steps = [
    ['CONTACT_LEAD', { leadId: 'lead-canonical', note: 'Phụ huynh xác nhận nhu cầu A2' }, 'admissions-1'],
    ['BOOK_PLACEMENT', { leadId: 'lead-canonical', startsAt: '2026-09-05T02:00:00.000Z', mode: 'OFFLINE' }, 'admissions-1'],
    ['RECORD_PLACEMENT', { leadId: 'lead-canonical', frameworkLevel: 'A2', centerLevelId: 'level-a2-1', skills: { listening: 74, reading: 78, spokenInteraction: 69, spokenProduction: 66, writing: 72, language: 75 }, recommendation: 'English Foundation 6 · A2.1' }, 'academic-1'],
    ['RELEASE_PLACEMENT', { leadId: 'lead-canonical' }, 'academic-1'],
    ['CREATE_OFFER', { leadId: 'lead-canonical', packageId: 'package-a2-1', discount: 300000 }, 'admissions-1'],
    ['SEND_OFFER', { leadId: 'lead-canonical' }, 'admissions-1'],
    ['ACCEPT_OFFER', { leadId: 'lead-canonical' }, 'admissions-1'],
    ['ISSUE_INVOICE', { leadId: 'lead-canonical' }, 'finance-1'],
    ['RECORD_MOCK_PAYMENT', { leadId: 'lead-canonical', reference: 'MOCK-260904-01' }, 'finance-1'],
  ];
  for (const [name, payload, actorId] of steps) {
    const result = runtime.dispatch(name, payload, actorId);
    assert.equal(result.ok, true, `${name}: ${result.message}`);
  }
}

test('placement cannot be recorded before contact and booking evidence', () => {
  const runtime = createRuntime();

  const result = runtime.dispatch('RECORD_PLACEMENT', {
    leadId: 'lead-canonical', frameworkLevel: 'A2', centerLevelId: 'level-a2-1', skills: {}
  }, 'academic-1');

  assert.equal(result.ok, false);
  assert.equal(result.code, 'PLACEMENT_NOT_BOOKED');
  assert.equal(runtime.state().placementResults.some((item) => item.leadId === 'lead-canonical'), false);
});

test('admission through mock payment preserves evidence, events, and audit', () => {
  const runtime = createRuntime();

  advanceCanonicalToPayment(runtime);

  const lead = runtime.state().leads.find((item) => item.id === 'lead-canonical');
  const invoice = runtime.state().invoices.find((item) => item.leadId === lead.id);
  const payment = runtime.state().payments.find((item) => item.invoiceId === invoice.id);
  assert.equal(lead.status, 'WON');
  assert.equal(invoice.status, 'PAID');
  assert.equal(payment.mode, 'MOCK');
  assert.equal(payment.provider, 'DEMO_LEDGER');
  assert.equal(runtime.state().domainEvents[0].type, 'PAYMENT_RECORDED');
  assert.ok(runtime.state().auditLogs.some((item) => item.action === 'MOCK_PAYMENT_RECORDED'));
});

test('paid learner can be allocated and receives one active enrollment', () => {
  const runtime = createRuntime();
  advanceCanonicalToPayment(runtime);

  const result = runtime.dispatch('ALLOCATE_CLASS', {
    leadId: 'lead-canonical', classId: 'class-6a'
  }, 'service-1');

  assert.equal(result.ok, true, result.message);
  const enrollment = runtime.state().enrollments.find((item) => item.learnerId === 'student-canonical' && item.status === 'ACTIVE');
  assert.equal(enrollment.classId, 'class-6a');
  assert.equal(runtime.state().learners.find((item) => item.id === 'student-canonical').classId, 'class-6a');
});

test('full class returns ranked alternatives without changing enrollment', () => {
  const runtime = createRuntime();
  const before = runtime.state().enrollments.length;

  const result = runtime.dispatch('ALLOCATE_CLASS', {
    leadId: 'lead-no-seat', classId: 'class-full'
  }, 'service-1');

  assert.equal(result.ok, false);
  assert.equal(result.code, 'NO_SEAT');
  assert.ok(result.alternatives.some((item) => item.classId === 'class-6b'));
  assert.equal(runtime.state().enrollments.length, before);
});

test('transfer closes the old enrollment and preserves it beside the new enrollment', () => {
  const runtime = createRuntime();
  advanceCanonicalToPayment(runtime);
  runtime.dispatch('ALLOCATE_CLASS', { leadId: 'lead-canonical', classId: 'class-6a' }, 'service-1');

  const result = runtime.dispatch('TRANSFER_ENROLLMENT', {
    learnerId: 'student-canonical', toClassId: 'class-6b', reason: 'Đổi lịch học theo gia đình'
  }, 'service-1');

  assert.equal(result.ok, true, result.message);
  const learnerEnrollments = runtime.state().enrollments.filter((item) => item.learnerId === 'student-canonical');
  assert.equal(learnerEnrollments.length, 2);
  assert.equal(learnerEnrollments.find((item) => item.classId === 'class-6a').status, 'TRANSFERRED');
  assert.equal(learnerEnrollments.find((item) => item.classId === 'class-6b').status, 'ACTIVE');
});

test('renewal acceptance requires a promotion decision and records the next course', () => {
  const runtime = createRuntime();
  runtime.store.transact((draft) => draft.promotionDecisions.push({
    id: 'promotion-test', learnerId: 'student-canonical', decision: 'PROMOTE', nextCourseVersionId: 'course-v7', status: 'FINAL', decidedAt: FIXED_NOW, decidedBy: 'academic-1'
  }));

  assert.equal(runtime.dispatch('CREATE_RENEWAL', { learnerId: 'student-canonical', packageId: 'package-a2-1' }, 'admissions-1').ok, true);
  const accepted = runtime.dispatch('ACCEPT_RENEWAL', { learnerId: 'student-canonical' }, 'admissions-1');

  assert.equal(accepted.ok, true);
  assert.equal(runtime.state().renewals.find((item) => item.learnerId === 'student-canonical').status, 'ACCEPTED');
});
