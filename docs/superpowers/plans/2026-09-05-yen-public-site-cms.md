# Yen Public Site and CMS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the responsive Lớp Tiếng Anh Cô Yến public website, dynamic navigation, homepage sections, brand assets, and a browser-only Admin CMS.

**Architecture:** Store public content revisions and site settings in schema v4. Public selectors expose only effective published content; Admin views edit drafts and publish audited revisions. Source pages use project assets, and the standalone builder embeds those assets as data URIs.

**Tech Stack:** Vanilla HTML/CSS/JavaScript IIFEs, PNG assets, localStorage, Node.js tests, Python standalone builder, browser QA.

**Spec:** `docs/superpowers/specs/2026-09-05-yen-governance-learning-operations-public-site-design.md`

## Global Constraints

- Requires the permission/approval foundation; CMS grants use `site.*` permissions.
- Brand text is “Lớp Tiếng Anh Cô Yến”; short label is “Cô Yến”.
- Use `source/assets/yen-logo-horizontal.png`; do not copy Apollo imagery or content.
- No demo-guide popup, walkthrough, or “Bỏ qua” CTA.
- Anonymous, Visitor, Student/Parent, and staff account states remain distinct.
- Public menus and Homepage cards use published state, not hard-coded program/branch names.
- Missing contact configuration hides the channel; no fake hotline.
- `OPEN-DEMO.html` must work through `file://` without network requests.

---

## File Structure

- Modify `scripts/build_standalone.py`: inline referenced project assets.
- Modify `source/index.html`: Yen metadata/favicon and brand title.
- Modify `source/modules/02-seed.js`: site settings and versioned CMS content.
- Create `source/modules/06-public-content.js`: published selectors and menu/homepage projections.
- Modify `source/modules/05-commands.js`: CMS draft/publish/archive commands.
- Create `source/modules/11-cms-views.js`: Admin content/settings screens.
- Modify `source/modules/08-public-views.js`: homepage and public content details.
- Modify `source/modules/13-router.js`: branded header/footer, dropdowns, routes, CMS nav.
- Modify `source/modules/14-actions.js`: dropdown/drawer/floating-contact/CMS form interactions.
- Modify `source/styles.css`: responsive editorial visual system.
- Add `source/assets/yen-home-hero.png`: original Yen hero artwork.
- Create `tests/domain/public-cms.test.cjs` and `tests/domain/yen-homepage.test.cjs`.
- Modify `tests/static/test_build.py` and verifier tests for embedded assets and no-network standalone output.

## Shared JavaScript Test Helpers

Define these helpers at the top of `tests/domain/yen-homepage.test.cjs` and reuse the same runtime shape in `public-cms.test.cjs`:

```js
const assert = require('node:assert/strict');
const test = require('node:test');
const { loadYC, memoryStorage } = require('../helpers/load-runtime.cjs');
const FIXED_NOW = '2026-09-05T02:00:00.000Z';

function runtime() {
  const YC = loadYC(['seed', 'store', 'commands', 'publicContent', 'router']);
  const store = YC.store.create({ storage: memoryStorage(), clock: () => FIXED_NOW });
  return { YC, store, bus: YC.commands.create(store), state: () => store.getState() };
}

function frame(path, actorId = null) {
  const { YC, state } = runtime();
  const current = state();
  const actor = actorId ? current.users.find((item) => item.id === actorId || item.role === actorId) : null;
  return YC.router.frame(path, { state: current, actor, learnerId: 'student-canonical', path });
}

function render(path, actorId = null) {
  const { YC, state } = runtime();
  const current = state();
  const actor = actorId ? current.users.find((item) => item.id === actorId || item.role === actorId) : null;
  return YC.router.render(path, { state: current, actor, learnerId: 'student-canonical', path });
}

function renderHome(actorId = null) {
  return render('/', actorId);
}

function activeContactCount(state) {
  return state.contactChannels.filter((item) => item.status === 'ACTIVE' && item.value).length;
}
```

