# Demo Script — 10 đến 15 phút

## Chuẩn bị

1. Mở `OPEN-DEMO.html` hoặc chạy local server.
2. Vào **Hướng dẫn demo**.
3. Chọn **Reset về điểm bắt đầu**.
4. Không dùng dữ liệu cá nhân thật khi demo.

## 1. Mở bài — 1 phút

Thông điệp:

> Yen Center kết nối vận hành lớp, nội dung học và học bù trong một luồng dữ liệu. Điểm khác biệt chính là khi học sinh vắng, hệ thống tự giao đúng bài và theo dõi tới khi hoàn thành.

Trên Homepage, chỉ nhanh hai journey:

- Phụ huynh/học sinh: tìm chương trình, gửi tư vấn.
- Trung tâm/trường học: xem giải pháp, đặt lịch demo.

## 2. Teacher flow — 3 phút

1. Đăng nhập nhanh tài khoản Giáo viên.
2. Mở **Lịch & điểm danh**.
3. Chọn buổi `English Foundation 6A` đang mở.
4. Chọn **Tất cả có mặt**.
5. Đổi riêng Nguyễn Minh Anh thành **Vắng**.
6. Lưu điểm danh.
7. Nêu rõ hệ thống tự tạo đúng một nhiệm vụ học bù cho buổi và bài học đó.
8. Mở **Theo dõi học bù**, chỉ trạng thái, deadline và quản lý link.

Điểm cần nói:

- Trigger idempotent, không tạo trùng assignment.
- Teacher chỉ thấy lớp được phân công.
- Link có trạng thái/version và có thể thu hồi/gia hạn.

## 3. Student flow — 3 đến 4 phút

1. Đăng xuất.
2. Đăng nhập `HS6A001 / 123456`.
3. Mở **Bài học bù**.
4. Chọn nhiệm vụ vừa được giao.
5. Hoàn tất video demo để lưu progress.
6. Mở quiz.
7. Chọn **Điền đáp án demo 8/10**.
8. Nộp bài.
9. Chỉ kết quả `80/100` và trạng thái **Đã bù xong**.

Điểm cần nói:

- Dữ liệu không phải card tĩnh; trạng thái vừa được thay đổi trên cùng state.
- Điểm đạt mặc định 80% và có thể cấu hình.
- Bản prototype mới hiện thực đầy đủ single-choice; các question type khác là phạm vi thiết kế.

## 4. Admin/Reporting — 3 phút

1. Chuyển sang Admin từ Hướng dẫn demo hoặc đăng nhập lại.
2. Mở **Quản lý học bù** để thấy assignment vừa hoàn tất.
3. Mở **Báo cáo** để xem dữ liệu theo buổi học.
4. Mở **Audit Log** để thấy attendance trigger và completion event.
5. Mở **Yêu cầu liên hệ** để mô tả B2C/B2B/support inbox.
6. Mở **Tích hợp** và nói rõ các provider đang ở mock mode.

## 5. Kết thúc — 1 phút

Thông điệp:

> Bản này chứng minh product flow và trải nghiệm. Bước tiếp theo là chốt backend, security, integration provider và backlog production; không lấy prototype frontend làm cam kết rằng mọi tích hợp đã live.

## Backup route khi demo có lỗi trạng thái

- Vào `/demo-guide`.
- Chọn **Reset về điểm bắt đầu**.
- Chạy lại canonical flow.
