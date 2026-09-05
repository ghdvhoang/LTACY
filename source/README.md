# Lớp Tiếng Anh Cô Yến frontend runtime v3.0

`index.html` + `styles.css` + `app.js` là bản source chạy qua HTTP. `yen-center-lms-demo.html` là bản standalone đã inline CSS/JavaScript.

Module được load theo thứ tự tên file từ `modules/00-namespace.js` đến `modules/15-bootstrap.js`. Không sửa trực tiếp `app.js`, `app.v3.js` hoặc standalone; hãy sửa module/CSS rồi chạy:

```bash
python3 ../scripts/build_standalone.py --release
```

State key là `yen-center-lms-fe-state-v3`. Actor và learner selection được lưu riêng. Dữ liệu v2 được phát hiện và reset an toàn sang schema v3 thay vì migrate sai quan hệ.

Runtime không dùng framework, package manager, backend hay provider bên ngoài. Các action nghiệp vụ phải đi qua command bus để bảo toàn validation, event và audit.
