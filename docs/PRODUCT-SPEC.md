# MASTER SPEC — YEN CENTER LMS HỌC BÙ THÔNG MINH

**Loại tài liệu:** Product Design + Full-stack Working MVP Specification  
**Đối tượng sử dụng:** AI Design / AI Coding Agent / Product Designer / Frontend & Backend Engineer  
**Ngôn ngữ sản phẩm:** Tiếng Việt  
**Múi giờ mặc định:** Asia/Ho_Chi_Minh  
**Ngân sách định hướng:** 80.000.000 VNĐ  
**Mức độ hoàn thiện mục tiêu:** Working MVP phục vụ demo, kiểm chứng nghiệp vụ và đi deal; không tuyên bố production-ready ở quy mô lớn.

---

## 0. Chỉ thị bắt buộc dành cho AI thực thi

Hãy thiết kế và xây dựng một **ứng dụng web full-stack chạy được**, không chỉ tạo ảnh, Figma, HTML tĩnh hoặc các màn hình rời.

AI được quyền chọn framework và kiến trúc phù hợp, nhưng đầu ra bắt buộc phải có:

1. Public marketing website.
2. Authentication và RBAC thật.
3. Student Portal.
4. Teacher / Teaching Assistant Portal.
5. Admin Portal.
6. Classroom Management.
7. LMS và Content Management.
8. Question Bank, Quiz Builder và Grading.
9. Workflow học bù tự động chạy xuyên role.
10. Reporting, Export, Notification và Audit Log.
11. Database persistence thật.
12. Mock/sandbox adapters cho tích hợp bên ngoài.
13. Seed data nhất quán.
14. Automated E2E tests cho các luồng chính.
15. README để chạy local.
16. Giao diện responsive trên desktop, tablet và mobile.

Không được:

- Trả về chỉ một landing page hoặc một dashboard.
- Dùng dữ liệu hard-code riêng biệt trong từng component.
- Tạo button, menu hoặc form không hoạt động.
- Dùng Lorem Ipsum.
- Dựng các card số liệu không truy ngược được về dữ liệu seed.
- Giả vờ đã tích hợp dịch vụ bên ngoài khi chưa có credential.
- Tuyên bố watermark là DRM hoặc “chống quay lén tuyệt đối”.
- Tạo giao diện quá giống template AI: gradient tím-xanh dày đặc, glassmorphism, 3D character, card bo tròn ở mọi chỗ, testimonial giả.

---

# 1. Bối cảnh sản phẩm

Yen Center cần một nền tảng web kết nối ba nhóm hoạt động:

1. **Marketing và tuyển người quan tâm**
   - Giới thiệu trung tâm, chương trình học và giải pháp LMS.
   - Phục vụ đồng thời B2C và B2B.
   - Thu nhận yêu cầu tư vấn và đặt lịch demo.

2. **Vận hành lớp học**
   - Quản lý học sinh, giáo viên, trợ giảng, lớp, ca học, buổi học và điểm danh.
   - Giáo viên thao tác nhanh trên lớp.
   - Admin quản trị dữ liệu tập trung.

3. **Học tập và học bù**
   - Quản lý khóa học, bài học, video, tài liệu, question bank và quiz.
   - Khi học sinh vắng, hệ thống tự gán đúng bài học bù.
   - Học sinh xem video, làm bài, được chấm điểm và cập nhật trạng thái.
   - Giáo viên và admin theo dõi được tiến độ và báo cáo.

## 1.1 Giá trị cốt lõi

> Biến việc học bù từ một quy trình thủ công thành một luồng tự động, có nội dung đúng, có kết quả đo được và có thể truy vết.

## 1.2 Thông điệp bao trùm cho website

> Một nền tảng kết nối học sinh, giáo viên và trung tâm trong toàn bộ hành trình học tập.

---

# 2. Mục tiêu sản phẩm

## 2.1 Mục tiêu bắt buộc

- Demo được một sản phẩm có luồng xuyên suốt, không phải bộ mockup rời.
- Admin có thể tạo và quản lý dữ liệu nền.
- Giáo viên có thể mở lớp, tạo/mở buổi học và điểm danh.
- Học sinh bị đánh dấu vắng được tự động nhận bài học bù.
- Học sinh có thể học video, làm quiz và nhận kết quả.
- Khi đạt điều kiện, hệ thống chuyển bài học bù sang “Đã bù xong”.
- Giáo viên và admin thấy dữ liệu vừa thay đổi mà không cần sửa seed thủ công.
- Public form B2C/B2B phải lưu được vào database.
- Báo cáo và export phải tạo file thật.
- Quyền truy cập phải được kiểm tra cả ở UI lẫn API.

## 2.2 Mục tiêu không phải ưu tiên

- Tối ưu cho hàng trăm nghìn người dùng.
- Chứng nhận bảo mật doanh nghiệp.
- Hệ thống payment, CRM hoặc ERP.
- Native mobile app.
- DRM cấp enterprise.
- Multi-tenant hoàn chỉnh.
- SSO live với Google/Microsoft.
- Tích hợp SMS/Zalo/Bunny/Google Sheets production nếu chưa có credential.

---

# 3. Người dùng và vai trò

## 3.1 Public Visitor

Gồm:

- Phụ huynh.
- Học sinh mới.
- Người đang tìm hiểu chương trình.
- Chủ trung tâm/trường học muốn tìm giải pháp B2B.

Hành động:

- Xem thông tin.
- Xem chương trình/lịch học/tin tức/sự kiện/tài liệu.
- Gửi form tư vấn.
- Đặt lịch demo.
- Đi tới đăng nhập.

## 3.2 Student — Học sinh

Hành động:

- Xem dashboard cá nhân.
- Xem bài học và bài học bù được giao.
- Xem video.
- Làm quiz.
- Xem điểm, lời giải và tiến độ.
- Xem thông báo.
- Chỉnh sửa thông tin cá nhân ở mức cho phép.

Giới hạn:

- Chỉ xem dữ liệu của chính mình.
- Không xem danh sách hoặc điểm của học sinh khác.
- Không truy cập khu vực teacher/admin.

## 3.3 Teacher — Giáo viên

Hành động:

- Xem các lớp được phân công.
- Xem lịch và buổi học.
- Điểm danh.
- Theo dõi học bù và tiến độ học sinh.
- Tạo/sửa/publish nội dung theo quyền.
- Tạo câu hỏi và quiz.
- Chấm bài thủ công.
- Xem và xuất báo cáo lớp.

## 3.4 Teaching Assistant — Trợ giảng

Hành động:

- Xem lớp được phân công.
- Điểm danh.
- Xem tiến độ và học bù.
- Hỗ trợ nội dung ở mức hạn chế.
- Xem báo cáo lớp.

Giới hạn:

- Không quản lý account toàn hệ thống.
- Không thay đổi cấu hình hệ thống.
- Không publish/xóa nội dung nếu chưa được cấp quyền.
- Không xem lớp không được phân công.

## 3.5 Admin

Hành động:

- Quản trị toàn bộ user, role, lớp, enrollment, lịch, nội dung, quiz, học bù, báo cáo.
- Khóa/mở tài khoản.
- Chuyển lớp.
- Cấu hình business rule.
- Xem lead B2C/B2B.
- Xem audit log và notification outbox.
- Reset demo data.

---

# 4. Kiến trúc thông tin và route map

Một codebase có thể phục vụ cả public website và authenticated app. Kiến trúc phải cho phép tách `www` và `app` sau này, nhưng V1 không bắt buộc tách deployment.

## 4.1 Public Website

| Route | Trang |
|---|---|
| `/` | Homepage chung |
| `/phu-huynh-hoc-sinh` | Trang B2C |
| `/giai-phap-trung-tam` | Trang B2B |
| `/chuong-trinh` | Danh sách chương trình |
| `/chuong-trinh/:slug` | Chi tiết chương trình |
| `/lich-hoc` | Lịch học public |
| `/tin-tuc` | Danh sách tin tức |
| `/tin-tuc/:slug` | Chi tiết tin |
| `/su-kien` | Danh sách sự kiện |
| `/su-kien/:slug` | Chi tiết sự kiện |
| `/tai-lieu` | Tài liệu/thông báo public |
| `/faq` | Câu hỏi thường gặp |
| `/lien-he` | Liên hệ |
| `/login` | Đăng nhập |
| `/forgot-password` | Quên mật khẩu |
| `/verify-otp` | Xác thực OTP demo |

## 4.2 Student Portal

