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

test('Admin sets and revokes an account permission override with audit evidence', () => {
  const { bus, state } = runtime();
  const granted = bus.dispatch('SET_USER_PERMISSION_OVERRIDE', {
    userId: 'teacher-1',
    permissionId: 'class.request_create',
    effect: 'ALLOW',
    scopeType: 'BRANCH',
    scopeIds: ['branch-q3'],
    reason: 'Phụ trách mở lớp tháng 9',
  }, 'admin-1');

  assert.equal(granted.ok, true);
  assert.equal(state().userPermissionOverrides.at(-1).grantedBy, 'admin-1');
  assert.equal(state().auditLogs[0].action, 'USER_PERMISSION_OVERRIDE_SET');
  assert.equal(state().domainEvents[0].type, 'USER_PERMISSION_OVERRIDE_SET');

  const revoked = bus.dispatch('REVOKE_USER_PERMISSION_OVERRIDE', {
    overrideId: granted.overrideId,
    reason: 'Kết thúc thời gian phụ trách',
  }, 'admin-1');
  assert.equal(revoked.ok, true);
  assert.equal(state().userPermissionOverrides.find((item) => item.id === granted.overrideId).status, 'REVOKED');
  assert.equal(state().auditLogs[0].action, 'USER_PERMISSION_OVERRIDE_REVOKED');
});

test('permission mutations require authority and a reason', () => {
  const { bus, state } = runtime();
  const teacherAttempt = bus.dispatch('SET_ROLE_PERMISSION', {
    role: 'TEACHER', permissionId: 'site.publish', effect: 'ALLOW', scopeType: 'ORGANIZATION', reason: 'Tự cấp quyền',
  }, 'teacher-1');
  assert.equal(teacherAttempt.ok, false);
  assert.equal(teacherAttempt.code, 'FORBIDDEN');

  const missingReason = bus.dispatch('SET_USER_PERMISSION_OVERRIDE', {
    userId: 'teacher-1', permissionId: 'site.edit', effect: 'ALLOW', scopeType: 'ORGANIZATION', reason: '',
  }, 'admin-1');
  assert.equal(missingReason.ok, false);
  assert.equal(missingReason.code, 'REASON_REQUIRED');
  assert.equal(state().userPermissionOverrides.length, 0);
});

test('role permission changes are versioned instead of rewriting prior evidence', () => {
  const { bus, state } = runtime();
  const previous = state().rolePermissions.find((item) => item.role === 'TEACHER' && item.permissionId === 'course.request_create');
  const result = bus.dispatch('SET_ROLE_PERMISSION', {
    role: 'TEACHER',
    permissionId: 'course.request_create',
    effect: 'DENY',
    scopeType: 'BRANCH',
    scopeIds: ['branch-q3'],
    reason: 'Tạm dừng đề xuất khóa học tại cơ sở',
  }, 'admin-1');

  assert.equal(result.ok, true);
  assert.equal(state().rolePermissions.find((item) => item.id === previous.id).effectiveTo, FIXED_NOW);
  assert.equal(state().rolePermissions.at(-1).effect, 'DENY');
  assert.equal(state().rolePermissions.at(-1).changedBy, 'admin-1');
  assert.equal(state().auditLogs[0].action, 'ROLE_PERMISSION_SET');
});

test('last active Admin cannot lose access management or approval decision authority', () => {
  const permissions = ['access.manage_role', 'approval.decide'];
  for (const permissionId of permissions) {
    const { bus, state } = runtime();
    const result = bus.dispatch('SET_ROLE_PERMISSION', {
      role: 'ADMIN', permissionId, effect: 'DENY', scopeType: 'ORGANIZATION', reason: 'Kiểm tra hàng rào an toàn',
    }, 'admin-1');
    assert.equal(result.ok, false);
    assert.equal(result.code, 'LAST_ADMIN_GUARD');
    assert.equal(state().rolePermissions.some((item) => item.role === 'ADMIN' && item.permissionId === permissionId && item.effect === 'DENY'), false);
  }
});

test('teacher request does not mutate canonical data until Admin approval', () => {
  const { bus, state } = runtimeWithTeacherAssignment();
  const submitted = bus.dispatch('SUBMIT_CHANGE_REQUEST', {
    resourceType: 'SESSION',
    operation: 'CREATE',
    baseVersion: 0,
    proposedSnapshot: sessionProposal(),
    reason: 'Bổ sung buổi ôn tập',
  }, 'teacher-1');

  assert.equal(submitted.ok, true);
  assert.equal(state().sessions.some((item) => item.id === submitted.provisionalResourceId), false);
  assert.equal(state().changeRequests.find((item) => item.id === submitted.requestId).status, 'SUBMITTED');
  assert.equal(state().domainEvents[0].type, 'CHANGE_REQUEST_SUBMITTED');
  assert.equal(state().auditLogs[0].action, 'CHANGE_REQUEST_SUBMITTED');

  const approved = bus.dispatch('REVIEW_CHANGE_REQUEST', {
    requestId: submitted.requestId,
    decision: 'APPROVE',
    note: 'Đủ điều kiện',
  }, 'admin-1');
  assert.equal(approved.ok, true);
  assert.equal(approved.status, 'APPROVED');
  assert.equal(state().sessions.some((item) => item.changeRequestId === submitted.requestId), true);
  assert.equal(state().changeRequests.find((item) => item.id === submitted.requestId).appliedAt, FIXED_NOW);
  assert.equal(state().auditLogs[0].action, 'CHANGE_REQUEST_APPROVED');
});