### Task 1: Asset embedding and Yen brand primitives

**Files:**
- Modify: `scripts/build_standalone.py`
- Modify: `source/index.html`
- Modify: `source/modules/13-router.js`
- Modify: `tests/static/test_build.py`
- Test: `tests/domain/yen-homepage.test.cjs`

**Interfaces:**
- Produces Python `inline_asset_urls(root, html) -> str`.
- Produces JS `brand({light = false, compact = false}) -> string` rendering `<img>` with text fallback.

- [ ] **Step 1: Write failing builder and brand tests**

```python
def test_release_embeds_project_png_assets(self):
    with tempfile.TemporaryDirectory() as temp:
        fixture = Path(temp)
        self.make_fixture(fixture)
        assets = fixture / 'source' / 'assets'
        assets.mkdir()
        (assets / 'yen-logo-horizontal.png').write_bytes(b'\x89PNG\r\n\x1a\nfixture')
        index = fixture / 'source' / 'index.html'
        index.write_text(index.read_text(encoding='utf-8').replace('<div id="app"></div>', '<img src="./assets/yen-logo-horizontal.png"><div id="app"></div>'), encoding='utf-8')
        result = self.run_builder(fixture, '--release')
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        html = (fixture / 'OPEN-DEMO.html').read_text(encoding='utf-8')
        self.assertIn('data:image/png;base64,', html)
        self.assertNotIn('./assets/yen-logo-horizontal.png', html)
```

```js
test('brand uses the Cô Yến logo and Vietnamese name', () => {
  const html = frame('/');
  assert.match(html, /yen-logo-horizontal\.png/);
  assert.match(html, /Lớp Tiếng Anh Cô Yến/);
});
```

- [ ] **Step 2: Run tests and verify RED**

Run: `python3 -m unittest tests.static.test_build_pipeline`

Run: `node --test tests/domain/yen-homepage.test.cjs`

Expected: PNG is not embedded and old Yen Center brand remains.

- [ ] **Step 3: Implement data-URI embedding and brand renderer**

```python
def inline_asset_urls(root: Path, html: str) -> str:
    pattern = re.compile(r'(?P<quote>["\'])\./assets/(?P<name>[^"\']+)(?P=quote)')
    def replace(match):
        path = root / 'source' / 'assets' / match.group('name')
        mime = 'image/png' if path.suffix.lower() == '.png' else 'image/svg+xml'
        payload = base64.b64encode(path.read_bytes()).decode('ascii')
        return f'{match.group("quote")}data:{mime};base64,{payload}{match.group("quote")}'
    return pattern.sub(replace, html)
```

Update title, description, favicon, public header, footer, login intro, app sidebar and topbar brand copy.

- [ ] **Step 4: Run focused tests and build check**

Run: `python3 -m unittest tests.static.test_build_pipeline`

Run: `node --test tests/domain/yen-homepage.test.cjs tests/domain/auth-ui.test.cjs`

Run: `python3 scripts/build_standalone.py --release`

Expected: tests pass and standalone HTML contains embedded PNG data.

- [ ] **Step 5: Commit**

```bash
git add scripts/build_standalone.py source/index.html source/modules/13-router.js tests source/app.js source/app.v3.js source/yen-center-lms-demo.html OPEN-DEMO.html
git commit -m "feat: apply Cô Yến brand and embed assets"
```

### Task 2: CMS schema, selectors, and commands

**Files:**
- Modify: `source/modules/02-seed.js`
- Create: `source/modules/06-public-content.js`
- Modify: `source/modules/05-commands.js`
- Create: `tests/domain/public-cms.test.cjs`

