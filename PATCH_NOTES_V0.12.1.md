# PATCH NOTES - V0.12.1_MOBILE_NAV_FUNCTION_FIX

## Nền cập nhật
- Baseline: V0.12_MOBILE_NAV_SHELL sau khi test phát hiện lỗi dropdown.
- Mục tiêu: sửa lỗi chức năng, chưa chỉnh sâu giao diện dashboard/nghỉ/chốt.

## Lỗi cần fix
- Sau khi chuyển giao diện sang tab, các ô dropdown/select trên mobile không mở hoặc thao tác không ổn định.

## Nội dung cập nhật
1. Bỏ kiểu `position: sticky` của thanh tab để tránh lớp tab đè vùng tương tác native select trên mobile/WebView.
2. Thêm CSS bảo vệ `select/input/textarea` trong shell mode: pointer-events/touch-action/z-index rõ ràng.
3. Thêm `installDropdownTouchGuard()` để sự kiện touch/click trên select/input/textarea không bị lan ra vùng tab/section.
4. Giữ nguyên cơ chế tab, phân quyền QL/NS/NV và lazy-load.
5. Cập nhật version sang `V0.12.1_MOBILE_NAV_FUNCTION_FIX`.

## Không thay đổi
- Không sửa backend nghiệp vụ.
- Không sửa DeviceID + DeviceToken.
- Không sửa NhanVienID/SoThe fallback.
- Không sửa giới hạn 8h/người/ngày.
- Không sửa nghỉ theo giờ.
- Không sửa chốt/mở ngày.
- Không sửa báo cáo.
- Chưa thực hiện các yêu cầu UI polish ở V0.12.2.

## File thay đổi
- `src/Config.js`
- `frontend/Script.html`
- `docs/TEST_CASES_V0.12.1.md`