| Route | Trang |
|---|---|
| `/app/student/dashboard` | Tổng quan |
| `/app/student/lessons` | Bài học của tôi |
| `/app/student/lessons/:id` | Chi tiết bài học |
| `/app/student/remedial` | Danh sách bài học bù |
| `/app/student/remedial/:id` | Chi tiết bài học bù |
| `/app/student/quiz/:id` | Làm quiz |
| `/app/student/results` | Kết quả |
| `/app/student/progress` | Tiến độ |
| `/app/student/notifications` | Thông báo |
| `/app/student/profile` | Hồ sơ cá nhân |

## 4.3 Teacher / TA Portal

| Route | Trang |
|---|---|
| `/app/teacher/dashboard` | Tổng quan giáo viên |
| `/app/teacher/classes` | Lớp của tôi |
| `/app/teacher/classes/:id` | Chi tiết lớp |
| `/app/teacher/schedule` | Lịch dạy |
| `/app/teacher/sessions/:id` | Chi tiết buổi học |
| `/app/teacher/sessions/:id/attendance` | Điểm danh |
| `/app/teacher/remedial` | Theo dõi học bù |
| `/app/teacher/students/:id` | Hồ sơ và tiến độ học sinh |
| `/app/teacher/courses` | Khóa học |
| `/app/teacher/courses/:id` | Chi tiết khóa học |
| `/app/teacher/question-bank` | Ngân hàng câu hỏi |
| `/app/teacher/quizzes` | Danh sách quiz |
| `/app/teacher/quizzes/new` | Tạo quiz |
| `/app/teacher/quizzes/:id/edit` | Sửa quiz |
| `/app/teacher/grading` | Hàng đợi chấm thủ công |
| `/app/teacher/reports` | Báo cáo lớp |
| `/app/teacher/notifications` | Thông báo |

## 4.4 Admin Portal

| Route | Trang |
|---|---|
| `/app/admin/dashboard` | Tổng quan hệ thống |
| `/app/admin/users` | Tài khoản và RBAC |
| `/app/admin/students` | Học sinh |
| `/app/admin/teachers` | Giáo viên/Trợ giảng |
| `/app/admin/classes` | Lớp |
| `/app/admin/enrollments` | Enrollment/Chuyển lớp |
| `/app/admin/schedules` | Ca và lịch học |
| `/app/admin/sessions` | Buổi học |
| `/app/admin/courses` | Khóa học |
| `/app/admin/lessons` | Bài học |
| `/app/admin/videos` | Kho video |
| `/app/admin/questions` | Question Bank |
| `/app/admin/quizzes` | Quiz |
| `/app/admin/grading` | Chấm thủ công |
| `/app/admin/remedial` | Quản lý học bù |
| `/app/admin/reports` | Báo cáo |
| `/app/admin/contacts` | Yêu cầu tư vấn/demo |
| `/app/admin/content/news` | Tin tức |
| `/app/admin/content/events` | Sự kiện |
| `/app/admin/content/documents` | Tài liệu/thông báo |
| `/app/admin/notifications` | Notification log/outbox |
| `/app/admin/audit-logs` | Audit log |
| `/app/admin/integrations` | Cấu hình integration |
| `/app/admin/settings` | Cấu hình hệ thống |
| `/app/admin/demo` | Reset và quản lý demo data |

## 4.5 System Routes

| Route | Trang |
|---|---|
| `/403` | Không có quyền |
| `/404` | Không tìm thấy |
| `/500` | Lỗi hệ thống |
| `/maintenance` | Trạng thái bảo trì demo |

---

# 5. Public Marketing Website / Homepage

## 5.1 Mục tiêu

Homepage phục vụ đồng thời B2C và B2B nhưng phải tách rõ hai journey.

- B2C: phụ huynh/học sinh → tìm hiểu → đăng ký tư vấn.
- B2B: trung tâm/trường học → hiểu giải pháp → đặt lịch demo.
- User hiện hữu: đi tới đăng nhập.

## 5.2 Header chung

Desktop:

- Logo Yen Center.
- Trang chủ.
- Chương trình.
- Lịch học.
- Tin tức.
- Dành cho phụ huynh & học sinh.
- Giải pháp cho trung tâm.
- Liên hệ.
- Nút phụ: `Đăng nhập`.
- Nút chính thay đổi theo context:
  - Homepage/B2C: `Đăng ký tư vấn`.
  - B2B: `Đặt lịch demo`.

Mobile:

- Logo.
- Hamburger menu.
- Nút `Đăng nhập` luôn nhìn thấy.
- CTA chính nằm trong menu và cuối trang.

## 5.3 Homepage `/`

### Section 1 — Hero

Headline:

> Học tập liền mạch, vận hành lớp học nhẹ hơn.

Subheadline:

> Yen Center kết nối chương trình học, điểm danh, học bù, bài tập và kết quả trên cùng một nền tảng.

CTA:

- `Dành cho phụ huynh & học sinh`
- `Giải pháp cho trung tâm`
- Text link `Đăng nhập hệ thống`

Visual:

- Không dùng nhân vật 3D.
- Dùng ảnh giáo dục thật có license rõ ràng hoặc một product screenshot composition sạch.
- Có thể dùng một screenshot dashboard và một khối nhỏ thể hiện tiến độ học bù.
- Không sử dụng testimonial giả.

### Section 2 — Chọn hành trình

Hai card lớn:

1. **Phụ huynh & Học sinh**
   - Con nghỉ học vẫn có đúng bài cần học.
   - Video và bài tập có hướng dẫn.
   - Kết quả rõ ràng.
   - CTA `Khám phá chương trình`.

2. **Trung tâm & Trường học**
   - Quản lý lớp, giáo viên và điểm danh.
   - Tự động hóa học bù.
   - Theo dõi và xuất báo cáo.
   - CTA `Xem giải pháp`.

### Section 3 — Workflow học bù 5 bước

1. Giáo viên điểm danh.
2. Hệ thống tự gắn bài học phù hợp.
3. Học sinh xem video.
4. Học sinh làm quiz và nhận kết quả.
5. Hệ thống cập nhật `Đã bù xong`.

Phải trình bày dễ hiểu, không biến thành sơ đồ kỹ thuật.

### Section 4 — Lợi ích B2C

- Không bỏ lỡ bài học.
- Học đúng nội dung đã vắng.
- Xem lại trên điện thoại/tablet/máy tính.
- Làm bài và xem lời giải.
- Theo dõi kết quả rõ ràng.

### Section 5 — Lợi ích B2B

- Điểm danh nhanh.
- Tự động giao bài học bù.
- Quản lý khóa học, video, quiz.
- Theo dõi tiến độ theo lớp/học sinh.
- Báo cáo và export.

### Section 6 — Chương trình nổi bật

Hiển thị dữ liệu từ `Program` hoặc các course được bật public:

- Tên.
- Khối/lứa tuổi.
- Mô tả ngắn.
- Lịch học gần nhất.
- CTA `Xem chi tiết`.

### Section 7 — Dữ liệu minh họa có nguồn

Dùng dữ liệu seed, ghi nhãn `Dữ liệu minh họa` trong demo:

- 128 video bài giảng.
- 24 bài học.
- 80 câu hỏi mẫu.
- 3 chương trình học.

Không tạo số phần trăm hiệu quả hoặc số khách hàng không có dữ liệu.

### Section 8 — Tin tức và sự kiện

- 3 tin mới nhất.
- 2 sự kiện sắp tới.
- Link xem tất cả.

### Section 9 — CTA cuối

Chia hai nhánh:

- `Đăng ký tư vấn chương trình`
- `Đặt lịch demo giải pháp`

### Section 10 — Footer

- Logo và giới thiệu ngắn.
- Chương trình.
- Hỗ trợ.
- Liên hệ.
- Điều khoản và chính sách bảo mật dùng nội dung mẫu có cấu trúc rõ ràng, không để link chết.
- Social links chỉ hiển thị khi có URL cấu hình.

## 5.4 Trang B2C `/phu-huynh-hoc-sinh`

Các section:

1. Hero tập trung vào học sinh không bị mất nhịp.
2. Pain point của phụ huynh.
3. Quy trình học bù.
4. Trải nghiệm học sinh: video, quiz, lời giải.
5. Danh sách chương trình.
6. FAQ B2C.
7. Form đăng ký tư vấn.

### Form B2C

Trường bắt buộc:

- Họ tên phụ huynh.
- Số điện thoại.
- Tên học sinh.
- Khối/lớp.
- Nhu cầu.
- Thời gian mong muốn được liên hệ.
- Checkbox đồng ý xử lý thông tin.

Sau submit:

- Validate client/server.
- Lưu `ContactLead` với `type=B2C`.
- Hiển thị success state và mã yêu cầu.
- Admin thấy ngay trong `/app/admin/contacts`.
- Tạo notification nội bộ và audit log.

