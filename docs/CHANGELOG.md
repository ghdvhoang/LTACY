# Changelog

## Chưa phát hành — Bản demo tiếng Việt và tương thích luồng cũ

- Giữ nguyên toàn bộ route cũ và bổ sung kiểm thử đối chiếu route tự động.
- Khôi phục đăng nhập bằng thông tin tài khoản, quên mật khẩu/OTP và đúng bốn tài khoản truy cập nhanh.
- Hoàn thiện Course từ danh mục công khai đến khu học viên, Content Studio và quản trị khóa học.
- Bổ sung điểm danh thủ công, học bù, trình phát video, bài kiểm tra 10 câu, kết quả và vòng đời liên kết.
- Chuyển giao diện sang tiếng Việt, rút luồng demo chính còn ba bước và giữ hành trình 12 chặng trong phần nâng cao.
- Bổ sung biểu mẫu quản trị cấu hình, tìm kiếm trong trang và sao chép liên kết khi chạy bằng `file://`.

## v3.0.0 — Full Journey Frontend Demo (2026-09-05)

- Rebuilt the frontend around a normalized Language Center domain state.
- Added a 12-milestone canonical journey from lead to next-level renewal.
- Added Admissions, Finance, Student Service, Academic, Teacher, Learner, Parent, Manager and Admin workspaces.
- Added command validation, atomic transactions, domain events, audit records and notifications.
- Added placement/allocation rules, teacher eligibility/workload, planned-vs-taught delivery, remedial learning, homework revision, moderation, promotion and renewal.
- Added deterministic demo checkpoints, audit CSV export and browser print.
- Added handbook v1.1 coverage matrix and explicit frontend/production boundary.

## v2.0 — International Minimal

## Changed

- Thiết kế lại toàn bộ public website theo phong cách editorial/product minimal.
- Thay hero generic bằng message tập trung vào workflow học bù.
- Thay fake dashboard composition bằng activity ledger có dữ liệu truy vết.
- Chuyển app shell từ dark/navy-heavy sang neutral light workspace.
- Thay ký tự viết tắt bằng outline SVG icons.
- Giảm radius, shadow, gradient và số lượng decorative surfaces.
- Chuẩn hóa typography, spacing và information hierarchy.
- Thêm role chip trong topbar và role context trong sidebar.
- Áp dụng role accent theo Student, Teacher, TA và Admin.
- Chuẩn hóa responsive behavior cho public site và attendance.

## Preserved

- Toàn bộ business flow và action handler.
- Toàn bộ mock data và state relationship.
- Route, login và RBAC behavior.
- Workflow học bù và quiz.
- Reporting, audit, notification và integration mock.

## Functional changes

Không có thay đổi có chủ đích về nghiệp vụ trong release này.
