# V0.10_EMPLOYEE_LEAVE_FILTER

Baseline đầu vào: `V0.9_DEVICE_BROWSER_TOKEN_REGISTER_TEST_PASS`.

## Mục tiêu

Bổ sung quản lý nhân viên nghỉ và chuẩn hóa danh sách nhân viên được phân công công việc:

1. Nhân viên có quyền `QL` không còn xuất hiện trong dropdown nhân viên khi nhập/sửa công việc.
2. QL nhập nhân viên nghỉ theo ngày.
3. Nhân viên đã nhập nghỉ trong ngày không xuất hiện trong dropdown nhập/sửa công việc ngày đó.
4. Báo cáo có mục nhân viên nghỉ.
5. Kiểm tra/chốt ngày và dashboard hiển thị riêng nhân viên nghỉ, không tính nhân viên nghỉ là thiếu giờ.

## Sheet mới tự tạo

`DATA_NHAN_VIEN_NGHI`

Header:

```text
ID | Ngay | SoThe | HoTen | LyDo | TrangThai | NguoiNhap | DeviceID | ThoiGianLuu | HuyBoi | ThoiGianHuy | LyDoHuy
```

Trạng thái:

```text
ACTIVE = đang có hiệu lực
CANCELLED = đã hủy dòng nghỉ
```

## File thay đổi / thêm mới

Copy đè:

```text
src/Config.js
src/Code.js
src/WorkEntryService.js
src/EntryManageService.js
src/DailyConfirmService.js
src/ReportService.js
src/ManagerDashboardService.js
frontend/Index.html
frontend/Style.html
frontend/Script.html
PATCH_NOTES.md
```

Thêm mới:

```text
src/EmployeeLeaveService.js
```

## Luồng sử dụng

1. QL mở app.
2. Vào mục `🏖️ Nhân viên nghỉ`.
3. Chọn ngày nghỉ.
4. Chọn nhân viên.
5. Nhập lý do nghỉ.
6. Lưu.
7. Khi nhập công việc ngày đó, nhân viên nghỉ sẽ không còn trong dropdown.
8. Khi tạo báo cáo, báo cáo có dòng/mục nhân viên nghỉ.

## Nguyên tắc giữ ổn định

Không sửa logic đã pass:

```text
- Đăng ký thiết bị bằng DeviceID + DeviceToken
- Lưu nhiều nhân viên
- Kiểm tra 8h/người/ngày
- Thêm hạng mục mới
- Sửa phiếu
- Hủy mềm phiếu
- Chốt/mở lại ngày
- Dashboard QL
```

## Test bắt buộc

1. QL không xuất hiện trong dropdown nhân viên khi nhập công việc.
2. NV đang làm, không phải QL, vẫn xuất hiện nếu chưa đủ 8h và không nghỉ.
3. QL nhập một nhân viên nghỉ cho ngày mai.
4. Chọn ngày mai ở mục nhập công việc → nhân viên đó không còn trong dropdown.
5. Hủy dòng nghỉ → chọn lại ngày đó → nhân viên xuất hiện lại nếu còn giờ.
6. Nhập nghỉ trùng cùng nhân viên/cùng ngày → hệ thống chặn.
7. Nhập nghỉ cho nhân viên quyền QL → hệ thống chặn.
8. Ngày đã chốt → không cho thêm/hủy nhân viên nghỉ cho ngày đó.
9. Tạo báo cáo → REPORT_NHAN_VIEN_NGAY có dòng `NGHỈ`.
10. Tạo báo cáo → REPORT_HANG_MUC_NGAY có dòng `Nhân viên nghỉ`.
11. Kiểm tra/chốt ngày hiển thị số lượng nghỉ riêng.
12. Lưu/sửa/hủy/chốt/báo cáo các chức năng cũ vẫn pass.

Nếu pass, chốt:

```text
V0.10_EMPLOYEE_LEAVE_FILTER_TEST_PASS
```