## 5.5 Trang B2B `/giai-phap-trung-tam`

Các section:

1. Hero: giảm thao tác vận hành và kiểm soát học bù.
2. Pain points:
   - Attendance rời rạc.
   - Giao bài học bù thủ công.
   - Không biết học sinh đã học hay chưa.
   - Báo cáo mất thời gian.
3. Capability overview:
   - Classroom.
   - LMS.
   - Assessment.
   - Workflow.
   - Reporting.
4. Sơ đồ flow học bù.
5. Các portal: Student, Teacher/TA, Admin.
6. Integration readiness.
7. Scope boundary minh bạch.
8. Form đặt lịch demo.

### Form B2B

Trường bắt buộc:

- Tên tổ chức.
- Họ tên người liên hệ.
- Chức danh.
- Email.
- Số điện thoại.
- Số lượng học sinh ước tính.
- Số cơ sở.
- Vấn đề đang gặp.
- Thời gian mong muốn demo.
- Checkbox đồng ý xử lý thông tin.

Sau submit:

- Lưu `ContactLead` với `type=B2B`.
- Admin xem được.
- Trạng thái mặc định `NEW`.
- Không xây CRM; chỉ có inbox và cập nhật trạng thái cơ bản.

## 5.6 Các trang public khác

### Chương trình

- Danh sách, filter theo khối/lứa tuổi.
- Chi tiết chương trình.
- Lịch học public.
- CTA tư vấn.

### Tin tức / Sự kiện / Tài liệu

- Admin CRUD.
- Public chỉ thấy item `PUBLISHED`.
- Có slug, thumbnail, ngày publish.
- Tài liệu download thật từ storage local/demo.
- Không lộ file private.

### FAQ

- Group theo B2C, B2B và sử dụng hệ thống.
- Search đơn giản.
- Admin CRUD hoặc cấu hình seed.

### Liên hệ

- Địa chỉ, số điện thoại, email.
- Form chung.
- Bản đồ chỉ hiển thị nếu có URL/embed được cấu hình.
- Không hard-code API key public.

### Support Widget / Chat hỗ trợ bất đồng bộ

- Có nút `Hỗ trợ` nổi ở các trang public.
- Widget không giả vờ là live chat có nhân viên trực tuyến.
- Người dùng chọn một nhu cầu: `Tư vấn khóa học`, `Hỗ trợ đăng nhập`, `Tìm hiểu giải pháp cho trung tâm`, hoặc `Khác`.
- Thu thập tối thiểu tên, số điện thoại/email và nội dung.
- Sau khi gửi, hệ thống tạo `SupportConversation`, `SupportMessage` và một `ContactLead` loại `SUPPORT`.
- Hiển thị phản hồi tự động: đã tiếp nhận, mã yêu cầu và thời gian dự kiến liên hệ.
- Admin xem hội thoại trong Contact Inbox, thêm note và đổi trạng thái.
- Không dùng WebSocket, không xây live-agent routing trong V1.

---

# 6. Identity & Access Management

## 6.1 Authentication

### Staff login

- Email + password.
- Remember me.
- Quên mật khẩu.
- OTP demo có countdown, resend, expiry và giới hạn số lần thử.
- Staff account có `email_verified_at`; verify email dùng cùng OTP flow trong demo mode.
- Lockout cơ bản sau số lần đăng nhập sai cấu hình được.
- Logout.
- Session timeout hợp lý.

### Student login

Cho phép hai cách:

1. Mã học sinh + mật khẩu/PIN.
2. Số điện thoại đăng ký + mật khẩu/PIN hoặc OTP demo.

Không yêu cầu học sinh chọn role trước; hệ thống tự điều hướng theo account.

## 6.2 Account Management

Admin có thể:

- Tạo tài khoản.
- Sửa thông tin.
- Khóa/mở khóa.
- Reset password/PIN.
- Gán role.
- Xem lần đăng nhập cuối.
- Xem trạng thái.
- Không xóa cứng user có dữ liệu liên quan; dùng deactivate.

## 6.3 RBAC

Quyền phải kiểm tra ở hai lớp:

- UI route/menu/action guard.
- Backend API authorization.

Không được chỉ ẩn menu.

### Ma trận quyền rút gọn

| Capability | Student | TA | Teacher | Admin |
|---|---:|---:|---:|---:|
| Xem dữ liệu cá nhân | Có | Có | Có | Có |
| Xem lớp được phân công | Không | Có | Có | Có |
| Điểm danh | Không | Có | Có | Có |
| Sửa attendance đã chốt | Không | Hạn chế | Có | Có |
| Xem tiến độ học sinh | Không | Lớp được phân công | Lớp được phân công | Tất cả |
| Tạo câu hỏi | Không | Theo quyền | Có | Có |
| Publish content | Không | Không mặc định | Có | Có |
| Chấm bài thủ công | Không | Theo quyền | Có | Có |
| Quản lý account | Không | Không | Không | Có |
| Cấu hình hệ thống | Không | Không | Không | Có |
| Xem audit log toàn hệ thống | Không | Không | Không | Có |
| Export báo cáo | Chỉ dữ liệu cá nhân nếu cần | Lớp được phân công | Lớp được phân công | Tất cả |

## 6.4 Trang lỗi quyền

- 403 rõ ràng.
- Có nút về dashboard phù hợp.
- Không hiển thị dữ liệu nhạy cảm trong error message.
- Ghi audit event khi có truy cập trái quyền đáng chú ý.

## 6.5 SSO

Không thuộc V1 live. Kiến trúc authentication phải cho phép thêm OAuth/OIDC/SAML sau này mà không thay toàn bộ user model.

---

# 7. Classroom Management

## 7.1 Student Management

Chức năng:

- Danh sách học sinh.
- Search theo tên, mã học sinh, số điện thoại.
- Filter theo lớp, trạng thái.
- Add/edit/deactivate.
- Xem profile.
- Import XLSX/CSV.
- Download template import.
- Preview và validate trước khi import.
- Báo lỗi theo từng dòng.
- Không import trùng mã học sinh.
- Xem lịch sử lớp và học bù.

Thông tin tối thiểu:

- Student code.
- Họ tên.
- Ngày sinh.
- Giới tính tùy chọn.
- Số điện thoại đăng ký.
- Email tùy chọn.
- Lớp hiện tại.
- Trạng thái.
- Ghi chú nội bộ.

## 7.2 Teacher / TA Management

- Danh sách.
- Add/edit/deactivate.
- Role Teacher hoặc TA.
- Chuyên môn/ghi chú.
- Lớp được phân công.
- Lịch dạy.
- Account status.

## 7.3 Class Management

Thông tin:

- Mã lớp.
- Tên lớp.
- Chương trình/khóa học.
- Giáo viên chính.
- Trợ giảng.
- Sức chứa.
- Ngày bắt đầu/kết thúc.
- Trạng thái: Draft, Active, Completed, Archived.
- Lịch học.
- Danh sách học sinh.

Chức năng:

- Create/edit/archive.
- Assign teacher/TA.
- Enroll student.
- Bulk enroll.
- Không xóa cứng lớp có dữ liệu attendance.

## 7.4 Enrollment và Chuyển lớp

Enrollment lưu:

- Student.
- Class.
- Start date.
- End date.
- Status.
- Reason.
- Created by.

Chuyển lớp:

1. Chọn học sinh.
2. Chọn lớp đích.
3. Chọn ngày hiệu lực.
4. Nhập lý do.
5. Hệ thống kết thúc enrollment cũ.
6. Tạo enrollment mới.
7. Ghi Transfer History.
8. Teacher lớp cũ không còn thấy học sinh ở dữ liệu hiện tại.
9. Teacher lớp mới nhìn thấy học sinh.
10. Lịch sử attendance cũ vẫn được giữ.

## 7.5 Schedule — Ca học

Cho phép:

- Tạo lịch lặp theo thứ trong tuần.
- Giờ bắt đầu/kết thúc.
- Khoảng ngày hiệu lực.
- Classroom/online note tùy chọn.
- Teacher/TA.
- Sinh các `ClassSession` theo lịch.
- Tạo session thủ công.
- Hủy/reschedule một session mà không phá lịch chung.

## 7.6 Class Session — Buổi học

Thông tin:

- Class.
- Ngày giờ.
- Teacher/TA.
- Lesson được map.
- Status: Scheduled, Open, Completed, Cancelled.
- Attendance completion status.
- Notes.

Chức năng:

- Open session.
- Map lesson.
- Edit notes.
- Mark completed.
- Cancel/reschedule.
- Xem attendance.
- Xem remedial assignments sinh từ session.

## 7.7 Attendance

UI:

