const assert = require('node:assert/strict');
const test = require('node:test');
const { loadYC } = require('../helpers/load-runtime.cjs');

const ROUTES = [
  ['STUDENT', '/app/student/dashboard'],
  ['STUDENT', '/app/student/course'],
  ['STUDENT', '/app/student/assessments'],
  ['PARENT', '/app/parent/dashboard'],
  ['PARENT', '/app/parent/services'],
  ['PARENT', '/app/parent/tuition'],
  ['TEACHER', '/app/teacher/dashboard'],
  ['TEACHER', '/app/teacher/sessions/session-canonical'],
  ['ACADEMIC_MANAGER', '/app/academic/dashboard'],
  ['ACADEMIC_MANAGER', '/app/academic/assignments'],
  ['STUDENT_SERVICE', '/app/service/dashboard'],
  ['STUDENT_SERVICE', '/app/service/allocation'],
  ['MANAGER', '/app/manager/dashboard'],
  ['MANAGER', '/app/manager/quality'],
  ['ADMIN', '/app/admin/dashboard'],
  ['ADMIN', '/app/admin/access'],
  ['ADMIN', '/app/admin/audit-logs'],
  ['ADMIN', '/app/admin/events'],
  ['ADMIN', '/app/admin/settings'],
  ['ADMIN', '/app/admin/remedial'],
  ['ADMIN', '/app/admin/reports'],
];

const ENGLISH_UI = /\b(?:My learning|Course progress|Learning objective|Required evidence|Assessment center|Next actions|Family portal|Teacher workspace|Session workbench|Academic Management|Decision queue|Policy snapshot|Teacher directory|Management signals|Quality signals|Admin console|System control|Active users|Domain events|Audit records|Demo integrations|System boundaries|Data health|Roles & scopes|Access register|Audit logs|Audit trail|Event stream|Demo settings|Reset controls|Service cases|Make-up bookings|Mock finance|No-seat cases|Ready to allocate|Candidate ranking|Not eligible|Attendance|Published & immutable)\b/i;

test('các workspace chính không còn tiêu đề và nhãn tiếng Anh', () => {
  const YC = loadYC(['seed', 'router']);
  const state = YC.seed.createSeed(() => '2026-09-05T02:00:00.000Z');
  for (const [role, path] of ROUTES) {
    const actor = state.users.find((item) => item.role === role);
    const html = YC.router.render(path, { state, actor, learnerId: 'student-canonical', path });
    const visibleText = html.replace(/<[^>]+>/g, ' ');
    assert.doesNotMatch(visibleText, ENGLISH_UI, path);
  }
});

test('trang lỗi và chặn quyền đều dùng tiếng Việt', () => {
  const YC = loadYC(['seed', 'router']);
  const state = YC.seed.createSeed(() => '2026-09-05T02:00:00.000Z');
  const student = state.users.find((item) => item.role === 'STUDENT');
  const notFound = YC.router.render('/duong-dan-khong-co', { state, actor: student, learnerId: 'student-canonical', path: '/duong-dan-khong-co' });
  const forbidden = YC.router.render('/app/admin/dashboard', { state, actor: student, learnerId: 'student-canonical', path: '/app/admin/dashboard' });
  assert.doesNotMatch(notFound, /Route not found|Demo Guide/i);
  assert.doesNotMatch(forbidden, /Scope guard/i);
});
