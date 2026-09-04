# Language Center Full-Journey Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a zero-install standalone frontend demo that connects the complete Yen Center learner, teacher, academic, service, commercial, parent, and renewal journeys through one normalized state.

**Architecture:** Plain browser JavaScript is split into deterministic classic-script modules attached to `window.YC`. A command layer owns state transitions, events, audit, and notifications; views consume selectors and never mutate state. A dependency-free Python build concatenates modules and produces both source and standalone artifacts.

**Tech Stack:** HTML5, CSS3, browser JavaScript, Node.js built-in test runner, Python 3 build/static verification, localStorage.

**Spec:** `docs/superpowers/specs/2026-09-04-language-center-full-journey-frontend-design.md`

## Global Constraints

- The deliverable must open directly through `OPEN-DEMO.html` without installation or network access.
- It represents one Yen Center organization with multiple branches and does not implement tenant management.
- All backend, auth, payment, messaging, and provider behavior is labelled mock/demo.
- Coursera is an interaction-design reference only; no Coursera brand assets or pixel copying.
- All state-changing UI actions dispatch commands; views do not mutate state directly.
- Every high-impact decision records rule, evidence, actor, reason when overridden, and audit.
- The complete canonical journey and every role dashboard use the same normalized state.
- Semantic state colors stay independent from role/workspace accent colors.

---

### Task 1: Dependency-Free Module and Build Foundation

**Files:**
- Create: `tests/static/test_build.py`
- Create: `scripts/build_standalone.py`
- Create: `source/modules/00-namespace.js`
- Create: `source/modules/01-utils.js`
- Modify: `source/index.html`
- Generate: `source/app.js`
- Generate: `source/yen-center-lms-demo.html`
- Generate: `OPEN-DEMO.html`

**Interfaces:**
- Produces: `window.YC`, `YC.define(name, value)`, `YC.require(name)`, `YC.utils.escapeHtml(value)`, `YC.utils.uid(prefix)`.
- Produces: `python3 scripts/build_standalone.py --check` for stale-artifact verification.

- [ ] **Step 1: Write the failing build tests**

```python
def test_module_manifest_is_in_deterministic_order(self):
    manifest = build_standalone.module_files(ROOT)
    self.assertEqual(manifest[0].name, "00-namespace.js")
    self.assertEqual([item.name for item in manifest], sorted(item.name for item in manifest))

def test_check_reports_stale_generated_artifacts(self):
    result = subprocess.run(
        [sys.executable, "scripts/build_standalone.py", "--check"],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
```

- [ ] **Step 2: Run the static test and confirm it fails because the build module does not exist**

Run: `python3 -m unittest discover -s tests/static -p 'test_build.py' -v`  
Expected: FAIL with import or missing-file error for `scripts/build_standalone.py`.

- [ ] **Step 3: Implement the namespace, utilities, manifest, and standalone builder**

The builder reads `source/modules/*.js` in filename order, writes their concatenation to `source/app.js`, injects `styles.css` and the bundle into a standalone HTML template, and supports `--check` without writing.

- [ ] **Step 4: Update `source/index.html` to load the generated bundle and retain skip-link/app-root semantics**

Use `<script src="app.js"></script>` without module mode so the source and standalone variants behave consistently under `file://`.

- [ ] **Step 5: Run build/static checks**

Run: `python3 scripts/build_standalone.py`  
Run: `python3 -m unittest discover -s tests/static -p 'test_build.py' -v`  
Expected: generated files are current and all tests PASS.

- [ ] **Step 6: Commit the foundation**

```bash
git add scripts source tests/static OPEN-DEMO.html
git commit -m "build: add modular standalone frontend pipeline"
```

### Task 2: Normalized Seed, Store, Policy, and Selectors

**Files:**
- Create: `tests/helpers/load-runtime.cjs`
- Create: `tests/domain/store-policy.test.cjs`
- Create: `source/modules/02-seed.js`
- Create: `source/modules/03-store.js`
- Create: `source/modules/04-policy.js`
- Create: `source/modules/06-selectors.js`

**Interfaces:**
- Produces: `YC.seed.createSeed(clock): StateV3`.
- Produces: `YC.store.create({storage, clock})` with `getState()`, `replace(next)`, `reset()`, `transact(mutator)`.
- Produces: `YC.policy.can(actor, capability, resource, state)` and `YC.policy.visibleFeedback(actor, records, state)`.
- Produces: `YC.selectors.byId(collection, id)`, `roleHome(role)`, `journey(state)`, `metrics(state, role)`.

