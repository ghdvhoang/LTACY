# Thiết kế Yen — Website công khai, phân quyền và vận hành học tập

**Ngày:** 2026-09-05  
**Trạng thái:** Đã chốt thiết kế trong hội thoại, chờ người dùng review bản đặc tả  
**Phạm vi:** Demo frontend chạy độc lập, dùng chung state trong trình duyệt  
**Tham chiếu nghiệp vụ:** `LMS_Language_Center_Visual_Domain_Handbook_v1.1.md`  
**Tham chiếu hình ảnh:** năm ảnh bố cục website Apollo do người dùng cung cấp; chỉ dùng để tham khảo cấu trúc, không sao chép thương hiệu hoặc tài sản hình ảnh

## 1. Mục tiêu

Nâng cấp demo hiện tại thành một hệ thống Yen có ba phần dùng chung dữ liệu:

1. Website công khai mang thương hiệu **Lớp Tiếng Anh Cô Yến**.
2. Hệ thống phân quyền chi tiết theo vai trò, tài khoản và phạm vi dữ liệu.
3. Chuỗi vận hành có thể truy vết từ Khóa học → Phiên bản → Lớp → Buổi học → Điểm danh → Hồ sơ học bù.

Các thay đổi do Giáo viên đề xuất đối với Khóa học, Lớp học và Buổi học phải chờ Admin duyệt. Sau khi duyệt, thay đổi xuất hiện trên mọi workspace liên quan mà không cần đồng bộ thủ công.

## 2. Các quyết định đã chốt

- Thương hiệu hiển thị: **Lớp Tiếng Anh Cô Yến**.
- Logo ngang đã được làm sạch và lưu tại `source/assets/yen-logo-horizontal.png`.
- Quyền mặc định được cấu hình theo vai trò; Admin có thể cấp thêm hoặc thu hồi theo từng tài khoản.
- Quyền cá nhân có độ ưu tiên cao hơn quyền vai trò.
- Giáo viên có thể được cấp quyền đề xuất tạo, sửa hoặc lưu trữ Khóa học, Lớp và Buổi; thay đổi chưa có hiệu lực trước khi Admin duyệt.
- Dữ liệu đã phát sinh vận hành không bị xóa vĩnh viễn. Chỉ bản nháp chưa từng được sử dụng mới được hard-delete.
- Học bù gồm hai hình thức: bài học trực tuyến và tham dự một buổi học tương đương tại lớp khác.
- Cả hai hình thức nằm trong một Hồ sơ học bù, cùng truy về điểm danh và buổi học gốc.
- Nội dung Homepage được Admin quản trị theo vòng đời Nháp → Chờ duyệt → Đã xuất bản → Lưu trữ.
- Không khôi phục UI hướng dẫn demo. Đăng nhập/đăng ký phải luôn dễ thấy trên Homepage.
- Tài khoản Học viên vẫn gắn với hồ sơ chuẩn Nguyễn Minh Anh. Mọi tương tác trong luồng chính phải xuất hiện khi đổi sang tài khoản này, bất kể tên nhân sự thực hiện.

## 3. Phạm vi và giới hạn

### 3.1 Trong phạm vi

- Responsive Homepage theo cấu trúc tham chiếu: header/dropdown, hero, chương trình, lợi ích, lịch khai giảng, đội ngũ, tin tức, sự kiện, CTA, footer và liên hệ nổi.
- CMS frontend cho cấu hình thương hiệu và nội dung công khai.
- Danh mục quyền, ma trận quyền vai trò, ngoại lệ tài khoản và scope.
- Hàng chờ phê duyệt thống nhất cho thay đổi master data.
- CRUD có kiểm soát cho Khóa học, Lớp học và Buổi học.
- Hồ sơ học bù thống nhất, liên kết truy ngược và hai hình thức hoàn thành.
- Notification, domain event và audit log cho mọi thao tác quan trọng.
- Migration dữ liệu demo hiện có và build thành `OPEN-DEMO.html` chạy qua `file://`.
- Kiểm thử domain, route, view, standalone build và manual browser ở desktop/mobile.

### 3.2 Ngoài phạm vi

- Backend, database, xác thực hoặc phân quyền phía server.
- Đồng bộ đa thiết bị hoặc nhiều trình duyệt thật.
- Tích hợp Zalo, SMS, email, thanh toán, bản đồ hoặc lịch ngoài đời thật.
- Rich-text editor đầy đủ như một CMS sản xuất.
- Tự động tối ưu lịch bằng AI.
- Sao chép hình ảnh, nội dung, logo hoặc nhận diện Apollo.

Demo phải ghi rõ các tích hợp bên ngoài là mô phỏng. Tuy nhiên, nhãn mô phỏng không được biến thành một luồng “hướng dẫn demo” riêng trên Homepage.

## 4. Hiện trạng và khoảng trống

### 4.1 Thành phần có thể tái sử dụng