**Interfaces:**
- Collections: `siteSettings`, `navigationGroups`, `navigationItems`, `heroBanners`, `publicProgramProfiles`, `publicBranchProfiles`, `publicTeacherProfiles`, `articles`, `articleCategories`, `publicEvents`, `staticPages`, `contactChannels`.
- Selectors: `published(type, state, at)`, `publicNavigation(state)`, `homepage(state, actor)`.
- Commands: `SAVE_SITE_SETTINGS`, `CREATE_CONTENT_DRAFT`, `SUBMIT_SITE_CONTENT`, `PUBLISH_SITE_CONTENT`, `ARCHIVE_SITE_CONTENT`.

- [ ] **Step 1: Write failing CMS lifecycle tests**

```js
test('public selectors expose published content and hide drafts', () => {
  const { YC, state: current } = runtime();
  const state = current();
  const draft = { id: 'article-draft', type: 'ARTICLE', status: 'DRAFT', effectiveFrom: state.currentAt };
  state.articles.push(draft);
  assert.equal(YC.publicContent.published('articles', state).some((item) => item.id === draft.id), false);
});

test('Admin publishing creates a revision and audit record', () => {
  const { bus, state } = runtime();
  const result = bus.dispatch('PUBLISH_SITE_CONTENT', { collection: 'articles', contentId: 'article-draft' }, 'admin-1');
  assert.equal(result.ok, true);
  assert.equal(state().articles.find((item) => item.id === 'article-draft').status, 'PUBLISHED');
  assert.equal(state().auditLogs[0].action, 'SITE_CONTENT_PUBLISHED');
});
```

Add scheduled effective window, archive, rollback-as-new-revision, non-Admin Change Request, contact-channel hiding, and public-teacher opt-in tests.

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test tests/domain/public-cms.test.cjs`

Expected: CMS collections/selectors/commands missing.

- [ ] **Step 3: Implement CMS domain**

Seed enough published content to render every Homepage section. `published()` must require `status === 'PUBLISHED'`, `effectiveFrom <= at`, and absent/greater `effectiveTo`. Program navigation is derived from published public profiles linked to internal `programId`.

- [ ] **Step 4: Run focused tests**

Run: `node --test tests/domain/public-cms.test.cjs tests/domain/visitor-auth.test.cjs`

Expected: CMS lifecycle and Visitor behavior pass.

- [ ] **Step 5: Commit**

```bash
git add source/modules/02-seed.js source/modules/05-commands.js source/modules/06-public-content.js tests/domain/public-cms.test.cjs
git commit -m "feat: add browser-based public content management"
```

### Task 3: Admin CMS workspace

**Files:**
- Create: `source/modules/11-cms-views.js`
- Modify: `source/modules/13-router.js`
- Modify: `source/modules/14-actions.js`
- Modify: `source/styles.css`
- Modify: `tests/domain/public-cms.test.cjs`

**Interfaces:**
- Routes: `/app/admin/site-content`, `/app/admin/site-content/:contentType`, `/app/admin/site-settings`.
- Forms/actions: `site-settings`, `site-content-draft`, `publish-site-content`, `archive-site-content`.

- [ ] **Step 1: Write failing CMS route/form tests**

```js
test('Admin CMS lists content types and publishes real records', () => {
  const html = render('/app/admin/site-content', 'ADMIN');
  assert.match(html, /Quản trị website/);
  assert.match(html, /Banner|Chương trình|Tin tức|Sự kiện/);
  assert.match(html, /data-action="publish-site-content"/);
});
```

- [ ] **Step 2: Run test and verify RED**

Run: `node --test tests/domain/public-cms.test.cjs`

Expected: CMS route missing.

- [ ] **Step 3: Implement CMS views and controller actions**

Render content status, effective window, revision, author, preview link, publish/archive controls, and settings for brand/contact channels. Permission-gate every control with `site.*` policy checks.

- [ ] **Step 4: Run UI and router tests**

Run: `node --test tests/domain/public-cms.test.cjs tests/domain/views-router.test.cjs tests/domain/v2-route-parity.test.cjs`

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add source/modules/11-cms-views.js source/modules/13-router.js source/modules/14-actions.js source/styles.css tests/domain/public-cms.test.cjs
git commit -m "feat: add Admin website content workspace"
```

