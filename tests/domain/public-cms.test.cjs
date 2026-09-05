const assert = require('node:assert/strict');
const test = require('node:test');
const { loadYC, memoryStorage } = require('../helpers/load-runtime.cjs');

const FIXED_NOW = '2026-09-05T02:00:00.000Z';

function runtime() {
  const YC = loadYC(['seed', 'store', 'commands', 'publicContent']);
  const store = YC.store.create({ storage: memoryStorage(), clock: () => FIXED_NOW });
  return { YC, store, bus: YC.commands.create(store), state: () => store.getState() };
}

test('CMS seed covers every public content collection and homepage projection', () => {
  const { YC, state } = runtime();
  const current = state();
  for (const collection of ['siteSettings', 'navigationGroups', 'navigationItems', 'heroBanners', 'publicProgramProfiles', 'publicBranchProfiles', 'publicTeacherProfiles', 'articles', 'articleCategories', 'publicEvents', 'staticPages', 'contactChannels']) {
    assert.ok(Array.isArray(current[collection]), `${collection} must be seeded`);
  }
  const homepage = YC.publicContent.homepage(current, null);
  assert.ok(homepage.hero);
  assert.ok(homepage.programs.length >= 3);
  assert.ok(homepage.branches.length >= 2);
  assert.ok(homepage.teachers.length >= 1);
  assert.ok(homepage.articles.length >= 1);
  assert.ok(homepage.events.length >= 1);
});

test('public selectors expose only published content inside its effective window', () => {
  const { YC, state } = runtime();
  const current = state();
  current.articles.push(
    { id: 'article-draft', contentKey: 'draft', title: 'Không được lộ', status: 'DRAFT', effectiveFrom: FIXED_NOW },
    { id: 'article-future', contentKey: 'future', title: 'Chưa tới giờ', status: 'PUBLISHED', effectiveFrom: '2026-09-06T02:00:00.000Z' },
    { id: 'article-expired', contentKey: 'expired', title: 'Đã hết hạn', status: 'PUBLISHED', effectiveFrom: '2026-09-01T02:00:00.000Z', effectiveTo: FIXED_NOW },
  );
  const visible = YC.publicContent.published('articles', current, FIXED_NOW);
  assert.equal(visible.some((item) => item.id === 'article-draft'), false);
  assert.equal(visible.some((item) => item.id === 'article-future'), false);
  assert.equal(visible.some((item) => item.id === 'article-expired'), false);
});

test('public navigation is derived from effective CMS groups, items and program profiles', () => {
  const { YC, state } = runtime();
  const navigation = YC.publicContent.publicNavigation(state());
  assert.ok(navigation.some((group) => group.label === 'Chương trình học'));
  assert.ok(navigation.flatMap((group) => group.items).some((item) => item.label === 'Tiếng Anh thiếu nhi'));
  assert.equal(navigation.flatMap((group) => group.items).some((item) => item.status === 'DRAFT'), false);
});

test('teacher opt-in and active contact configuration control public visibility', () => {
  const { YC, state } = runtime();
  const current = state();
  current.publicTeacherProfiles.push({ id: 'teacher-private', contentKey: 'private-teacher', name: 'Giáo viên riêng tư', publicOptIn: false, status: 'PUBLISHED', effectiveFrom: FIXED_NOW });
  current.contactChannels.push({ id: 'contact-empty', contentKey: 'empty', type: 'HOTLINE', label: 'Không có số', value: '', status: 'PUBLISHED', effectiveFrom: FIXED_NOW });
  const homepage = YC.publicContent.homepage(current, null);
  assert.equal(homepage.teachers.some((item) => item.id === 'teacher-private'), false);
  assert.equal(homepage.contacts.some((item) => item.id === 'contact-empty'), false);
});

