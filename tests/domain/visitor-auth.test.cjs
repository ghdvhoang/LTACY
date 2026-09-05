const assert = require('node:assert/strict');
const test = require('node:test');
const { loadYC, memoryStorage } = require('../helpers/load-runtime.cjs');

function createRuntime() {
  const YC = loadYC(['seed', 'store', 'commands', 'router', 'actions']);
  const storage = memoryStorage();
  const store = YC.store.create({ storage, clock: () => '2026-09-05T02:00:00.000Z' });
  const location = { hash: '' };
  const controller = YC.actions.create({ store, bus: YC.commands.create(store), storage, location });
  return { YC, storage, store, location, controller };
}

function renderFrame(YC, state, actor, path) {
  return YC.router.frame(path, { state, actor, learnerId: 'student-canonical', path });
}

function headerOf(html) {
  return html.split('</header>')[0];
}

test('homepage gives anonymous visitors clear login and registration actions without demo guidance', () => {
  const runtime = createRuntime();

  const html = renderFrame(runtime.YC, runtime.store.getState(), null, '/');

  assert.match(html, /href="#\/login"[^>]*>Đăng nhập</);
  assert.match(html, /href="#\/dang-ky"[^>]*>Đăng ký</);
  assert.doesNotMatch(html, /demo-guide|Hướng dẫn demo|Mở hướng dẫn|Xem demo vận hành/i);
  const removedGuide = runtime.YC.router.render('/demo-guide', { state: runtime.store.getState(), actor: null, learnerId: 'student-canonical', path: '/demo-guide' });
  assert.match(removedGuide, /Không tìm thấy trang/);
});

test('visitor registration creates a local account and opens the personal area', () => {
  const runtime = createRuntime();

  const result = runtime.controller.execute('register-visitor', {
    name: 'Nguyễn Thu Hà',
    email: 'thuha.moi@example.com',
    phone: '0909000001',
    secret: 'MatKhau123',
  });

  assert.equal(result.ok, true, result.message);
  const visitor = runtime.store.getState().users.find((item) => item.id === result.actorId);
  assert.equal(visitor.role, 'VISITOR');
  assert.deepEqual(Array.from(visitor.identifiers), ['thuha.moi@example.com', '0909000001']);
  assert.equal(runtime.storage.getItem('yc.demo.actorId'), visitor.id);
  assert.equal(runtime.location.hash, '#/tai-khoan');

  runtime.controller.execute('logout');
  const login = runtime.controller.execute('credential-login', { identifier: 'thuha.moi@example.com', secret: 'MatKhau123' });
  assert.equal(login.ok, true);
  assert.equal(login.actorId, visitor.id);
});

test('registration rejects duplicate email without adding another account', () => {
  const runtime = createRuntime();
  const payload = { name: 'Nguyễn Thu Hà', email: 'khach@example.com', phone: '0909000001', secret: 'MatKhau123' };

  assert.equal(runtime.controller.execute('register-visitor', payload).ok, true);
  runtime.controller.execute('logout');
  const duplicate = runtime.controller.execute('register-visitor', { ...payload, phone: '0909000002' });

  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.code, 'IDENTIFIER_EXISTS');
  assert.equal(runtime.store.getState().users.filter((item) => item.role === 'VISITOR').length, 1);
});

test('logged-in visitor can save interests, register an event and track a consultation', () => {
  const runtime = createRuntime();
  const registered = runtime.controller.execute('register-visitor', { name: 'Nguyễn Thu Hà', email: 'khach@example.com', phone: '0909000001', secret: 'MatKhau123' });

  assert.equal(runtime.controller.execute('toggle-program-interest', { programId: 'program-foundation' }).ok, true);
  assert.equal(runtime.controller.execute('register-public-event', { eventId: 'event-1' }).ok, true);
  assert.equal(runtime.controller.execute('submit-public-lead', { type: 'B2C', name: 'Nguyễn Thu Hà', studentName: 'Nguyễn Minh Anh', phone: '0909000001', email: 'khach@example.com', message: 'Cần tư vấn lớp A2.' }).ok, true);

  const state = runtime.store.getState();
  const visitor = state.users.find((item) => item.id === registered.actorId);
  const html = renderFrame(runtime.YC, state, visitor, '/tai-khoan');
  assert.match(html, /Tài khoản của tôi/);
  assert.match(html, /Tiếng Anh nền tảng/);
  assert.match(html, /Kiểm tra đầu vào miễn phí/);
  assert.doesNotMatch(html, /T\d{2}:\d{2}:\d{2}/);
  assert.match(html, /Cần tư vấn lớp A2/);
  assert.doesNotMatch(html, /Điểm danh|Bài học bù|Tiến độ học tập/);
});

test('public header distinguishes a visitor account from anonymous and learner sessions', () => {
  const runtime = createRuntime();
  const state = runtime.store.getState();
  const registered = runtime.controller.execute('register-visitor', { name: 'Nguyễn Thu Hà', email: 'khach@example.com', phone: '0909000001', secret: 'MatKhau123' });
  const visitor = runtime.store.getState().users.find((item) => item.id === registered.actorId);
  const learner = state.users.find((item) => item.role === 'STUDENT');

  const visitorHtml = headerOf(renderFrame(runtime.YC, runtime.store.getState(), visitor, '/'));
  assert.match(visitorHtml, /Tài khoản của tôi/);
  assert.match(visitorHtml, /data-action="logout"/);
  assert.doesNotMatch(visitorHtml, /href="#\/dang-ky"/);
  const visitorPage = renderFrame(runtime.YC, runtime.store.getState(), visitor, '/');
  assert.doesNotMatch(visitorPage, /href="#\/(?:login|dang-ky)"/);

  const learnerHtml = headerOf(renderFrame(runtime.YC, state, learner, '/'));
  assert.match(learnerHtml, /Khu vực học tập/);
  assert.doesNotMatch(learnerHtml, /Tài khoản của tôi/);
});

test('visitor cannot inherit an internal workspace navigation on a direct app route', () => {
  const runtime = createRuntime();
  const registered = runtime.controller.execute('register-visitor', { name: 'Nguyễn Thu Hà', email: 'khach@example.com', phone: '0909000001', secret: 'MatKhau123' });
  const visitor = runtime.store.getState().users.find((item) => item.id === registered.actorId);

  const html = renderFrame(runtime.YC, runtime.store.getState(), visitor, '/app/student/course');

  assert.match(html, /Không có quyền vào khu vực này/);
  assert.doesNotMatch(html, /href="#\/app\/(?:admin|student|teacher)\//);
  assert.doesNotMatch(html, /data-actor-id="admin-1"/);
  assert.match(html, /Tài khoản của tôi/);
});
