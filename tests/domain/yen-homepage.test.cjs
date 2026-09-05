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

function render(path = '/', actorId = null) {
  const { YC, state } = runtime();
  const current = state();
  const actor = actorId ? current.users.find((item) => item.id === actorId || item.role === actorId) : null;
  return YC.router.render(path, { state: current, actor, learnerId: 'student-canonical', path });
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

test('Homepage renders all business sections from published CMS state', () => {
  const html = frame('/', 'VISITOR');
  for (const label of ['Chương trình nổi bật', 'Vì sao chọn Cô Yến', 'Cách bắt đầu', 'Lịch khai giảng', 'Tiến bộ có thể theo dõi', 'Đội ngũ giáo viên', 'Tin mới nhất', 'Sự kiện sắp tới']) assert.match(html, new RegExp(label));
  assert.match(html, /yen-home-hero\.png/);
  assert.match(html, /toggle-program-interest/);
  assert.match(html, /Cơ sở Quận 3/);
  assert.match(html, /Cô Hoàng Yến/);
  assert.doesNotMatch(html, /Bản nháp đang chờ hoàn thiện|Hướng dẫn demo|Bỏ qua/);
});

test('public detail routes render their published CMS records', () => {
  const cases = [
    ['/gioi-thieu', /Câu chuyện lớp học|Về Cô Yến/],
    ['/phuong-phap', /Phương pháp học/],
    ['/doi-ngu-giao-vien', /Cô Hoàng Yến/],
    ['/co-so', /Cơ sở Quận 3/],
    ['/co-so/co-so-quan-3', /120 Võ Văn Tần/],
    ['/lich-khai-giang', /Lớp đang mở|Tiếng Anh nền tảng 6A/],
    ['/chuong-trinh/tieng-anh-thieu-nhi', /Tiếng Anh thiếu nhi/],
    ['/tin-tuc/giup-con-tu-tin-noi-tieng-anh', /5 cách giúp con tự tin/],
    ['/su-kien/kiem-tra-dau-vao-thang-9', /Kiểm tra đầu vào và tư vấn lộ trình/],
    ['/goc-phu-huynh', /Phụ huynh/],
    ['/cau-hoi-thuong-gap', /Câu hỏi thường gặp/],
  ];
  for (const [path, expected] of cases) assert.match(render(path), expected, path);
  assert.doesNotMatch(render('/tin-tuc'), /Xây thói quen học tiếng Anh mỗi ngày/);
});

test('floating contact actions match configured published channels and do not auto-open chat', () => {
  const { YC, state } = runtime();
  const active = YC.publicContent.homepage(state(), null).contacts.length;
  const html = frame('/');
  assert.equal((html.match(/class="floating-contact"/g) || []).length, active);
  assert.match(html, /Hotline tư vấn/);
  assert.match(html, /Nhắn Zalo/);
  assert.doesNotMatch(html, /chat-panel[^>]*open|Chat ngay/);
});

test('signed-in visitor can register a CMS event and see it in one account', () => {
  const { YC, store, state } = runtime();
  const visitor = { id: 'visitor-test', role: 'VISITOR', name: 'Nguyễn Thu Hà', status: 'ACTIVE', savedProgramIds: [], registeredEventIds: [] };
  store.transact((draft) => draft.users.push(visitor));
  const bus = YC.commands.create(store);
  const result = bus.dispatch('REGISTER_PUBLIC_EVENT', { eventId: 'public-event-placement' }, visitor.id);
  assert.equal(result.ok, true);
  const current = state();
  const actor = current.users.find((item) => item.id === visitor.id);
  const html = YC.router.render('/tai-khoan', { state: current, actor, learnerId: 'student-canonical', path: '/tai-khoan' });
  assert.match(html, /Kiểm tra đầu vào và tư vấn lộ trình/);
});
