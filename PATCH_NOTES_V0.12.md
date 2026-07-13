# PATCH NOTES - V0.12_MOBILE_NAV_SHELL

Baseline: `V0.11.2.1_EMPLOYEE_ID_NS_PERFORMANCE_FIX_TEST_PASS`

## Mục tiêu

Tinh chỉnh giao diện mobile để không còn cuộn dài toàn bộ trang. Các nhóm chức năng được gom vào một thanh điều hướng cố định, chỉ hiển thị một khu vực chức năng tại một thời điểm.

## Phạm vi cập nhật

- Thêm mobile nav shell bằng JavaScript, không thay đổi cấu trúc backend.
- Mặc định mở tab `Tổng quan` nếu người dùng có quyền xem tổng quan.
- QL thấy các tab theo quyền: Tổng quan, Nhập, Nghỉ, Báo cáo, Phiếu, Chốt, Thiết bị.
- NS thấy các tab theo quyền: Tổng quan, Nghỉ, Báo cáo.
- NV hoặc quyền không đủ sẽ không thấy các khu vực quản lý.
- Quick action trong Tổng quan chuyển sang tab tương ứng thay vì cuộn xuống một trang dài.
- Section đang chọn không bị thu gọn khi ở chế độ shell.
- Giữ nguyên overlay xử lý và khóa nút bấm của V0.11.1/V0.11.2.1.

## File thay đổi

```text
src/Config.js
frontend/Script.html
```

## Không thay đổi

- Không sửa logic DeviceID + DeviceToken.
- Không sửa logic NhanVienID / SoThe fallback.
- Không sửa phân quyền backend QL / NS / NV.
- Không sửa lưu phiếu, sửa phiếu, hủy phiếu.
- Không sửa nghỉ theo giờ.
- Không sửa giới hạn 8h/người/ngày.
- Không sửa chốt/mở ngày.
- Không sửa báo cáo.
- Không sửa schema Google Sheet.

## Lưu ý triển khai

Bản này là UI shell. Sau khi chép đè file và `clasp push`, cần deploy Apps Script new version với mô tả:

```text
V0.12_MOBILE_NAV_SHELL
```

Chỉ tag pass sau khi test đủ quyền QL/NS và các tab chức năng.
