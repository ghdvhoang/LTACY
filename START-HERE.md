# START HERE — Lớp Tiếng Anh Cô Yến Frontend v3.0

## Mở demo

1. Mở `OPEN-DEMO.html`, hoặc chạy `source/start-demo.sh` rồi vào `http://localhost:4173/#/`.
2. Từ trang chủ, chọn **Đăng ký** để tạo tài khoản khách hoặc **Đăng nhập** để vào tài khoản học tập/nhân sự.
3. Không nhập dữ liệu cá nhân thật: toàn bộ dữ liệu chỉ được lưu cục bộ trong trình duyệt.

## Khách chưa đăng nhập và khách đã đăng nhập

- Khách chưa đăng nhập có thể xem chương trình, lịch khai giảng, sự kiện và gửi yêu cầu tư vấn.
- Khách đã đăng nhập có thêm **Tài khoản của tôi** để lưu chương trình quan tâm, đăng ký sự kiện, theo dõi yêu cầu tư vấn và thông báo.
- Tài khoản khách không có khóa học, điểm danh hay tiến độ học tập. Các mục này chỉ dành cho tài khoản Học viên.

## Tài khoản demo

Trang đăng nhập ưu tiên bốn tài khoản nhanh sau:

| Vai trò | Đăng nhập | Mật khẩu/PIN |
|---|---|---|
| Giáo viên | `teacher@yencenter.demo` | `Demo@123` |
| Trợ giảng | `ta@yencenter.demo` | `Demo@123` |
| Học viên Nguyễn Minh Anh | `HS6A001` | `123456` |
| Quản trị viên | `admin@yencenter.demo` | `Demo@123` |

Các vai trò chuyên môn trong hành trình nâng cao vẫn tồn tại để giữ đủ luồng cũ: `admissions@yencenter.demo`, `academic@yencenter.demo`, `service@yencenter.demo`, `finance@yencenter.demo`, `0901000002` (Phụ huynh), `manager@yencenter.demo`. Chúng không được đưa thành nhiều thẻ trên trang đăng nhập.

Màn hình đăng nhập và bộ chuyển tài khoản đều ưu tiên đúng bốn tài khoản chính; có thể bấm thẻ tài khoản nhanh mà không cần nhập mật khẩu.

## Luồng review nhanh — 10 phút

1. Ở trang chủ, kiểm tra hai nút **Đăng nhập** và **Đăng ký** trên desktop lẫn mobile.
2. Đăng ký một tài khoản khách; lưu một chương trình, đăng ký một sự kiện và gửi yêu cầu tư vấn.
3. Mở **Tài khoản của tôi** để kiểm tra các mục vừa tạo và thông báo liên quan.
4. Đăng xuất, đăng nhập Học viên để kiểm tra Course, bài học, bài kiểm tra, kết quả và tiến độ.
5. Đăng nhập Giáo viên để kiểm tra lớp, buổi học, điểm danh, học bù và Xưởng nội dung.
6. Đăng nhập Quản trị viên để kiểm tra người dùng, khóa học, báo cáo, nhật ký và xuất CSV/in trang.

## Cách giới thiệu đúng

> Bản minh họa frontend chứng minh một hành trình học viên xuyên miền nghiệp vụ, vai trò, bằng chứng và nhật ký theo handbook v1.1.

Không giới thiệu đây là production-ready, không nhập dữ liệu cá nhân thật và không nói các provider mock đã live.
