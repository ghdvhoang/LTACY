const assert = require('node:assert/strict');
const test = require('node:test');
const { loadYC, memoryStorage } = require('../helpers/load-runtime.cjs');

function context(YC, role, path) {
  const state = YC.seed.createSeed(() => '2026-09-05T02:00:00.000Z');
  return { state, actor: state.users.find((item) => item.role === role), learnerId: 'student-canonical', path };
}

test('course surfaces share the same curriculum from public catalog to learner player', () => {
  const YC = loadYC(['seed', 'router']);
  const publicHtml = YC.router.render('/chuong-trinh/program-foundation', context(YC, 'STUDENT', '/chuong-trinh/program-foundation'));
  const learnerHtml = YC.router.render('/app/student/course/item-past-simple-video', context(YC, 'STUDENT', '/app/student/course/item-past-simple-video'));

  assert.match(publicHtml, /English Foundation 6/);
  assert.match(publicHtml, /A2\.1/);
  assert.match(learnerHtml, /Past Simple in context/);
  assert.match(learnerHtml, /Mục tiêu học tập/);
  assert.doesNotMatch(learnerHtml, /Không tìm thấy trang/);
});

test('teacher content studio exposes courses, lessons, videos and question bank', () => {
  const YC = loadYC(['seed', 'router']);
  const ctx = context(YC, 'TEACHER', '/app/teacher/content');

  for (const path of ['/app/teacher/content', '/app/teacher/courses', '/app/teacher/question-bank', '/app/teacher/quizzes', '/app/teacher/content/preview/lesson-past-simple']) {
    const html = YC.router.render(path, { ...ctx, path });
    assert.match(html, /Kho nội dung|Xưởng nội dung|Xem trước bài học/, path);
    assert.doesNotMatch(html, /Không tìm thấy trang/, path);
  }
  assert.match(YC.router.render('/app/teacher/content', ctx), /Tạo bản nháp mẫu/);
});

test('admin course inventory restores every legacy content route', () => {
  const YC = loadYC(['seed', 'router']);
  const ctx = context(YC, 'ADMIN', '/app/admin/courses');

  for (const path of ['/app/admin/courses', '/app/admin/lessons', '/app/admin/videos', '/app/admin/questions', '/app/admin/quizzes']) {
    const html = YC.router.render(path, { ...ctx, path });
    assert.match(html, /Quản trị khóa học/);
    assert.match(html, /English Foundation 6/);
    assert.doesNotMatch(html, /Không tìm thấy trang/);
  }
});

test('creating a content draft persists it with audit and event evidence', () => {
  const YC = loadYC(['seed', 'store', 'commands']);
  const store = YC.store.create({ storage: memoryStorage(), clock: () => '2026-09-05T02:00:00.000Z' });
  const bus = YC.commands.create(store);

  const result = bus.dispatch('CREATE_CONTENT_DRAFT', { courseVersionId: 'course-v6', lessonTemplateId: 'lesson-past-simple', title: 'Luyện nói cuối bài' }, 'teacher-1');

  assert.equal(result.ok, true, result.message);
  assert.equal(store.getState().contentDrafts.length, 1);
  assert.equal(store.getState().contentDrafts[0].status, 'DRAFT');
  assert.equal(store.getState().contentDrafts[0].createdBy, 'teacher-1');
  assert.equal(store.getState().auditLogs[0].action, 'CONTENT_DRAFT_CREATED');
  assert.equal(store.getState().domainEvents[0].type, 'CONTENT_DRAFT_CREATED');
});

test('published course versions remain immutable', () => {
  const YC = loadYC(['seed', 'store', 'commands']);
  const store = YC.store.create({ storage: memoryStorage(), clock: () => '2026-09-05T02:00:00.000Z' });
  const result = YC.commands.create(store).dispatch('PUBLISH_COURSE_VERSION', { courseVersionId: 'course-v6' }, 'academic-1');

  assert.equal(result.ok, false);
  assert.equal(result.code, 'COURSE_VERSION_IMMUTABLE');
  assert.equal(store.getState().courseVersions.find((item) => item.id === 'course-v6').immutable, true);
});

