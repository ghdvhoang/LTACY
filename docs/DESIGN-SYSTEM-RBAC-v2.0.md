# Design System & RBAC Color Strategy — v2.0

## 1. Design direction

Mục tiêu của visual redesign là đưa prototype về phong cách của một SaaS giáo dục quốc tế: rõ ràng, đáng tin cậy, ít trang trí và tối ưu cho thao tác vận hành.

### Nguyên tắc

1. **Typography-first:** phân cấp bằng type scale, weight và khoảng trắng trước khi dùng màu.
2. **Neutral-first:** phần lớn giao diện dùng trắng, off-white, graphite và gray.
3. **Accent with purpose:** màu chỉ xuất hiện khi cần chỉ ra role, selection, action hoặc trạng thái.
4. **Low ornamentation:** không gradient trang trí, glassmorphism, neon, 3D character hoặc shadow dày.
5. **Data density with clarity:** bảng và form có mật độ đủ cao cho vận hành nhưng vẫn dễ scan.
6. **One product, four workspaces:** các role thuộc cùng một sản phẩm, không phải bốn theme tách rời.

## 2. Role palette

| Role | Accent | Strong | Soft surface | Border |
|---|---|---|---|---|
| Student | `#155EEF` | `#114EC9` | `#EEF4FF` | `#B9D0FF` |
| Teacher | `#087F5B` | `#056747` | `#EAF8F2` | `#A9DDCA` |
| Teaching Assistant | `#A55B08` | `#854605` | `#FFF6E8` | `#E9C895` |
| Admin | `#6E56CF` | `#5741B5` | `#F2EFFF` | `#CBC2F0` |

### Role accent áp dụng vào

- Active sidebar item.
- Primary action trong authenticated workspace.
- Role chip và avatar border.
- Progress indicator không mang ý nghĩa semantic.
- Focus hoặc selection có tính role context.

### Role accent không áp dụng vào

- `ABSENT`, `FAILED`, `ERROR`, `OVERDUE`.
- `COMPLETED`, `SUCCESS`, `PUBLISHED`.
- `WARNING`, `PENDING_REVIEW`.
- Chart series mang ý nghĩa dữ liệu riêng.

Lý do: nếu Admin dùng tím thì trạng thái thành công không được tự động chuyển thành tím; màu trạng thái phải giữ cùng nghĩa ở mọi role.

## 3. Semantic palette

| Meaning | Color |
|---|---|
| Success / Completed / Present | `#079455` |
| Warning / Pending review | `#B65D09` |
| Danger / Absent / Failed | `#D92D20` |
| Text primary | `#101114` |
| Text secondary | `#565B64` |
| Border | `#E2E3E5` |
| Page | `#F7F7F5` |
| Surface | `#FFFFFF` |

## 4. Typography and geometry

- Font stack: system UI, Segoe UI, Helvetica Neue, Arial, Noto Sans.
- Public H1: 48–72px desktop, 36–46px mobile.
- App H1: khoảng 27px.
- Body: 14px app, 15–17px marketing.
- Radius: 4–12px; tránh pill/card bo quá lớn.
- Shadow: chỉ dùng cho layer nổi thật sự như modal, support panel và hero product preview.
- Sidebar: nền neutral sáng, không dùng dark block làm chi phối toàn màn hình.

## 5. Visual anti-patterns bị loại bỏ

- Gradient tím/xanh phủ hero hoặc dashboard.
- Các khối pastel lặp lại không có hierarchy.
- Fake analytics hoặc số liệu không truy được về seed.
- Icon 3D, stock illustration kiểu AI.
- Mỗi dòng dữ liệu đặt trong một card riêng trên desktop.
- Copy khoa trương hoặc testimonial giả.