- State và localStorage dùng chung giữa các vai trò.
- Command bus, domain events, notifications và audit logs.
- Course version bất biến sau khi xuất bản.
- Teacher assignment có phạm vi lớp và thời hạn hiệu lực.
- Session workbench trước/trong/sau buổi học.
- Điểm danh vắng tạo remedial assignment đúng một lần.
- Video progress, quiz, link lifecycle và kết quả học bù trực tuyến.
- Các public route, đăng nhập/đăng ký Visitor và tài khoản Học viên chuẩn.

### 4.2 Khoảng trống phải xử lý

- `roleCapabilities` đang hard-code và không có màn hình thay đổi quyền.
- Command đang kiểm tra role trực tiếp; chưa dùng permission/action nhất quán.
- Chưa có user override, deny rule, scope record hoặc effective date cho quyền.
- Chưa có Change Request và màn so sánh trước/sau.
- Admin chưa có hàng chờ phê duyệt tập trung.
- Màn Khóa học/Lớp/Buổi chủ yếu là danh sách đọc, chưa có form và state machine đầy đủ.
- Học bù trực tuyến và đặt buổi học bù đang là hai collection rời, thiếu hồ sơ cha.
- Các trang học bù chưa hiển thị đầy đủ chuỗi khóa học/lớp/buổi/điểm danh.
- Homepage chưa có header dropdown, CMS và bố cục editorial giống yêu cầu mới.
- Logo hiện tại còn là brand mark sinh bằng CSS và tên “Yen Center”.

## 5. Kiến trúc đề xuất

Sử dụng mô hình lai, giữ normalized store hiện tại và bổ sung các lớp rõ trách nhiệm:

```text
Views/Forms
    ↓ intent
Action Controller
    ↓ command
Permission Policy ──→ Scope Resolver
    ↓ allow
Approval Policy
    ├── direct operation ──→ Domain Mutation
    └── needs approval ────→ Change Request
                                  ↓ Admin approves
                              Domain Mutation
                                  ↓
                    Event + Notification + Audit
                                  ↓
                         Shared normalized store
```

### 5.1 Ranh giới module

| Module | Trách nhiệm |
|---|---|
| Permission catalog | Định nghĩa resource, action, mô tả và nhóm hiển thị |
| Policy evaluator | Tính quyền cuối cùng theo role, user override và scope |
| Approval policy | Quyết định thao tác áp dụng trực tiếp hay tạo Change Request |
| Change Request service | Lưu snapshot trước/sau, revision, review và apply |
| Course service | Course, version, curriculum và publish validation |
| Class service | Lớp, ghi danh, lịch định kỳ và sức chứa |
| Session service | Buổi học, xung đột, readiness và delivery evidence |
| Remedial service | Eligibility, online assignment, live booking và completion |
| Public content service | Draft, preview, publish và truy vấn nội dung công khai |
| Projection/selectors | Sinh dashboard, danh sách, breadcrumb và số liệu từ state |

Các service giao tiếp qua command và state, không gọi trực tiếp view. View không tự thay đổi collection.

## 6. Phân quyền

### 6.1 Dữ liệu quyền

```text
PermissionDefinition
- id: "class.request_create"
- domain: "CLASS"
- action: "REQUEST_CREATE"
- label
- description
- riskLevel

RolePermission
- role
- permissionId
- effect: ALLOW | DENY
- scopeType
- effectiveFrom
- effectiveTo

UserPermissionOverride
- userId
- permissionId
- effect: ALLOW | DENY
- scopeType
- scopeIds[]
- reason
- grantedBy
- effectiveFrom
- effectiveTo
```

`scopeType` hỗ trợ `ORGANIZATION`, `BRANCH`, `CLASS`, `SESSION`, `ASSIGNED_CLASS`, `OWN_LEARNER` và `LINKED_LEARNER`.

### 6.2 Thứ tự đánh giá

1. Tài khoản phải `ACTIVE`.
2. Permission definition phải tồn tại và đang hoạt động.
3. User override `DENY` hợp lệ chặn thao tác.
4. User override `ALLOW` hợp lệ cấp thao tác.
5. Nếu không có override, dùng role permission.
6. Scope resolver kiểm tra tổ chức, chi nhánh, lớp, session, assignment và effective time.
7. Resource state guard kiểm tra thao tác có hợp lệ với trạng thái hiện tại không.
8. Approval policy quyết định áp dụng trực tiếp hoặc tạo yêu cầu.
9. Không có allow phù hợp thì mặc định từ chối.

Một tài khoản không đồng thời có hai override đang hiệu lực cho cùng `permissionId + scope`. Khi Admin thay override, bản cũ được kết thúc hiệu lực thay vì ghi đè lịch sử.

### 6.3 Danh mục quyền tối thiểu

