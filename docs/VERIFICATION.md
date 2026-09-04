# Verification Report — Full Journey Demo v3.0

Ngày kiểm tra: 2026-09-05

## Kết quả tự động

| Gate | Kết quả |
|---|---|
| Domain/policy/router/controller tests | 44/44 PASS |
| Static build/release/docs tests | 7/7 PASS |
| Standalone release build | PASS |
| Generated artifact freshness | PASS — 4/4 current |
| Runtime modules | PASS — 16/16 |
| `app.js` / `app.v3.js` parity | PASS |
| Root/source standalone parity | PASS |
| External CSS/JS trong standalone | 0 |
| `git diff --check` | PASS |

## Browser QA

Kiểm tra thủ công bằng in-app Chromium trên bản chạy HTTP:

- Public homepage và Demo Guide render đúng hierarchy, responsive shell và 12 checkpoint.
- `RENEWED` checkpoint mở ở 92% với renewal là next action; không còn báo hoàn tất sớm.
- **Chạy tự động đến cuối** đạt 100%, 12/12 milestone và hiện `Hành trình đã hoàn tất`.
- Role switcher mở/đổi được Admissions → Admin.
- Admin Audit Logs hiển thị canonical events, có **In view** và **Xuất CSV**.
- CSV action hoàn tất, button được re-enable và có success toast.
- Parent progress lọc internal/restricted feedback; Learner course có continue-learning và module affordance.
- Không có console/page error mới trong phiên QA sạch.

## Luồng canonical đã xác minh

1. Contact lead và book placement.
2. Ghi/release placement 6 skill.
3. Create/send/accept offer, issue invoice, record mock payment.
4. Allocate class sau capacity/fit gate.
5. Propose/accept teacher sau eligibility/workload gate.
6. Mark ready, start và complete session với planned/taught gap.
7. Finalize absence và tạo một remedial assignment.
8. Hoàn thành video + quiz, rồi homework feedback/revision/resubmission.
9. Manual final grade, moderation approval và result release.
10. Publish report, decide promotion với override evidence.
11. Parent acknowledgement theo visibility policy.
12. Create và accept next-level renewal.

## Regression được thêm trong self-review

- Checkpoint lặp lại trong cùng phiên cho snapshot ổn định.
- Journey phân biệt milestone cuối đang mở với toàn hành trình đã complete.
- Teacher qualification dùng transaction time, không dùng seed time cũ.
- Admin Data Health đọc `schemaVersion` thật.
- Audit CSV có UTF-8 BOM và chống spreadsheet formula injection.
- Direct route khác role bị chặn trước khi view được gọi.

Standalone `file://` được kiểm tra bằng static release invariant vì browser QA sandbox chặn điều hướng local file theo policy. File release không có dependency ngoài; người dùng cuối vẫn nên chạy HTTP khi cần download/print ổn định.
