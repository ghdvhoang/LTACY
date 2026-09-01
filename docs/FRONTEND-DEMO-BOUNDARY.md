# Frontend Demo Boundary — v2.0

Tài liệu này bổ sung cho `PRODUCT-SPEC.md` và làm rõ mức triển khai của package hiện tại.

## 1. Loại sản phẩm bàn giao

Package là **frontend working demonstrator**, không phải full-stack MVP như target architecture trong Master Spec.

| Thành phần | Mức thực hiện trong package |
|---|---|
| UI, route và responsive | Thực hiện thật |
| Cross-role business flow | Thực hiện thật trong browser |
| Shared state | `localStorage` |
| Authentication/RBAC | Mô phỏng frontend |
| Backend/API/Database | Chưa có |
| Integration provider | Mock/sandbox |
| Export | CSV thật; PDF qua browser print |
| Automated verification | Route/data invariant/core flow smoke tests |

## 2. Rule được prototype hóa

- Attendance `ABSENT` tạo tối đa một assignment theo `student + session`.
- Session canonical phải có lesson/quiz hợp lệ.
- Assignment completion mặc định cần quiz score ≥ passing score; video threshold theo settings.
- Link có `ACTIVE/REVOKED`, expiry và version.
- Teacher/TA data scope giới hạn theo class được phân công ở UI/export.
- Admin thấy dữ liệu toàn hệ thống.
- Overdue được hiển thị cùng lifecycle status để không mất trạng thái học tập.

## 3. Canonical demo record

```text
Class: English Foundation 6A
Teacher: Hoàng Yến
Student: Nguyễn Minh Anh — HS6A001
Session: buổi đang mở trong seed
Lesson: Unit 4 – Lesson 2: Past Simple
Passing score: 80%
```

## 4. Acceptance cho frontend demonstrator

Package được coi là đạt khi:

1. Mở được bằng local server và standalone HTML.
2. Public critical pages render được.
3. Đăng nhập/chuyển role demo được.
4. Teacher mark absent sinh assignment.
5. Student hoàn thành video/quiz và assignment cập nhật.
6. Teacher/Admin thấy dữ liệu mới.
7. RBAC direct route trả 403 trong UI.
8. Lead B2C/B2B/support lưu được.
9. Link regenerate/revoke/extend hoạt động.
10. Reset dữ liệu đưa canonical flow về điểm đầu.
11. Không có JavaScript/page error trong happy path được kiểm thử.

## 5. Production backlog bắt buộc

Master Spec vẫn là nguồn định hướng cho backend, database, server-side RBAC, file storage, provider integrations, automated tests đầy đủ, observability và security hardening. Các hạng mục này không được coi là hoàn thành chỉ vì demonstrator có UI tương ứng.
