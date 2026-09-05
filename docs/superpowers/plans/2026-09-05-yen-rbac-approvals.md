# Yen RBAC and Approval Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hard-coded role capabilities with configurable permissions and add an audited Admin approval queue for teacher-originated master-data changes.

**Architecture:** Keep the existing normalized browser store. Add a static permission catalog loaded before the seed, persist role grants and user overrides in schema v4, evaluate scope through `YC.policy`, and represent pending mutations as versioned Change Requests that are applied atomically by Admin commands.

**Tech Stack:** Vanilla JavaScript IIFEs, browser localStorage, Node.js `node:test`, Python static tests, standalone HTML builder.

**Spec:** `docs/superpowers/specs/2026-09-05-yen-governance-learning-operations-public-site-design.md`

## Global Constraints

- Frontend-only; no network, backend, or server authorization.
- Preserve the canonical learner `student-canonical` and all v2 routes/interactions.
- User override `DENY` precedes user `ALLOW`, then role permission; default deny.
- Teacher Course/Class/Session master-data mutations create Change Requests and do not alter canonical data before Admin approval.
- Keep at least one active Admin with access-management and approval-decision permissions.
- Every RBAC/approval mutation records actor, time, reason, event, and audit.
- All user-facing copy is Vietnamese.

---

## File Structure

- Create `source/modules/02-permissions.js`: permission definitions, default grants, legacy aliases, command-permission metadata.
- Modify `source/modules/02-seed.js`: schema v4 collections and version fields.
- Modify `source/modules/03-store.js`: v3→v4 migration and storage keys.
- Modify `source/modules/04-policy.js`: dynamic permission and scope evaluation.
- Create `source/modules/05-approval.js`: Change Request builders, diffs, transitions, stale checks.
- Modify `source/modules/05-commands.js`: RBAC and approval commands.
- Create `source/modules/11-governance-views.js`: permission matrix, user override, approval queue, request detail.
- Modify `source/modules/13-router.js`: Admin/Teacher governance navigation and route access.
- Modify `source/modules/14-actions.js`: form/action dispatch for governance screens.
- Create `tests/domain/rbac-approval.test.cjs`: domain and command coverage.
- Create `tests/domain/governance-ui.test.cjs`: route and form coverage.
- Modify `tests/domain/store-policy.test.cjs`: schema v4 and migration assertions.

## Shared JavaScript Test Helpers

Define these exact helpers at the top of `tests/domain/rbac-approval.test.cjs` and reuse them in the snippets below:

```js
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
  return { id: `assignment-${teacherProfileId}-${classId}`, teacherProfileId, classId, role: 'PRIMARY', startsAt: '2026-01-01T00:00:00.000Z', endsAt: '2027-01-01T00:00:00.000Z', workloadMinutes: 720, status: 'ACTIVE' };
}

function runtimeWithTeacherAssignment() {
  const result = runtime();
  result.store.transact((draft) => { draft.teacherAssignments.push(activeAssignment('teacher-profile-1', 'class-6a')); });
  return result;
}

function sessionProposal() {
  return { provisionalId: 'session-proposed-1', classId: 'class-6a', lessonTemplateId: 'lesson-past-simple', startsAt: '2026-09-08T11:00:00.000Z', endsAt: '2026-09-08T12:30:00.000Z', room: 'P.304', mode: 'OFFLINE', status: 'PLANNED', version: 1 };
}

function render(path, role) {
  const YC = loadYC(['seed', 'router']);
  const state = YC.seed.createSeed(() => FIXED_NOW);
  return YC.router.render(path, { state, actor: state.users.find((item) => item.role === role), learnerId: 'student-canonical', path });
}
```

### Task 1: Schema v4 and v3 migration

**Files:**
- Create: `source/modules/02-permissions.js`
- Modify: `source/modules/02-seed.js`
- Modify: `source/modules/03-store.js`
- Modify: `tests/domain/store-policy.test.cjs`

**Interfaces:**
- Produces: `YC.permissions.definitions`, `YC.permissions.roleDefaults`, `YC.permissions.legacyAliases`, `YC.store.migrateV3(state)`.
- Data: `permissionDefinitions[]`, `rolePermissions[]`, `userPermissionOverrides[]`, `changeRequests[]`, record-level `version`.

- [ ] **Step 1: Write failing schema and migration tests**