### Task 4: Dynamic accessible header and navigation

**Files:**
- Modify: `source/modules/13-router.js`
- Modify: `source/modules/14-actions.js`
- Modify: `source/styles.css`
- Modify: `tests/domain/yen-homepage.test.cjs`

**Interfaces:**
- Public menu groups: Về Cô Yến, Chương trình học, Cơ sở & lịch học, Tin tức & sự kiện, Góc phụ huynh.
- Actions: `toggle-public-menu`, `close-public-menus`, `toggle-mobile-nav`.

- [ ] **Step 1: Write failing account/menu tests**

```js
test('header renders dynamic dropdowns and correct account actions', () => {
  const anonymous = frame('/', null);
  assert.match(anonymous, /Về Cô Yến/);
  assert.match(anonymous, /Đăng nhập/);
  assert.match(anonymous, /Đăng ký/);
  const visitor = frame('/', 'VISITOR');
  assert.match(visitor, /Tài khoản của tôi/);
  assert.doesNotMatch(visitor, /Khu vực học tập/);
});
```

Assert ARIA expanded/controls, published programs, mobile drawer, Student/staff workspace labels, and absence of demo guide.

- [ ] **Step 2: Run test and verify RED**

Run: `node --test tests/domain/yen-homepage.test.cjs`

Expected: grouped dropdown markup and dynamic items missing.

- [ ] **Step 3: Implement header, dropdown, drawer, and account states**

Use buttons with `aria-expanded`, panels with stable IDs, Escape/outside-click close, and CSS hover only as enhancement. Keep Login/Register visible without opening a menu.

- [ ] **Step 4: Run header regressions**

