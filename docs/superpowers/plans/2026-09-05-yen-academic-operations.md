# Yen Academic Operations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement approved Course, Class, Session, and unified Remedial Case business flows with complete traceability and cross-role projections.

**Architecture:** Build specialized commands on the schema-v4 permission and approval foundation. Preserve existing collections for compatibility while making canonical Course/Class/Session records versioned and adding `remedialCases` as the aggregate that owns online assignments and live make-up bookings.

**Tech Stack:** Vanilla JavaScript IIFEs, normalized browser state/localStorage, Node.js tests, Python standalone builder.

**Spec:** `docs/superpowers/specs/2026-09-05-yen-governance-learning-operations-public-site-design.md`

## Global Constraints

- Requires completion of `2026-09-05-yen-rbac-approvals.md`.
- Published Course Versions are immutable; edits fork a new draft version.
- Classes pin a published Course Version; Sessions pin a lesson in that version.
- Teacher master-data changes stay pending until Admin approval.
- Delivery, attendance, homework, and grading remain direct operational actions inside effective assignment scope.
- One attendance record creates at most one Remedial Case.
- Existing online remedial player, quiz, link lifecycle, and canonical learner behavior must remain functional.

---

## File Structure

- Modify `source/modules/02-seed.js`: richer Course/Class/Session fields, remedial policy, seeded request scenario.
- Modify `source/modules/05-approval.js`: resource appliers for Course/Class/Session and validation hooks.
- Modify `source/modules/05-commands.js`: specialized request/direct commands and remedial aggregate commands.
- Modify `source/modules/06-selectors.js`: course tree, readiness, conflicts, source/target trace.
- Create `source/modules/06-remedial.js`: eligibility, completion, target ranking, reconciliation.
- Modify `source/modules/09-learning-views.js`: learner/parent source trace and unified case status.
- Modify `source/modules/10-operations-views.js`: teacher CRUD requests and remedial detail.
- Modify `source/modules/11-management-views.js`: Admin Course/Class/Session/Remedial CRUD/detail.
- Modify `source/modules/13-router.js` and `14-actions.js`: routes, forms, actions.
- Create `tests/domain/course-class-session-crud.test.cjs`.
- Create `tests/domain/remedial-case.test.cjs`.
- Create `tests/domain/academic-operations-ui.test.cjs`.

## Shared JavaScript Test Helpers

Define these helpers in each new domain test file that needs them:

```js
const assert = require('node:assert/strict');
const test = require('node:test');
const { loadYC, memoryStorage } = require('../helpers/load-runtime.cjs');
const FIXED_NOW = '2026-09-05T02:00:00.000Z';

function runtimeWithTeacherAssignment() {
  const YC = loadYC(['seed', 'store', 'commands', 'selectors', 'router']);
  const store = YC.store.create({ storage: memoryStorage(), clock: () => FIXED_NOW });
  store.transact((draft) => {
    const learner = draft.learners.find((item) => item.id === 'student-canonical');
    learner.status = 'ACTIVE';
    learner.classId = 'class-6a';
    if (!draft.enrollments.some((item) => item.learnerId === learner.id && item.classId === 'class-6a')) draft.enrollments.push({ id: 'enrollment-canonical-ops', learnerId: learner.id, classId: 'class-6a', courseVersionId: 'course-v6', status: 'ACTIVE', startsAt: FIXED_NOW, endsAt: null });
    if (!draft.teacherAssignments.some((item) => item.teacherProfileId === 'teacher-profile-1' && item.classId === 'class-6a')) draft.teacherAssignments.push({ id: 'assignment-canonical-ops', teacherProfileId: 'teacher-profile-1', classId: 'class-6a', role: 'PRIMARY', startsAt: '2026-01-01T00:00:00.000Z', endsAt: '2027-01-01T00:00:00.000Z', workloadMinutes: 720, status: 'ACTIVE' });
    draft.sessions.find((item) => item.id === 'session-canonical').status = 'COMPLETED';
  });
  return { YC, store, bus: YC.commands.create(store), state: () => store.getState() };
}

function approve(bus, requestId) {
  return bus.dispatch('REVIEW_CHANGE_REQUEST', { requestId, decision: 'APPROVE', note: 'Đã kiểm tra dữ liệu và xung đột.' }, 'admin-1');
}

function requestSession(bus) {
  return bus.dispatch('REQUEST_CREATE_SESSION', { classId: 'class-6a', lessonTemplateId: 'lesson-past-simple', startsAt: '2026-09-08T11:00:00.000Z', endsAt: '2026-09-08T12:30:00.000Z', room: 'P.304', mode: 'OFFLINE', reason: 'Bổ sung buổi ôn tập' }, 'teacher-1');
}

function finalizeAbsent(bus) {
  return bus.dispatch('FINALIZE_ATTENDANCE', { sessionId: 'session-canonical', records: [{ learnerId: 'student-canonical', status: 'ABSENT', reasonCode: 'SICK' }] }, 'teacher-1');
}

function renderAs(YC, state, path, actorId) {
  return YC.router.render(path, { state, actor: state.users.find((item) => item.id === actorId), learnerId: 'student-canonical', path });
}
```