- Danh sách học sinh.
- Mặc định `UNMARKED`.
- Action nhanh `Có mặt` / `Vắng`.
- Bulk `Tất cả có mặt`.
- Search.
- Sticky save bar trên mobile.
- Hiển thị số đã điểm danh/chưa điểm danh.

Business rule:

- Chỉ dùng trạng thái `PRESENT`, `ABSENT`, `UNMARKED` trong V1.
- Giáo viên/TA chỉ điểm danh lớp được phân công.
- Lưu thời gian và người thao tác.
- Sửa attendance phải ghi audit.
- Khi đổi sang `ABSENT`, kích hoạt workflow học bù.
- Trigger phải idempotent: không tạo hai assignment cho cùng student + session.
- Khi đổi từ `ABSENT` về `PRESENT`:
  - Nếu assignment chưa bắt đầu và progress = 0: chuyển `CANCELLED`, không xóa record.
  - Nếu assignment đã bắt đầu/hoàn tất: hiển thị cảnh báo và yêu cầu xác nhận; giữ lịch sử.
- Không cho hoàn tất session khi còn `UNMARKED`, trừ khi user có quyền override và nhập lý do.

---

# 8. Learning Management System

## 8.1 Course

Thông tin:

- Code.
- Title.
- Description.
- Level/grade.
- Thumbnail.
- Status: Draft, Published, Archived.
- Public visibility.
- Owner.
- Created/updated timestamps.

Chức năng:

- Create/edit/publish/archive.
- Duplicate.
- Search/filter.
- Gắn với class/program.

## 8.2 Curriculum Structure

Hierarchy:

```text
Course
└── Chapter / Unit
    └── Lesson
        ├── Video
        ├── Document
        ├── Text
        ├── Link / Embed
        └── Quiz
```

Chức năng:

- Thêm/sửa/xóa mềm chapter.
- Reorder chapter/lesson.
- Preview.
- Draft/publish.
- Không cho student xem draft.

## 8.3 Lesson

Thông tin:

- Title.
- Learning objectives.
- Summary.
- Chapter.
- Content items.
- Video.
- Documents.
- Quiz.
- Estimated duration.
- Publish status.

## 8.4 Video Management

Khả năng:

- Upload video demo hoặc nhập external ID/URL.
- Metadata: title, duration, thumbnail, provider.
- Player Full HD nếu source hỗ trợ.
- Playback speed: 0.75x, 1x, 1.25x, 1.5x, 2x.
- Track current time, watched seconds và progress percentage.
- Resume playback.
- Overlay watermark gồm student code và tên viết tắt khi học sinh xem.
- Watermark di chuyển vị trí theo khoảng thời gian để tăng tính răn đe.
- Không tuyên bố đây là DRM.
- Signed/access-controlled URL được mô phỏng hoặc thực hiện bằng app token.
- Không phụ thuộc vào một external URL dễ hỏng để demo.

Seed:

- 128 video metadata.
- Ít nhất 3–5 video playable thật trong local/demo.
- Có thể tái sử dụng file mẫu nhỏ cho nhiều lesson, nhưng metadata phải nhất quán.

## 8.5 Document / Link / Embed

- Upload PDF/DOC demo.
- Download file public/private đúng quyền.
- Add external link.
- Embed có whitelist cơ bản.
- Không render script tùy ý từ user input.

## 8.6 Mapping Lesson với Buổi học

- Mỗi ClassSession có thể gắn một lesson chính.
- Teacher/Admin được đổi mapping trước khi điểm danh.
- Khi đã có remedial assignment:
  - Đổi lesson phải cảnh báo.
  - Có tùy chọn cập nhật assignment chưa bắt đầu.
  - Không tự sửa assignment đã completed.
- Xem lịch sử mapping.

---

# 9. Content Authoring & Assessment

## 9.1 Authoring

Teacher/Admin có thể:

- Soạn lesson.
- Thêm video, text, document, link.
- Tạo đáp án và lời giải.
- Preview ở chế độ student.
- Save draft.
- Publish theo quyền.
- Clone lesson/quiz.

## 9.2 Question Bank

Thông tin câu hỏi:

- ID/code.
- Type.
- Prompt.
- Media/audio.
- Answer/options.
- Explanation.
- Difficulty.
- Tags.
- Course/chapter/lesson.
- Status.
- Created by.

Chức năng:

- Create/edit/archive.
- Search/filter.
- Reuse.
- Bulk tag.
- Preview.
- Không xóa cứng câu đã được dùng trong attempt; version hoặc archive.

## 9.3 Question Types

Tất cả các loại sau phải có thể tạo và làm được:

### Nhóm auto-grade bắt buộc

1. Single-choice multiple choice.
2. Multiple-choice nhiều đáp án.
3. Fill in the blank.
4. Audio prompt + lựa chọn/điền đáp án.
5. Sentence ordering.
6. True/False.
7. Matching.

### Nhóm manual-grade

8. Short answer.
9. Long essay.
10. File attachment.

Quy tắc:

- Objective types được chấm tự động.
- Short answer có thể cấu hình exact/keyword auto-grade, nhưng mặc định manual nếu không có rule.
- Essay và file attachment luôn đi vào grading queue.
- Mixed quiz có câu manual thì attempt ở trạng thái `PENDING_MANUAL_GRADING` cho tới khi chấm xong.
- Không hiển thị final pass/fail trước khi hoàn tất chấm manual.

## 9.4 Quiz Builder

Cấu hình:

- Title.
- Description/instructions.
- Course/lesson.
- Question selection.
- Point per question.
- Randomize question order.
- Randomize option order.
- Time limit.
- Number of attempts.
- Passing score.
- Open/close time.
- Deadline.
- Show answer/explanation:
  - Never.
  - After each attempt.
  - After final attempt.
  - After deadline.
- Status Draft/Published/Archived.

Chức năng:

- Create/edit/preview/publish.
- Add from question bank.
- Reorder.
- Validate total score.
- Không publish quiz không có câu hỏi.

## 9.5 Quiz Attempt

Student:

- Start.
- Timer.
- Navigate between questions.
- Autosave answers.
- Submit confirmation.
- Handle timeout.
- View result based on configuration.
- Retry if attempts remain.

System:

- Auto-grade objective questions.
- Calculate provisional/final score.
- Set `PENDING_MANUAL_GRADING` if needed.
- Record attempt number and timestamps.
- Prevent double-submit.
- Store answers in DB.

## 9.6 Manual Grading

Teacher/Admin:

- Queue filter theo class, quiz, status.
- View response.
- Enter score and feedback.
- Save draft/complete grading.
- Recalculate final result.
- Audit grader and timestamp.

## 9.7 Passing Rule

Default:

- Passing score = 80%.
- Attempts = 3.
- Deadline = configurable.
- Highest final score được dùng cho pass/fail.

Cho phép cấu hình theo quiz/course.

---

# 10. Remedial Learning — Học bù tự động

Đây là core differentiator và phải là luồng E2E tốt nhất.

## 10.1 Trigger

Trigger chính:

```text
Attendance chuyển sang ABSENT
```

Điều kiện:

- Student đang active enrollment trong class.
- Session có lesson mapping.

Nếu không có lesson mapping:

- Không tạo assignment lỗi.
- Tạo `RemedialIssue` hoặc flag `NEEDS_ASSIGNMENT`.
- Hiển thị cảnh báo cho Teacher/Admin.
- Cho phép gán lesson thủ công.
- Ghi audit.

## 10.2 Auto Assignment

Khi đủ điều kiện:

- Tạo một `RemedialAssignment`.
- Unique theo `student_id + session_id`.
- Gắn lesson tương ứng.
- Gắn quiz của lesson nếu có.
- Due date mặc định = ngày buổi học + 7 ngày, kết thúc 23:59 Asia/Ho_Chi_Minh.
- Tạo access token/link.
- Tạo notification.
- Ghi audit event.

## 10.3 Access & Link

- Link cá nhân hóa theo assignment.
- Yêu cầu student đã đăng nhập hoặc xác thực student code.
- Token có expiry.
- Student khác mở link phải nhận 403.
- Sau deadline:
  - Vẫn xem được nếu cấu hình cho phép.
  - Trạng thái hiển thị `Quá hạn`.
- Admin/Teacher có thể extend deadline và phải nhập lý do.

## 10.4 Learning Flow

Student:

1. Mở assignment.
2. Xem lesson và video.
3. Progress được lưu.
4. Làm quiz.
5. Nhận result.
6. Nếu chưa đạt và còn lượt, làm lại.
7. Nếu đạt, assignment hoàn tất.

## 10.5 Completion Rule

Mặc định:

- Final quiz score >= passing score.
- Video progress được tracking nhưng không chặn completion mặc định.

Admin có setting tùy chọn:

- `minimum_video_progress_for_completion`.
- Default = 0.
- Có thể đặt 80% nếu business muốn bắt buộc xem video.

Nếu quiz có manual-grade:

- Chưa hoàn tất cho tới khi final grading xong.

## 10.6 Status State Machine

Internal statuses:

- `ASSIGNED`
- `IN_PROGRESS`
- `PENDING_REVIEW`
- `NOT_PASSED`
- `COMPLETED`
- `OVERDUE`
- `CANCELLED`

UI labels:

| Internal | Hiển thị |
|---|---|
| ASSIGNED | Chưa bắt đầu |
| IN_PROGRESS | Đang học |
| PENDING_REVIEW | Chờ chấm |
| NOT_PASSED | Chưa đạt |
| COMPLETED | Đã bù xong |
| OVERDUE | Quá hạn |
| CANCELLED | Đã hủy |

Transitions:

```text
ASSIGNED -> IN_PROGRESS
IN_PROGRESS -> PENDING_REVIEW
IN_PROGRESS -> NOT_PASSED
IN_PROGRESS -> COMPLETED
NOT_PASSED -> IN_PROGRESS
PENDING_REVIEW -> NOT_PASSED
PENDING_REVIEW -> COMPLETED
ASSIGNED/IN_PROGRESS/NOT_PASSED -> OVERDUE
ASSIGNED -> CANCELLED
```

Manual override:

- Teacher/Admin có thể mark completed/cancelled.
- Bắt buộc nhập lý do.
- Ghi audit.
- UI phải phân biệt auto-completed và manual-completed.

## 10.7 Notifications

Tạo notification khi:

- Assignment được giao.
- Còn 1 ngày tới deadline.
- Assignment quá hạn.
- Quiz được chấm.
- Assignment completed.
- Deadline được gia hạn.

---

# 11. Student Portal

## 11.1 Dashboard

Hiển thị từ dữ liệu thật:

- Chào học sinh.
- Bài học bù cần làm.
- Deadline gần nhất.
- Progress tuần.
- Kết quả quiz gần đây.
- Thông báo chưa đọc.
- CTA `Tiếp tục học`.

Không hiển thị leaderboard nếu chưa có requirement.

## 11.2 Bài học của tôi

- List course/lesson được phép truy cập.
- Filter theo trạng thái.
- Progress.
- Open lesson.

## 11.3 Bài học bù

- Tabs: Tất cả, Chưa bắt đầu, Đang học, Chưa đạt, Đã bù xong, Quá hạn.
- Card/list gồm lesson, class session, deadline, progress, status.
- Sorting theo deadline.
- CTA đúng theo status.

## 11.4 Lesson Player

Desktop:

- Main content.
- Sidebar outline.
- Video player.
- Downloadable resources.
- Quiz CTA.

Mobile:

- Video full width.
- Sticky progress/action.
- Outline dạng accordion.

## 11.5 Quiz

- Timer.
- Progress questions.
- Autosave state.
- Accessible controls.
- Confirm before submit.
- Result and explanation based on config.
- Retry.

## 11.6 Kết quả và tiến độ

- Attempts.
- Score.
- Pass/fail.
- Video progress.
- Remedial completion.
- Không so sánh với học sinh khác.

---

# 12. Teacher / TA Portal

## 12.1 Dashboard

KPIs derived from DB:

- Số lớp được phân công.
- Buổi học hôm nay.
- Học sinh vắng gần đây.
- Bài học bù đang học.
- Quá hạn.
- Pending manual grading.

Widgets:

- Lịch hôm nay.
- Lớp cần điểm danh.
- Remedial exceptions.
- Recent activity.

## 12.2 Lớp của tôi

List:

- Class.
- Teacher/TA.
- Schedule.
- Student count.
- Attendance summary.
- Remedial summary.

Detail tabs:

- Tổng quan.
- Học sinh.
- Lịch/buổi học.
- Attendance.
- Học bù.
- Tiến độ.
- Báo cáo.

## 12.3 Điểm danh

- Tối ưu thao tác một chạm.
- Hoạt động tốt trên mobile.
- Save state rõ.
- Trigger remedial.
- Confirm/undo hợp lý.
- Audit.

## 12.4 Theo dõi học bù

Table/card:

- Student.
- Session missed.
- Lesson.
- Assigned date.
- Deadline.
- Video progress.
- Quiz score.
- Status.
- Action: view, extend, manual assign, override.

## 12.5 Student Detail

- Profile cơ bản.
- Enrollment.
- Attendance history.
- Remedial history.
- Quiz results.
- Progress timeline.
- Internal note theo quyền.

## 12.6 Content Authoring

Teacher được truy cập:

- Courses được sở hữu/phân công.
- Lesson editor.
- Question bank.
- Quiz builder.
- Manual grading.

TA:

- Xem và hỗ trợ theo permission.
- Không publish mặc định.

## 12.7 Reports

- Attendance.
- Remedial.
- Quiz.
- Progress.
- Filter chỉ trong lớp được phân công.
- Export thật.

---

# 13. Admin Portal

## 13.1 Dashboard

Dữ liệu thật:

- Active students.
- Active classes.
- Today sessions.
- Attendance completion.
- Absent count.
- Remedial assigned/in progress/completed/overdue.
- Pending grading.
- New B2C/B2B contacts.
- Integration outbox failures.

Charts:

- Attendance trend.
- Remedial status distribution.
- Completion trend.

Không dùng chart trang trí.

## 13.2 User & RBAC

- CRUD/deactivate.
- Role assignment.
- Account lock/unlock.
- Reset credentials.
- Permission preview.
- Audit.

## 13.3 Academic Management

- Students.
- Teachers/TAs.
- Classes.
- Enrollment/transfer.
- Schedule/session.
- Attendance correction.

## 13.4 Content Management

- Courses.
- Lessons.
- Videos.
- Questions.
- Quizzes.
- Publishing.
- Public Programs.
- News.
- Events.
- Documents.
- FAQ.

## 13.5 Remedial Administration

- Global list.
- Filter.
- Manual assign.
- Extend deadline.
- Override status.
- View issues without lesson mapping.
- Bulk reminder.

## 13.6 Contact Inbox

Không phải CRM.

Fields:

- Type B2C/B2B.
- Request code.
- Contact info.
- Submitted time.
- Status: New, Contacted, Qualified, Closed.
- Internal note.
- Assignee tùy chọn.

Actions:

- Change status.
- Add note.
- Export.
- Không có sales pipeline phức tạp.

## 13.7 Settings

- Center name/logo/contact.
- Default passing score.
- Default attempts.
- Default remedial deadline days.
- Minimum video progress.
- Notification toggles.
- Login/OTP demo settings.
- Integration mode: mock/live.
- File size limits.

## 13.8 Demo Management

- Hiển thị demo accounts.
- Nút `Reset dữ liệu demo`.
- Confirm modal.
- Chỉ Admin.
- Seed lại database về trạng thái chuẩn.
- Ghi audit event trước reset nếu hệ thống lưu audit ngoài DB reset; nếu không, hiển thị log ở server console.

---

# 14. Progress, Reporting & Export

## 14.1 Progress Tracking

Track:

- Video watched seconds.
- Video percentage.
- Lesson completion.
- Quiz attempts.
- Final score.
- Remedial status.
- Study time ước tính từ active interaction.

Không tính study time bằng cách chỉ mở tab; cần heartbeat hoặc activity signal ở mức prototype.

## 14.2 Reports

### Attendance Report

- Class.
- Student.
- Date range.
- Present/Absent.
- Attendance rate.
- Edited records flag.

### Remedial Report

- Student.
- Missed session.
- Lesson.
- Assigned/deadline/completed dates.
- Status.
- Video progress.
- Final score.
- Auto/manual completion.

### Quiz Report

- Quiz.
- Attempts.
- Score.
- Pass rate.
- Pending manual grading.

### Progress Report

- Lesson completion.
- Video progress.
- Quiz result.
- Remedial completion.

## 14.3 Filter

- Date range.
- Class.
- Teacher.
- Student.
- Course.
- Status.

## 14.4 Export

Phải tạo file tải được thật:

- CSV.
- XLSX.
- PDF.

Filename rõ ràng, ví dụ:

`bao-cao-hoc-bu-lop-6a-2026-09-01.xlsx`

Export phải tôn trọng filter và quyền.

## 14.5 Google Sheets

Demo mặc định:

- Nút `Đồng bộ Google Sheets`.
- Tạo sync job trong database.
- Mock adapter trả trạng thái sent/success.
- Hiển thị preview dữ liệu.
- Ghi notification/audit.
- Có luồng import mô phỏng bằng một trong hai cách:
  - Upload file CSV/XLSX được export từ Google Sheets; hoặc
  - Chọn một sheet mẫu seed sẵn trong Mock Adapter.
