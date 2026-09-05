const assert = require('node:assert/strict');
const test = require('node:test');
const { loadYC, memoryStorage } = require('../helpers/load-runtime.cjs');

const FIXED_NOW = '2026-09-05T02:00:00.000Z';

function render(path, role, mutate = () => {}) {
  const YC = loadYC(['seed', 'router']);
  const state = YC.seed.createSeed(() => FIXED_NOW);
  mutate(state);
  const actor = state.users.find((item) => item.role === role);
  return { YC, state, actor, html: YC.router.render(path, { state, actor, learnerId: 'student-canonical', path }) };
}

test('Admin permission matrix and approval queue expose real controls', () => {
  const roles = render('/app/admin/roles', 'ADMIN').html;
  assert.match(roles, /Ma trận quyền/);
  assert.match(roles, /data-form="role-permissions"/);
  assert.match(roles, /Quyền theo vai trò/);

  const roleDetail = render('/app/admin/roles/TEACHER/permissions', 'ADMIN').html;
  assert.match(roleDetail, /Quyền của Giáo viên/);
  assert.match(roleDetail, /session\.request_create/);
  assert.match(roleDetail, /Phạm vi/);

  const approvals = render('/app/admin/approvals', 'ADMIN').html;
  assert.match(approvals, /Hàng chờ phê duyệt/);
  assert.match(approvals, /So sánh thay đổi/);
});

test('Admin account access page manages scoped user overrides', () => {
  const html = render('/app/admin/users/teacher-1/access', 'ADMIN').html;
  assert.match(html, /Ngoại lệ quyền của Hoàng Yến/);
  assert.match(html, /data-form="user-permissions"/);
  assert.match(html, /Chi nhánh Quận 3/);
  assert.match(html, /Lý do/);
});

test('approval detail renders requester reason diff and decision form', () => {
  const result = render('/app/admin/approvals/request-ui-1', 'ADMIN', (state) => {
    state.changeRequests.push({
      id: 'request-ui-1', resourceType: 'SESSION', operation: 'CREATE', resourceId: null,
      provisionalResourceId: 'session-ui-1', baseVersion: 0, beforeSnapshot: null,
      proposedSnapshot: { classId: 'class-6a', room: 'P.304' },
      diff: [{ field: 'room', before: null, after: 'P.304' }], reason: 'Bổ sung buổi ôn tập',
      submittedBy: 'teacher-1', submittedAt: FIXED_NOW, status: 'SUBMITTED', revision: 1,
      reviewerId: null, reviewNote: null, reviewedAt: null, appliedAt: null, eventIds: [],
    });
  });
  assert.match(result.html, /Hoàng Yến/);
  assert.match(result.html, /Bổ sung buổi ôn tập/);
  assert.match(result.html, /Trước thay đổi/);
  assert.match(result.html, /Sau thay đổi/);
  assert.match(result.html, /data-form="review-change-request"/);
});

test('Teacher request workspace only shows requests submitted by the signed-in teacher', () => {
  const result = render('/app/teacher/requests', 'TEACHER', (state) => {
    const base = {
      resourceType: 'SESSION', operation: 'CREATE', resourceId: null, provisionalResourceId: null,
      baseVersion: 0, beforeSnapshot: null, proposedSnapshot: {}, diff: [], submittedAt: FIXED_NOW,
      status: 'SUBMITTED', revision: 1, reviewerId: null, reviewNote: null, reviewedAt: null, appliedAt: null, eventIds: [],
    };
    state.changeRequests.push(
      { ...base, id: 'mine', reason: 'Yêu cầu của Hoàng Yến', submittedBy: 'teacher-1' },
      { ...base, id: 'other', reason: 'Yêu cầu của giáo viên khác', submittedBy: 'teacher-2' },
    );
  });
  assert.match(result.html, /Yêu cầu của Hoàng Yến/);
  assert.doesNotMatch(result.html, /Yêu cầu của giáo viên khác/);
  assert.match(result.html, /data-form="withdraw-change-request"/);
});

test('Teacher is blocked from the Admin governance workspace by the app frame', () => {
  const { YC, state, actor } = render('/app/admin/roles', 'TEACHER');
  const html = YC.router.frame('/app/admin/roles', { state, actor, learnerId: 'student-canonical', path: '/app/admin/roles' });
  assert.match(html, /Không có quyền vào khu vực này/);
  assert.doesNotMatch(html, /data-form="role-permissions"/);
});

test('governance UI actions dispatch permission and approval commands as the signed-in actor', () => {
  const YC = loadYC(['seed', 'store', 'commands', 'actions']);
  const storage = memoryStorage({ [YC.actions.ACTOR_KEY]: 'admin-1' });
  const store = YC.store.create({ storage, clock: () => FIXED_NOW });
  const bus = YC.commands.create(store);
  const controller = YC.actions.create({ store, bus, storage });

  const result = controller.execute('set-user-permission', {
    userId: 'teacher-1', permissionId: 'site.edit', effect: 'ALLOW', scopeType: 'ORGANIZATION', scopeIds: [], reason: 'Phụ trách nội dung',
  });
  assert.equal(result.ok, true);
  assert.equal(store.getState().userPermissionOverrides.at(-1).grantedBy, 'admin-1');
});
