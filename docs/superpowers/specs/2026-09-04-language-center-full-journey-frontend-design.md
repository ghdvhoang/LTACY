# Language Center Full-Journey Frontend Demo Design

**Date:** 2026-09-04  
**Status:** Approved for autonomous implementation  
**Reference:** `LMS_Language_Center_Visual_Domain_Handbook_v1.1.md` and the existing Yen Center v2.0 frontend demonstrator

## 1. Purpose

Extend the current Yen Center remedial-learning prototype into a complete, standalone frontend demonstration of a multi-branch language-center operating model. The demo must preserve the existing browser-only delivery model while connecting admissions, academic design, teacher operations, class delivery, learning, assessment, service, commerce, reporting, and renewal through one coherent state.

The product remains a truthful frontend demonstrator. Authentication, payment, messaging, storage providers, and integrations are simulated and visibly labelled as demo or mock capabilities.

## 2. Product Boundary

### Goals

- Demonstrate a learner journey from lead creation through renewal.
- Demonstrate the teacher journey from eligibility through delivery, grading, moderation, and coaching evidence.
- Support one Yen Center organization with multiple branches.
- Provide role-specific workspaces for Admissions, Academic Management, Student Service, Finance, Teacher/TA, Learner, Parent, Center Management, and Admin.
- Use one normalized state so every action is reflected across all relevant workspaces.
- Implement business transitions through commands that validate rules, emit events, create audit records, and notify the next owner.
- Keep all important dashboard values derived from state rather than hard-coded.
- Preserve the existing `OPEN-DEMO.html` zero-install experience.
- Preserve the current remedial flow and make it part of the larger journey.
- Provide deterministic reset data and a guided demo cockpit.

### Non-goals

- Real backend, database, password security, server-side authorization, or concurrency.
- Multi-tenant administration for unrelated education companies.
- Live payment, email, SMS, Zalo, video conferencing, HRM, payroll, or accounting integrations.
- Production CRM automation, enterprise BI, predictive AI, or certification standards integration.
- A pixel-for-pixel copy of Coursera or use of Coursera brand assets.

## 3. Experience Direction

The interface will borrow product-design ideas from Coursera without copying its visual identity:

- A calm cobalt-led learning brand with large, direct headings and restrained neutral surfaces.
- Clear `Khám phá` and search entry points on public/catalog experiences.
- Goal- and task-oriented navigation rather than menus organized around database tables.
- A prominent `Tiếp tục học` action and visible progress on learner pages.
- Course metadata presented in a compact facts row: level, duration, mode, workload, and outcome.
- Curriculum shown as expandable modules and lessons with time estimates and completion state.
- One dominant action per screen, with secondary actions visually quieter.
- Dense operational tables for staff, learning cards for learners, and summary-first views for parents.
- Existing role accents remain as subtle workspace cues; semantic success, warning, and danger colors remain role-independent.

The public site and learner experience should feel editorial and learning-led. Operational workspaces should feel precise, scannable, and audit-friendly.

## 4. Canonical Demo Story

The reset state centers on **Nguyễn Minh Anh**, initially a qualified B2C lead for the English Foundation program at the Quận 3 branch. Other seeded learners, teachers, and classes remain available so dashboards and matching decisions have realistic context.

The primary story advances through these milestones:

1. Admissions contacts the lead and books placement.
2. An examiner records a multidimensional placement result and recommends `English Foundation 6 · A2.1`.
3. Admissions creates an offer; Finance records a mock payment.
4. Student Service ranks suitable classes and allocates the learner to `English Foundation 6A`.
5. Academic Management assigns teacher Hoàng Yến after checking eligibility and workload.
6. The teacher prepares and completes a session delivery record.
7. Nguyễn Minh Anh is marked absent, creating a remedial assignment exactly once.
8. The learner completes the lesson and quiz; the teacher releases feedback.
9. A later final assessment enters moderation because the speaking score is close to threshold.
10. Academic Management publishes the progress report and decides promotion.
11. The parent reviews the published report and next actions.
12. Admissions creates and closes the next-level renewal offer.

The demo cockpit always shows the current milestone, evidence, owner, and next valid action. It supports resetting the complete story or jumping to a documented checkpoint without producing contradictory state.

## 5. Supporting Demo Flows

### 5.1 Curriculum and Versioning

`Product Line → Program → Level → Course → Course Version → Unit → Lesson Template → Learning Item`

- Academic Management reviews and publishes a draft course version.
- Published versions are immutable in the demo.
- A class references one course version.
- Existing enrollment history remains tied to its original course version.
- Session lesson plans can adapt delivery notes without mutating the curriculum definition.

### 5.2 Teacher Operations and Delivery

`Profile → Qualification → Availability → Eligibility → Assignment → Preparation → Delivery → Evidence → Grading → Quality`

