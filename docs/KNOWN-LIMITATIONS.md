# Known Limitations — đọc trước khi demo hoặc handoff

## 1. Security và persistence

- Dữ liệu nằm trong `localStorage` của trình duyệt.
- Login/RBAC chỉ là mô phỏng frontend; người có DevTools có thể sửa state.
- Không có backend API, database, password hashing, session server hoặc authorization server-side.
- Không dùng prototype cho dữ liệu thật hoặc môi trường production.

## 2. Integrations

- Bunny Stream, Google Sheets, Email, SMS và Zalo đều là mock/sandbox representation.
- Không có provider credential hoặc outbound delivery thật.
- Watermark là lớp răn đe trên UI, không phải DRM.
- Link học bù được quản lý theo state demo; không phải signed URL production.

## 3. Assessment

- E2E quiz player hoàn thiện cho single-choice.
- Các loại multiple-answer, fill blank, audio, ordering, matching, essay và file upload mới được mô tả/đại diện ở Content Studio; chưa phải engine hoàn chỉnh.
- Manual grading production chưa được xây dựng.

## 4. Reporting và file

- CSV export hoạt động bằng browser download.
- PDF sử dụng chức năng Print/Save as PDF của trình duyệt.
- Google Sheets sync chỉ tạo mock job/status.
- KPI giờ công tiết kiệm là ước tính theo số assignment × phút thao tác cấu hình.

## 5. Public website

- Content, địa chỉ, email và chương trình là mock data để minh họa.
- Không có analytics, SEO pipeline, CMS backend hoặc form anti-spam production.
- Terms/Privacy là nội dung minh họa, cần legal review trước khi dùng thật.

## 6. Scope và performance

- Prototype tập trung vào happy path và các exception quan trọng nhất.
- Chưa kiểm thử scale, concurrency, data migration, backup/restore hoặc disaster recovery.
- Không có multi-tenant, parent portal riêng, payment, CRM đầy đủ, live class hoặc native mobile app.

## 7. Browser

- Nên chạy qua local HTTP server để clipboard và download ổn định hơn.
- Mở standalone bằng `file://` vẫn dùng được luồng chính, nhưng một số browser có thể hạn chế clipboard/download.