| Domain | Permission IDs |
|---|---|
| Truy cập | `access.view`, `access.manage_role`, `access.manage_user_override` |
| Phê duyệt | `approval.view`, `approval.review`, `approval.decide` |
| Khóa học | `course.view`, `course.request_create`, `course.request_update`, `course.request_archive`, `course.review`, `course.publish` |
| Nội dung học | `content.view`, `content.request_create`, `content.request_update`, `content.publish` |
| Lớp | `class.view`, `class.request_create`, `class.request_update`, `class.request_archive`, `class.manage_roster`, `class.assign_teacher` |
| Buổi học | `session.view`, `session.request_create`, `session.request_reschedule`, `session.request_cancel`, `session.prepare`, `session.start`, `session.complete` |
| Điểm danh | `attendance.view`, `attendance.edit`, `attendance.finalize`, `attendance.correct_in_window`, `attendance.correct_after_window` |
| Học bù | `remedial.view`, `remedial.propose`, `remedial.book_live`, `remedial.manage_link`, `remedial.extend`, `remedial.override`, `remedial.complete` |
| Website | `site.view_draft`, `site.edit`, `site.submit`, `site.publish`, `site.archive`, `site.configure_contact` |
| Báo cáo | `report.view`, `report.export` |
| Audit | `audit.view` |

### 6.4 Quyền mặc định theo vai trò

| Vai trò | Quyền mặc định chính |
|---|---|
| Admin | Toàn bộ tổ chức; quyết định phê duyệt, publish, RBAC, audit và CMS |
| Quản lý học thuật | Xem và tạo đề xuất curriculum; review học thuật; phân công Giáo viên; không có quyết định Admin cuối cùng |
| Quản lý trung tâm | Xem dashboard, lớp, chất lượng và báo cáo trong chi nhánh được giao |
| Giáo viên | Xem lớp được phân công; đề xuất Course/Class/Session; chuẩn bị, bắt đầu, hoàn tất buổi; điểm danh, bài tập, chấm bài và theo dõi học bù |
| Trợ giảng | Xem lớp được phân công; hỗ trợ điểm danh; không tạo Course/Class mặc định |
| Dịch vụ học viên | Xem lớp, quản lý roster, chuyển lớp và đặt buổi học bù |
| Tuyển sinh | Lead, placement summary, offer, renewal; không xem note học thuật hạn chế |
| Tài chính | Hóa đơn, thanh toán, hoàn tiền; không chỉnh curriculum |
| Học viên | Học và xem dữ liệu của hồ sơ được liên kết |
| Phụ huynh | Xem dữ liệu được phép của học viên liên kết |
| Visitor | Nội dung công khai, chương trình đã lưu, sự kiện và yêu cầu tư vấn của chính mình |

Admin có thể thay các mặc định này qua UI. Giáo viên không tự cấp quyền cho mình.

### 6.5 Guard chống mất quyền quản trị

- Luôn phải có ít nhất một Admin đang hoạt động với `access.manage_role`, `access.manage_user_override` và `approval.decide`.
- Không cho Admin vô hiệu hóa hoặc thu hồi quyền của tài khoản quản trị cuối cùng.
- Thay đổi RBAC luôn cần reason và audit; không hard-delete lịch sử quyền.

## 7. Change Request và phê duyệt

### 7.1 Dữ liệu

```text
ChangeRequest
- id
- resourceType: COURSE | COURSE_VERSION | CLASS | SESSION | SITE_CONTENT | REMEDIAL_EXCEPTION
- operation: CREATE | UPDATE | ARCHIVE | CANCEL | RESCHEDULE | PUBLISH
- resourceId hoặc provisionalResourceId
- baseVersion
- beforeSnapshot
- proposedSnapshot
- diff[]
- reason
- submittedBy
- submittedAt
- status
- revision
- reviewerId
- reviewNote
- reviewedAt
- appliedAt
- eventIds[]
```

### 7.2 Trạng thái

```text
DRAFT → SUBMITTED → IN_REVIEW → APPROVED
                     ├→ CHANGES_REQUESTED → DRAFT(revision + 1)
                     ├→ REJECTED
                     ├→ WITHDRAWN
                     └→ CONFLICTED
```

Khi Admin duyệt, validate và apply xảy ra trong cùng một transaction. Nếu `baseVersion` khác canonical version hiện tại, yêu cầu chuyển `CONFLICTED` và không áp dụng. Người gửi phải rebase rồi gửi revision mới.

### 7.3 Quy tắc áp dụng

- Giáo viên có permission `request_*` chỉ được tạo yêu cầu.
- Admin có `approval.decide` mới được approve/reject/request changes.
- Người gửi không tự duyệt Change Request của mình nếu sau này được gán đồng thời vai trò khác. Admin tạo trực tiếp không sinh Change Request; nếu Admin chủ động gửi qua workflow hai người duyệt thì một Admin khác phải quyết định.
- Admin tạo master data trực tiếp có thể áp dụng ngay nhưng vẫn phải audit.
- `session.start`, `session.complete`, `attendance.finalize`, giao/chấm bài là vận hành trong phạm vi assignment và áp dụng trực tiếp.
- Đổi lịch, hủy buổi, tạo lớp, sửa course version và correction ngoài thời hạn phải qua approval.
- Reject và request changes bắt buộc có review note.
- Approve không được thực hiện hai lần; command phải idempotent.