- [ ] **Step 1: Write failing tests for seed referential integrity and role scope**

```javascript
test('every class references a branch and immutable course version', () => {
  const state = YC.seed.createSeed(fixedClock);
  for (const cohort of state.classes) {
    assert.ok(state.branches.some((item) => item.id === cohort.branchId));
    assert.ok(state.courseVersions.some((item) => item.id === cohort.courseVersionId && item.status === 'PUBLISHED'));
  }
});

test('parent selectors exclude internal and safeguarding feedback', () => {
  const state = YC.seed.createSeed(fixedClock);
  const parent = state.users.find((item) => item.role === 'PARENT');
  const visible = YC.policy.visibleFeedback(parent, state.feedbackRecords, state);
  assert.ok(visible.every((item) => ['PARENT', 'LEARNER_PARENT'].includes(item.visibility)));
});
```

- [ ] **Step 2: Run domain tests and verify RED**

Run: `node --test tests/domain/store-policy.test.cjs`  
Expected: FAIL because the seed/store/policy modules are missing.

- [ ] **Step 3: Implement a deterministic v3 seed covering every collection in the spec**

Seed the canonical lead, two branches, three programs, three course versions, three classes, qualified/ineligible teachers, timetable conflicts, one no-seat case, one substitution case, homework and assessment examples, progress reports, parent relationships, commercial records, events, and audit history.

- [ ] **Step 4: Implement storage and v2 reset migration**

`load()` returns valid v3 state or a fresh seed. A detected v2 payload sets a `migrationNotice` and seeds v3 rather than guessing missing relationships.

- [ ] **Step 5: Implement policy and selector functions**

Enforce role, branch, class, assignment, effective-date, learner ownership, parent relationship, and feedback visibility checks.

- [ ] **Step 6: Run domain and build tests**

Run: `node --test tests/domain/store-policy.test.cjs`  
Run: `python3 scripts/build_standalone.py`  
Expected: PASS.

- [ ] **Step 7: Commit the data foundation**

```bash
git add source/modules tests
git commit -m "feat: add normalized language center demo state"
```

### Task 3: Admissions, Placement, Commerce, and Allocation Commands

**Files:**
- Create: `tests/domain/admissions-commerce.test.cjs`
- Create: `source/modules/05-commands.js`

**Interfaces:**
- Produces: `YC.commands.create(runtime)` returning `dispatch(name, payload, actorId)`.
- Produces commands: `CONTACT_LEAD`, `BOOK_PLACEMENT`, `RECORD_PLACEMENT`, `RELEASE_PLACEMENT`, `CREATE_OFFER`, `SEND_OFFER`, `ACCEPT_OFFER`, `ISSUE_INVOICE`, `RECORD_MOCK_PAYMENT`, `ALLOCATE_CLASS`, `TRANSFER_ENROLLMENT`, `CREATE_RENEWAL`, `ACCEPT_RENEWAL`.
- Every result is `{ok: true, eventIds, message}` or `{ok: false, code, message}`.

- [ ] **Step 1: Write failing tests for the admission-to-allocation journey**

```javascript
test('paid offer can allocate the canonical learner and create an active enrollment', () => {
  const runtime = createRuntime();
  advanceCanonicalToPayment(runtime);
  const result = runtime.dispatch('ALLOCATE_CLASS', {leadId: 'lead-canonical', classId: 'class-6a'} , 'service-1');
  assert.equal(result.ok, true);
  assert.equal(runtime.state().enrollments.find((item) => item.learnerId === 'student-canonical').status, 'ACTIVE');
});

test('allocation returns ranked alternatives when the requested class has no seat', () => {
  const runtime = createRuntime();
  const result = runtime.dispatch('ALLOCATE_CLASS', {leadId: 'lead-no-seat', classId: 'class-full'}, 'service-1');
  assert.equal(result.ok, false);
  assert.equal(result.code, 'NO_SEAT');
  assert.ok(result.alternatives.length > 0);
});
```

- [ ] **Step 2: Verify RED**

Run: `node --test tests/domain/admissions-commerce.test.cjs`  
Expected: FAIL because dispatch and commands are undefined.

- [ ] **Step 3: Implement atomic command dispatch and side-effect helpers**

Each successful command validates the current state, mutates a cloned draft, appends a domain event, appends an audit record, creates owner notifications, and commits once.

