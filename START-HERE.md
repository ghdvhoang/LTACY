# START HERE — Yen Center LMS v2.0

## Mở demo

Mở `OPEN-DEMO.html`. Chrome hoặc Edge được khuyến nghị.

Khi cần chạy qua HTTP server:

- Windows: mở `source/start-demo.bat`.
- macOS/Linux: chạy `source/start-demo.sh`.

## Tài khoản demo

| Role | Login | Password/PIN | Accent |
|---|---|---|---|
| Admin | `admin@yencenter.demo` | `Demo@123` | Indigo |
| Giáo viên | `teacher@yencenter.demo` | `Demo@123` | Deep Teal |
| Trợ giảng | `ta@yencenter.demo` | `Demo@123` | Amber |
| Học sinh | `HS6A001` | `123456` | Cobalt Blue |
| Phụ huynh nhiều hồ sơ | `0901000002` | `123456` | Student flow |

Màn hình login có quick-login cho các tài khoản chính.

## Luồng demo khuyến nghị

1. Vào **Hướng dẫn demo** và reset về điểm bắt đầu.
2. Đăng nhập Giáo viên.
3. Vào **Lịch & điểm danh**, mở buổi lớp 6A.
4. Đánh dấu Nguyễn Minh Anh là **Vắng**, rồi lưu.
5. Đăng xuất và đăng nhập Học sinh `HS6A001`.
6. Mở bài học bù mới, hoàn tất video.
7. Chọn **Điền đáp án demo 8/10**, rồi nộp quiz.
8. Kiểm tra trạng thái **Đã bù xong**, điểm `80/100`.
9. Đăng nhập Admin để xem dashboard, report và audit log.

## Cách đọc màu

- Student: cobalt blue.
- Teacher: deep teal.
- TA: amber.
- Admin: indigo.

Role color chỉ nhận diện workspace. Success/Warning/Danger vẫn giữ semantic color nhất quán.

## Cách giới thiệu đúng

> Frontend working product prototype cho nền tảng quản lý lớp và học bù tự động.

Không giới thiệu đây là production-ready hoặc các tích hợp ngoài đã live.