### 7.4 Đồng bộ nội bộ

Không tồn tại bản sao dữ liệu riêng cho Giáo viên và Admin. Hai workspace đọc cùng store:

- Pending request chỉ hiển thị như overlay cho người gửi và Admin.
- Học viên/Phụ huynh chỉ thấy canonical data đã được duyệt.
- Khi approve, canonical record, event, notification và audit được commit cùng lúc.
- Đổi tài khoản chỉ đổi actor/session; domain state không bị reset.
- Nút mock sync chỉ dành cho tích hợp ngoài, không dùng để đồng bộ vai trò.

## 8. Quy tắc xóa và lưu trữ

- Bản nháp chưa được tham chiếu có thể hard-delete.
- Course/course version đã publish chỉ được retire/archive.
- Lớp có enrollment, session hoặc attendance chỉ được cancel/archive.
- Session đã bắt đầu hoặc có attendance/delivery chỉ được cancel/amend bằng workflow.
- Hồ sơ học bù không hard-delete; có thể cancel với reason.
- Content đã publish được archive nhưng phiên bản vẫn tồn tại trong audit/history.
- Restore là permission riêng và tạo event/audit.

## 9. Khóa học và phiên bản

### 9.1 Cây dữ liệu

```text
Program → Level → Course → Course Version
                            ├→ Unit
                            │   └→ Lesson Template
                            │       └→ Learning Item
                            ├→ Assessment/Question set
                            ├→ Completion Rule
                            └→ Remedial Policy
```

Course là định danh lâu dài. Course Version là snapshot nội dung dùng để mở lớp.

### 9.2 Trường dữ liệu Course

- Mã, tên, program, level, age band và mô tả.
- Mode được hỗ trợ.
- Tổng giờ, số buổi và thời lượng chuẩn.
- Điều kiện đầu vào/khóa tiên quyết.
- Chuẩn đầu ra và competency mapping.
- Chi nhánh áp dụng và effective dates.
- Trạng thái.

Thông tin package/học phí là resource riêng và không tự mở cho Giáo viên.

### 9.3 Trường dữ liệu Course Version

- Version number, title, baseVersionId và change summary.
- Units, lesson templates và learning items có thứ tự.
- Assessment, rubric, attempt rules và passing rules.
- Attendance, completion và promotion rules.
- Remedial policy snapshot source.
- Material visibility: teacher-only, learner, parent hoặc restricted.
- Status, immutable flag, publishedAt và publishedBy.

### 9.4 Vòng đời

```text
DRAFT → SUBMITTED → APPROVED → PUBLISHED → RETIRED
             └→ CHANGES_REQUESTED/REJECTED
```

- Chỉ `PUBLISHED` version mới được gắn vào lớp mới.
- Published version bất biến; chỉnh sửa tạo version mới.
- Lớp đang học không tự nâng version.
- Retired version không mở lớp mới nhưng vẫn phục vụ lớp hiện có.

### 9.5 Publish validation

Chặn submit/publish khi:

- Course code trùng trong tổ chức.
- Thiếu program/level.
- Không có unit hoặc lesson.
- Lesson thiếu objective/duration.
- Learning item bắt buộc trỏ tới content đã archive.
- Assessment trỏ tới question không hợp lệ.
- Thiếu completion rule hoặc remedial policy.
- Tổng thời lượng lệch ngoài ngưỡng cấu hình.

Cảnh báo nhưng cho submit khi mô tả, media phụ hoặc tài liệu không bắt buộc chưa đủ. Admin thấy toàn bộ warning trước khi duyệt.

### 9.6 Màn hình Course

Tab: Tổng quan, Cấu trúc, Bài học/Nội dung, Đánh giá, Quy tắc hoàn thành, Học bù, Lớp sử dụng, Phiên bản, Phê duyệt/Audit.

## 10. Lớp học

### 10.1 Trường dữ liệu

- Mã và tên lớp.
- Branch, courseVersionId, age band và mode.
- Start/end date, timezone.
- Timetable rules, duration, room/link.
- Minimum/maximum capacity và waitlist policy.
- Enrollment window.
- Teacher assignments với role và effective dates.
- Make-up/transfer/reservation policy snapshot.
- Equipment/accommodation notes.
- Status và version.

### 10.2 Thành phần trong chi tiết Lớp

Tổng quan, Course Version, roster/enrollment history, Giáo viên, lịch định kỳ, sessions, attendance, homework/results, remedial cases, interventions, notifications, pending changes và audit.

### 10.3 Vòng đời

```text
DRAFT → SUBMITTED → OPEN → READY → ACTIVE → COMPLETED → ARCHIVED
                         ├→ PAUSED
                         └→ CANCELLED
```

