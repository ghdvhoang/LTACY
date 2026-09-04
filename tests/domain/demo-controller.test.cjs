const assert = require('node:assert/strict');
const test = require('node:test');
const { loadYC, memoryStorage } = require('../helpers/load-runtime.cjs');

function createController() {
  const YC = loadYC(['seed', 'store', 'commands', 'actions']);
  const storage = memoryStorage();
  const store = YC.store.create({ storage, clock: () => '2026-09-04T02:00:00.000Z' });
  const bus = YC.commands.create(store);
  const location = { hash: '' };
  const notices = [];
  const downloads = [];
  let printCount = 0;
  const controller = YC.actions.create({ store, bus, storage, location, onChange() {}, onToast(message, kind) { notices.push({ message, kind }); }, onDownload(name, content) { downloads.push({ name, content }); }, onPrint() { printCount += 1; } });
  return { YC, store, storage, location, notices, downloads, get printCount() { return printCount; }, controller };
}

test('demo controller can advance the canonical story to renewal', () => {
  const runtime = createController();

  const result = runtime.controller.runCanonicalAll();

  assert.equal(result.ok, true, result.message);
  assert.equal(runtime.YC.selectors.journey(runtime.store.getState()).status, 'RENEWED');
  assert.equal(runtime.YC.selectors.journey(runtime.store.getState()).complete, true);
  assert.equal(runtime.store.getState().homeworkAssignments.find((item) => item.learnerId === 'student-canonical').status, 'ACCEPTED');
  assert.ok(runtime.store.getState().auditLogs.length > 8);
  assert.match(runtime.notices.at(-1).message, /hoàn tất/i);
});

test('role login persists the actor and navigates to its role home', () => {
  const runtime = createController();

  const result = runtime.controller.execute('login', { actorId: 'parent-1' });

  assert.equal(result.ok, true);
  assert.equal(runtime.storage.getItem('yc.demo.actorId'), 'parent-1');
  assert.equal(runtime.location.hash, '#/app/parent/dashboard');
});

test('reset restores the canonical lead without retaining journey events', () => {
  const runtime = createController();
  runtime.controller.runCanonicalNext();

  const result = runtime.controller.execute('reset-demo');

  assert.equal(result.ok, true);
  assert.equal(runtime.store.getState().leads.find((item) => item.id === 'lead-canonical').status, 'NEW');
  assert.equal(runtime.store.getState().domainEvents.length, 0);
});

test('documented checkpoints are deterministic', () => {
  const runtime = createController();

  assert.equal(runtime.controller.execute('load-checkpoint', { checkpoint: 'ENROLLED' }).ok, true);
  const first = JSON.stringify(runtime.store.getState());
  assert.equal(runtime.YC.selectors.journey(runtime.store.getState()).status, 'ENROLLED');
  assert.equal(runtime.controller.execute('load-checkpoint', { checkpoint: 'ENROLLED' }).ok, true);

  assert.equal(JSON.stringify(runtime.store.getState()), first);
});

test('renewed checkpoint opens the renewal milestone without claiming the journey is complete', () => {
  const runtime = createController();

  assert.equal(runtime.controller.execute('load-checkpoint', { checkpoint: 'RENEWED' }).ok, true);

  assert.equal(runtime.YC.selectors.journey(runtime.store.getState()).status, 'RENEWED');
  assert.equal(runtime.YC.selectors.journey(runtime.store.getState()).complete, false);
  assert.equal(runtime.store.getState().renewals.length, 0);
});

test('audit export uses a spreadsheet-safe UTF-8 CSV and print delegates to the host', () => {
  const runtime = createController();
  runtime.controller.runCanonicalNext();

  assert.equal(runtime.controller.execute('export-csv', { type: 'audit' }).ok, true);
  assert.equal(runtime.downloads.length, 1);
  assert.match(runtime.downloads[0].name, /audit.*\.csv$/);
  assert.ok(runtime.downloads[0].content.startsWith('\uFEFF'));
  assert.match(runtime.downloads[0].content, /LEAD_CONTACTED/);
  assert.equal(runtime.controller.execute('print-view').ok, true);
  assert.equal(runtime.printCount, 1);
});
