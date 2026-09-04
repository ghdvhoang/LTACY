const assert = require('node:assert/strict');
const test = require('node:test');
const { loadYC, memoryStorage } = require('../helpers/load-runtime.cjs');

function context(YC, path = '/login') {
  return { state: YC.seed.createSeed(() => '2026-09-05T02:00:00.000Z'), actor: null, learnerId: 'student-canonical', path };
}

function controllerRuntime() {
  const YC = loadYC(['store', 'commands', 'actions']);
  const storage = memoryStorage();
  const store = YC.store.create({ storage, clock: () => '2026-09-05T02:00:00.000Z' });
  const location = { hash: '' };
  const controller = YC.actions.create({ store, bus: YC.commands.create(store), storage, location });
  return { YC, storage, location, controller };
}

test('login keeps the credential form and exactly four primary quick accounts', () => {
  const YC = loadYC(['seed', 'publicViews']);
  const html = YC.publicViews.render('/login', context(YC));

  assert.match(html, /data-form="login"/);
  assert.match(html, /name="identifier"/);
  assert.match(html, /name="secret"/);
  assert.equal((html.match(/data-primary-account/g) || []).length, 4);
  assert.match(html, /Giáo viên/);
  assert.match(html, /Trợ giảng/);
  assert.match(html, /Học viên/);
  assert.match(html, /Quản trị viên/);
  assert.doesNotMatch(html, /Admissions|Finance|Academic Manager|Student Service|Center Manager/);
});

test('credential login opens the same canonical student account', () => {
  const runtime = controllerRuntime();

  const result = runtime.controller.execute('credential-login', { identifier: 'HS6A001', secret: '123456' });

  assert.equal(result.ok, true);
  assert.equal(result.actorId, 'student-login-1');
  assert.equal(runtime.storage.getItem('yc.demo.actorId'), 'student-login-1');
  assert.equal(runtime.location.hash, '#/app/student/dashboard');
});

test('invalid credentials are rejected without changing the current actor', () => {
  const runtime = controllerRuntime();

  const result = runtime.controller.execute('credential-login', { identifier: 'HS6A001', secret: 'sai-mat-khau' });

  assert.equal(result.ok, false);
  assert.equal(result.code, 'INVALID_CREDENTIALS');
  assert.equal(runtime.storage.getItem('yc.demo.actorId'), null);
});

test('password recovery and OTP routes render Vietnamese recovery steps', () => {
  const YC = loadYC(['seed', 'router']);
  for (const [path, pattern] of [['/forgot-password', /Quên mật khẩu/], ['/verify-otp', /mã xác thực/i], ['/select-profile', /Chọn hồ sơ học viên/]]) {
    const html = YC.router.render(path, context(YC, path));
    assert.match(html, pattern, path);
    assert.doesNotMatch(html, /Không tìm thấy trang/);
  }
});

test('primary navigation and role labels are Vietnamese', () => {
  const YC = loadYC(['router']);
  assert.equal(YC.router.ROLE_LABELS.TEACHER, 'Giáo viên');
  assert.equal(YC.router.ROLE_LABELS.STUDENT, 'Học viên');
  assert.equal(YC.router.ROLE_LABELS.ADMIN, 'Quản trị viên');
  assert.deepEqual(Array.from(YC.router.NAV.STUDENT, (item) => item[0]), ['Học tập', 'Khóa học', 'Học bù', 'Kiểm tra', 'Tiến bộ']);
});