- [ ] **Step 4: Implement admission, placement, offer, invoice, payment, allocation, transfer, and renewal transitions**

Mock payments must include `provider: 'DEMO_LEDGER'` and `mode: 'MOCK'`. Transfers must close the old enrollment and preserve historical attendance/results.

- [ ] **Step 5: Run focused and aggregate domain tests**

Run: `node --test tests/domain/admissions-commerce.test.cjs tests/domain/store-policy.test.cjs`  
Expected: PASS.

- [ ] **Step 6: Commit the first vertical slice**

```bash
git add source/modules/05-commands.js tests/domain/admissions-commerce.test.cjs
git commit -m "feat: connect admissions commerce and class allocation"
```

### Task 4: Curriculum, Teacher Operations, Session Delivery, and Exceptions

**Files:**
- Create: `tests/domain/academic-teacher-ops.test.cjs`
- Modify: `source/modules/05-commands.js`
- Modify: `source/modules/06-selectors.js`

**Interfaces:**
- Produces commands: `PUBLISH_COURSE_VERSION`, `PROPOSE_TEACHER_ASSIGNMENT`, `ACCEPT_TEACHER_ASSIGNMENT`, `CONFIRM_SESSION`, `START_SESSION`, `COMPLETE_SESSION`, `CORRECT_ATTENDANCE`, `REQUEST_SUBSTITUTION`, `CONFIRM_SUBSTITUTE`, `MARK_HANDOVER_READY`, `CLOSE_SUBSTITUTION`, `BOOK_MAKE_UP`.
- Produces selectors: `teacherEligibility(state, teacherId, classId)`, `teacherWorkload(state, teacherId)`, `sessionWorkbench(state, sessionId, actorId)`, `scheduleConflicts(state, request)`.

- [ ] **Step 1: Write failing teacher eligibility, conflict, evidence, and substitution tests**

```javascript
test('ineligible teacher cannot be proposed for a young learner class', () => {
  const runtime = createRuntime();
  const result = runtime.dispatch('PROPOSE_TEACHER_ASSIGNMENT', {teacherId: 'teacher-ineligible', classId: 'class-6a'}, 'academic-1');
  assert.equal(result.code, 'TEACHER_INELIGIBLE');
});

test('completed session stores planned-versus-taught evidence', () => {
  const runtime = createRuntimeAtAllocatedLearner();
  const result = runtime.dispatch('COMPLETE_SESSION', {
    sessionId: 'session-canonical',
    taughtItemIds: ['item-past-simple-video', 'item-speaking-pairs'],
    deferredItemIds: ['item-pronunciation'],
    note: 'Chuyển pronunciation sang buổi tiếp theo'
  }, 'teacher-1');
  assert.equal(result.ok, true);
  assert.deepEqual(runtime.state().deliveryRecords.at(-1).deferredItemIds, ['item-pronunciation']);
});
```

- [ ] **Step 2: Verify RED**

Run: `node --test tests/domain/academic-teacher-ops.test.cjs`  
Expected: FAIL on the first unimplemented command/selector.

- [ ] **Step 3: Implement curriculum publication and teacher eligibility/workload selectors**

Published course versions reject content mutation. Eligibility reports hard-gate failures and soft ranking signals separately.

- [ ] **Step 4: Implement assignment, delivery record, attendance correction, schedule conflict, make-up, and substitution commands**

Late attendance correction and substitution override paths reject empty reasons. Substitute access is bound to a session and handover window.

- [ ] **Step 5: Run focused and aggregate tests**

Run: `node --test tests/domain/*.test.cjs`  
Expected: PASS.

- [ ] **Step 6: Commit academic operations**

```bash
git add source/modules tests/domain/academic-teacher-ops.test.cjs
git commit -m "feat: model teacher operations and session evidence"
```

### Task 5: Learning, Remedial, Assessment, Moderation, Progress, and Intervention

**Files:**
- Create: `tests/domain/learning-outcomes.test.cjs`
- Modify: `source/modules/05-commands.js`
- Modify: `source/modules/06-selectors.js`

