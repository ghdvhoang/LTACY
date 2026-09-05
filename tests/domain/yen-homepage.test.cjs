const assert = require('node:assert/strict');
const test = require('node:test');
const { loadYC, memoryStorage } = require('../helpers/load-runtime.cjs');

const FIXED_NOW = '2026-09-05T02:00:00.000Z';

function runtime() {
  const YC = loadYC(['seed', 'store', 'commands', 'router']);
  const store = YC.store.create({ storage: memoryStorage(), clock: () => FIXED_NOW });
  return { YC, store, state: () => store.getState() };
}

function frame(path = '/', actorId = null) {
  const { YC, state } = runtime();
  const current = state();
  const actor = actorId ? (current.users.find((item) => item.id === actorId || item.role === actorId) || (actorId === 'VISITOR' ? { id: 'visitor-test', role: 'VISITOR', name: 'Nguyễn Thu Hà', status: 'ACTIVE', savedProgramIds: [] } : null)) : null;
  return YC.router.frame(path, { state: current, actor, learnerId: 'student-canonical', path });
}

test('brand uses the Cô Yến logo and Vietnamese name', () => {
  const html = frame('/');
  assert.match(html, /yen-logo-horizontal\.png/);
  assert.match(html, /Lớp Tiếng Anh Cô Yến/);
  assert.doesNotMatch(html, /Yen Center/);
});

test('header renders published CMS groups as accessible dropdown menus', () => {
  const html = frame('/');
  for (const label of ['Về Cô Yến', 'Chương trình học', 'Cơ sở & lịch học', 'Tin tức & sự kiện', 'Góc phụ huynh']) assert.match(html, new RegExp(label.replace('&', '&amp;')));
  assert.match(html, /Tiếng Anh thiếu nhi/);
  assert.match(html, /data-action="toggle-public-menu"/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /aria-controls="public-menu-/);
  assert.match(html, /class="mobile-public-nav"/);
  assert.doesNotMatch(html, /Không được lộ|Bản nháp đang chờ hoàn thiện/);
});

test('header keeps the four account states distinct and removes demo guidance', () => {
  const anonymous = frame('/');
  assert.match(anonymous, /href="#\/login">Đăng nhập/);
  assert.match(anonymous, /href="#\/dang-ky">Đăng ký/);
  const visitor = frame('/', 'VISITOR');
  assert.match(visitor, /Tài khoản của tôi/);
  assert.doesNotMatch(visitor, /Khu vực học tập/);
  const student = frame('/', 'STUDENT');
  assert.match(student, /Khu vực học tập/);
  const staff = frame('/', 'ADMIN');
  assert.match(staff, /Khu vực làm việc/);
  assert.doesNotMatch(anonymous, /Hướng dẫn demo|Bỏ qua/);
});