- Assignment matching has hard gates for qualification, level/age capability, branch/mode, schedule conflict, compliance, and workload limit.
- The selected teacher accepts the proposed assignment.
- Before-session work exposes roster, lesson template, learner risks, and open homework.
- During/after-session work records check-in, attendance, taught content, coverage gaps, homework, incidents, and handover.
- Workload combines teaching, preparation, grading, administration, and coaching minutes.
- Quality uses a balanced evidence set rather than a single score.

### 5.3 Operational Exceptions

- No-seat allocation produces alternatives and a manual-review queue.
- Attendance correction requires a reason after the correction window.
- Excused absence progresses from request to approval or rejection.
- Make-up progresses from eligibility to booking and attendance.
- Transfer closes the old enrollment, creates the new enrollment, preserves history, and changes teacher roster scope.
- Reservation and withdrawal expose academic and finance settlement dependencies.
- Session rescheduling detects teacher and room conflicts.
- Teacher substitution requires candidate selection, confirmation, handover readiness, delivery, and closure.

### 5.4 Homework, Assessment, and Moderation

- Homework supports assignment, submission, grading, released feedback, revision, resubmission, and acceptance.
- Assessment supports placement, diagnostic, formative, periodic, final, and mock-exam purposes.
- Single-choice questions are interactive and auto-graded.
- Essay/speaking/file evidence uses a manual grading queue.
- Final or borderline results require moderation before release.
- An approved appeal creates an amended result while preserving the released result history.

### 5.5 Progress, Intervention, and Promotion

- Progress reports combine attendance, homework, skill evidence, trend, narrative, next actions, and approval.
- Skill profiles remain multidimensional: listening, reading, spoken interaction, spoken production, writing, and language/pronunciation.
- Risk signals create an intervention case with owner, plan, follow-up date, and outcome.
- Promotion decisions support `PROMOTE`, `CONDITIONAL`, `REMEDIAL`, and `REPEAT_OR_TRANSFER`.
- High-impact overrides require owner, reason, evidence, and audit.

### 5.6 Parent and Renewal

- Parent accounts are distinct from student accounts and can switch between linked learner profiles.
- Parents see attendance, schedule changes, published progress, shareable teacher feedback, homework support actions, appropriate tuition status, and service-case history.
- Restricted teacher notes, safeguarding details, and internal coaching records are never shown to parents.
- Renewal combines outcome, satisfaction, next goal, recommended program, seat options, and mock financial status.

## 6. Roles and Scope

| Role | Primary decision | Scope |
|---|---|---|
| Admissions | What should be offered next? | Leads, placement summary, offers, renewal |
| Academic Manager | Is the academic evidence sufficient? | Curriculum, teachers, assessment, promotion |
| Student Service | Where and how should the learner be served? | Allocation, transfer, make-up, service cases |
| Finance | Is the learner financially cleared? | Package, invoice, payment/refund mock records |
| Teacher | What must be prepared, delivered, graded, or escalated? | Assigned class/session and effective dates |
| Teaching Assistant | What operational support is required? | Assigned class/session with restricted content actions |
| Learner | What should I learn next? | Own learning, submissions, results, notifications |
| Parent | What happened and what support is needed? | Linked learners and publishable information only |
| Center Manager | Where is capacity, quality, retention, or revenue at risk? | Assigned branches and aggregated dashboards |
| Admin | Is configuration, access, and audit healthy? | Full demo state and reset controls |

Permissions are evaluated by role, branch, class, assignment, effective time, and visibility policy. The frontend restriction is demonstrative rather than secure and is labelled accordingly.

## 7. Information Architecture

### Public

- `/`
- `/chuong-trinh`
- `/chuong-trinh/:id`
- `/lich-hoc`
- `/phu-huynh-hoc-sinh`
- `/giai-phap-trung-tam`
- `/lien-he`
- `/login`
- `/demo-guide`

### Admissions and Commerce

- `/app/admissions/dashboard`
- `/app/admissions/leads`
- `/app/admissions/leads/:id`
- `/app/admissions/placement`
- `/app/admissions/offers`
- `/app/admissions/renewals`
- `/app/finance/dashboard`
- `/app/finance/invoices`
- `/app/finance/payments`

### Academic and Teacher Operations

- `/app/academic/dashboard`
- `/app/academic/curriculum`
- `/app/academic/teachers`
- `/app/academic/assignments`
- `/app/academic/moderation`
- `/app/academic/progress-reviews`
- `/app/teacher/dashboard`
- `/app/teacher/sessions`
- `/app/teacher/sessions/:id`
- `/app/teacher/grading`
- `/app/teacher/workload`
- `/app/teacher/quality`

### Student Service

- `/app/service/dashboard`
- `/app/service/allocation`
- `/app/service/cases`
- `/app/service/make-up`
- `/app/service/transfers`
- `/app/service/substitutions`