### Task 1: Course and Course Version lifecycle

**Files:**
- Modify: `source/modules/05-approval.js`
- Modify: `source/modules/05-commands.js`
- Modify: `source/modules/06-selectors.js`
- Create: `tests/domain/course-class-session-crud.test.cjs`

**Interfaces:**
- Commands: `REQUEST_CREATE_COURSE`, `REQUEST_UPDATE_COURSE`, `CREATE_COURSE_VERSION`, `SUBMIT_COURSE_VERSION`, `PUBLISH_COURSE_VERSION`, `ARCHIVE_COURSE`.
- Selector: `coursePublishValidation(state, courseVersionId): {valid, errors[], warnings[]}`.

- [ ] **Step 1: Write failing Course lifecycle tests**

```js
test('Teacher course create is pending while Admin approval creates canonical Course', () => {
  const { bus, state } = runtimeWithTeacherAssignment();
  const requested = bus.dispatch('REQUEST_CREATE_COURSE', {
    code: 'YEN-KIDS-A2', name: 'Tiếng Anh thiếu nhi A2', programId: 'program-foundation',
    levelId: 'level-a2-1', ageBand: 'YOUNG_LEARNER', mode: 'OFFLINE', reason: 'Mở lộ trình mới'
  }, 'teacher-1');
  assert.equal(requested.ok, true);
  assert.equal(state().courses.some((item) => item.code === 'YEN-KIDS-A2'), false);
  bus.dispatch('REVIEW_CHANGE_REQUEST', { requestId: requested.requestId, decision: 'APPROVE', note: 'Đã kiểm tra' }, 'admin-1');
  assert.equal(state().courses.some((item) => item.code === 'YEN-KIDS-A2'), true);
});
```

Add duplicate code, incomplete version validation, published immutability, forked version, retire-with-existing-class tests.

- [ ] **Step 2: Run test and verify RED**

Run: `node --test tests/domain/course-class-session-crud.test.cjs`

Expected: specialized Course commands missing.

- [ ] **Step 3: Implement Course commands and validation**

Use Change Requests for Teacher create/update/archive. Admin direct creation writes canonical records with `version: 1`. `PUBLISH_COURSE_VERSION` validates unit, lesson, objective, duration, assessment references, completion rule, and remedial policy before setting `immutable: true`.

- [ ] **Step 4: Run focused and Course regression tests**

