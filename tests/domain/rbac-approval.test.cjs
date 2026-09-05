const assert = require('node:assert/strict');
const test = require('node:test');
const { loadYC, memoryStorage } = require('../helpers/load-runtime.cjs');

const FIXED_NOW = '2026-09-05T02:00:00.000Z';

function runtime() {
  const YC = loadYC(['seed', 'store', 'policy', 'commands']);
  const store = YC.store.create({ storage: memoryStorage(), clock: () => FIXED_NOW });
  return { YC, store, bus: YC.commands.create(store), state: () => store.getState() };
}

function activeAssignment(teacherProfileId, classId) {
  return {
    id: `assignment-${teacherProfileId}-${classId}`,
    teacherProfileId,
    classId,
    role: 'PRIMARY',
    startsAt: '2026-01-01T00:00:00.000Z',
    endsAt: '2027-01-01T00:00:00.000Z',
    workloadMinutes: 720,
    status: 'ACTIVE',
  };
}

function runtimeWithTeacherAssignment() {
  const result = runtime();
  result.store.transact((draft) => {
    draft.teacherAssignments.push(activeAssignment('teacher-profile-1', 'class-6a'));
  });
  return result;
}

function sessionProposal() {
  return {
    provisionalId: 'session-proposed-1',
    classId: 'class-6a',
    lessonTemplateId: 'lesson-past-simple',
    startsAt: '2026-09-08T11:00:00.000Z',
    endsAt: '2026-09-08T12:30:00.000Z',
    room: 'P.304',
    mode: 'OFFLINE',
    status: 'PLANNED',
    version: 1,
  };
}

function render(path, role) {
  const YC = loadYC(['seed', 'router']);
  const state = YC.seed.createSeed(() => FIXED_NOW);
  return YC.router.render(path, {
    state,
    actor: state.users.find((item) => item.role === role),
    learnerId: 'student-canonical',
    path,
  });
}

test('user deny overrides role allow and assigned-class scope is enforced', () => {
  const { YC, state: current } = runtimeWithTeacherAssignment();
  const state = current();
  const teacher = state.users.find((item) => item.id === 'teacher-1');

  assert.equal(YC.policy.can(teacher, 'session.request_create', { classId: 'class-6a' }, state), true);
  assert.equal(YC.policy.can(teacher, 'session.request_create', { classId: 'class-7b' }, state), false);

  state.userPermissionOverrides.push({
    id: 'deny-1',
    userId: teacher.id,
    permissionId: 'session.request_create',
    effect: 'DENY',
    scopeType: 'CLASS',
    scopeIds: ['class-6a'],
    effectiveFrom: state.currentAt,
    effectiveTo: '2027-01-01T00:00:00.000Z',
  });

  const decision = YC.policy.explain(teacher, 'session.request_create', { classId: 'class-6a' }, state);
  assert.equal(decision.allowed, false);
  assert.equal(decision.source, 'USER_DENY');
  assert.equal(decision.permissionId, 'session.request_create');
  assert.equal(decision.scope, 'CLASS');
});

test('expired overrides are ignored and inactive users are denied', () => {
  const { YC, state: current } = runtimeWithTeacherAssignment();
  const state = current();
  const teacher = state.users.find((item) => item.id === 'teacher-1');
  state.userPermissionOverrides.push({
    id: 'expired-deny',
    userId: teacher.id,
    permissionId: 'session.request_create',
    effect: 'DENY',
    scopeType: 'CLASS',
    scopeIds: ['class-6a'],
    effectiveFrom: '2025-01-01T00:00:00.000Z',
    effectiveTo: '2025-12-31T23:59:59.999Z',
  });

  assert.equal(YC.policy.can(teacher, 'session.request_create', { classId: 'class-6a' }, state), true);
  teacher.status = 'INACTIVE';
  const decision = YC.policy.explain(teacher, 'session.request_create', { classId: 'class-6a' }, state);
  assert.equal(decision.allowed, false);
  assert.equal(decision.source, 'INACTIVE_USER');
});

test('branch grants cannot cross the actor branch boundary', () => {
  const { YC, state } = runtime();
  const snapshot = state();
  const teacher = snapshot.users.find((item) => item.id === 'teacher-1');

  assert.equal(YC.policy.can(teacher, 'course.request_create', { branchId: 'branch-q3' }, snapshot), true);
  assert.equal(YC.policy.can(teacher, 'course.request_create', { branchId: 'branch-td' }, snapshot), false);
});

test('legacy permission aliases use the same dynamic assigned-class policy', () => {
  const { YC, state } = runtimeWithTeacherAssignment();
  const snapshot = state();
  const teacher = snapshot.users.find((item) => item.id === 'teacher-1');

  const decision = YC.policy.explain(teacher, 'CLASS_VIEW', { classId: 'class-6a' }, snapshot);
  assert.equal(decision.allowed, true);
  assert.equal(decision.source, 'ROLE');
  assert.equal(decision.permissionId, 'class.view');
  assert.equal(decision.scope, 'ASSIGNED_CLASS');
  assert.equal(YC.policy.can(teacher, 'CLASS_VIEW', { classId: 'class-7b' }, snapshot), false);
});

module.exports = { FIXED_NOW, activeAssignment, render, runtime, runtimeWithTeacherAssignment, sessionProposal };