### Learner and Parent

- `/app/student/dashboard`
- `/app/student/course`
- `/app/student/remedial`
- `/app/student/assessments`
- `/app/student/progress`
- `/app/parent/dashboard`
- `/app/parent/attendance`
- `/app/parent/progress`
- `/app/parent/services`
- `/app/parent/tuition`

### Management and Admin

- `/app/manager/dashboard`
- `/app/manager/capacity`
- `/app/manager/quality`
- `/app/manager/retention`
- `/app/admin/dashboard`
- `/app/admin/access`
- `/app/admin/audit-logs`
- `/app/admin/events`
- `/app/admin/integrations`
- `/app/admin/settings`

Routes may share page renderers when the decision and data are identical, but each route must render meaningful content rather than a placeholder.

## 8. Frontend Architecture

### 8.1 Source Layout

The browser loads classic scripts in a deterministic order so the unbuilt source works over HTTP and the build script can inline the same files for `file://` use.

```text
source/
  index.html
  styles.css
  modules/
    00-namespace.js
    01-utils.js
    02-seed.js
    03-store.js
    04-policy.js
    05-commands.js
    06-selectors.js
    07-ui-kit.js
    08-public-views.js
    09-learning-views.js
    10-operations-views.js
    11-management-views.js
    12-demo-guide.js
    13-router.js
    14-actions.js
    15-bootstrap.js
  app.js                 # generated concatenated source
scripts/
  build_standalone.py
tests/
  domain/
  static/
source/validation/
  verify_prototype.py
```

Each module attaches a focused API to `window.YC`. The generated `source/app.js` is committed so the source demo runs without a build step. `OPEN-DEMO.html` and `source/yen-center-lms-demo.html` inline the generated JavaScript and CSS.

### 8.2 State

The state root has `schemaVersion: 3` and normalized collections for:

- organizations, branches, users, profiles, relationships, roleScopes
- leads, consultations, placementBookings, placementResults
- programs, levels, courses, courseVersions, units, lessonTemplates, learningItems
- teacherProfiles, qualifications, availabilitySlots, teacherAssignments, sessionAssignments
- classes, enrollments, timetableRules, sessions, attendanceRecords
- lessonPlans, deliveryRecords, homeworkAssignments, homeworkSubmissions
- assessments, questions, attempts, gradingRecords, moderationCases, skillResults
- packages, offers, invoices, payments, refunds, renewals
- progressReports, promotionDecisions, interventionCases, serviceCases
- notifications, outboundMessages, domainEvents, auditLogs, analyticsSnapshots

Foreign-key relationships are validated by tests. Read models are computed with selectors and are not persisted as independent truth.

### 8.3 Commands and Events

Views dispatch commands instead of mutating state. Every successful command returns a structured result and performs the following transaction in memory:

1. Validate actor scope and current state.
2. Validate transition rules and required evidence.
3. Apply normalized state changes.
4. Append a domain event with entity ID, actor, timestamp, and payload summary.
5. Append an audit record when the action changes or exposes sensitive state.
6. Create notifications or work items for the next owner.
7. Persist once and re-render.

Rejected commands return a Vietnamese user-facing message and do not partially modify state.

### 8.4 State Migration

The v3 application detects v2 localStorage. It offers a one-time reset into the new canonical story because the v2 schema cannot supply the missing domain relationships safely. User-created v3 state is migrated additively for future minor revisions. Reset is deterministic and idempotent.

## 9. State Machines

The following transitions are enforced by command guards:

```text
Lead: NEW → CONTACTED → PLACEMENT_BOOKED → PLACED → OFFERED → WON | LOST
Placement: BOOKED → TESTED → INTERVIEWED → REVIEWED → RELEASED
Offer: DRAFT → SENT → ACCEPTED → EXPIRED | DECLINED
Invoice: DRAFT → ISSUED → PAID | VOID
Enrollment: PENDING → ACTIVE → TRANSFERRED | RESERVED | WITHDRAWN | COMPLETED
Class: PLANNED → OPEN → ACTIVE → PAUSED → COMPLETED; PLANNED/OPEN → CANCELLED
Session: PLANNED → CONFIRMED → IN_PROGRESS → COMPLETED → REVIEWED
TeacherAssignment: PROPOSED → ACCEPTED → ACTIVE → COMPLETED | REPLACED | CANCELLED
Substitution: REQUESTED → CANDIDATE_FOUND → CONFIRMED → HANDOVER_READY → DELIVERED → CLOSED
Homework: ASSIGNED → SUBMITTED → GRADING → FEEDBACK_READY → RELEASED → ACCEPTED
Homework revision: RELEASED → REVISION_REQUIRED → RESUBMITTED → GRADING
Assessment: DRAFT_SCORE → SUBMITTED_FOR_REVIEW → MODERATION → APPROVED → RELEASED → AMENDED
ProgressReport: DRAFT → SUBMITTED → APPROVED → PUBLISHED
Promotion: PENDING → PROMOTE | CONDITIONAL | REMEDIAL | REPEAT_OR_TRANSFER
Renewal: DUE → RECOMMENDED → OFFERED → ACCEPTED | DECLINED | LAPSED
```

