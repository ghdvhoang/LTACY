# START HERE — Yen Center Full Journey Demo v3.0

## Mở demo

1. Mở `OPEN-DEMO.html`, hoặc chạy `source/start-demo.sh` rồi vào `http://localhost:4173/#/demo-guide`.
2. Chọn **Demo Guide** trên header.
3. Dùng **Chạy tự động đến cuối** để tạo toàn bộ evidence, hoặc tải một trong **12 checkpoint** để bắt đầu tại milestone mong muốn.
4. Chọn **Reset demo** để quay về lead mới.

## Tài khoản demo

| Workspace | Login | Password/PIN |
|---|---|---|
| Admissions | `admissions@yencenter.demo` | `Demo@123` |
| Academic Manager | `academic@yencenter.demo` | `Demo@123` |
| Student Service | `service@yencenter.demo` | `Demo@123` |
| Finance | `finance@yencenter.demo` | `Demo@123` |
| Teacher | `teacher@yencenter.demo` | `Demo@123` |
| Teaching Assistant | `ta@yencenter.demo` | `Demo@123` |
| Learner | `HS6A001` | `123456` |
| Parent (hai hồ sơ) | `0901000002` | `123456` |
| Center Manager | `manager@yencenter.demo` | `Demo@123` |
| Admin | `admin@yencenter.demo` | `Demo@123` |

Màn hình đăng nhập và role switcher có quick access; không cần nhập password để demo.

## 12 checkpoint

`LEAD` → `PLACEMENT` → `PAID` → `ENROLLED` → `TEACHER_ASSIGNED` → `SESSION_DELIVERED` → `REMEDIAL_ASSIGNED` → `REMEDIAL_COMPLETED` → `MODERATED` → `PROGRESS_PUBLISHED` → `PARENT_REVIEWED` → `RENEWED`.

Mỗi checkpoint được dựng lại bằng chính command/business rule của demo, không thay card tĩnh. Tải lại cùng checkpoint trong phiên hiện tại cho ra cùng một snapshot.

## Luồng review nhanh — 10 phút

1. Ở Demo Guide, reset rồi chạy tới `ENROLLED`; mở Admissions, Finance và Student Service để xem handoff.
2. Chạy tiếp tới `SESSION_DELIVERED`; mở Academic assignment và Teacher session để xem hard gate, workload, lesson readiness, planned/taught gap.
3. Chạy tới `REMEDIAL_COMPLETED`; mở learner course/remedial và Teacher grading để xem video, quiz và homework revision loop.
4. Chạy tới `MODERATED`; mở Academic moderation để xem independent review.
5. Chạy tới `PARENT_REVIEWED`; mở Parent Progress, kiểm tra report publish và visibility-filtered feedback.
6. Chạy tới `RENEWED`; mở Manager Retention và Admin Audit Logs, thử **Xuất CSV** hoặc **In view**.

## Cách giới thiệu đúng

> Frontend demonstrator chứng minh một learner journey xuyên domain, role, evidence và audit theo handbook v1.1.

Không giới thiệu đây là production-ready, không nhập dữ liệu cá nhân thật và không nói các provider mock đã live.