Run: `node --test tests/domain/yen-homepage.test.cjs tests/domain/visitor-auth.test.cjs tests/domain/auth-ui.test.cjs`

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add source/modules/13-router.js source/modules/14-actions.js source/styles.css tests/domain/yen-homepage.test.cjs
git commit -m "feat: add dynamic accessible public navigation"
```

### Task 5: Original hero asset and full Homepage

**Files:**
- Create: `source/assets/yen-home-hero.png`
- Modify: `source/modules/08-public-views.js`
- Modify: `source/styles.css`
- Modify: `tests/domain/yen-homepage.test.cjs`

**Interfaces:**
- Consumes `YC.publicContent.homepage(state, actor)`.
- Produces hero plus ten published-state sections from spec §13.4.

- [ ] **Step 1: Write failing Homepage section tests**

```js
test('Homepage renders all business sections from published state', () => {
  const html = renderHome('VISITOR');
  for (const label of ['Chương trình nổi bật', 'Vì sao chọn Cô Yến', 'Cách bắt đầu', 'Lịch khai giảng', 'Đội ngũ giáo viên', 'Tin mới nhất', 'Sự kiện sắp tới']) {
    assert.match(html, new RegExp(label));
  }
  assert.match(html, /toggle-program-interest/);
  assert.doesNotMatch(html, /Bỏ qua|Hướng dẫn demo/);
});
```

- [ ] **Step 2: Run test and verify RED**

Run: `node --test tests/domain/yen-homepage.test.cjs`

Expected: new sections and hero asset missing.

- [ ] **Step 3: Generate the original Yen hero artwork**

Use the built-in image generation path with this exact production prompt:

```text
Use case: ads-marketing
Asset type: transparent website hero illustration for Lớp Tiếng Anh Cô Yến
Primary request: an original Vietnamese female English teacher encouraging a Vietnamese school-age learner in a warm modern classroom, expressive friendly interaction, optimistic educational energy
Style: polished editorial cutout photography/illustration blend, natural faces, brand-ready
Composition: subjects on the right, generous negative space on the left, wide landscape
Color palette: deep navy, confident red, small golden accents matching the supplied Yen logo
Background: genuinely transparent alpha
Constraints: no text, no logo, no watermark, no Apollo uniforms or recognizable Apollo assets
```

Verify with `sips -g hasAlpha source/assets/yen-home-hero.png`; expected `yes`.

- [ ] **Step 4: Implement state-driven Homepage and responsive CSS**

Hero CTAs link to `/chuong-trinh` and `/lich-khai-giang`. Schedule availability uses capacity selector including make-up reservations. News uses one featured record and a side list. Missing CMS sections collapse without empty decorative gaps.

- [ ] **Step 5: Run tests, build, and commit**

Run: `node --test tests/domain/yen-homepage.test.cjs tests/domain/visitor-auth.test.cjs`

Run: `python3 scripts/build_standalone.py --release`

```bash
git add source/assets/yen-home-hero.png source/modules/08-public-views.js source/styles.css tests/domain/yen-homepage.test.cjs source/app.js source/app.v3.js source/yen-center-lms-demo.html OPEN-DEMO.html
git commit -m "feat: redesign the Cô Yến Homepage"
```

### Task 6: Public details, contact actions, and final QA

**Files:**
- Modify: `source/modules/08-public-views.js`
- Modify: `source/modules/13-router.js`
- Modify: `source/modules/14-actions.js`
- Modify: `source/styles.css`
- Modify: `tests/domain/yen-homepage.test.cjs`
- Modify: `source/validation/verify_prototype.py`
- Modify: `tests/static/test_release_docs.py`

**Interfaces:**
- Public detail routes from spec §14.1.
- Floating actions read active `contactChannels` only.

- [ ] **Step 1: Write failing public-route and contact tests**

```js
test('public detail routes render published CMS records and configured contacts only', () => {
  const { state } = runtime();
  assert.match(render('/gioi-thieu'), /Cô Yến/);
  assert.match(render('/tin-tuc/news-1'), /Tin mới nhất|Khai giảng/);
  const html = render('/');
  assert.equal((html.match(/floating-contact/g) || []).length, activeContactCount(state()));
});
```

- [ ] **Step 2: Run test and verify RED**

Run: `node --test tests/domain/yen-homepage.test.cjs`

Expected: detail routes/contact projection missing.

- [ ] **Step 3: Implement routes, footer, floating actions, and empty-state behavior**

Use CMS records for About, Method, Teachers, Branch, Article, Event, Parent Corner, FAQ, Contact, Privacy, and Terms. Do not show a floating chat panel automatically. Preserve current B2C/B2B/support form persistence.

- [ ] **Step 4: Run complete automated verification**

Run: `node --test tests/domain/*.test.cjs`

Run: `python3 -m unittest discover -s tests/static -p 'test_*.py'`

Run: `python3 scripts/build_standalone.py --release --check`

Run: `python3 source/validation/verify_prototype.py --static-only`

Expected: zero failures and verifier `PASS`.

- [ ] **Step 5: Run browser QA and commit**

Open `OPEN-DEMO.html` at 1440×900 and 390×844. Exercise header menus, anonymous/Visitor/Student/Admin states, lead form, Admin CMS, approval flow, Course/Class/Session trace, remedial trace, and console. Expected: no blocking overflow, inaccessible menu, dead CTA, or console error.

```bash
git add source tests scripts docs OPEN-DEMO.html
git commit -m "feat: complete Yen public site and CMS"
```

## Plan Verification

```bash
node --test tests/domain/*.test.cjs
python3 -m unittest discover -s tests/static -p 'test_*.py'
python3 scripts/build_standalone.py --release --check
python3 source/validation/verify_prototype.py --static-only
git status --short
```

Expected: zero failures, verifier `PASS`, current generated artifacts, and a clean worktree.
