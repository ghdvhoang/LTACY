# START HERE — Yen Center Full Journey Demo v3.0

## Mở demo

1. Mở `OPEN-DEMO.html`, hoặc chạy `source/start-demo.sh` rồi vào `http://localhost:4173/#/demo-guide`.
2. Chọn **Hướng dẫn demo** trên đầu trang.
3. Bấm **Bắt đầu demo chính** để đi theo 3 bước Giáo viên → Học viên → Quản trị viên.
4. Khi cần trình bày sâu, mở **Phần nâng cao** để dùng **Chạy tự động đến cuối** hoặc 12 checkpoint.

## Tài khoản demo

Trang đăng nhập chỉ hiển thị bốn tài khoản nhanh sau:

| Vai trò | Đăng nhập | Mật khẩu/PIN |
|---|---|---|
| Giáo viên | `teacher@yencenter.demo` | `Demo@123` |
| Trợ giảng | `ta@yencenter.demo` | `Demo@123` |
| Học viên Nguyễn Minh Anh | `HS6A001` | `123456` |
| Quản trị viên | `admin@yencenter.demo` | `Demo@123` |

Các vai trò chuyên môn trong hành trình nâng cao vẫn tồn tại để giữ đủ luồng cũ: `admissions@yencenter.demo`, `academic@yencenter.demo`, `service@yencenter.demo`, `finance@yencenter.demo`, `0901000002` (Phụ huynh), `manager@yencenter.demo`. Chúng không được đưa thành nhiều thẻ trên trang đăng nhập.

Màn hình đăng nhập và bộ chuyển tài khoản đều ưu tiên đúng bốn tài khoản chính; không cần nhập mật khẩu để demo.

## 12 checkpoint

`LEAD` → `PLACEMENT` → `PAID` → `ENROLLED` → `TEACHER_ASSIGNED` → `SESSION_DELIVERED` → `REMEDIAL_ASSIGNED` → `REMEDIAL_COMPLETED` → `MODERATED` → `PROGRESS_PUBLISHED` → `PARENT_REVIEWED` → `RENEWED`.

Mỗi checkpoint được dựng lại bằng quy tắc nghiệp vụ thật của demo, không thay thẻ tĩnh. Tải lại cùng checkpoint trong phiên hiện tại cho ra cùng một bản chụp dữ liệu.

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