test('Admin creates, publishes and archives an audited content revision', () => {
  const { bus, state } = runtime();
  const created = bus.dispatch('CREATE_SITE_CONTENT_DRAFT', {
    collection: 'articles', contentKey: 'news-cms-test', title: 'Tin mới từ CMS', summary: 'Nội dung kiểm thử', slug: 'tin-moi-cms', effectiveFrom: FIXED_NOW,
  }, 'admin-1');
  assert.equal(created.ok, true);
  const published = bus.dispatch('PUBLISH_SITE_CONTENT', { collection: 'articles', contentId: created.contentId }, 'admin-1');
  assert.equal(published.ok, true);
  assert.equal(state().articles.find((item) => item.id === created.contentId).status, 'PUBLISHED');
  assert.equal(state().auditLogs[0].action, 'SITE_CONTENT_PUBLISHED');
  const archived = bus.dispatch('ARCHIVE_SITE_CONTENT', { collection: 'articles', contentId: created.contentId, reason: 'Hết chiến dịch' }, 'admin-1');
  assert.equal(archived.ok, true);
  assert.equal(state().articles.find((item) => item.id === created.contentId).status, 'ARCHIVED');
  assert.equal(state().auditLogs[0].action, 'SITE_CONTENT_ARCHIVED');
});

test('editor submission waits for Admin and cannot self-publish', () => {
  const { bus, state } = runtime();
  assert.equal(bus.dispatch('SET_ROLE_PERMISSION', { role: 'ACADEMIC_MANAGER', permissionId: 'site.edit', effect: 'ALLOW', scopeType: 'ORGANIZATION', reason: 'Cho phép biên tập nội dung' }, 'admin-1').ok, true);
  assert.equal(bus.dispatch('SET_ROLE_PERMISSION', { role: 'ACADEMIC_MANAGER', permissionId: 'site.submit', effect: 'ALLOW', scopeType: 'ORGANIZATION', reason: 'Cho phép gửi duyệt nội dung' }, 'admin-1').ok, true);
  const created = bus.dispatch('CREATE_SITE_CONTENT_DRAFT', { collection: 'articles', contentKey: 'editor-news', title: 'Bài của biên tập viên', slug: 'bai-bien-tap', effectiveFrom: FIXED_NOW }, 'academic-1');
  assert.equal(created.ok, true);
  const submitted = bus.dispatch('SUBMIT_SITE_CONTENT', { collection: 'articles', contentId: created.contentId, reason: 'Đã kiểm tra nội dung' }, 'academic-1');
  assert.equal(submitted.ok, true);
  assert.equal(state().articles.find((item) => item.id === created.contentId).status, 'SUBMITTED');
  assert.equal(state().changeRequests.find((item) => item.id === submitted.requestId).status, 'SUBMITTED');
  const forbidden = bus.dispatch('PUBLISH_SITE_CONTENT', { collection: 'articles', contentId: created.contentId }, 'academic-1');
  assert.equal(forbidden.ok, false);
  assert.equal(forbidden.code, 'FORBIDDEN');
  assert.equal(bus.dispatch('PUBLISH_SITE_CONTENT', { collection: 'articles', contentId: created.contentId }, 'admin-1').ok, true);
});

test('rollback clones a published record as a new draft revision', () => {
  const { bus, state } = runtime();
  const source = state().articles.find((item) => item.status === 'PUBLISHED');
  const rollback = bus.dispatch('CREATE_SITE_CONTENT_DRAFT', { collection: 'articles', sourceContentId: source.id }, 'admin-1');
  assert.equal(rollback.ok, true);
  const draft = state().articles.find((item) => item.id === rollback.contentId);
  assert.equal(draft.status, 'DRAFT');
  assert.equal(draft.contentKey, source.contentKey);
  assert.equal(draft.revision, source.revision + 1);
  assert.equal(draft.sourceRevisionId, source.id);
});

test('site settings require configuration permission and write audit history', () => {
  const { bus, state } = runtime();
  const denied = bus.dispatch('SAVE_SITE_SETTINGS', { hotline: '1900 0000' }, 'teacher-1');
  assert.equal(denied.ok, false);
  const saved = bus.dispatch('SAVE_SITE_SETTINGS', { centerName: 'Lớp Tiếng Anh Cô Yến', tagline: 'Học chắc, nói tự tin' }, 'admin-1');
  assert.equal(saved.ok, true);
  assert.equal(state().siteSettings[0].tagline, 'Học chắc, nói tự tin');
  assert.equal(state().auditLogs[0].action, 'SITE_SETTINGS_SAVED');
});