- Import phải có preview, validation và báo lỗi theo dòng; không ghi thẳng dữ liệu lỗi vào database.

Khi có credential:

- Adapter live có thể đọc, tạo và update Google Sheet theo quyền được cấp.

---

# 15. Cross-cutting Capabilities

## 15.1 Security

MVP bắt buộc:

- Hash password/PIN.
- Server-side session hoặc token an toàn.
- API authorization.
- Validate input.
- Sanitize rich text.
- File type/size validation.
- Không expose secret ở frontend.
- Không lộ dữ liệu student trong public page.
- Basic rate limit cho login/form.
- CSRF protection phù hợp với stack.
- Safe error messages.
- Không dùng sequential public ID cho link nhạy cảm nếu không có access guard.

Đây không phải security-certified production system.

## 15.2 Notification Center

In-app notification:

- Unread/read.
- Deep link.
- Created time.
- Category.

Outbound outbox:

- Email.
- SMS.
- Zalo.
- Mock/live status.
- Retry button cho Admin.
- Error message kỹ thuật không hiển thị cho Student.

## 15.3 Audit Log

Ghi ít nhất:

- Login/logout thất bại/thành công ở mức phù hợp.
- Create/update/deactivate user.
- Enrollment/transfer.
- Attendance changes.
- Lesson mapping changes.
- Quiz publish.
- Manual grading.
- Remedial override/deadline extension.
- Settings changes.
- Contact status changes.
- Integration actions.

Fields:

- Actor.
- Action.
- Resource type/id.
- Before/after summary.
- Timestamp.
- IP/user agent nếu stack hỗ trợ.
- Correlation/request ID.

## 15.4 Error Handling

Có:

- Inline validation.
- Toast success/error.
- Retry.
- Empty state có CTA.
- Loading skeleton hoặc progress.
- 403/404/500.
- Network failure simulation trong demo mode nếu dễ triển khai.

---

# 16. Integrations

Dùng adapter interface. Core domain không gọi trực tiếp vendor SDK.

## 16.1 Bunny Stream

Mock/local mode:

- Local sample video.
- Provider metadata giả lập.
- Progress tracking thật.
- Watermark thật ở UI.
- Access check thật.

Live mode:

- Chỉ kích hoạt khi có env credentials.
- Dùng video ID và signed URL theo provider.
- Không bắt buộc để acceptance local pass.

## 16.2 Email/SMS/Zalo

Mock mode:

- Tạo outbound record.
- Trạng thái `MOCKED` hoặc `SENT`.
- Xem body preview trong Admin.
- Retry/fail simulation.

Live mode:

- Cấu hình provider qua env.
- Không hard-code token.

## 16.3 Google Sheets

Như mục Reporting.

## 16.4 API

- REST/GraphQL/RPC tùy stack.
- Phải có service boundary rõ.
- Có API docs ngắn hoặc typed client.
- Không truy cập DB trực tiếp từ UI component.
- Thiết kế đủ để thay frontend hoặc integration sau này.

## 16.5 SSO

Architecture-ready nhưng out of scope live.

---

# 17. Data Model tối thiểu

AI có thể đổi tên bảng theo framework nhưng phải giữ quan hệ nghiệp vụ.

## 17.1 IAM

- `User`
- `Role`
- `Permission`
- `UserRole` hoặc role enum
- `Session/AuthAccount`
- `PasswordResetToken`
- `OtpChallenge`

## 17.2 Profiles

- `StudentProfile`
- `StaffProfile`

## 17.3 Classroom

- `Class`
- `ClassStaffAssignment`
- `Enrollment`
- `TransferHistory`
- `Schedule`
- `ClassSession`
- `AttendanceRecord`

## 17.4 LMS

- `Program`
- `Course`
- `CourseChapter`
- `Lesson`
- `ContentItem`
- `VideoAsset`
- `ClassSession.lesson_id` để giữ mapping hiện tại.
- `LessonSessionMappingHistory` để lưu mọi lần thay đổi mapping.

## 17.5 Assessment

- `Question`
- `QuestionOption`
- `Quiz`
- `QuizQuestion`; khi quiz được publish, record này phải lưu immutable snapshot của nội dung câu hỏi, đáp án, điểm và lời giải để lần sửa sau không làm thay đổi attempt cũ.
- `QuizAttempt`
- `QuizAnswer`
- `ManualGrade`

## 17.6 Remedial

- `RemedialAssignment`
- `RemedialIssue`
- `VideoProgress`
- `LessonProgress`

## 17.7 CMS/Public

- `NewsArticle`
- `Event`
- `PublicDocument`
- `FaqItem`
- `ContactLead`
- `SupportConversation`
- `SupportMessage`

## 17.8 Cross-cutting

- `Notification`
- `OutboundMessage`
- `AuditLog`
- `IntegrationConfig`
- `IntegrationSyncLog`
- `SystemSetting`

## 17.9 Trạng thái khuyến nghị

### User

- ACTIVE
- LOCKED
- INACTIVE

### Class

- DRAFT
- ACTIVE
- COMPLETED
- ARCHIVED

### Session

- SCHEDULED
- OPEN
- COMPLETED
- CANCELLED

### Attendance

- UNMARKED
- PRESENT
- ABSENT

### Content

- DRAFT
- PUBLISHED
- ARCHIVED

### Quiz Attempt

- IN_PROGRESS
- SUBMITTED
- PENDING_MANUAL_GRADING
- GRADED

### Contact Lead

Types:

- B2C
- B2B
- GENERAL
- SUPPORT

Statuses:

- NEW
- CONTACTED
- QUALIFIED
- CLOSED

---

# 18. Mock Data / Seed Data

Tất cả dashboard, report và luồng demo phải lấy từ cùng database seed.

## 18.1 Demo Accounts

| Role | Login | Password/PIN |
|---|---|---|
| Admin | `admin@yencenter.demo` | `Demo@123` |
| Teacher | `teacher@yencenter.demo` | `Demo@123` |
| TA | `ta@yencenter.demo` | `Demo@123` |
| Student | Mã `HS6A001` | `123456` |
| Student phone | `0901000001` | `123456` |

Login page phải có khu vực “Tài khoản demo” để copy nhanh trong demo mode.

## 18.2 User Dataset

- 2 Admin.
- 4 Teacher.
- 3 Teaching Assistant.
- 74 Student.
- Tên tiếng Việt tự nhiên.
- Không sử dụng dữ liệu người thật.

Teacher mẫu:

- Hoàng Yến.
- Lê Hải Nam.
- Phạm Thu Hương.
- Nguyễn Quốc Minh.

TA mẫu:

- Trần Mai Anh.
- Vũ Đức Long.
- Nguyễn Ngọc Hà.

Student canonical:

- Nguyễn Minh Anh — `HS6A001` — `0901000001`.

## 18.3 Classes

1. `ENG6A-T3T5-1800`
   - Tên: English Foundation 6A.
   - Teacher: Hoàng Yến.
   - TA: Trần Mai Anh.
   - 28 students.

2. `ENG7B-T2T4-1900`
   - Teacher: Lê Hải Nam.
   - TA: Vũ Đức Long.
   - 24 students.

3. `ENG5C-T7CN-0900`
   - Teacher: Phạm Thu Hương.
   - TA: Nguyễn Ngọc Hà.
   - 22 students.

## 18.4 Courses

- English Foundation 5.
- English Foundation 6.
- English Foundation 7.

Mỗi course:

- 4 chapter/unit.
- 2 lesson mỗi chapter.
- Tổng tối thiểu 24 lesson.

## 18.5 Video

- 128 metadata records.
- 5 playable sample videos.
- Có duration, thumbnail, provider, course/lesson mapping.
- Không sử dụng nội dung có vấn đề bản quyền.

## 18.6 Questions và Quizzes

- Tối thiểu 80 questions.
- Có đủ tất cả question types.
- Tối thiểu 8 quizzes.
- Một quiz canonical:
  - `Unit 5 – Lesson 2: Past Simple`.
  - 10 câu.
  - Passing score 80%.
  - 3 attempts.
  - 15 phút.

## 18.7 Sessions và Attendance

- 18 sessions.
- Có dữ liệu quá khứ, hôm nay và sắp tới.
- Có attendance present/absent.
- Có records đã chỉnh sửa để audit/report thể hiện được.

## 18.8 Remedial Assignments

Seed 12 assignments ở nhiều trạng thái:

- 2 ASSIGNED.
- 3 IN_PROGRESS.
- 2 NOT_PASSED.
- 1 PENDING_REVIEW.
- 2 COMPLETED.
- 2 OVERDUE.