Run: `node --test tests/domain/course-class-session-crud.test.cjs tests/domain/course-superset.test.cjs`

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add source/modules/05-approval.js source/modules/05-commands.js source/modules/06-selectors.js tests/domain/course-class-session-crud.test.cjs
git commit -m "feat: add governed course lifecycle"
```

### Task 2: Class lifecycle, timetable, capacity, and assignment

**Files:**
- Modify: `source/modules/05-approval.js`
- Modify: `source/modules/05-commands.js`
- Modify: `source/modules/06-selectors.js`
- Modify: `tests/domain/course-class-session-crud.test.cjs`

**Interfaces:**
- Commands: `REQUEST_CREATE_CLASS`, `REQUEST_UPDATE_CLASS`, `OPEN_CLASS`, `MARK_CLASS_READY`, `ARCHIVE_CLASS`.
- Selectors: `classReadiness(state, classId)`, `classCapacity(state, classId)`.

- [ ] **Step 1: Write failing Class tests**

```js
test('class capacity includes active enrollment and held make-up seats', () => {
  const { YC, state: current } = runtimeWithTeacherAssignment();
  const state = current();
  const result = YC.selectors.classCapacity(state, 'class-6a');
  assert.equal(result.used, result.activeEnrollments + result.makeUpReservations);
  assert.equal(result.remaining, result.capacity - result.used);
});
```

Add Teacher request-before-approval, only-published-version, readiness requirements, minimum-capacity override, no course-version swap after first session, and archive-only-after-use tests.

- [ ] **Step 2: Run test and verify RED**

Run: `node --test tests/domain/course-class-session-crud.test.cjs`

Expected: Class lifecycle functions missing.

- [ ] **Step 3: Implement Class operations**

Store timezone, recurring timetable, capacity bounds, enrollment window, policy snapshot, status, and version. Generate future Session drafts only when an approved Class becomes `OPEN`; do not generate duplicates for the same class/start time.

- [ ] **Step 4: Run focused tests**

Run: `node --test tests/domain/course-class-session-crud.test.cjs tests/domain/admissions-commerce.test.cjs`

Expected: Class CRUD and existing allocation/transfer tests pass.

- [ ] **Step 5: Commit**

```bash
git add source/modules/05-approval.js source/modules/05-commands.js source/modules/06-selectors.js tests/domain/course-class-session-crud.test.cjs
git commit -m "feat: add governed class lifecycle"
```

### Task 3: Session creation, rescheduling, cancellation, and evidence

**Files:**
- Modify: `source/modules/05-approval.js`
- Modify: `source/modules/05-commands.js`
- Modify: `source/modules/06-selectors.js`
- Modify: `tests/domain/course-class-session-crud.test.cjs`

**Interfaces:**
- Commands: `REQUEST_CREATE_SESSION`, `REQUEST_RESCHEDULE_SESSION`, `REQUEST_CANCEL_SESSION`, `CONFIRM_SESSION`, existing preparation/delivery commands.
- Selectors: `sessionValidation(state, proposal)`, `sessionTrace(state, sessionId)`.

- [ ] **Step 1: Write failing Session tests**

```js
test('approved Teacher session request appears in class and learner schedules', () => {
  const { YC, bus, state } = runtimeWithTeacherAssignment();
  const request = requestSession(bus);
  assert.equal(state().sessions.some((item) => item.provisionalId === request.provisionalResourceId), false);
  approve(bus, request.requestId);
  const session = state().sessions.find((item) => item.changeRequestId === request.requestId);
  assert.equal(session.classId, 'class-6a');
  assert.equal(YC.selectors.sessionTrace(state(), session.id).courseVersion.id, 'course-v6');
});
```

Add room/teacher/learner conflicts, lesson-course mismatch, roster snapshot timing, no reschedule after start, notification and audit tests.

- [ ] **Step 2: Run test and verify RED**

Run: `node --test tests/domain/course-class-session-crud.test.cjs`

Expected: Session request commands/trace missing.

- [ ] **Step 3: Implement Session operations**

Validate course/lesson relationship and conflicts both at submit and approve. Keep roster dynamic in `PLANNED/CONFIRMED`; set `rosterSnapshot` when starting/opening attendance. Reschedule creates a new schedule revision and preserves previous values in audit.

- [ ] **Step 4: Run Session and Teacher operation tests**

Run: `node --test tests/domain/course-class-session-crud.test.cjs tests/domain/academic-teacher-ops.test.cjs tests/domain/attendance-ui.test.cjs`

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add source/modules/05-approval.js source/modules/05-commands.js source/modules/06-selectors.js tests/domain/course-class-session-crud.test.cjs
git commit -m "feat: add governed session lifecycle"
```

