# V2 Superset and Course Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Biến demo v3 thành superset của v2, hoàn thiện Course và giữ một hồ sơ học viên dùng chung xuyên tài khoản.

**Architecture:** Tiếp tục dùng runtime JavaScript module không framework và state v3 hiện có. Bổ sung command có audit/event cho mutation, view tương thích cho route v2 và controller xử lý form/action; bundle/standalone vẫn được sinh từ `source/modules` bằng script hiện tại.

**Tech Stack:** HTML, CSS, JavaScript thuần, Node.js test runner, Python unittest và build script hiện hữu.

**Spec:** `docs/V2-SUPERSET-SPEC.md`

## Global Constraints

- Toàn bộ nhãn và nội dung người dùng nhìn thấy dùng tiếng Việt.
- Chỉ bốn tài khoản nhanh ở đăng nhập chính: Giáo viên, Trợ giảng, Học viên, Quản trị viên.
- Mọi bước demo chính dùng `student-canonical` và state v3 chung.
- Không gọi backend hoặc provider thật.
- Không sửa trực tiếp các file bundle sinh tự động.

---

### Task 1: Authentication and Vietnamese navigation

**Files:**
- Modify: `source/modules/08-public-views.js`
- Modify: `source/modules/13-router.js`
- Modify: `source/modules/14-actions.js`
- Modify: `source/modules/15-bootstrap.js`
- Test: `tests/domain/auth-ui.test.cjs`

**Interfaces:**
- Consumes: `state.users`, `YC.selectors.roleHome`, actor storage key.
- Produces: `actions.authenticate(identifier, secret)`, routes `/forgot-password`, `/verify-otp`, `/select-profile`, action `logout` and four quick-login cards.

- [ ] Viết test thất bại xác nhận form credential, đúng bốn tài khoản nhanh, toàn bộ nhãn điều hướng tiếng Việt và các route recovery render nội dung thật.
- [ ] Chạy `node --test tests/domain/auth-ui.test.cjs` và xác nhận thất bại vì UI/handler chưa có.
- [ ] Cài đặt login/recovery/profile/logout và Việt hóa shell/nav/role label.
- [ ] Chạy lại test và toàn bộ `node --test tests/domain/*.test.cjs`.
- [ ] Commit thay đổi độc lập của Task 1.

### Task 2: Complete Course and content management

**Files:**
- Modify: `source/modules/02-seed.js`
- Modify: `source/modules/05-commands.js`
- Modify: `source/modules/08-public-views.js`
- Modify: `source/modules/09-learning-views.js`
- Modify: `source/modules/11-management-views.js`
- Modify: `source/modules/13-router.js`
- Modify: `source/modules/14-actions.js`
- Test: `tests/domain/course-superset.test.cjs`

**Interfaces:**
- Consumes: `courses`, `courseVersions`, `units`, `lessonTemplates`, `learningItems`, `assessments`, `questions`, `enrollments`.
- Produces: Course management routes, teacher Content Studio, preview, `CREATE_CONTENT_DRAFT`, `PUBLISH_COURSE_VERSION`, and learner activity/quiz detail routes.

- [ ] Viết test thất bại cho public catalog/detail, learner module/activity, teacher studio/question bank, admin course inventory và content mutation có audit.
- [ ] Chạy test riêng và xác nhận thất bại do route/action còn thiếu.
- [ ] Bổ sung state metadata, command và các view Course dùng chung dữ liệu.
- [ ] Chạy test riêng và toàn bộ domain tests.
- [ ] Commit thay đổi độc lập của Task 2.

### Task 3: Restore manual teacher attendance and shared learner flow

**Files:**
- Modify: `source/modules/10-operations-views.js`
- Modify: `source/modules/13-router.js`
- Modify: `source/modules/14-actions.js`
- Modify: `source/modules/15-bootstrap.js`
- Test: `tests/domain/attendance-ui.test.cjs`

**Interfaces:**
- Consumes: `FINALIZE_ATTENDANCE`, policy class assignment, `student-canonical`.
- Produces: teacher classes/detail/report/remedial routes, attendance draft actions and form submission payload `{sessionId, records}`.

- [ ] Viết test thất bại cho route lớp, editor điểm danh, all-present/reset/save và idempotent remedial assignment.
- [ ] Chạy test riêng và xác nhận thất bại vì editor chưa render/dispatch.
- [ ] Cài đặt attendance draft trong controller và view tương tác; mặc định chọn Nguyễn Minh Anh là vắng trong hướng dẫn.
- [ ] Chạy test riêng và toàn bộ domain tests.
- [ ] Commit thay đổi độc lập của Task 3.

