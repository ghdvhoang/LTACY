# Known Limitations — Full Journey Frontend Demo v3.0

## Security và dữ liệu

- State, actor và role scope nằm trong trình duyệt; người dùng DevTools có thể sửa chúng.
- Không có backend, server-side authorization, password hashing, session server, encryption at rest, immutable audit hoặc tenant isolation.
- Dữ liệu chỉ là seed giả lập; không dùng thông tin cá nhân thật.

## Tích hợp

- Payment, email/SMS/Zalo, media và identity provider đều là mock; không có credential hoặc outbound transaction.
- CSV được tạo thật trong browser. PDF dùng Print/Save as PDF của trình duyệt.
- Không có accounting/ERP, HRM/payroll, SSO, virtual classroom hoặc external test provider.

## Academic engine

- Canonical homework, remedial quiz, six-skill final, moderation và promotion chạy đầy đủ; đây chưa phải question bank/authoring/proctoring engine tổng quát.
- File/audio evidence là metadata demo, không upload vào object storage.
- Timetable có model và conflict evidence đại diện nhưng chưa có solver recurrence/room/holiday đầy đủ.
- Excused absence, reservation, withdrawal, class-wide reschedule và refund mới ở mức boundary/backlog, không phải full interactive workflow.

## Reporting và vận hành

- Dashboard tính trực tiếp từ in-memory/localStorage state, không phải analytics snapshot/warehouse.
- Không kiểm thử concurrent edit, offline merge, queue retry, migration production, backup/restore, disaster recovery hoặc large-scale performance.
- Notifications chỉ là record trong ứng dụng; không có delivery worker hay SLA.

## Browser

- Nên chạy qua local HTTP server để download và browser tooling ổn định nhất.
- `OPEN-DEMO.html` không cần dependency, nhưng chính sách bảo mật của một số browser hoặc embedded preview có thể chặn `file://`, download hoặc print.

## Product scope

- Release 3+ của handbook—AI, adaptive learning, standards, credentials, external certification và predictive optimization—không thuộc bản demo.
- Hướng giao diện lấy cảm hứng từ cách Coursera tổ chức việc học rõ ràng, không sao chép thương hiệu, nội dung hoặc tài sản thiết kế.