### Task 4: Unified Remedial Case and compatibility migration

**Files:**
- Create: `source/modules/06-remedial.js`
- Modify: `source/modules/02-seed.js`
- Modify: `source/modules/03-store.js`
- Modify: `source/modules/05-commands.js`
- Modify: `source/modules/06-selectors.js`
- Create: `tests/domain/remedial-case.test.cjs`

**Interfaces:**
- Produces: `YC.remedial.evaluateEligibility(state, attendanceId)`, `caseStatus(state, caseId)`, `reconcileAttendance(draft, attendance, previousStatus, context)`.
- `remedialAssignments[].remedialCaseId` remains the online child compatibility path.
- `makeUpBookings[].remedialCaseId` becomes the live child compatibility path.

- [ ] **Step 1: Write failing aggregate tests**

```js
test('finalized absence creates one case and one online child idempotently', () => {
  const { bus, state } = runtimeWithTeacherAssignment();
  finalizeAbsent(bus);
  finalizeAbsent(bus);
  const attendance = state().attendanceRecords.find((item) => item.sessionId === 'session-canonical' && item.learnerId === 'student-canonical');
  assert.equal(state().remedialCases.filter((item) => item.sourceAttendanceId === attendance.id).length, 1);
  const remedialCase = state().remedialCases[0];
  assert.equal(state().remedialAssignments.filter((item) => item.remedialCaseId === remedialCase.id).length, 1);
});
```

Add policy snapshot, online completion, absent→present reconciliation, present→absent idempotency, existing v3 assignment migration, and evidence-retention tests.

- [ ] **Step 2: Run test and verify RED**

Run: `node --test tests/domain/remedial-case.test.cjs`

Expected: `remedialCases` and service missing.

- [ ] **Step 3: Implement aggregate and update attendance transaction**

Create the Attendance record before eligibility evaluation, then create case and online child in the same store transaction. Compute aggregate status from `requiredModes`, online status, and live booking status; do not allow a command to set aggregate status directly.

- [ ] **Step 4: Run remedial regressions**

Run: `node --test tests/domain/remedial-case.test.cjs tests/domain/learning-outcomes.test.cjs tests/domain/remedial-ui.test.cjs tests/domain/attendance-ui.test.cjs`

Expected: unified case assertions and all legacy player/quiz/link tests pass.

- [ ] **Step 5: Commit**

```bash
git add source/modules/02-seed.js source/modules/03-store.js source/modules/05-commands.js source/modules/06-remedial.js source/modules/06-selectors.js tests/domain/remedial-case.test.cjs
git commit -m "feat: unify online and live remedial records"
```

### Task 5: Live make-up ranking and booking

**Files:**
- Modify: `source/modules/05-commands.js`
- Modify: `source/modules/06-remedial.js`
- Modify: `tests/domain/remedial-case.test.cjs`

**Interfaces:**
- Commands: `HOLD_MAKE_UP_SEAT`, `CONFIRM_MAKE_UP_BOOKING`, `CANCEL_MAKE_UP_BOOKING`, `RECORD_MAKE_UP_ATTENDANCE`.
- Selector: `rankMakeUpTargets(state, caseId): Array<{sessionId, score, hardGates, reasons}>`.

- [ ] **Step 1: Write failing live make-up tests**

```js
test('booking adds a make-up guest without changing the learner primary class', () => {
  const { bus, store, state } = runtimeWithTeacherAssignment();
  finalizeAbsent(bus);
  const caseId = state().remedialCases[0].id;
  store.transact((draft) => { draft.sessions.push({ id: 'session-equivalent', classId: 'class-6b', lessonTemplateId: 'lesson-past-simple', startsAt: '2026-09-10T11:00:00.000Z', endsAt: '2026-09-10T12:30:00.000Z', room: 'P.204', mode: 'OFFLINE', status: 'CONFIRMED', version: 1 }); });
  const beforeClass = state().learners.find((item) => item.id === 'student-canonical').classId;
  const result = bus.dispatch('CONFIRM_MAKE_UP_BOOKING', { caseId, targetSessionId: 'session-equivalent' }, 'service-1');
  assert.equal(result.ok, true);
  assert.equal(state().learners.find((item) => item.id === 'student-canonical').classId, beforeClass);
  assert.equal(state().makeUpBookings.at(-1).rosterRole, 'MAKE_UP_GUEST');
});
```

