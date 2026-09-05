# Đặc tả demo v3.1 — Không mất luồng v2

## Mục tiêu

Demo v3.1 phải là tập hợp đầy đủ của v2 và hành trình nghiệp vụ v3. Không được thay một luồng tương tác v2 bằng dashboard chỉ đọc hoặc nút chạy tự động.

## Nguyên tắc trải nghiệm

- Toàn bộ nội dung người dùng nhìn thấy dùng tiếng Việt; mã định danh và mã sự kiện kỹ thuật được giữ nguyên khi cần truy vết.
- Màn hình đăng nhập chính chỉ có bốn tài khoản nhanh: Giáo viên, Trợ giảng, Học viên và Quản trị viên. Các vai trò nghiệp vụ nâng cao vẫn tồn tại trong dữ liệu và hành trình nâng cao nhưng không làm rối luồng đăng nhập chính.
- Tài khoản Học viên duy nhất liên kết với hồ sơ `student-canonical` / `HS6A001` / Nguyễn Minh Anh. Mọi thao tác trong luồng demo chính phải tác động đến hồ sơ này để khi đổi sang tài khoản Học viên có thể thấy ngay kết quả.
- Luồng mặc định là Giáo viên điểm danh → hệ thống giao bài bù → Học viên xem video/làm bài → Giáo viên và Quản trị viên xem kết quả.
- Luồng lead → renewal được giữ trong phần “Luồng nâng cao”.

## Course và nội dung

- Public có catalog chương trình và chi tiết lộ trình.
- Học viên có khóa học đang học, cây module/activity, trình phát video có tiến độ, quiz từng câu, giới hạn lượt làm, kết quả và lịch sử.
- Giáo viên có Content Studio, khóa học, ngân hàng câu hỏi, preview bài học và thao tác tạo bản nháp nội dung mẫu.
- Quản trị viên có tổng quan khóa học, bài học, video, câu hỏi và quiz.
- Academic giữ version khóa học immutable sau publish và nhìn thấy cấu trúc curriculum.
- Enrollment, lớp, session, lesson template, learning item, remedial và assessment phải dùng cùng một state.

## Luồng v2 phải được giữ

- Đăng nhập bằng mã/email và mật khẩu/PIN, đăng nhập nhanh, đăng xuất, quên mật khẩu, OTP mock và chọn hồ sơ học viên khi một tài khoản có nhiều hồ sơ.
- Giáo viên xem lớp, chi tiết lớp, danh sách buổi; chỉnh điểm danh từng học viên, đánh dấu cả lớp có mặt, hoàn tác và lưu.
- Attendance vắng tự sinh đúng một bài học bù; thao tác lưu lặp không tạo bản trùng.
- Học viên xem danh sách và chi tiết bài bù, mở video, lưu tiến độ, làm quiz từng câu, điền đáp án demo, nộp, xem điểm/lời giải/lịch sử và làm lại trong giới hạn.
- Quản lý link bài bù: sao chép, tạo lại, thu hồi và gia hạn.
- Public có tin tức, sự kiện, tài liệu, FAQ, điều khoản, chính sách và các form B2C/B2B/hỗ trợ có lưu vào Contact Inbox.
- Admin/Teacher có các danh sách quản lý và báo cáo v2: người dùng, học viên, giáo viên, lớp, enrollment, lịch, session, course/content, remedial, liên hệ, báo cáo, tích hợp, audit, thông báo và settings.
- Thêm học viên, đổi trạng thái lead, đánh dấu toàn bộ thông báo đã đọc, mock sync, tải tài liệu, in và xuất CSV theo từng tập dữ liệu.

## Ranh giới demo

- Không gọi backend hoặc nhà cung cấp thật.
- Auth, payment, messaging, video và sync đều là mô phỏng phía trình duyệt và phải được gắn nhãn rõ.
- Mọi thay đổi nghiệp vụ phải lưu vào state chung, tạo audit/event phù hợp và còn nguyên sau khi đổi tài khoản trong cùng trình duyệt.

