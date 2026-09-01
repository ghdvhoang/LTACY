# Verification Report — v2.0 Minimal

Ngày kiểm tra: 2026-08-31

## Automated smoke and E2E

| Check | Result |
|---|---|
| Public routes | 14/14 PASS |
| Authenticated routes | 31/31 PASS |
| Seed/data invariants | PASS |
| Direct URL RBAC | PASS |
| B2C form persistence | PASS |
| Guardian multi-profile chooser | PASS |
| Assignment link lifecycle | PASS |
| Teacher → Student → Admin core E2E | PASS |
| CSV export generation | PASS |
| Standalone HTML smoke | PASS |
| RBAC visual tokens | PASS |
| Console errors | 0 |
| Page errors | 0 |

## RBAC visual token verification

| Role | Computed accent |
|---|---|
| Student | `#155eef` |
| Teacher | `#087f5b` |
| TA | `#a55b08` |
| Admin | `#6e56cf` |

## Data invariants

- 74 students.
- 3 classes.
- 24 lessons.
- 128 video metadata records.
- 80 questions.
- 12 seeded remedial assignments.
- Không có lesson thiếu video reference.
- Không có assignment sai quan hệ Student → Class → Session → Lesson → Quiz.
- Không có attendance `ABSENT` bị thiếu assignment trong seeded state.

## Core E2E đã kiểm tra

1. Teacher mở session canonical.
2. Đặt Nguyễn Minh Anh thành `ABSENT`.
3. Lưu attendance và sinh đúng một remedial assignment.
4. Student đăng nhập và mở assignment.
5. Hoàn thành video, điền đáp án demo và submit quiz.
6. Assignment chuyển `COMPLETED` với `80/100`.
7. Admin audit log có `REMEDIAL_COMPLETED_AUTO`.
8. Báo cáo tạo được file CSV có nội dung.

## Lưu ý môi trường test

Prototype được kiểm tra bằng Chromium headless với standalone HTML và storage shim trong môi trường kiểm thử. Người dùng cuối vẫn nên chạy qua local server để có hành vi trình duyệt ổn định nhất.
