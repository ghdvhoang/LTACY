# Kịch bản kiểm tra demo frontend

## Chuẩn bị

Mở `#/demo-guide`, bấm **Đặt lại demo** rồi chọn **Bắt đầu demo chính**. Không nhập dữ liệu thật. Nguyễn Minh Anh (`HS6A001`) là hồ sơ duy nhất được theo xuyên các tài khoản.

## Luồng chính — 3 bước

### 1. Giáo viên điểm danh

1. Bản demo tự đưa Giáo viên tới buổi học mẫu đã hoàn tất giảng dạy.
2. Đánh dấu Nguyễn Minh Anh **Vắng**.
3. Bấm **Lưu điểm danh**.

Kết quả mong đợi: chỉ một bài học bù được tạo. Lưu lại không tạo bản ghi trùng.

### 2. Học viên hoàn thành bài học bù

1. Đăng xuất hoặc chuyển sang tài khoản Học viên `HS6A001 / 123456`.
2. Mở **Học bù**, chọn bài vừa được Giáo viên tạo.
3. Chạy video đến 100%, mở bài kiểm tra, dùng **Điền đáp án demo** nếu muốn rồi nộp bài.
4. Mở **Kết quả** để xem điểm và lịch sử lượt làm.

Kết quả mong đợi: đúng bài của Nguyễn Minh Anh xuất hiện dù thao tác điểm danh được thực hiện từ tài khoản Giáo viên; hoàn thành cần cả tiến độ video và điểm bài kiểm tra.

### 3. Quản trị viên kiểm tra

1. Chuyển sang tài khoản Quản trị viên `admin@yencenter.demo / Demo@123`.
2. Mở **Học bù**, **Báo cáo** và **Nhật ký**.
3. Có thể xuất CSV, in báo cáo hoặc thay đổi cấu hình demo.

Kết quả mong đợi: trạng thái, kết quả, sự kiện và nhật ký của cùng hồ sơ Nguyễn Minh Anh được nối xuyên suốt.

## Kiểm tra Course

1. Không đăng nhập: mở **Chương trình** để xem danh mục và chi tiết khóa học.
2. Học viên: mở **Khóa học** và một hoạt động để xem cây học phần, nội dung và tiến độ.
3. Giáo viên: mở **Nội dung** để xem khóa học, bài học, video, ngân hàng câu hỏi và tạo bản nháp nội dung.
4. Quản trị viên: mở **Khóa học** để kiểm kê phiên bản, bài học, hoạt động và bài kiểm tra.

Các màn hình trên cùng đọc một dữ liệu chương trình. Phiên bản đã công bố là bất biến; thao tác tạo nội dung sinh bản nháp riêng.

## Luồng nâng cao — 12 chặng

Mở phần **Hành trình đầy đủ** trong Hướng dẫn demo khi cần trình bày từ khách hàng tiềm năng đến gia hạn. Có thể chạy từng checkpoint hoặc chạy tự động đến cuối.

Chuỗi đầy đủ gồm: tư vấn → đầu vào → thanh toán → xếp lớp → phân công giáo viên → giảng dạy → điểm danh/học bù → bài tập → đánh giá/kiểm duyệt → báo cáo/lên lớp → phụ huynh xác nhận → gia hạn.

## Giới hạn

Đây là demo frontend dùng `localStorage`. Xác thực, phân quyền, thanh toán, tin nhắn, media và tích hợp bên ngoài đều là mô phỏng, chưa phải triển khai production.