```js
test('seed v4 contains configurable permission and approval collections', () => {
  const YC = loadYC(['seed', 'permissions']);
  const state = YC.seed.createSeed(clock);
  assert.equal(state.schemaVersion, 4);
  assert.ok(state.permissionDefinitions.some((item) => item.id === 'approval.decide'));
  assert.ok(state.rolePermissions.some((item) => item.role === 'TEACHER' && item.permissionId === 'session.request_create'));
  assert.deepEqual(state.userPermissionOverrides, []);
  assert.deepEqual(state.changeRequests, []);
});

test('store migrates a persisted v3 payload without losing learners', () => {
  const YC = loadYC(['seed', 'store']);
  const v3 = YC.seed.createSeed(clock);
  v3.schemaVersion = 3;
  delete v3.permissionDefinitions;
  const storage = memoryStorage({ [YC.store.V3_STORAGE_KEY]: JSON.stringify(v3) });
  const state = YC.store.create({ storage, clock }).getState();
  assert.equal(state.schemaVersion, 4);
  assert.equal(state.learners.find((item) => item.id === 'student-canonical').name, 'Nguyễn Minh Anh');
  assert.equal(state.migrationNotice.code, 'V3_MIGRATED');
});
```

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test tests/domain/store-policy.test.cjs`

Expected: failures for schema `3`, missing permission collections, and missing `V3_STORAGE_KEY`.

- [ ] **Step 3: Implement catalog, seed, and migration**

```js
const definitions = Object.freeze([
  { id: 'access.manage_role', domain: 'ACCESS', action: 'MANAGE_ROLE', riskLevel: 'HIGH' },
  { id: 'access.manage_user_override', domain: 'ACCESS', action: 'MANAGE_USER_OVERRIDE', riskLevel: 'HIGH' },
  { id: 'approval.view', domain: 'APPROVAL', action: 'VIEW', riskLevel: 'MEDIUM' },
  { id: 'approval.decide', domain: 'APPROVAL', action: 'DECIDE', riskLevel: 'HIGH' },
  { id: 'course.request_create', domain: 'COURSE', action: 'REQUEST_CREATE', riskLevel: 'MEDIUM' },
  { id: 'class.request_create', domain: 'CLASS', action: 'REQUEST_CREATE', riskLevel: 'MEDIUM' },
  { id: 'session.request_create', domain: 'SESSION', action: 'REQUEST_CREATE', riskLevel: 'MEDIUM' },
]);
```

Implement every permission ID listed in spec §6.3, clone defaults into each seed, add `version: 1` to Course/Class/Session records, use `yen-center-lms-fe-state-v4`, read the old v3 key, and migrate by filling new collections rather than resetting state.

- [ ] **Step 4: Run focused and full domain tests**

Run: `node --test tests/domain/store-policy.test.cjs`

Expected: all tests pass with schema v4 assertions.

Run: `node --test tests/domain/*.test.cjs`

Expected: all existing tests pass after updating only explicit schema-version expectations.

- [ ] **Step 5: Commit**

```bash
git add source/modules/02-permissions.js source/modules/02-seed.js source/modules/03-store.js tests/domain/store-policy.test.cjs
git commit -m "feat: add schema v4 permission foundation"
```

### Task 2: Dynamic policy evaluator

**Files:**
- Modify: `source/modules/04-policy.js`
- Create: `tests/domain/rbac-approval.test.cjs`

**Interfaces:**
- Consumes: `state.rolePermissions`, `state.userPermissionOverrides`, `YC.permissions.legacyAliases`.
- Produces: `YC.policy.can(actor, permissionId, resource, state): boolean`, `YC.policy.explain(...): {allowed, source, permissionId, scope}`.

- [ ] **Step 1: Write failing precedence and scope tests**

```js
test('user deny overrides role allow and assigned-class scope is enforced', () => {
  const { YC, state: current } = runtime();
  const state = current();
  const teacher = state.users.find((item) => item.id === 'teacher-1');
  state.teacherAssignments.push(activeAssignment('teacher-profile-1', 'class-6a'));
  assert.equal(YC.policy.can(teacher, 'session.request_create', { classId: 'class-6a' }, state), true);
  assert.equal(YC.policy.can(teacher, 'session.request_create', { classId: 'class-7b' }, state), false);
  state.userPermissionOverrides.push({ id: 'deny-1', userId: teacher.id, permissionId: 'session.request_create', effect: 'DENY', scopeType: 'CLASS', scopeIds: ['class-6a'], effectiveFrom: state.currentAt, effectiveTo: '2027-01-01T00:00:00.000Z' });
  assert.equal(YC.policy.can(teacher, 'session.request_create', { classId: 'class-6a' }, state), false);
});
```

Also assert expired overrides are ignored, inactive users are denied, branch scope is enforced, and legacy `CLASS_VIEW` still resolves.

- [ ] **Step 2: Run test and verify RED**

Run: `node --test tests/domain/rbac-approval.test.cjs`

Expected: `session.request_create` does not use dynamic grants yet.

- [ ] **Step 3: Implement resolver and explanation result**

```js
function explain(actor, requestedId, resource = {}, state) {
  const permissionId = legacyAliases[requestedId] || requestedId;
  if (!actor || actor.status !== 'ACTIVE') return deny(permissionId, 'INACTIVE_USER');
  const override = effectiveOverride(actor.id, permissionId, resource, state);
  if (override?.effect === 'DENY') return deny(permissionId, 'USER_DENY', override.scopeType);
  if (override?.effect === 'ALLOW') return allow(permissionId, 'USER_ALLOW', override.scopeType);
  const roleGrant = effectiveRoleGrant(actor.role, permissionId, resource, state);
  return roleGrant ? allow(permissionId, 'ROLE', roleGrant.scopeType) : deny(permissionId, 'DEFAULT_DENY');
}
```

Keep `visibleFeedback` behavior and route its Teacher access check through the new permission resolver.

- [ ] **Step 4: Run policy and regression tests**

Run: `node --test tests/domain/rbac-approval.test.cjs tests/domain/store-policy.test.cjs`

Expected: precedence, scope, legacy aliases, and feedback visibility pass.

- [ ] **Step 5: Commit**

```bash
git add source/modules/04-policy.js tests/domain/rbac-approval.test.cjs
git commit -m "feat: evaluate permissions by role user and scope"
```

### Task 3: RBAC mutation commands and last-Admin guard

**Files:**
- Modify: `source/modules/05-commands.js`
- Modify: `tests/domain/rbac-approval.test.cjs`

**Interfaces:**
- Produces commands `SET_ROLE_PERMISSION`, `SET_USER_PERMISSION_OVERRIDE`, `REVOKE_USER_PERMISSION_OVERRIDE`.
- Payloads include `permissionId`, `effect`, `scopeType`, `scopeIds`, effective dates, and non-empty `reason`.

- [ ] **Step 1: Write failing RBAC command tests**

```js
test('Admin grants and denies a user permission with audit evidence', () => {
  const { bus, state } = runtime();
  const result = bus.dispatch('SET_USER_PERMISSION_OVERRIDE', {
    userId: 'teacher-1', permissionId: 'class.request_create', effect: 'ALLOW',
    scopeType: 'BRANCH', scopeIds: ['branch-q3'], reason: 'Phụ trách mở lớp tháng 9'
  }, 'admin-1');
  assert.equal(result.ok, true);
  assert.equal(state().userPermissionOverrides.at(-1).grantedBy, 'admin-1');
  assert.equal(state().auditLogs[0].action, 'USER_PERMISSION_OVERRIDE_SET');
});
```

Add tests that a Teacher is forbidden, a missing reason fails, and removal of the last Admin decision/access grant fails with `LAST_ADMIN_GUARD`.

- [ ] **Step 2: Run test and verify RED**

Run: `node --test tests/domain/rbac-approval.test.cjs`

Expected: unknown RBAC commands.

- [ ] **Step 3: Implement commands**

Use `YC.policy.can(actor, 'access.manage_role', { organizationId }, draft)` instead of role-name checks. End the old override with `effectiveTo = nowIso()` before inserting its replacement. Append one domain event and one audit record per successful mutation.

- [ ] **Step 4: Run focused tests**

Run: `node --test tests/domain/rbac-approval.test.cjs`

Expected: all RBAC mutation and guard tests pass.

- [ ] **Step 5: Commit**

```bash
git add source/modules/05-commands.js tests/domain/rbac-approval.test.cjs
git commit -m "feat: manage role and account permission overrides"
```

### Task 4: Change Request state machine and atomic Admin decision

**Files:**
- Create: `source/modules/05-approval.js`
- Modify: `source/modules/05-commands.js`
- Modify: `tests/domain/rbac-approval.test.cjs`

**Interfaces:**
- Produces: `YC.approval.buildRequest(input, context)`, `YC.approval.diff(before, after)`, `YC.approval.assertReviewable(request, state)`.
- Produces commands: `SUBMIT_CHANGE_REQUEST`, `REVIEW_CHANGE_REQUEST`, `WITHDRAW_CHANGE_REQUEST`.

- [ ] **Step 1: Write failing lifecycle tests**

```js
test('teacher request does not mutate canonical data until Admin approval', () => {
  const { bus, state } = runtimeWithTeacherAssignment();
  const submitted = bus.dispatch('SUBMIT_CHANGE_REQUEST', {
    resourceType: 'SESSION', operation: 'CREATE', baseVersion: 0,
    proposedSnapshot: sessionProposal(), reason: 'Bổ sung buổi ôn tập'
  }, 'teacher-1');
  assert.equal(submitted.ok, true);
  assert.equal(state().sessions.some((item) => item.id === submitted.provisionalResourceId), false);
  const approved = bus.dispatch('REVIEW_CHANGE_REQUEST', { requestId: submitted.requestId, decision: 'APPROVE', note: 'Đủ điều kiện' }, 'admin-1');
  assert.equal(approved.ok, true);
  assert.equal(state().sessions.some((item) => item.changeRequestId === submitted.requestId), true);
});
```

Add stale `baseVersion` → `CONFLICTED`, rejection-note required, duplicate approval idempotent, sender self-review denied, and events/audit assertions.

- [ ] **Step 2: Run test and verify RED**

Run: `node --test tests/domain/rbac-approval.test.cjs`

Expected: approval service and commands missing.

- [ ] **Step 3: Implement request builder and decision transaction**

```js
const REQUEST_TRANSITIONS = Object.freeze({
  DRAFT: ['SUBMITTED', 'WITHDRAWN'],
  SUBMITTED: ['IN_REVIEW', 'APPROVED', 'CHANGES_REQUESTED', 'REJECTED', 'CONFLICTED', 'WITHDRAWN'],
  IN_REVIEW: ['APPROVED', 'CHANGES_REQUESTED', 'REJECTED', 'CONFLICTED'],
  CHANGES_REQUESTED: ['SUBMITTED', 'WITHDRAWN'],
});
```

Whitelist resource operation handlers; initial `SESSION.CREATE` applies a validated session snapshot. Store `beforeSnapshot`, `proposedSnapshot`, deterministic field diff, `revision`, reviewer metadata, `appliedAt`, and `changeRequestId` on the created record.

- [ ] **Step 4: Run focused and full domain tests**

Run: `node --test tests/domain/rbac-approval.test.cjs`

Run: `node --test tests/domain/*.test.cjs`

Expected: lifecycle tests and all legacy domain tests pass.

- [ ] **Step 5: Commit**

```bash
git add source/modules/05-approval.js source/modules/05-commands.js tests/domain/rbac-approval.test.cjs
git commit -m "feat: add audited Admin approval workflow"
```

### Task 5: Governance screens and actions

**Files:**
- Create: `source/modules/11-governance-views.js`
- Modify: `source/modules/13-router.js`
- Modify: `source/modules/14-actions.js`
- Create: `tests/domain/governance-ui.test.cjs`
- Modify: `source/styles.css`

**Interfaces:**
- Routes: `/app/admin/roles`, `/app/admin/roles/:role/permissions`, `/app/admin/users/:userId/access`, `/app/admin/approvals`, `/app/admin/approvals/:requestId`, `/app/teacher/requests`.
- Actions: `set-role-permission`, `set-user-permission`, `review-change-request`, `withdraw-change-request`.

- [ ] **Step 1: Write failing route/form tests**

```js
test('Admin permission matrix and approval detail expose real controls', () => {
  const roles = render('/app/admin/roles', 'ADMIN');
  assert.match(roles, /Ma trận quyền/);
  assert.match(roles, /data-form="role-permissions"/);
  const approvals = render('/app/admin/approvals', 'ADMIN');
  assert.match(approvals, /Hàng chờ phê duyệt/);
  assert.match(approvals, /So sánh thay đổi/);
});
```

Assert Teacher sees only their requests and cannot render Admin screens.

- [ ] **Step 2: Run test and verify RED**

Run: `node --test tests/domain/governance-ui.test.cjs`

Expected: routes return not-found or old access view.

- [ ] **Step 3: Implement views, navigation, and controller wiring**

Render permissions grouped by domain with explicit `ALLOW`, `DENY`, and inherited labels. Render approval cards with requester, reason, status, before/after values, warnings, and decision form requiring a note for reject/changes-requested.

- [ ] **Step 4: Run UI, static, and verifier tests**

Run: `node --test tests/domain/governance-ui.test.cjs tests/domain/views-router.test.cjs tests/domain/v2-route-parity.test.cjs`

Run: `python3 -m unittest discover -s tests/static -p 'test_*.py'`

Run: `python3 source/validation/verify_prototype.py --static-only`

Expected: all commands exit 0.

- [ ] **Step 5: Build and commit**

```bash
python3 scripts/build_standalone.py --release
git add source tests OPEN-DEMO.html
git commit -m "feat: add permission and approval workspaces"
```

## Plan Verification

Run after Task 5:

```bash
node --test tests/domain/*.test.cjs
python3 -m unittest discover -s tests/static -p 'test_*.py'
python3 scripts/build_standalone.py --release --check
python3 source/validation/verify_prototype.py --static-only
```

Expected: zero failures, current generated artifacts, verifier `PASS`.
