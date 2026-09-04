const assert = require('node:assert/strict');
const test = require('node:test');
const { loadYC, memoryStorage } = require('../helpers/load-runtime.cjs');

const PUBLIC_ROUTES = ['/tin-tuc', '/su-kien', '/tai-lieu', '/faq', '/dieu-khoan-su-dung', '/chinh-sach-bao-mat', '/403', '/404'];
const STUDENT_ROUTES = ['/app/student/lessons', '/app/student/notifications'];
const TEACHER_ROUTES = ['/app/teacher/notifications'];
const ADMIN_ROUTES = ['/app/admin/users', '/app/admin/students', '/app/admin/teachers', '/app/admin/classes', '/app/admin/enrollments', '/app/admin/schedules', '/app/admin/sessions', '/app/admin/remedial', '/app/admin/contacts', '/app/admin/reports', '/app/admin/notifications', '/app/admin/demo'];

function renderContext(YC, role, path) {
  const state = YC.seed.createSeed(() => '2026-09-05T02:00:00.000Z');
  return { state, actor: state.users.find((item) => item.role === role), learnerId: 'student-canonical', path };
}

test('every legacy public and workspace route remains available', () => {
  const YC = loadYC(['seed', 'router']);
  for (const path of PUBLIC_ROUTES) {
    const html = YC.router.render(path, renderContext(YC, 'STUDENT', path));
    assert.ok(html.length > 180, path);
    if (path !== '/404') assert.doesNotMatch(html, /Không tìm thấy trang/, path);
  }
  for (const [role, paths] of [['STUDENT', STUDENT_ROUTES], ['TEACHER', TEACHER_ROUTES], ['ADMIN', ADMIN_ROUTES]]) {
    for (const path of paths) {
      const html = YC.router.render(path, renderContext(YC, role, path));
      assert.ok(html.length > 180, path);
      assert.doesNotMatch(html, /Không tìm thấy trang/, path);
    }
  }
});

test('B2C, B2B and support forms use persisted submissions', () => {
  const YC = loadYC(['seed', 'router']);
  for (const [path, type] of [['/phu-huynh-hoc-sinh', 'B2C'], ['/giai-phap-trung-tam', 'B2B'], ['/lien-he', 'SUPPORT']]) {
    const html = YC.router.render(path, renderContext(YC, 'STUDENT', path));
    assert.match(html, new RegExp(`data-form="public-lead"[^>]*data-type="${type}"`), path);
  }
});

test('public submission is stored and immediately visible in admin contact inbox', () => {
  const YC = loadYC(['store', 'commands', 'actions']);
  const storage = memoryStorage();
  const store = YC.store.create({ storage, clock: () => '2026-09-05T02:00:00.000Z' });
  const controller = YC.actions.create({ store, bus: YC.commands.create(store), storage, location: { hash: '' } });

  const result = controller.execute('submit-public-lead', { type: 'B2C', name: 'Nguyễn Thu Hà', studentName: 'Nguyễn Minh Anh', phone: '0901000002', email: 'ha@example.com', message: 'Cần tư vấn lớp A2.' });

  assert.equal(result.ok, true, result.message);
  assert.match(result.code, /^YC-B2C-/);
  assert.ok(store.getState().leads.some((item) => item.code === result.code && item.status === 'NEW'));
  const admin = store.getState().users.find((item) => item.id === 'admin-1');
  const html = YC.router.render('/app/admin/contacts', { state: store.getState(), actor: admin, learnerId: 'student-canonical', path: '/app/admin/contacts' });
  assert.match(html, /Nguyễn Thu Hà/);
  assert.match(html, /Cần tư vấn lớp A2/);
});

test('admin can add learner, update lead status, read notifications and record mock sync', () => {
  const YC = loadYC(['store', 'commands']);
  const store = YC.store.create({ storage: memoryStorage(), clock: () => '2026-09-05T02:00:00.000Z' });
  const bus = YC.commands.create(store);
  store.transact((state) => state.notifications.push({ id: 'notice-test', userId: 'admin-1', title: 'Test', body: 'Test', read: false, createdAt: state.currentAt }));

  assert.equal(bus.dispatch('CREATE_LEARNER', { code: 'HSNEW01', name: 'Học viên Mới', phone: '0909000000', classId: 'class-5c' }, 'admin-1').ok, true);
  assert.equal(store.getState().learners.find((item) => item.code === 'HSNEW01').classId, 'class-5c');
  assert.equal(bus.dispatch('UPDATE_LEAD_STATUS', { leadId: 'lead-b2b', status: 'CONTACTED' }, 'admin-1').ok, true);
  assert.equal(bus.dispatch('MARK_NOTIFICATIONS_READ', {}, 'admin-1').ok, true);
  assert.equal(store.getState().notifications.find((item) => item.id === 'notice-test').read, true);
  assert.equal(bus.dispatch('RUN_MOCK_SYNC', {}, 'admin-1').ok, true);
  assert.equal(store.getState().auditLogs[0].action, 'MOCK_SYNC_COMPLETED');
});

test('legacy CSV exports produce the requested dataset', () => {
  const YC = loadYC(['store', 'commands', 'actions']);
  const storage = memoryStorage();
  const store = YC.store.create({ storage, clock: () => '2026-09-05T02:00:00.000Z' });
  const downloads = [];
  const controller = YC.actions.create({ store, bus: YC.commands.create(store), storage, location: { hash: '' }, onDownload(name, content) { downloads.push({ name, content }); } });

  for (const type of ['audit', 'students', 'contacts', 'remedial', 'sessions']) assert.equal(controller.execute('export-csv', { type }).ok, true, type);
  assert.equal(downloads.length, 5);
  assert.ok(downloads.every((item) => item.content.startsWith('\uFEFF')));
  assert.ok(downloads.some((item) => /hoc-vien/.test(item.name) && /HS6A001/.test(item.content)));
});

