const assert = require('node:assert/strict');
const test = require('node:test');
const { loadYC } = require('../helpers/load-runtime.cjs');

function context(YC, role, path) {
  const state = YC.seed.createSeed(() => '2026-09-04T02:00:00.000Z');
  return {
    state,
    actor: state.users.find((item) => item.role === role) || null,
    path,
    learnerId: 'student-canonical',
  };
}

test('router resolves every documented route to meaningful content', () => {
  const YC = loadYC(['seed', 'router']);
  const paths = [
    '/', '/chuong-trinh', '/chuong-trinh/program-foundation', '/lich-hoc', '/phu-huynh-hoc-sinh', '/giai-phap-trung-tam', '/lien-he', '/login', '/demo-guide',
    '/app/admissions/dashboard', '/app/admissions/leads', '/app/admissions/leads/lead-canonical', '/app/admissions/placement', '/app/admissions/offers', '/app/admissions/renewals',
    '/app/finance/dashboard', '/app/finance/invoices', '/app/finance/payments',
    '/app/academic/dashboard', '/app/academic/curriculum', '/app/academic/teachers', '/app/academic/assignments', '/app/academic/moderation', '/app/academic/progress-reviews',
    '/app/teacher/dashboard', '/app/teacher/sessions', '/app/teacher/sessions/session-canonical', '/app/teacher/grading', '/app/teacher/workload', '/app/teacher/quality',
    '/app/service/dashboard', '/app/service/allocation', '/app/service/cases', '/app/service/make-up', '/app/service/transfers', '/app/service/substitutions',
    '/app/student/dashboard', '/app/student/course', '/app/student/remedial', '/app/student/assessments', '/app/student/progress',
    '/app/parent/dashboard', '/app/parent/attendance', '/app/parent/progress', '/app/parent/services', '/app/parent/tuition',
    '/app/manager/dashboard', '/app/manager/capacity', '/app/manager/quality', '/app/manager/retention',
    '/app/admin/dashboard', '/app/admin/access', '/app/admin/audit-logs', '/app/admin/events', '/app/admin/integrations', '/app/admin/settings',
  ];

  for (const path of paths) {
    const role = path.includes('/parent/') ? 'PARENT' : path.includes('/student/') ? 'STUDENT' : 'ADMIN';
    const html = YC.router.render(path, context(YC, role, path));
    assert.ok(html.length > 180, `${path} should render useful content`);
    assert.doesNotMatch(html, /coming soon|đang phát triển|>placeholder/i, `${path} should not be a placeholder`);
  }
});

test('learner course uses continue-learning and module affordances', () => {
  const YC = loadYC(['seed', 'router']);
  const html = YC.router.render('/app/student/course', context(YC, 'STUDENT', '/app/student/course'));
  assert.match(html, /Tiếp tục học/);
  assert.match(html, /course-module/);
  assert.match(html, /Past Simple/);
});

test('parent views never render restricted feedback text', () => {
  const YC = loadYC(['seed', 'router']);
  const ctx = context(YC, 'PARENT', '/app/parent/progress');
  const html = YC.router.render('/app/parent/progress', ctx);
  assert.match(html, /Linh có tiến bộ tốt/);
  assert.doesNotMatch(html, /Restricted demonstration record|quan sát thêm cách phân nhóm/);
});

test('unknown routes return a recoverable not-found view', () => {
  const YC = loadYC(['seed', 'router']);
  const html = YC.router.render('/khong-ton-tai', context(YC, 'ADMIN', '/khong-ton-tai'));
  assert.match(html, /Không tìm thấy trang/);
  assert.match(html, /#\//);
});

test('app frame blocks a mismatched workspace role without invoking the view', () => {
  const YC = loadYC(['seed', 'router']);
  const ctx = context(YC, 'ADMISSIONS', '/app/parent/progress');

  const html = YC.router.frame('/app/parent/progress', ctx);

  assert.match(html, /Không có quyền vào workspace này/);
  assert.match(html, /Chọn vai trò phù hợp/);
});