### Task 4: Restore remedial player, real quiz and link lifecycle

**Files:**
- Modify: `source/modules/05-commands.js`
- Modify: `source/modules/09-learning-views.js`
- Modify: `source/modules/10-operations-views.js`
- Modify: `source/modules/14-actions.js`
- Modify: `source/modules/15-bootstrap.js`
- Test: `tests/domain/remedial-ui.test.cjs`

**Interfaces:**
- Consumes: `UPDATE_VIDEO_PROGRESS`, `SUBMIT_AUTO_ASSESSMENT`, shared assignment and question records.
- Produces: `/app/student/remedial/:id`, `/app/student/quiz/:id`, `/app/student/results`; commands for link regeneration/revocation/deadline extension and quiz form submission.

- [ ] Viết test thất bại cho player progress, question form, incomplete answer rejection, score/history và link lifecycle audit.
- [ ] Chạy test riêng và xác nhận thất bại đúng nguyên nhân.
- [ ] Cài đặt view, commands, controller form/action và trạng thái link.
- [ ] Chạy test riêng và toàn bộ domain tests.
- [ ] Commit thay đổi độc lập của Task 4.

### Task 5: Restore public content, inbox, admin compatibility and utilities

**Files:**
- Modify: `source/modules/02-seed.js`
- Modify: `source/modules/05-commands.js`
- Modify: `source/modules/08-public-views.js`
- Modify: `source/modules/10-operations-views.js`
- Modify: `source/modules/11-management-views.js`
- Modify: `source/modules/13-router.js`
- Modify: `source/modules/14-actions.js`
- Modify: `source/modules/15-bootstrap.js`
- Test: `tests/domain/v2-route-parity.test.cjs`

**Interfaces:**
- Consumes: all v2 route inventory in `docs/V2-SUPERSET-SPEC.md` and current state collections.
- Produces: every public/student/teacher/admin v2 route, persisted contact/support submissions, add learner, lead status, notification read, mock sync, download/print and typed CSV exports.

- [ ] Viết route-parity test thất bại cho toàn bộ route v2 và controller tests cho từng mutation/export utility.
- [ ] Chạy test riêng và xác nhận các route/action thiếu.
- [ ] Cài đặt view tương thích, command và handler; giữ dashboard v3 ở các route mới.
- [ ] Chạy test riêng và toàn bộ domain tests.
- [ ] Commit thay đổi độc lập của Task 5.

### Task 6: Simplify guided journey and verify release

**Files:**
- Modify: `source/modules/12-demo-guide.js`
- Modify: `source/modules/13-router.js`
- Modify: `README.md`
- Modify: `docs/DEMO-SCRIPT.md`
- Modify: `docs/HANDBOOK-COVERAGE-v1.1.md`
- Modify: `docs/VERIFICATION.md`
- Modify: `docs/CHANGELOG.md`
- Test: `tests/domain/demo-controller.test.cjs`
- Test: `tests/static/test_release_docs.py`

**Interfaces:**
- Consumes: restored teacher/student/admin routes and advanced canonical controller.
- Produces: default 3-stage guided flow plus collapsed “Luồng nâng cao”, current standalone artifacts and coverage evidence.

- [ ] Viết test thất bại cho guide mặc định Giáo viên → Học viên → Quản trị viên và liên kết luồng nâng cao.
- [ ] Chạy test riêng và xác nhận guide cũ chưa đáp ứng.
- [ ] Cập nhật guide, docs và release metadata.
- [ ] Chạy `python3 scripts/build_standalone.py --release`, rồi kiểm tra freshness, domain, static, validator và `git diff --check`.
- [ ] QA thủ công qua HTTP cho desktop/mobile, bốn account, Course, attendance, remedial quiz, admin inbox/report và advanced journey; sửa mọi lỗi rồi chạy lại toàn bộ gate.
- [ ] Commit release v3.1 khi tất cả bằng chứng đều đạt.

## Self-review

- Spec coverage: sáu task bao phủ auth, Course, teacher attendance, student remedial/quiz, public/admin parity, guided flow và release.
- Placeholder scan: không có TBD/TODO hay bước “làm tương tự”.
- Type consistency: mọi luồng dùng state v3; mutation đi qua command/controller; learner dùng `student-canonical`; artifact chỉ sinh bằng build script.