**Interfaces:**
- Produces commands: `FINALIZE_ATTENDANCE`, `START_REMEDIAL`, `UPDATE_VIDEO_PROGRESS`, `SUBMIT_AUTO_ASSESSMENT`, `SUBMIT_HOMEWORK`, `GRADE_HOMEWORK`, `REQUEST_REVISION`, `RESUBMIT_HOMEWORK`, `SUBMIT_MANUAL_GRADE`, `START_MODERATION`, `APPROVE_MODERATION`, `RELEASE_RESULT`, `OPEN_INTERVENTION`, `PUBLISH_PROGRESS_REPORT`, `DECIDE_PROMOTION`.
- Produces selectors: `skillProfile(state, learnerId)`, `completionStatus(state, assignmentId)`, `progressReportEvidence(state, learnerId)`, `riskSignals(state)`.

- [ ] **Step 1: Write failing tests for idempotent remedial, moderation, parent publication, and promotion**

```javascript
test('finalizing the same absence twice creates one remedial assignment', () => {
  const runtime = createRuntimeAtSession();
  runtime.dispatch('FINALIZE_ATTENDANCE', canonicalAbsence, 'teacher-1');
  runtime.dispatch('FINALIZE_ATTENDANCE', canonicalAbsence, 'teacher-1');
  assert.equal(runtime.state().remedialAssignments.filter((item) => item.sessionId === 'session-canonical' && item.learnerId === 'student-canonical').length, 1);
});

test('borderline final assessment cannot release before moderation approval', () => {
  const runtime = createRuntimeAtFinalAssessment();
  const result = runtime.dispatch('RELEASE_RESULT', {attemptId: 'attempt-final-canonical'}, 'teacher-1');
  assert.equal(result.code, 'MODERATION_REQUIRED');
});

test('promotion uses skill thresholds instead of overall average alone', () => {
  const runtime = createRuntimeAtProgressReview();
  const result = runtime.dispatch('DECIDE_PROMOTION', {learnerId: 'student-canonical', decision: 'PROMOTE'}, 'academic-1');
  assert.equal(result.ok, true);
  assert.ok(result.evidence.skillThresholds.every((item) => item.passed));
});
```

- [ ] **Step 2: Verify RED**

Run: `node --test tests/domain/learning-outcomes.test.cjs`  
Expected: FAIL for missing learning/outcome commands.

- [ ] **Step 3: Implement homework and remedial lifecycles**

Remedial completion requires configured video progress and released passing assessment evidence. Retry keeps the highest released score and attempt history.

- [ ] **Step 4: Implement auto/manual grading, moderation, release, and appeal-safe result history**

Speaking, writing, essay, and file evidence never auto-release a final decision.

- [ ] **Step 5: Implement skill profiles, risk signals, interventions, progress publication, and promotion**

The progress report answers achieved, missing, and next-action questions and creates parent/admissions notifications only after publication.

- [ ] **Step 6: Run all domain tests and rebuild**

Run: `node --test tests/domain/*.test.cjs`  
Run: `python3 scripts/build_standalone.py`  
Expected: PASS.

- [ ] **Step 7: Commit learning outcomes**

```bash
git add source/modules tests/domain/learning-outcomes.test.cjs
git commit -m "feat: connect learning evidence to promotion outcomes"
```

### Task 6: UI Kit, Public Experience, Learner, and Parent Workspaces

**Files:**
- Create: `tests/static/test_routes_and_actions.py`
- Create: `source/modules/07-ui-kit.js`
- Create: `source/modules/08-public-views.js`
- Create: `source/modules/09-learning-views.js`
- Modify: `source/styles.css`

**Interfaces:**
- Produces: `YC.ui` functions `button`, `badge`, `metric`, `timeline`, `decisionPanel`, `workQueue`, `courseCard`, `appShell`, `publicShell`, `emptyState`, `errorState`.
- Produces view registries: `YC.views.public`, `YC.views.learning`.

- [ ] **Step 1: Write failing static tests for required routes, labels, and action bindings**

```python
def test_learning_and_parent_routes_have_renderers(self):
    bundle = (ROOT / "source/app.js").read_text()
    for route in ("/app/student/course", "/app/student/progress", "/app/parent/dashboard", "/app/parent/tuition"):
        self.assertIn(route, bundle)

def test_no_placeholder_renderer_remains(self):
    bundle = (ROOT / "source/app.js").read_text()
    self.assertNotIn("simplePlaceholder", bundle)
```

- [ ] **Step 2: Verify RED**

Run: `python3 -m unittest tests.static.test_routes_and_actions -v`  
Expected: FAIL because route view registries do not exist.

- [ ] **Step 3: Implement the Coursera-inspired design tokens and UI kit**

