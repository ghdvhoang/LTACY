# Yen Center LMS — Frontend Working Prototype v2.0 Minimal

Bản v2.0 là visual redesign trên functional baseline v1.1.

## Điều được giữ nguyên

- Route và information architecture.
- Mock data và quan hệ dữ liệu.
- Local persistence key.
- Login demo và RBAC behavior.
- Workflow `Vắng → tạo bài học bù → học video → làm quiz → hoàn tất`.
- Reporting, export, audit, notification và integration mock.

## Điều được thiết kế lại

- Homepage và public website.
- App shell, sidebar, topbar và navigation icons.
- Typography, spacing, surface, border, shadow và radius.
- Table, form, card, badge, toast, empty state và responsive layout.
- Visual accents theo role.

## Chạy nhanh

Mở `yen-center-lms-demo.html`, hoặc:

```bash
python3 -m http.server 4173
```

Mở `http://localhost:4173`.

## Tài khoản demo

| Role | Tài khoản | Password/PIN |
|---|---|---|
| Admin | `admin@yencenter.demo` | `Demo@123` |
| Giáo viên | `teacher@yencenter.demo` | `Demo@123` |
| Trợ giảng | `ta@yencenter.demo` | `Demo@123` |
| Học sinh | `HS6A001` | `123456` |
| SĐT phụ huynh nhiều hồ sơ | `0901000002` | `123456` |

## Lưu ý kỹ thuật

- Không cần dependency hoặc build step.
- `index.html`, `styles.css`, `app.js` là bản source tách file.
- `yen-center-lms-demo.html` là bản standalone đã inline CSS/JS.
- State key: `yen-center-lms-fe-state-v2`.
- Session key: `yen-center-lms-fe-session-v2`.
