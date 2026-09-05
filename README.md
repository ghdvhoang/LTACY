# Yen Center — Full Journey Frontend Demo v3.0

Đây là bản **demo frontend có tương tác** cho nền tảng trung tâm ngoại ngữ, được mở rộng từ prototype cũ theo `LMS Language Center Visual Domain Handbook v1.1`. Một hồ sơ học viên được nối xuyên suốt từ khách hàng tiềm năng, đầu vào, thanh toán, xếp lớp, giảng dạy, điểm danh, học bù, bài tập, đánh giá, tiến bộ, phụ huynh xem báo cáo đến gia hạn.

## Mở nhanh

Mở `OPEN-DEMO.html` bằng Chrome hoặc Edge. File đã inline toàn bộ CSS/JavaScript và không cần cài dependency.

Để chạy ổn định hơn qua HTTP:

```bash
cd source
python3 -m http.server 4173
```

Sau đó mở `http://localhost:4173/#/demo-guide`.

## Proof points chính

- Luồng kiểm tra chính chỉ có 3 bước: Giáo viên điểm danh vắng → Học viên hoàn thành bài học bù → Quản trị viên kiểm tra bằng chứng.
- Luồng đầy đủ 12 chặng vẫn có checkpoint độc lập và nút chạy tự động đến cuối trong phần nâng cao.
- Trang đăng nhập chỉ hiển thị 4 tài khoản nhanh: Giáo viên, Trợ giảng, Học viên và Quản trị viên; tất cả cùng dùng hồ sơ Nguyễn Minh Anh.
- Course hoàn chỉnh xuyên bốn bề mặt: danh mục công khai, khu học của Học viên, Content Studio của Giáo viên và quản trị khóa học của Admin.
- Trạng thái chuẩn hóa dùng chung cho các vai trò và hai chi nhánh; thao tác ở tài khoản Giáo viên xuất hiện ngay khi đăng nhập tài khoản Học viên.
- Command validation cho role, state transition, capacity, teacher eligibility, workload và promotion evidence.
- Planned lesson khác taught evidence; attendance vắng tạo remedial có deadline.
- Homework đi qua submit → feedback → revision → resubmit → accepted.
- Final assessment đi qua manual grade → moderation → release.
- Parent chỉ thấy report/feedback đã publish và đúng visibility policy.
- Event, audit, notification, CSV audit và Print/Save as PDF đều dùng được trong trình duyệt.
- Trang công khai, cổng học tập và các khu vực làm việc dùng giao diện responsive lấy cảm hứng từ cách Coursera ưu tiên việc quan trọng tiếp theo, không sao chép thương hiệu hay tài sản thiết kế.

## Cấu trúc kỹ thuật

- `source/modules/00-*.js` đến `15-*.js`: module nguồn, chạy không bundler.
- `source/app.js` và `source/app.v3.js`: bundle được sinh tự động.
- `OPEN-DEMO.html`: release standalone.
- `scripts/build_standalone.py`: build/check artifact có tính lặp lại.
- `tests/domain/`: domain, policy, journey, router và controller tests.
- `tests/static/`: build/release documentation tests.
- `docs/HANDBOOK-COVERAGE-v1.1.md`: ma trận đối chiếu handbook.

## Build và kiểm tra

```bash
python3 scripts/build_standalone.py --release
python3 scripts/build_standalone.py --release --check
node --test tests/domain/*.test.cjs
python3 -m unittest discover -s tests/static -p 'test_*.py'
python3 source/validation/verify_prototype.py --static-only
```

## Boundary

Đây không phải production system. State, auth và RBAC đều nằm phía client; payment, messaging, media và identity provider đều là mock. Xem `docs/FRONTEND-DEMO-BOUNDARY.md` và `docs/KNOWN-LIMITATIONS.md` trước khi dùng để estimate hoặc cam kết với khách hàng.