Use cobalt brand actions, neutral page/surface hierarchy, compact metadata rows, restrained borders, strong focus states, one dominant action per view, and responsive record cards.

- [ ] **Step 4: Implement public/catalog/course-detail views**

Expose Explore, search, audience pathways, course outcomes, level, duration, mode, workload, module outline, and truthful demo CTAs.

- [ ] **Step 5: Implement learner views**

Include Continue Learning, course outline, remedial work, assessments, multidimensional skill progress, notifications, and evidence-linked results.

- [ ] **Step 6: Implement parent views with visibility-filtered data**

Include linked-learner switcher, attendance, schedule, published progress, shareable feedback, service cases, and mock tuition summary.

- [ ] **Step 7: Build and run static/domain tests**

Run: `python3 scripts/build_standalone.py`  
Run: `python3 -m unittest discover -s tests/static -p 'test_*.py' -v`  
Run: `node --test tests/domain/*.test.cjs`  
Expected: PASS.

- [ ] **Step 8: Commit learner-facing UI**

```bash
git add source tests/static OPEN-DEMO.html
git commit -m "feat: add learning-led public student and parent UX"
```

### Task 7: Operations and Management Workspaces

**Files:**
- Modify: `tests/static/test_routes_and_actions.py`
- Create: `source/modules/10-operations-views.js`
- Create: `source/modules/11-management-views.js`
- Modify: `source/styles.css`

**Interfaces:**
- Produces view registries: `YC.views.operations`, `YC.views.management`.
- Consumes: commands and selectors from Tasks 3–5.

- [ ] **Step 1: Add failing route/action coverage for every staff workspace**

Assert meaningful renderers for Admissions, Finance, Academic, Service, Teacher, Manager, and Admin routes and assert every emitted `data-command` is registered.

- [ ] **Step 2: Verify RED**

Run: `python3 -m unittest tests.static.test_routes_and_actions -v`  
Expected: FAIL listing missing staff routes.

- [ ] **Step 3: Implement Admissions and Finance workspaces**

Show lead/placement pipeline, evidence-based recommendation, offer state, mock invoice/payment, renewal queue, and role-owned next actions.

- [ ] **Step 4: Implement Academic and Teacher workspaces**

Show curriculum publication, eligibility, assignments, workbench before/during/after session, delivery evidence, grading, moderation, workload, and balanced quality.

- [ ] **Step 5: Implement Student Service workspace**

Show allocation ranking, no-seat alternatives, make-up, transfer, reservation/withdrawal dependencies, schedule conflicts, substitutions, handover, and service/intervention cases.

- [ ] **Step 6: Implement Center Manager and Admin workspaces**

Show state-derived capacity, quality, retention, mock revenue, event health, audit, access matrix, integrations, settings, and reset controls.

- [ ] **Step 7: Run aggregate tests and rebuild**

Run: `python3 scripts/build_standalone.py`  
Run: `python3 -m unittest discover -s tests/static -p 'test_*.py' -v`  
Run: `node --test tests/domain/*.test.cjs`  
Expected: PASS.

- [ ] **Step 8: Commit staff workspaces**

```bash
git add source tests/static OPEN-DEMO.html
git commit -m "feat: add complete language center operations workspaces"
```

### Task 8: Router, Actions, Authentication, and Guided Demo Cockpit

**Files:**
- Create: `tests/domain/canonical-journey.test.cjs`
- Create: `source/modules/12-demo-guide.js`
- Create: `source/modules/13-router.js`
- Create: `source/modules/14-actions.js`
- Create: `source/modules/15-bootstrap.js`
- Modify: `source/styles.css`

**Interfaces:**
- Produces: `YC.router.resolve(path, actor)`, `navigate(path)`, `render()`.
- Produces: delegated handlers for `data-command`, login, role switching, filters, profile switching, reset, checkpoint loading, CSV export, print, dialog, and responsive navigation.
- Produces: `YC.demo.milestones`, `currentMilestone(state)`, `loadCheckpoint(id)`.

- [ ] **Step 1: Write the failing canonical journey test**

```javascript
test('canonical journey advances from lead to accepted renewal with complete evidence', () => {
  const runtime = createRuntime();
  for (const step of canonicalJourneyCommands) {
    const result = runtime.dispatch(step.name, step.payload, step.actorId);
    assert.equal(result.ok, true, `${step.name}: ${result.message}`);
  }
  assert.equal(YC.selectors.journey(runtime.state()).status, 'RENEWED');
  assert.ok(runtime.state().auditLogs.length >= canonicalJourneyCommands.length);
  assert.ok(runtime.state().domainEvents.every((event) => event.actorId && event.occurredAt));
});
```