Điều kiện `READY`: course version đã publish, timetable hợp lệ, room/link tồn tại, Giáo viên chính đủ điều kiện, không conflict, đạt minimum capacity hoặc có override, và sessions đã được sinh.

### 10.4 Quy tắc chỉnh sửa

- Trước session đầu: có thể đề xuất đổi lịch, room, teacher hoặc course version.
- Sau session đầu: không đổi course version trực tiếp.
- Đổi timetable chỉ tác động future session chưa bắt đầu.
- Thay Giáo viên đóng assignment cũ bằng effective date và tạo assignment mới.
- Capacity không thấp hơn active enrollment cộng live make-up reservations.
- Hủy lớp bắt buộc có reason và learner disposition plan.

## 11. Buổi học

### 11.1 Nguồn tạo

- Sinh từ timetable của lớp.
- Tạo bổ sung thủ công.
- Tạo thay cho session bị hủy.
- Tạo làm session học bù.
- Nhân bản từ session tương đương.

### 11.2 Trường dữ liệu

- `classId`, sequence number và `lessonTemplateId` thuộc đúng Course Version.
- Start/end, timezone, room/link và mode.
- Session type: `REGULAR`, `EXTRA`, `REPLACEMENT`, `MAKE_UP`.
- Source session nếu replacement/make-up.
- Teacher/session assignments.
- Planned objectives/items.
- Roster snapshot; danh sách vẫn được tính động khi session còn ở `PLANNED/CONFIRMED` và chỉ chụp cố định khi mở điểm danh hoặc chuyển `IN_PROGRESS`.
- Readiness, attendanceFinalized và version.

### 11.3 Vòng đời

```text
PLANNED → CONFIRMED → READY → IN_PROGRESS → RECORD_PENDING → COMPLETED
    ├→ RESCHEDULED
    ├→ CANCELLED
    └→ SUBSTITUTION_REQUESTED
```

### 11.4 Trước, trong và sau buổi

- Trước: roster, accommodations, đúng lesson template, open homework/gaps, adaptation, material/equipment và readiness.
- Trong: teacher check-in, attendance, planned material, taught items, formative checks và incident note theo quyền.
- Sau: delivery record, deferred items, homework, grade/feedback, intervention và handover.

Planned content và taught evidence là hai record khác nhau. Không có delivery record thì session chưa đủ điều kiện `COMPLETED`.

### 11.5 Conflict validation

Kiểm tra overlap theo teacher, room, learner và branch buffer. Reschedule đã duyệt phải cập nhật lịch các vai trò và gửi notification. Session đã bắt đầu không được reschedule; phải cancel/amend có audit.

## 12. Hồ sơ học bù

### 12.1 Aggregate cha

```text
RemedialCase
- learnerId
- enrollmentId
- sourceAttendanceId (unique)
- originalSessionId
- originalClassId
- courseVersionId
- lessonTemplateId
- policySnapshot
- eligibilityStatus
- requiredModes
- dueAt
- status
- version
```

`sourceAttendanceId` là unique key chống tạo trùng. Link regeneration, quiz attempts và live rebooking là child records, không tạo case mới.

### 12.2 Eligibility

Sau khi attendance được finalize, case đủ điều kiện khi:

- Enrollment hợp lệ tại thời điểm session.
- Attendance là `ABSENT` hoặc `EXCUSED`.
- Course policy cho phép.
- Có online content hoặc live equivalent.
- Chưa có case cho attendance đó.

Kết quả: `ELIGIBLE`, `REVIEW_REQUIRED`, `INELIGIBLE` hoặc `EXISTING_CASE`.

### 12.3 Tạo tự động và ngoại lệ

- Finalize attendance chạy eligibility và tạo case trong cùng transaction.
- Case theo policy đã được Admin duyệt có thể giao tự động.
- Trường hợp ngoài policy hoặc do Giáo viên tạo thủ công đi qua Change Request.
- Policy thay đổi về sau không retroactively đổi case cũ.

### 12.4 Online assignment

- Lấy đúng learning items của lesson đã vắng.
- Lưu video threshold, assessment, passing score, max attempts và due date.
- Vòng đời: `ASSIGNED → IN_PROGRESS → PASSED | NOT_PASSED | EXPIRED | REVOKED`.
- Completion cần đồng thời đạt progress, score, attempts và thời hạn theo policy snapshot.
- Mỗi token có version, status và expiration. Regenerate thu hồi token cũ nhưng giữ progress.

### 12.5 Live make-up booking

Buổi đích được xếp hạng theo:

1. Cùng courseVersion và lessonTemplate.
2. Còn capacity sau active enrollment và make-up reservations.
3. Không conflict lịch học viên.
4. Chưa bắt đầu và đang confirmed/ready.
5. Teacher đích có access hợp lệ.
6. Phù hợp age band, mode, branch và accommodations.

Nếu dùng equivalent khác lesson template, Admin phải approve mapping và ghi coverage note.

