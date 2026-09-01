# PO/UI Review — International Minimal Redesign v2.0

## Kết luận về bản cũ

Bản v1.1 đúng luồng và có đủ data để demo, nhưng visual language còn mang dấu hiệu của giao diện AI-generated:

- Dùng quá nhiều gradient, pastel surface và rounded card.
- Homepage giống template SaaS chung, chưa kể rõ câu chuyện sản phẩm.
- Dashboard role khác nhau nhưng thiếu nhận diện không gian làm việc.
- Một số màn hình ưu tiên trang trí hơn hierarchy dữ liệu.

## Quyết định redesign

Bản v2.0 giữ nguyên functional baseline và thay đổi visual system theo năm quyết định:

1. Chuyển nền tảng sang neutral-first minimal UI.
2. Tách role bằng accent có kiểm soát theo RBAC.
3. Giữ semantic color độc lập với role color.
4. Homepage tập trung vào core promise: từ điểm danh đến kết quả học bù.
5. App ưu tiên scanability, thao tác nhanh và khả năng đọc bảng.

## Những gì không thay đổi

- Data schema và seed.
- Số lượng học sinh, lớp, lesson, video, quiz và assignment.
- Route map.
- Login demo.
- Permission behavior.
- Remedial workflow.
- Reporting/export.
- Audit and notification behavior.
- Integration mock behavior.

## Acceptance của visual redesign

- Bốn role có accent khác nhau và có thể nhận biết trong app shell.
- Không dùng role color để thay màu status nghiệp vụ.
- Public website không còn gradient hoặc fake product dashboard.
- Desktop app có neutral sidebar và data-first content area.
- Mobile critical flows không mất action.
- Không phát sinh console/page error trong luồng test.