Ngoài ra giữ một session chưa điểm danh để demo trigger từ đầu.

## 18.9 Public Content

- 3 programs.
- 6 news articles.
- 4 events.
- 6 public documents/announcements.
- 12 FAQ items.
- 8 contact leads gồm B2C và B2B.

## 18.10 Canonical Demo Story

Data relation:

```text
Class: English Foundation 6A
Session: 01/09/2026, 18:00
Lesson: Unit 5 – Lesson 2: Past Simple
Teacher: Hoàng Yến
Student: Nguyễn Minh Anh — HS6A001
Quiz: Unit 5 – Lesson 2 Check
Passing score: 80%
```

Trạng thái reset ban đầu:

- Session đang OPEN.
- Nguyễn Minh Anh đang UNMARKED.
- Chưa có remedial assignment cho session này.

Sau khi Teacher mark ABSENT:

- Assignment được sinh.
- Student login thấy assignment.
- Student xem video và làm quiz đạt 8/10.
- Assignment chuyển COMPLETED.
- Teacher/Admin report cập nhật.

---

# 19. Luồng E2E bắt buộc

## E2E-01 — Public B2C Lead

1. Mở homepage.
2. Chọn B2C.
3. Xem chương trình.
4. Điền form tư vấn.
5. Submit.
6. Nhận mã yêu cầu.
7. Login Admin.
8. Thấy lead mới trong Contact Inbox.
9. Đổi trạng thái thành Contacted.
10. Audit log có record.

## E2E-02 — Public B2B Demo Request

1. Mở B2B page.
2. Xem capability.
3. Điền form đặt demo.
4. Submit.
5. Admin thấy lead B2B.
6. Export contact list.

## E2E-03 — Admin Setup

1. Login Admin.
2. Tạo teacher hoặc student mới.
3. Tạo class.
4. Enroll student.
5. Gán teacher.
6. Tạo schedule/session.
7. Gắn lesson.
8. Dữ liệu xuất hiện đúng ở Teacher Portal.

## E2E-04 — Core Remedial Workflow

1. Reset demo data.
2. Login Teacher.
3. Mở lớp 6A.
4. Mở session canonical.
5. Mark Nguyễn Minh Anh ABSENT.
6. Save attendance.
7. Hệ thống tạo remedial assignment.
8. Logout.
9. Login Student `HS6A001`.
10. Thấy assignment mới.
11. Xem video đến progress được lưu.
12. Làm quiz đạt 8/10.
13. Assignment chuyển `Đã bù xong`.
14. Logout.
15. Login Teacher.
16. Thấy status và score.
17. Login Admin.
18. Report và audit có dữ liệu.
19. Export XLSX/PDF.

## E2E-05 — Quiz Không Đạt và Làm Lại

1. Student làm dưới 80%.
2. Status `Chưa đạt`.
3. Hiển thị lời giải theo config.
4. Attempts giảm.
5. Student retry.
6. Đạt lần 2.
7. Highest score được ghi nhận.
8. Remedial completed.

## E2E-06 — Manual Grading

1. Teacher tạo quiz có essay/file.
2. Student submit.
3. Attempt `Chờ chấm`.
4. Teacher mở grading queue.
5. Chấm và feedback.
6. Final score tính lại.
7. Pass/fail cập nhật.
8. Student nhận notification.

## E2E-07 — Transfer Class

1. Admin chuyển một student từ class A sang class B.
2. Enrollment cũ kết thúc.
3. Enrollment mới tạo.
4. Teacher A không thấy trong active roster.
5. Teacher B thấy student.
6. Lịch sử cũ vẫn truy cập được.
7. Audit log có record.

## E2E-08 — RBAC

1. Login TA.
2. Truy cập admin URL trực tiếp.
3. Nhận 403.
4. API không trả dữ liệu.
5. Login Teacher.
6. Truy cập class không được phân công.
7. Nhận 403.
8. Login Student.
9. Thử mở assignment student khác.
10. Nhận 403.

## E2E-09 — Import / Export

1. Admin download import template.
2. Upload file có record hợp lệ và record lỗi.
3. Preview.
4. Import record hợp lệ.
5. Hiển thị lỗi theo dòng.
6. Export report với filter.
7. File mở được và đúng dữ liệu.

## E2E-10 — Integration Sandbox

1. Admin bật mock mode.
2. Trigger remedial notification.
3. Outbound log được tạo.
4. Mock Email/Zalo/SMS có preview.
5. Google Sheets sync job thành công giả lập.
6. Audit log có action.
7. Không cần external credential.

---

# 20. UI Design System

## 20.1 Phong cách

Từ khóa:

- Education SaaS.
- Operational.
- Trustworthy.
- Clear.
- Human-designed.
- Practical.
- Modern nhưng không phô trương.

## 20.2 Điều cần tránh

- Gradient tím-xanh phủ toàn màn hình.
- Glassmorphism.
- Neon.
- 3D icon/character.
- AI-generated family/teacher imagery có cảm giác giả.
- Border radius quá lớn.
- Mỗi dòng dữ liệu đặt trong một card.
- Quá nhiều shadow.
- Dashboard toàn số lớn nhưng ít hành động.
- Fake testimonial.
- Fake partner logo.
- Marketing copy khoa trương.
- Animation gây chậm thao tác.

## 20.3 Color Tokens khuyến nghị

AI được tinh chỉnh nhưng giữ logic:

- Brand Navy: `#0F2B5B`.
- Primary Blue: `#2563EB`.
- Success Green: `#198754`.
- Warning Amber: `#D97706`.
- Danger Red: `#DC2626`.
- Text Primary: `#111827`.
- Text Secondary: `#4B5563`.
- Border: `#E5E7EB`.
- Page Background: `#F8FAFC`.
- Surface: `#FFFFFF`.

Không dùng màu để truyền trạng thái một mình; luôn kèm text/icon.

## 20.4 Typography

Ưu tiên font hỗ trợ tiếng Việt:

- Be Vietnam Pro.
- Inter.
- Hoặc system fallback.

Hierarchy:

- H1 public: 44–56px desktop, 34–40px mobile.
- H1 app: 28–32px.
- Body: 14–16px.
- Table: 13–14px.
- Line-height dễ đọc.

## 20.5 Layout

Public:

- Max width 1200–1280px.
- 12-column grid.
- Section spacing rõ.
- Hero không cao quá mức.

App:

- Sidebar desktop khoảng 232–256px.
- Topbar.
- Main content có max-width linh hoạt.
- Data tables dense nhưng readable.
- Detail pages dùng tabs khi hợp lý.
- Mobile dùng drawer.

## 20.6 Components bắt buộc

- Button variants.
- Input, select, date picker, phone input.
- Search.
- Filter bar.
- Table.
- Pagination.
- Status badge.
- Card.
- Tabs.
- Accordion.
- Modal.
- Drawer.
- Toast.
- Alert.
- Empty state.
- Loading skeleton.
- Error state.
- Breadcrumb.
- Stepper.
- Video player shell.
- Quiz question components.
- File uploader.
- Chart.
- Confirm dialog.
- Permission denied panel.

## 20.7 Status Colors

- PRESENT / COMPLETED / PUBLISHED: Green.
- ABSENT / FAILED / ERROR: Red.
- ASSIGNED / DRAFT: Neutral/Blue-gray.
- IN_PROGRESS: Blue.
- PENDING_REVIEW / WARNING: Amber.
- OVERDUE: Red/Orange.
- CANCELLED / ARCHIVED: Gray.

## 20.8 Visual Authenticity

- Public imagery phải có nguồn/license hoặc dùng product UI.
- Không tạo ảnh “người thật” giả làm testimonial.
- Dữ liệu marketing phải ghi `Dữ liệu minh họa` trong demo nếu chưa phải số thật.
- Copy tiếng Việt tự nhiên, không dịch máy.

---

# 21. Responsive & Accessibility

## 21.1 Breakpoints

- Desktop: >= 1280px.
- Laptop: 1024–1279px.
- Tablet: 768–1023px.
- Mobile: < 768px.

## 21.2 Mobile Critical Flows

Phải dùng tốt:

- Public form.
- Login/OTP.
- Teacher attendance.
- Student lesson/video.
- Student quiz.
- Remedial list.
- Notifications.

## 21.3 Table Responsiveness

- Ưu tiên cột quan trọng.
- Cho horizontal scroll khi cần.
- Trên mobile có thể chuyển thành card/list.
- Action không được bị mất.

## 21.4 Accessibility