Booking lưu source case, original/target class-session, reserved seat, content mapping, bookedBy, confirmation deadline và history. Học viên xuất hiện trong roster đích với nhãn `MAKE_UP_GUEST`; không đổi enrollment hay lớp chính.

Vòng đời: `CANDIDATE → HELD → BOOKED → NOTIFIED → ATTENDED → RECOGNIZED`, với nhánh `CANCELLED`, `NO_SHOW` và `REBOOK_REQUIRED`.

### 12.6 Trạng thái case tổng

`NEW`, `ELIGIBLE`, `ASSIGNED`, `IN_PROGRESS`, `PARTIALLY_COMPLETED`, `COMPLETED`, `EXPIRED`, `NOT_PASSED`, `CANCELLED`, `REVIEW_REQUIRED`, `INELIGIBLE`.

Status tổng được tính từ child records và `requiredModes`; người dùng không chỉnh trực tiếp.

### 12.7 Attendance correction

- `ABSENT → PRESENT`: case chưa bắt đầu tự cancel/revoke; case đang học hoặc đã hoàn thành chuyển `REVIEW_REQUIRED` nhưng giữ evidence.
- `PRESENT → ABSENT`: chạy eligibility idempotent và tạo đúng một case.
- `ABSENT → EXCUSED`: giữ case, tính lại entitlement; thay mode cần approval nếu khác policy snapshot.

### 12.8 Breadcrumb và quyền truy ngược

```text
Khóa học / Phiên bản / Lớp gốc / Buổi gốc / Điểm danh / Hồ sơ học bù
```

Live booking hiển thị thêm Lớp đích / Buổi đích / Teacher đích / mapping nội dung. Mỗi vai trò chỉ mở được route theo scope; liên kết không làm lộ data ngoài quyền.

## 13. Website công khai và CMS

### 13.1 Nhận diện

- Tất cả brand copy chuyển sang **Lớp Tiếng Anh Cô Yến** hoặc tên ngắn **Cô Yến** khi không đủ chiều rộng.
- Logo PNG alpha thật ở `source/assets/yen-logo-horizontal.png`.
- Standalone build phải embed logo thành data URI; không phụ thuộc filesystem/network ngoài.
- Hero dùng hình riêng theo màu logo, không dùng ảnh Apollo.

### 13.2 Header

Desktop:

```text
Logo | Về Cô Yến | Chương trình học | Cơ sở & lịch học
     | Tin tức & sự kiện | Góc phụ huynh | Tài khoản | Hotline
```

Menu lấy dữ liệu published thay vì hard-code tên chương trình/cơ sở. Dropdown hỗ trợ pointer, click, focus và Escape. Mobile dùng drawer, khóa cuộn nền và giữ login/register trong vùng dễ thấy.

### 13.3 Trạng thái tài khoản

- Anonymous: Đăng nhập, Đăng ký, tư vấn, kiểm tra đầu vào.
- Visitor: Tài khoản, saved programs, registered events, requests, notifications, logout.
- Student/Parent: Khu vực học tập.
- Staff/Admin: Khu vực làm việc.

Visitor không được thấy course nội bộ, attendance, remedial, assessment hoặc progress.

### 13.4 Homepage sections

1. Hero bo góc lớn với headline, mô tả, CTA chương trình và lịch khai giảng.
2. Chương trình nổi bật.
3. Vì sao chọn Cô Yến.
4. Quy trình đăng ký → kiểm tra đầu vào → xếp lớp.
5. Lịch khai giảng và số chỗ dẫn xuất.
6. Tiến bộ có thể theo dõi.
7. Đội ngũ Giáo viên được phép công khai.
8. Tin mới nhất: một bài nổi bật và danh sách nhỏ.
9. Sự kiện sắp tới.
10. CTA tư vấn cuối trang và footer.

Không có popup hướng dẫn demo hoặc nút “Bỏ qua”.

### 13.5 Contact actions

Hotline, Zalo và form tư vấn đọc từ site settings. Kênh thiếu cấu hình tự ẩn. Chat không tự bật che nội dung. Mobile hiển thị tối đa hai floating actions. Với dữ liệu seed, CTA không có số thật sẽ dùng nhãn “Liên hệ tư vấn” thay vì hiển thị số giả.

### 13.6 CMS entities

- `SiteSettings`
- `NavigationGroup` và `NavigationItem`
- `HeroBanner`
- `PublicProgramProfile`
- `PublicBranchProfile`
- `PublicTeacherProfile`
- `Article` và `ArticleCategory`
- `PublicEvent` và `EventRegistration`
- `StaticPage`
- `ContactChannel`

Public teacher profile là record publish riêng, không tự lấy toàn bộ hồ sơ nhân sự.

### 13.7 CMS lifecycle

```text
DRAFT → SUBMITTED → APPROVED → SCHEDULED | PUBLISHED → ARCHIVED
```

