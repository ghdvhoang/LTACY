# Verification Report — Full Journey Demo v3.0

Ngày kiểm tra: 2026-09-05

## Kết quả tự động

| Gate | Kết quả |
|---|---|
| Kiểm thử nghiệp vụ/chính sách/router/controller | 74/74 PASS |
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

- Trang đăng nhập giữ biểu mẫu quen thuộc và đúng bốn tài khoản nhanh: Giáo viên, Trợ giảng, Học viên, Quản trị viên.
- Luồng sạch đã chạy qua Giáo viên điểm danh vắng → Học viên `HS6A001` nhận đúng bài → video 100% → bài kiểm tra 10 câu → kết quả 80/100.
- Dashboard Học viên hiển thị đúng 0% cho bài học bù mới, không dùng giá trị minh họa 42%.
- Course được kiểm tra ở Học viên, Xưởng nội dung Giáo viên và Quản trị khóa học Admin; cùng hiển thị một chương trình đã Việt hóa.
- Tạo bản nháp nội dung, tìm kiếm trong trang và lưu cấu hình Admin đều hoạt động.
- Mobile 390×844 không tràn ngang; thanh tìm kiếm desktop được ẩn đúng breakpoint và thanh điều hướng dùng nút mở.
- Không có lỗi hoặc cảnh báo trong console ở phiên QA sạch.

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

## Hồi quy được thêm trong tự rà soát

- Checkpoint lặp lại trong cùng phiên cho snapshot ổn định.
- Journey phân biệt milestone cuối đang mở với toàn hành trình đã complete.
- Teacher qualification dùng transaction time, không dùng seed time cũ.
- Admin Data Health đọc `schemaVersion` thật.
- Audit CSV có UTF-8 BOM và chống spreadsheet formula injection.
- Direct route khác role bị chặn trước khi view được gọi.
- Toàn bộ route cũ có kiểm thử parity; Course có kiểm thử xuyên trang công khai, Học viên, Giáo viên và Admin.
- Thông báo thao tác, dữ liệu khóa học mẫu và các enum hiển thị đã được Việt hóa.
- Sao chép liên kết có phương án dự phòng khi Clipboard API bị giới hạn trên `file://`.

Standalone `file://` được kiểm tra bằng static release invariant vì browser QA sandbox chặn điều hướng local file theo policy. File release không có dependency ngoài; người dùng cuối vẫn nên chạy HTTP khi cần download/print ổn định.