- [ ] **Step 2: Verify RED**

Run: `node --test tests/domain/canonical-journey.test.cjs`  
Expected: FAIL until all required commands and milestone calculation are connected.

- [ ] **Step 3: Implement role-aware router and authentication simulation**

Direct navigation outside the role scope renders 403 and records a denied audit. Parent and learner accounts remain distinct.

- [ ] **Step 4: Implement delegated action handling**

Forms collect explicit evidence/reason inputs and dispatch commands. Success re-renders and announces a toast; rejected commands preserve form data and show the reason.

- [ ] **Step 5: Implement the guided demo cockpit and deterministic checkpoints**

The cockpit shows six flows, twelve primary milestones, current owner, evidence, next action, quick role switch, reset, and checkpoint controls.

- [ ] **Step 6: Connect export, print, responsive menu, dialog, and accessibility behaviors**

CSV uses UTF-8 BOM, exports respect actor scope, dialogs restore focus, and mobile navigation closes after route changes.

- [ ] **Step 7: Build and run every automated test**

Run: `python3 scripts/build_standalone.py`  
Run: `node --test tests/domain/*.test.cjs`  
Run: `python3 -m unittest discover -s tests/static -p 'test_*.py' -v`  
Expected: PASS.

- [ ] **Step 8: Commit the complete interactive journey**

```bash
git add source tests OPEN-DEMO.html
git commit -m "feat: add guided end-to-end language center journey"
```

### Task 9: Documentation, Browser QA, and Release Verification

**Files:**
- Modify: `README.md`
- Modify: `START-HERE.md`
- Modify: `docs/DEMO-SCRIPT.md`
- Modify: `docs/FRONTEND-DEMO-BOUNDARY.md`
- Modify: `docs/KNOWN-LIMITATIONS.md`
- Modify: `docs/DESIGN-SYSTEM-RBAC-v2.0.md`
- Modify: `docs/VERIFICATION.md`
- Modify: `source/validation/verify_prototype.py`
- Modify: `VERSION.txt`
- Modify: `source/VERSION.txt`
- Modify: `PACKAGE-MANIFEST.txt`
- Modify: `CHECKSUMS-SHA256.txt`

**Interfaces:**
- Produces documented demo accounts and exact twelve-step demo script.
- Produces deterministic verification summary and package checksums.

- [ ] **Step 1: Write failing documentation/static assertions**

Assert that every documented demo account exists in the seed, every documented route resolves, both version files match, and the package manifest/checksum entries cover generated artifacts.

- [ ] **Step 2: Verify RED**

Run: `python3 -m unittest discover -s tests/static -p 'test_*.py' -v`  
Expected: FAIL on outdated v2 documentation and package metadata.

- [ ] **Step 3: Update product documentation and limitations**

Describe the v3 full-journey scope, mock boundaries, source/build structure, accounts, six flows, twelve-step demo, reset/checkpoints, and production backlog.

- [ ] **Step 4: Update verification script and package metadata**

The verification script checks v3 data invariants, route/action coverage, generated artifact freshness, and optionally performs browser checks when Playwright is installed.

- [ ] **Step 5: Run complete automated verification**

Run: `python3 scripts/build_standalone.py --check`  
Run: `node --test tests/domain/*.test.cjs`  
Run: `python3 -m unittest discover -s tests/static -p 'test_*.py' -v`  
Run: `python3 source/validation/verify_prototype.py --static-only`  
Expected: all checks PASS with no warning or stale artifact.

- [ ] **Step 6: Run browser QA on source and standalone variants**

Verify the canonical journey, role scope, parent visibility, reset/checkpoints, CSV, desktop 1440 px, tablet 768 px, mobile 390 px, and zero console errors.

- [ ] **Step 7: Perform final self-review**

Compare every design-spec completion criterion to a test or observed browser result. Fix every gap and rerun the full verification suite.

- [ ] **Step 8: Commit release documentation**

```bash
git add README.md START-HERE.md docs source VERSION.txt PACKAGE-MANIFEST.txt CHECKSUMS-SHA256.txt OPEN-DEMO.html tests scripts
git commit -m "docs: release full journey frontend demo"
```