test('stale base version moves the request to conflicted without applying it', () => {
  const { bus, store, state } = runtimeWithTeacherAssignment();
  const current = state().sessions.find((item) => item.id === 'session-canonical');
  const submitted = bus.dispatch('SUBMIT_CHANGE_REQUEST', {
    resourceType: 'SESSION',
    operation: 'RESCHEDULE',
    resourceId: current.id,
    baseVersion: current.version,
    proposedSnapshot: { startsAt: '2026-09-10T11:00:00.000Z', endsAt: '2026-09-10T12:30:00.000Z', room: 'P.401' },
    reason: 'Đổi lịch theo lịch thi của học viên',
  }, 'teacher-1');
  assert.equal(submitted.ok, true);
  store.transact((draft) => {
    draft.sessions.find((item) => item.id === current.id).version += 1;
  });

  const reviewed = bus.dispatch('REVIEW_CHANGE_REQUEST', {
    requestId: submitted.requestId, decision: 'APPROVE', note: 'Đồng ý lịch mới',
  }, 'admin-1');
  assert.equal(reviewed.ok, true);
  assert.equal(reviewed.status, 'CONFLICTED');
  assert.equal(reviewed.applied, false);
  assert.equal(state().changeRequests.find((item) => item.id === submitted.requestId).status, 'CONFLICTED');
  assert.notEqual(state().sessions.find((item) => item.id === current.id).room, 'P.401');
});

test('rejection requires a review note and sender cannot review their own request', () => {
  const first = runtimeWithTeacherAssignment();
  const submitted = first.bus.dispatch('SUBMIT_CHANGE_REQUEST', {
    resourceType: 'SESSION', operation: 'CREATE', baseVersion: 0,
    proposedSnapshot: sessionProposal(), reason: 'Bổ sung buổi luyện nói',
  }, 'teacher-1');
  const rejected = first.bus.dispatch('REVIEW_CHANGE_REQUEST', {
    requestId: submitted.requestId, decision: 'REJECT', note: '',
  }, 'admin-1');
  assert.equal(rejected.ok, false);
  assert.equal(rejected.code, 'REVIEW_NOTE_REQUIRED');
  assert.equal(first.state().changeRequests.find((item) => item.id === submitted.requestId).status, 'SUBMITTED');

  const second = runtime();
  const selfSubmitted = second.bus.dispatch('SUBMIT_CHANGE_REQUEST', {
    resourceType: 'SESSION', operation: 'CREATE', baseVersion: 0,
    proposedSnapshot: sessionProposal(), reason: 'Kiểm tra quy tắc bốn mắt',
  }, 'admin-1');
  assert.equal(selfSubmitted.ok, true);
  const selfReviewed = second.bus.dispatch('REVIEW_CHANGE_REQUEST', {
    requestId: selfSubmitted.requestId, decision: 'APPROVE', note: 'Tự duyệt',
  }, 'admin-1');
  assert.equal(selfReviewed.ok, false);
  assert.equal(selfReviewed.code, 'SELF_REVIEW_FORBIDDEN');
});

test('approval is idempotent and withdrawal preserves the request history', () => {
  const first = runtimeWithTeacherAssignment();
  const submitted = first.bus.dispatch('SUBMIT_CHANGE_REQUEST', {
    resourceType: 'SESSION', operation: 'CREATE', baseVersion: 0,
    proposedSnapshot: sessionProposal(), reason: 'Bổ sung buổi củng cố',
  }, 'teacher-1');
  const approved = first.bus.dispatch('REVIEW_CHANGE_REQUEST', {
    requestId: submitted.requestId, decision: 'APPROVE', note: 'Đã kiểm tra lịch',
  }, 'admin-1');
  assert.equal(approved.ok, true);
  const auditCount = first.state().auditLogs.length;
  const sessionCount = first.state().sessions.length;
  const duplicate = first.bus.dispatch('REVIEW_CHANGE_REQUEST', {
    requestId: submitted.requestId, decision: 'APPROVE', note: 'Duyệt lại',
  }, 'admin-1');
  assert.equal(duplicate.ok, true);
  assert.equal(duplicate.idempotent, true);
  assert.equal(first.state().auditLogs.length, auditCount);
  assert.equal(first.state().sessions.length, sessionCount);

  const second = runtimeWithTeacherAssignment();
  const withdrawable = second.bus.dispatch('SUBMIT_CHANGE_REQUEST', {
    resourceType: 'SESSION', operation: 'CREATE', baseVersion: 0,
    proposedSnapshot: sessionProposal(), reason: 'Đề xuất cần rà soát thêm',
  }, 'teacher-1');
  const withdrawn = second.bus.dispatch('WITHDRAW_CHANGE_REQUEST', {
    requestId: withdrawable.requestId, reason: 'Cần điều chỉnh lại thời lượng',
  }, 'teacher-1');
  assert.equal(withdrawn.ok, true);
  assert.equal(second.state().changeRequests.find((item) => item.id === withdrawable.requestId).status, 'WITHDRAWN');
  assert.equal(second.state().auditLogs[0].action, 'CHANGE_REQUEST_WITHDRAWN');
});

module.exports = { FIXED_NOW, activeAssignment, render, runtime, runtimeWithTeacherAssignment, sessionProposal };