- Public selectors chỉ lấy bản `PUBLISHED` trong effective window.
- Preview route cho Admin đọc draft.
- Admin có `site.publish` được publish draft của chính mình trực tiếp; hệ thống ghi `APPROVED` và `PUBLISHED` trong cùng một transaction có audit. Tài khoản không phải Admin được cấp quyền CMS phải gửi Change Request và không được tự duyệt.
- Publish tạo revision có thể rollback bằng cách publish một revision mới.
- Archive giữ URL history; route hiển thị trạng thái không còn công khai hoặc điều hướng về danh sách phù hợp.
- Thay brand settings cập nhật public header, footer, login và app shell.

## 14. Information architecture

### 14.1 Public

```text
/
/gioi-thieu
/phuong-phap
/doi-ngu-giao-vien
/chuong-trinh
/chuong-trinh/:programId
/co-so
/co-so/:branchId
/lich-khai-giang
/tin-tuc
/tin-tuc/:articleId
/su-kien
/su-kien/:eventId
/goc-phu-huynh
/cau-hoi-thuong-gap
/lien-he
/login
/dang-ky
/tai-khoan
```

### 14.2 Admin

```text
/app/admin/approvals
/app/admin/approvals/:requestId
/app/admin/roles
/app/admin/roles/:roleId/permissions
/app/admin/users/:userId/access
/app/admin/courses
/app/admin/courses/new
/app/admin/courses/:courseId
/app/admin/course-versions/:versionId
/app/admin/classes
/app/admin/classes/new
/app/admin/classes/:classId
/app/admin/sessions/:sessionId
/app/admin/remedial
/app/admin/remedial/:caseId
/app/admin/site-content
/app/admin/site-content/:contentType
/app/admin/site-settings
/app/admin/notifications
/app/admin/audit-logs
```

Các route Admin cũ vẫn được giữ hoặc redirect có chủ đích; không làm mất luồng v2.

### 14.3 Giáo viên

```text
/app/teacher/requests
/app/teacher/courses
/app/teacher/course-drafts/:draftId
/app/teacher/classes
/app/teacher/classes/:classId
/app/teacher/sessions
/app/teacher/sessions/:sessionId
/app/teacher/sessions/:sessionId/attendance
/app/teacher/remedial
/app/teacher/remedial/:caseId
/app/teacher/homework
/app/teacher/grading
```

### 14.4 Học viên/Phụ huynh

Giữ route hiện tại và bổ sung chi tiết/breadcrumb tới Course Version, Class, Session, Attendance và Remedial Case trong phạm vi được phép.

## 15. Luồng dữ liệu xuyên vai trò chuẩn

1. Admin cấp `session.request_create` cho Teacher trong scope chi nhánh/lớp.
2. Teacher tạo proposed session.
3. Permission và conflict validator chạy.
4. Change Request xuất hiện cho Teacher và Admin; Student chưa thấy.
5. Admin xem diff và approve.
6. Session canonical được tạo; lịch Teacher/Student và class detail cập nhật.
7. Teacher prepare/start/complete session và finalize một attendance `ABSENT`.
8. Hệ thống tạo đúng một Remedial Case theo policy snapshot.
9. Student Nguyễn Minh Anh thấy assignment khi đăng nhập tài khoản chuẩn.
10. Student hoàn thành online assignment hoặc tham dự target session.
11. Remedial status được tính lại; Teacher/Admin/Parent thấy projection phù hợp.
12. Audit có thể lần ngược từ completion tới attendance, session, class và course version.

## 16. Lỗi và trường hợp biên

| Trường hợp | Xử lý |
|---|---|
| Không có permission | Từ chối, không mutate state, hiển thị lý do dễ hiểu |
| Scope hết hạn | Từ chối dù role có permission |
| Request dùng base version cũ | Chuyển `CONFLICTED`, yêu cầu rebase |
| Approve lặp | Trả kết quả đã áp dụng, không tạo event trùng |
| Course version đã publish | Chặn sửa, đề nghị tạo version mới |
| Room/teacher conflict | Chặn submit hoặc approve tùy thời điểm phát hiện |
| Capacity không đủ | Không giữ chỗ; xếp hạng target khác |
| Attendance lưu lặp | Trả case hiện có |
| Điểm danh nguồn bị sửa | Giữ evidence, chạy reconciliation rule |
| Link remedial cũ | Từ chối truy cập nhưng giữ audit |
| Content chưa publish | Không xuất hiện trên public route |
| Asset không tải được | Hiển thị text brand và alt text; layout không vỡ |

## 17. Persistence và migration

- Nâng `schemaVersion` từ 3 lên 4.
- Migration thêm permission definitions, role permissions, user overrides, change requests, remedial cases và CMS revisions.
- Mapping remedial assignment hiện có vào Remedial Case theo `sessionId + learnerId`.
- Mapping make-up booking hiện có vào live booking child record.
- Giữ users, learner links, classes, sessions, content, attempts và audit hiện có.
- Migration idempotent và tạo `migrationNotice` mô tả thay đổi.
- Reset tạo deterministic seed v4.
- Login/logout không reset domain state.

## 18. Giao diện và khả năng truy cập