- Semantic HTML.
- Label đầy đủ.
- Keyboard navigation.
- Focus visible.
- Contrast tối thiểu hợp lý.
- ARIA cho modal/menu/quiz nếu cần.
- Không auto-play video có âm thanh.
- Error message liên kết với field.
- Timer quiz không chỉ biểu diễn bằng màu.

---

# 22. Technical Constraints

AI tự chọn framework, nhưng phải tuân thủ:

## 22.1 Architecture

- Full-stack.
- TypeScript nếu ecosystem hỗ trợ.
- Relational database.
- Migration.
- Seed script.
- API/service layer.
- Domain/business rules tách khỏi UI.
- Integration adapters.
- Route-level và API-level auth.
- Có thể dùng monorepo hoặc single full-stack app.

## 22.2 Local Run

Chấp nhận một trong các cách:

```bash
docker compose up
```

hoặc tối đa:

```bash
npm install
npm run db:setup
npm run dev
```

README phải chính xác.

## 22.3 Persistence

- Không mất data sau refresh.
- Không dùng localStorage làm database chính.
- Có thể dùng SQLite local và PostgreSQL-ready.
- File demo lưu local storage directory hoặc object-storage adapter.

## 22.4 Environment

Có `.env.example`.

Nhóm biến:

- Database.
- Session/auth secret.
- Demo mode.
- Bunny.
- Google.
- Email/SMS/Zalo.
- File storage.
- App base URL.

Không commit secret thật.

## 22.5 Testing

Tối thiểu:

- Unit test cho remedial trigger/completion.
- Authorization test.
- Automated E2E cho E2E-04 và E2E-08.
- Ưu tiên thêm E2E-01, E2E-05 và E2E-09.
- Lint.
- Typecheck.
- Test command trong README.

## 22.6 Quality

- Không có console error trong happy path.
- Không có broken route.
- Không có dead button.
- Form có validation.
- Error handling.
- Seed/reset idempotent.
- Export mở được.
- Demo accounts hoạt động.

---

# 23. Acceptance Criteria theo module

## 23.1 Public Website

- Homepage có hai journey B2C/B2B.
- Header/footer responsive.
- Chương trình, news, events, documents lấy từ DB.
- Form lưu DB.
- Admin thấy contact.
- Không có link chết.

## 23.2 IAM

- Login theo role.
- Student login bằng student code/phone.
- Logout.
- Forgot password/OTP demo.
- Lock/unlock.
- Route/API RBAC.
- 403.

## 23.3 Classroom

- CRUD student/teacher/class.
- Import.
- Enrollment/transfer.
- Schedule/session.
- Attendance.
- Absent trigger.

## 23.4 LMS

- Course/chapter/lesson.
- Content.
- Video.
- Progress.
- Lesson-session mapping.

## 23.5 Assessment

- Question bank.
- Tất cả question types.
- Quiz builder.
- Auto/manual grade.
- Attempts.
- Pass rule.
- Explanation.

## 23.6 Remedial

- Idempotent assignment.
- Personalized access.
- Deadline.
- Progress.
- Completion.
- Overdue.
- Override.
- Notification.
- Audit.

## 23.7 Reporting

- 4 report groups.
- Filter.
- CSV/XLSX/PDF.
- Permission-aware.

## 23.8 Cross-cutting

- In-app notifications.
- Mock outbox.
- Audit.
- Basic security.
- Responsive.
- Error states.

---

# 24. Ngân sách và mức độ đầu tư

Tổng ngân sách định hướng: **80 triệu VNĐ**.

| Module | Chi phí định hướng | Tỷ trọng |
|---|---:|---:|
| Public Website / Homepage | 4 triệu | 5% |
| Identity & Access Management | 8 triệu | 10% |
| Classroom Management | 12 triệu | 15% |
| Learning Management System | 14 triệu | 17,5% |
| Content Authoring & Assessment | 12 triệu | 15% |
| Remedial Learning | 11 triệu | 13,75% |
| Progress, Reporting & Administration | 10 triệu | 12,5% |
| Cross-cutting Capabilities | 4 triệu | 5% |
| Integrations | 3 triệu | 3,75% |
| QA / Testing | 2 triệu | 2,5% |
| **Tổng** | **80 triệu** | **100%** |

## 24.1 Guardrail theo ngân sách

Tất cả module phải có luồng sử dụng được, nhưng độ sâu được kiểm soát:

- Core workflow phải hoàn chỉnh nhất.
- CRUD dùng pattern tái sử dụng.
- CMS public ở mức cơ bản.
- External integration mặc định mock/sandbox.
- Không pixel-perfect quá mức cho màn phụ.
- Không custom animation phức tạp.
- Không high-scale architecture.
- Không production SLA.
- Không triển khai những mục Out of Scope.

---

# 25. Out of Scope hiện tại

Không phát triển trong V1:

- Thanh toán học phí.
- CRM tuyển sinh đầy đủ.
- Live class/video conference.
- Native iOS/Android app.
- Parent Portal riêng.
- Marketplace khóa học.
- Multi-tenant nhiều trung tâm.
- White-label tenant management.
- SSO Google/Microsoft/Entra live.
- AI tutor hoặc AI tạo đề.
- Gamification/leaderboard.
- Payroll giáo viên.
- ERP/HRM.
- Advanced DRM.
- Data warehouse/BI enterprise.
- Disaster recovery/SLA production.
- Chat realtime.
- Marketplace/e-commerce.

Public contact inbox không được mở rộng thành CRM.

---

# 26. Deliverables bắt buộc

AI phải trả:

1. Source code hoàn chỉnh.
2. README.
3. `.env.example`.
4. Database migrations.
5. Seed script.
6. Demo reset command/UI.
7. Demo accounts.
8. Automated tests.
9. Hướng dẫn integration mock/live.
10. Route map.
11. RBAC matrix.
12. Data model/ERD đơn giản.
13. Screenshots hoặc short demo notes.
14. Danh sách limitation trung thực.
15. Không yêu cầu credential bên ngoài để chạy local.

---

# 27. Definition of Done

Chỉ coi là hoàn thành khi:

- Project cài và chạy theo README.
- Database seed thành công.
- Public site mở được.
- B2C/B2B form lưu được.
- Login đủ 4 role.
- Route/API RBAC hoạt động.
- Admin tạo/quản lý dữ liệu được.
- Teacher điểm danh được.
- ABSENT sinh remedial assignment.
- Student học và làm quiz được.
- Auto/manual grading hoạt động.
- Assignment completed khi đạt rule.
- Teacher/Admin thấy dữ liệu mới.
- Report filter hoạt động.
- Export tải được.
- Notification và audit có record.
- Reset demo hoạt động.
- Responsive critical flows.
- E2E core test pass.
- Không còn nội dung tạm chưa xử lý, route chết hoặc button chết.

---

# 28. Thứ tự triển khai khuyến nghị

1. Project foundation, design tokens, database.
2. IAM và RBAC.
3. Student/Teacher/Admin seed.
4. Classroom, class, enrollment, session.
5. Course/lesson/video.
6. Question bank/quiz/grading.
7. Remedial state machine.
8. Student Portal.
9. Teacher Portal.
10. Admin Portal.
11. Reporting/export.
12. Public website/contact.
13. Notifications/audit/integrations.
14. Responsive.
15. E2E tests và demo polish.

Không dựng toàn bộ giao diện trước rồi mới nối dữ liệu. Mỗi vertical slice phải đi từ UI → API → DB → quyền → test.

---

# 29. Output format mong muốn từ AI

AI nên bắt đầu bằng:

1. Tóm tắt kiến trúc đã chọn.
2. Lý do chọn stack.
3. Cấu trúc thư mục.
4. Data model.
5. Kế hoạch vertical slices.
6. Sau đó tạo source code chạy được.

Khi có mâu thuẫn:

- Ưu tiên core remedial workflow.
- Ưu tiên dữ liệu nhất quán.
- Ưu tiên bảo vệ quyền truy cập.
- Giữ đúng Out of Scope.
- Không tự thêm CRM, payment, parent portal, multi-tenant hoặc AI feature.

---

# 30. Prompt ngắn để đặt trước tài liệu khi gửi AI

> Hãy dùng toàn bộ tài liệu này làm source of truth để thiết kế và xây dựng một full-stack working MVP cho Yen Center LMS. Không chỉ tạo mockup hoặc HTML tĩnh. Mọi màn hình phải dùng chung database và đi được các luồng E2E đã mô tả. AI được tự chọn framework nhưng phải tuân thủ route map, RBAC, business rules, mock data, responsive behavior, integration adapter và Definition of Done. Giữ giao diện giống sản phẩm SaaS giáo dục do designer thực hiện thủ công, tránh phong cách AI template. Không mở rộng ngoài scope và không yêu cầu dịch vụ bên ngoài để chạy demo local.