Add target equivalence, capacity, conflict, one-active-booking, no-show, rebook, and Admin override-note tests.

- [ ] **Step 2: Run test and verify RED**

Run: `node --test tests/domain/remedial-case.test.cjs`

Expected: ranking/booking commands missing.

- [ ] **Step 3: Implement ranking and booking lifecycle**

Score exact course-version/lesson match highest, then branch/mode fit. Reject failed hard gates. Count `HELD`, `BOOKED`, and `NOTIFIED` bookings in session capacity. Preserve cancelled/no-show attempts under the same case.

- [ ] **Step 4: Run focused tests**

Run: `node --test tests/domain/remedial-case.test.cjs tests/domain/admissions-commerce.test.cjs`

Expected: live booking and allocation capacity tests pass.

- [ ] **Step 5: Commit**

```bash
git add source/modules/05-commands.js source/modules/06-remedial.js tests/domain/remedial-case.test.cjs
git commit -m "feat: add live make-up booking workflow"
```

### Task 6: Course/Class/Session/Remedial management UI

**Files:**
- Modify: `source/modules/09-learning-views.js`
- Modify: `source/modules/10-operations-views.js`
- Modify: `source/modules/11-management-views.js`
- Modify: `source/modules/13-router.js`
- Modify: `source/modules/14-actions.js`
- Modify: `source/styles.css`
- Create: `tests/domain/academic-operations-ui.test.cjs`

**Interfaces:**
- Admin detail routes from spec §14.2.
- Teacher request/detail routes from spec §14.3.
- Breadcrumb: Course / Version / Class / Session / Attendance / Remedial Case.

- [ ] **Step 1: Write failing route and cross-role tests**

```js
test('remedial detail exposes source and target chains without leaking Admin actions', () => {
  const { YC, bus, state } = runtimeWithTeacherAssignment();
  finalizeAbsent(bus);
  const caseId = state().remedialCases[0].id;
  const adminHtml = renderAs(YC, state(), `/app/admin/remedial/${caseId}`, 'admin-1');
  assert.match(adminHtml, /Nguồn phát sinh/);
  assert.match(adminHtml, /Tiếng Anh nền tảng 6A/);
  assert.match(adminHtml, /Buổi học đích/);
  const studentHtml = renderAs(YC, state(), `/app/student/remedial/${caseId}`, 'student-login-1');
  assert.match(studentHtml, /Nguồn bài học bù/);
  assert.doesNotMatch(studentHtml, /Duyệt ngoại lệ/);
});
```

Assert CRUD forms, status guards, pending labels, approval links, detail tabs, and legacy route parity.

- [ ] **Step 2: Run test and verify RED**

Run: `node --test tests/domain/academic-operations-ui.test.cjs`

Expected: new detail/forms and breadcrumbs missing.

- [ ] **Step 3: Implement views and action wiring**

Use real state-derived options for Program/Level/Course Version/Class/Lesson/Teacher/Target Session. Every Teacher master-data submit displays `Chờ Admin duyệt`; operational buttons render only when `YC.policy.can` allows them.

- [ ] **Step 4: Run full domain and static tests**

Run: `node --test tests/domain/*.test.cjs`

Run: `python3 -m unittest discover -s tests/static -p 'test_*.py'`

Expected: zero failures.

- [ ] **Step 5: Build, verify, and commit**

```bash
python3 scripts/build_standalone.py --release
python3 source/validation/verify_prototype.py --static-only
git add source tests OPEN-DEMO.html
git commit -m "feat: complete academic operations workspaces"
```

## Plan Verification

```bash
node --test tests/domain/*.test.cjs
python3 -m unittest discover -s tests/static -p 'test_*.py'
python3 scripts/build_standalone.py --release --check
python3 source/validation/verify_prototype.py --static-only
```

Expected: zero failures and verifier `PASS`.