- Toàn bộ copy người dùng bằng tiếng Việt; mã kỹ thuật chỉ xuất hiện khi cần truy vết.
- Form có label, validation inline, summary lỗi và focus về trường đầu tiên lỗi.
- Dialog approval có focus trap, Escape và nút hủy rõ ràng.
- Dropdown/drawer dùng được bằng bàn phím.
- Bảng phức tạp có chế độ card hoặc horizontal scroll trên mobile.
- Mỗi trang chỉ có một primary action nổi bật.
- Pending, approved, rejected, archived và conflicted không chỉ phân biệt bằng màu.
- Logo có alt text; hero có decorative/meaningful alt phù hợp.
- Kiểm thử tối thiểu ở 1440×900 và 390×844.

## 19. Chiến lược kiểm thử

### 19.1 Domain tests

- Permission precedence, deny/allow, scope và effective dates.
- Last-admin guard.
- Change Request state machine, diff, stale conflict và idempotent approval.
- Course publish validation và immutability.
- Class readiness, capacity, timetable propagation và archive rules.
- Session conflict, state transition và delivery evidence.
- Remedial eligibility, unique attendance key, correction reconciliation và completion rules.
- Live make-up capacity, target mapping, no-show và rebooking.
- CMS lifecycle và published selectors.

### 19.2 View/route tests

- Homepage/header cho anonymous, Visitor, Student và staff.
- Dropdown menu sinh từ published content.
- Admin permission matrix và user override.
- Approval diff/detail/actions.
- Course/Class/Session detail tabs.
- Remedial breadcrumb và source/target links theo scope.
- Route parity cho các luồng v2.

### 19.3 Cross-role scenario

Kiểm thử tự động chuỗi 12 bước ở mục 15 trên cùng store và learner chuẩn.

### 19.4 Build và manual QA

- Domain suite và static suite đều pass.
- `verify_prototype.py` pass.
- `OPEN-DEMO.html` không gọi network và không thiếu asset.
- Console không có error trên luồng chuẩn.
- Manual desktop/mobile: menus, forms, approval, role switching, course/class/session/remedial links và reset.

## 20. Tiêu chí nghiệm thu

- Logo Cô Yến xuất hiện rõ ở public header, login và app shell; standalone build vẫn hiển thị khi mở `file://`.
- Homepage có đủ nhóm thành phần đã chốt và không có hướng dẫn demo.
- Admin thay role permission và user override; policy có hiệu lực ngay và có audit.
- Teacher chỉ thấy/create request trong đúng scope.
- Teacher-created Course/Class/Session không tác động canonical data trước approval.
- Admin approve làm dữ liệu xuất hiện trên mọi vai trò liên quan.
- Course Version đã publish không sửa được.
- Class pin đúng version; session pin đúng lesson template.
- Attendance vắng tạo đúng một Remedial Case.
- Remedial Case truy được source chain và, nếu có, target chain.
- Online và live make-up cùng cập nhật một status tổng đúng policy.
- Nguyễn Minh Anh thấy đúng tác động khi đổi sang tài khoản Student chuẩn.
- Không mất route hoặc tương tác v2 đã có.
- Mọi thay đổi quan trọng có actor, time, reason, before/after và audit.
- Toàn bộ test và verifier pass, không có console error trong manual QA.

## 21. Thứ tự triển khai ở mức kiến trúc

Đây là một release thống nhất nhưng được chia thành các lát độc lập để giảm rủi ro:

1. Schema v4, permission catalog, dynamic policy và migration.
2. Change Request, approval queue, notifications và audit.
3. Course CRUD/versioning/publish validation.
4. Class/Session CRUD, conflict, readiness và teacher proposals.
5. Remedial Case migration, online/live child flows và breadcrumbs.
6. CMS, Homepage, brand assets và visitor states.
7. Cross-role regression, standalone build và browser QA.

Mỗi lát phải giữ test cũ xanh trước khi chuyển sang lát tiếp theo. Không tách thành các store hoặc demo riêng; toàn bộ lát dùng chung domain state và permission/approval interfaces.

## 22. Các giả định đã cố định

- “Admin duyệt” nghĩa là role `ADMIN` có `approval.decide`; Quản lý học thuật chỉ review/đề xuất nếu được cấp quyền.
- Teacher master-data changes cần approval; operational delivery trong assignment áp dụng trực tiếp.
- Homepage contact values là CMS settings. Kênh thiếu dữ liệu sẽ ẩn thay vì dùng thông tin giả.
- Hình thức học bù được xác định bằng policy snapshot hoặc Admin override có reason.
- FE demo mô phỏng optimistic concurrency bằng `baseVersion` dù không có server.
- Public CMS và academic Course là hai domain khác nhau; public program profile chỉ liên kết tới course catalog, không làm lộ curriculum nội bộ.
- Logo mới là tài sản dự án đã được người dùng cung cấp nguồn tham chiếu và yêu cầu làm rõ.
