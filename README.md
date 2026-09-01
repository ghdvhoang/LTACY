# Yen Center LMS — Client-ready Demo v2.0

Package này là bản **frontend working product prototype** để review concept, demo nghiệp vụ và bàn giao cho stakeholder.

## Mở nhanh

1. Giải nén package.
2. Mở `OPEN-DEMO.html` bằng Chrome hoặc Edge.
3. Đọc `START-HERE.md` để lấy tài khoản và chạy luồng demo.

Để hành vi clipboard/download ổn định hơn, chạy local server:

```bash
cd source
python3 -m http.server 4173
```

Sau đó mở `http://localhost:4173`.

## Nội dung package

- `OPEN-DEMO.html`: bản standalone, không cần cài dependency.
- `source/`: source tách file HTML/CSS/JavaScript và script chạy nhanh.
- `docs/`: product spec, PO review, design system, demo script, verification và giới hạn.
- `previews/`: ảnh các màn hình chính trên desktop/mobile.
- `MESSAGE-TO-SEND.txt`: tin nhắn mẫu gửi cùng package.

## Visual direction

- International minimal UI, neutral-first.
- Không gradient trang trí, glassmorphism hoặc 3D illustration.
- Accent theo RBAC: Student cobalt, Teacher teal, TA amber, Admin indigo.
- Màu trạng thái nghiệp vụ độc lập với màu role.

## Phạm vi kỹ thuật hiện tại

Đây chưa phải production system:

- Dữ liệu lưu bằng `localStorage`.
- Auth/RBAC được mô phỏng trong trình duyệt.
- Bunny Stream, Google Sheets, Email/SMS/Zalo chạy mock/sandbox.
- Quiz E2E tập trung vào single-choice.
- CSV export hoạt động; PDF dùng Print/Save as PDF của trình duyệt.

Đọc `docs/KNOWN-LIMITATIONS.md` trước khi cam kết phạm vi với khách hàng.
