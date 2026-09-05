# Frontend Demo Boundary — v3.0

## Loại sản phẩm bàn giao

Package là frontend working demonstrator, không phải full-stack MVP.

| Thành phần | Mức thực hiện |
|---|---|
| Public site, responsive role workspaces | Thực hiện thật trong browser |
| Canonical cross-role journey | Thực hiện thật bằng command/state transitions |
| Domain state | Normalized seed + `localStorage` schema v3 |
| Validation/policy | Client-side command gates và selectors |
| Event/audit/notification | Client-side records có traceability |
| Auth/RBAC | Role simulation + route/data visibility guard |
| Backend/API/database | Không có |
| Payment/message/media/identity | Mock adapter/record |
| Export | UTF-8 CSV; PDF qua browser Print/Save as PDF |

## Invariants được prototype hóa

- Offer, invoice, payment và enrollment là object riêng.
- Class không vượt capacity; allocation kiểm tra level, age, availability, branch và package/payment.
- Teacher assignment kiểm tra qualification, capability, branch/mode, availability, compliance và workload.
- Course version đã publish là snapshot bất biến trong demo.
- Session có readiness và delivery evidence riêng; planned content không bị dùng thay taught content.
- Attendance `ABSENT` tạo tối đa một remedial assignment theo learner/session.
- Remedial completion cần video threshold và quiz đạt ngưỡng.
- Homework completion cần feedback/revision evidence trong canonical story.
- Final result cần moderation trước release.
- Promotion override bắt buộc reason + evidence và được audit.
- Parent chỉ thấy learner được liên kết, report đã publish và feedback có visibility phù hợp.

## Definition of done cho demonstrator

1. Standalone và HTTP source build đồng nhất.
2. Public, learner, parent và mọi staff workspace render được.
3. Direct-route mismatch bị chặn theo role demo.
4. Canonical journey chạy được từ lead đến renewal.
5. Khách đăng ký cục bộ có thể lưu chương trình, sự kiện và yêu cầu tư vấn trong một tài khoản.
6. Domain command thất bại không để lại partial state.
7. Event, audit, notification và evidence nối đúng handoff.
8. CSV audit và browser print hoạt động.
9. Automated tests, static release verification và browser QA đều đạt.

Backend, database, server-side authorization, encrypted storage, tenant isolation, queue/outbox, provider credentials, observability và scale testing vẫn là production backlog bắt buộc.