Exceptions are modeled as explicit records rather than free-text status changes.

## 10. UI Building Blocks

- Global public header with Explore, search, role pathways, login, and one primary CTA.
- Role shell with compact navigation, workspace identity, branch switcher, notifications, and demo label.
- Journey bar showing current milestone, evidence, owner, and next action.
- Work queue with priority, age, SLA, owner, and action.
- Course card and course detail with outcome, level, mode, duration, module outline, and next action.
- Learner `Continue learning` card with due date, progress, and resume action.
- Entity summary header with state, relationship context, and audit-safe actions.
- Evidence timeline combining events from multiple domains without changing their ownership.
- Decision panel with rules, evidence, recommendation, override reason, and approver.
- Side panel/modal for focused transitions; destructive demo actions require confirmation.
- Empty, loading, blocked, invalid-transition, insufficient-permission, and configuration-missing states.
- Tables transform into labelled record cards on narrow screens.

## 11. Reporting and Metrics

Dashboards derive metrics from state and expose the action behind each signal:

- Admissions: lead aging, placement conversion, offer conversion, renewal due.
- Academic: attendance risk, skill gaps, moderation backlog, promotion queue.
- Teacher: upcoming sessions, preparation readiness, grading backlog, evidence completeness, workload.
- Student Service: allocation queue, no-seat cases, make-up queue, transfers, substitutions.
- Finance: issued/paid mock invoices, overdue balances, refunds awaiting policy input.
- Center Manager: class occupancy, teacher capacity, learner outcomes, retention, and mock revenue.
- Parent/Learner: attendance, due work, skill profile, next action.

Each metric links to a filtered queue or evidence view. No metric claims production accuracy.

## 12. Error Handling and Safety

- Invalid transitions show the current state and required predecessor action.
- Missing curriculum/session configuration creates a visible configuration issue instead of silently skipping work.
- Duplicate attendance/remedial commands are idempotent.
- Scope violations render a 403 view and append a denied-action audit record.
- High-impact overrides require a non-empty reason.
- Parent visibility is applied by selectors before rendering.
- Mock payment and outbound messaging are visibly labelled and cannot imply a live transaction.
- Reset explains that all local demo changes will be lost.

## 13. Responsive and Accessibility Requirements

- Critical flows work at 390 px, 768 px, and 1440 px widths.
- Keyboard focus is visible; dialogs trap focus and close with Escape.
- Every form control has a programmatic label and inline error association.
- Status is expressed with text/icons in addition to color.
- Touch targets are at least 40 px high in critical flows.
- Tables preserve headers through responsive labels.
- Skip links, landmarks, heading order, and live toast announcements are retained.
- Reduced-motion preference disables nonessential transitions.

## 14. Verification Strategy

### Domain tests

- Valid and invalid state transitions for each core state machine.
- Role/scope checks for branch, class, assignment, time, and parent visibility.
- Idempotent absent-to-remedial trigger.
- Allocation matching and no-seat fallback.
- Teacher eligibility and workload gates.
- Moderation and promotion threshold rules.
- Event, audit, and notification side effects.
- Foreign-key and source-of-truth invariants.

### Static/build tests

- Module order and required namespace exports.
- Generated bundle and standalone HTML contain current source hashes.
- No external runtime dependency is required.
- All declared routes resolve to meaningful pages.
- No placeholder route or dead `data-action` remains.

### Browser smoke tests

- Complete canonical journey across role switches.
- Existing remedial happy path and retry behavior.
- Parent visibility restrictions.
- Direct-route RBAC denial.
- Reset and checkpoint determinism.
- CSV exports and print view.
- Desktop and mobile critical views.
- Console and page error count remain zero.

## 15. Completion Criteria

The work is complete when:

- All six business flows are reachable from the guided demo cockpit.
- The canonical learner moves from lead to accepted renewal using valid commands.
- Teacher qualification, assignment, delivery evidence, grading, moderation, and workload are demonstrated.
- Operational exceptions have interactive state transitions and ownership.
- Learner and parent views reflect only released and permitted data.
- Every high-impact decision has rule, evidence, owner, and audit.
- All role dashboards derive values from the shared state.
- Source is modular and produces working committed standalone artifacts.
- Automated domain/static tests pass.
- Browser verification passes on desktop and mobile with no console errors.
- Documentation, demo accounts, route map, limitations, and verification results match the implementation.

