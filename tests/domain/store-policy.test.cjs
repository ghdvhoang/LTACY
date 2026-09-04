const assert = require('node:assert/strict');
const test = require('node:test');
const { loadYC, memoryStorage } = require('../helpers/load-runtime.cjs');

const FIXED_NOW = '2026-09-04T02:00:00.000Z';
const clock = () => FIXED_NOW;

test('seed keeps class delivery tied to branch and immutable course version', () => {
  const YC = loadYC(['seed']);
  const state = YC.seed.createSeed(clock);

  assert.equal(state.schemaVersion, 3);
  assert.ok(state.branches.length >= 2);
  for (const cohort of state.classes) {
    assert.ok(state.branches.some((item) => item.id === cohort.branchId), cohort.id);
    assert.ok(
      state.courseVersions.some(
        (item) => item.id === cohort.courseVersionId && item.status === 'PUBLISHED' && item.immutable === true
      ),
      cohort.id
    );
  }
});

test('seed collections preserve core foreign-key relationships', () => {
  const YC = loadYC(['seed']);
  const state = YC.seed.createSeed(clock);

  for (const session of state.sessions) {
    assert.ok(state.classes.some((item) => item.id === session.classId), session.id);
    assert.ok(state.lessonTemplates.some((item) => item.id === session.lessonTemplateId), session.id);
  }
  for (const assignment of state.teacherAssignments) {
    assert.ok(state.teacherProfiles.some((item) => item.id === assignment.teacherProfileId), assignment.id);
    assert.ok(state.classes.some((item) => item.id === assignment.classId), assignment.id);
  }
});

test('store persists transactions and rolls back a throwing transaction', () => {
  const YC = loadYC(['seed', 'store']);
  const storage = memoryStorage();
  const store = YC.store.create({ storage, clock });
  const originalName = store.getState().organizations[0].name;

  store.transact((draft) => { draft.organizations[0].name = 'Yen Center Demo'; });
  assert.equal(JSON.parse(storage.snapshot()[YC.store.STORAGE_KEY]).organizations[0].name, 'Yen Center Demo');

  assert.throws(() => store.transact((draft) => {
    draft.organizations[0].name = 'Corrupted';
    throw new Error('reject');
  }), /reject/);
  assert.equal(store.getState().organizations[0].name, 'Yen Center Demo');
  assert.notEqual(store.getState().organizations[0].name, originalName);
});

test('v2 payload is reset instead of inventing missing domain relationships', () => {
  const YC = loadYC(['store']);
  const storage = memoryStorage({ [YC.store.LEGACY_STORAGE_KEY]: JSON.stringify({ version: 2, users: [] }) });

  const store = YC.store.create({ storage, clock });

  assert.equal(store.getState().schemaVersion, 3);
  assert.equal(store.getState().migrationNotice.code, 'V2_RESET_REQUIRED');
});

test('parent visibility excludes internal and safeguarding feedback', () => {
  const YC = loadYC(['seed', 'policy']);
  const state = YC.seed.createSeed(clock);
  const parent = state.users.find((item) => item.role === 'PARENT');

  const visible = YC.policy.visibleFeedback(parent, state.feedbackRecords, state);

  assert.ok(visible.length > 0);
  assert.ok(visible.every((item) => ['PARENT', 'LEARNER_PARENT'].includes(item.visibility)));
  assert.ok(visible.every((item) => parent.linkedLearnerIds.includes(item.learnerId)));
});

test('teacher class access follows effective assignment scope', () => {
  const YC = loadYC(['seed', 'policy']);
  const state = YC.seed.createSeed(clock);
  const teacher = state.users.find((item) => item.id === 'teacher-2');

  assert.equal(YC.policy.can(teacher, 'CLASS_VIEW', { classId: 'class-7b' }, state), true);
  assert.equal(YC.policy.can(teacher, 'CLASS_VIEW', { classId: 'class-6a' }, state), false);
});

test('journey selector reports the earliest unfinished canonical milestone', () => {
  const YC = loadYC(['seed', 'selectors']);
  const state = YC.seed.createSeed(clock);

  assert.deepEqual(
    JSON.parse(JSON.stringify(YC.selectors.journey(state))),
    { status: 'LEAD', index: 0, total: 12, ownerRole: 'ADMISSIONS' }
  );
  assert.equal(YC.selectors.roleHome('PARENT'), '/app/parent/dashboard');
  assert.equal(YC.selectors.roleHome('ACADEMIC_MANAGER'), '/app/academic/dashboard');
});
