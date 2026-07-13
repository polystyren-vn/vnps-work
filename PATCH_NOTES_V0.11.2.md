# VNPS WORK ASSIGN - V0.11.2_EMPLOYEE_ID_AND_NS_PERMISSION_PREP

## Baseline
- V0.11.1_EMPLOYEE_LEAVE_UI_FLOW_FIX_TEST_PASS

## Mục tiêu
1. Thêm `NhanVienID` làm định danh nhân viên duy nhất, không dùng lại.
2. Giữ `SoThe` để hiển thị/nhập nhanh, cho phép tái sử dụng sau khi nhân viên cũ nghỉ.
3. Thêm quyền `NS` đứng dưới `QL`, trên `NV`.
4. `NS` được xem tổng quan, tạo báo cáo, xem/nhập/hủy nhân viên nghỉ khi ngày chưa chốt.
5. Dropdown nhân viên làm việc/nghỉ chỉ lấy `ViTri = NV` và `TrangThai = Đang làm`.
6. Dữ liệu cũ chưa có `NhanVienID` fallback theo `SoThe`.

## File thay thế
Copy các file trong gói này đè vào repo:

```text
src/Config.js
src/AuthService.js
src/EmployeeService.js
src/DeviceService.js
src/JobService.js
src/WorkEntryService.js
src/EmployeeLeaveService.js
src/EntryManageService.js
src/DailyConfirmService.js
src/ReportService.js
src/ManagerDashboardService.js
src/Code.js
frontend/Script.html
```

## Ghi chú schema
Các cột mới sẽ được tự động thêm bằng `ensureSheetColumns_` khi app chạy:

### DM_NHAN_VIEN
- `NhanVienID`

Nếu dòng nhân viên cũ chưa có `NhanVienID`, hàm `ensureEmployeeIdSchema_()` sẽ tự gán dạng:

```text
EMP000001
EMP000002
...
```

### DM_THIET_BI
- `NhanVienIDDangKy`
- `HoTenDangKy`

### DATA_NHAN_SU_CONG_VIEC
- `NhanVienID`
- `HoTen`

### DATA_NHAN_VIEN_NGHI
- `NhanVienID`

## Phân quyền mới

| Chức năng | NV | NS | QL |
|---|---:|---:|---:|
| Xem tổng quan | Ẩn | Có | Có |
| Tạo/xem báo cáo | Không | Có | Có |
| Xem/nhập/hủy nghỉ | Không | Có | Có |
| Nhập công việc | Không | Không | Có |
| Sửa/hủy phiếu | Không | Không | Có |
| Thêm hạng mục | Không | Không | Có |
| Chốt/mở ngày | Không | Không | Có |
| Duyệt thiết bị | Không | Không | Có |

## Quy trình deploy

```powershell
# 1. Backup/tag baseline trước khi chép code
 git status
 git add .
 git commit -m "V0.11.1 EMPLOYEE LEAVE UI FLOW FIX TEST PASS"
 git push origin main
 git tag V0.11.1_EMPLOYEE_LEAVE_UI_FLOW_FIX_TEST_PASS
 git push origin V0.11.1_EMPLOYEE_LEAVE_UI_FLOW_FIX_TEST_PASS

# 2. Chép file V0.11.2 vào repo local

# 3. Đẩy lên Apps Script
 clasp push

# 4. Deploy Apps Script new version
# Description: V0.11.2_EMPLOYEE_ID_AND_NS_PERMISSION_PREP
```

## Test nhanh bắt buộc
1. QL vào app: thấy đầy đủ chức năng.
2. NS vào app: chỉ thấy Tổng quan, Nhân viên nghỉ, Báo cáo.
3. NS nhập nghỉ 4h cho NV: lưu được nếu ngày chưa chốt.
4. NS tạo báo cáo: tạo được.
5. NS cố nhập công việc/sửa phiếu/chốt ngày/duyệt thiết bị: bị chặn.
6. Dropdown phân công chỉ hiện NV đang làm, không hiện QL/NS.
7. Dropdown nghỉ chỉ hiện NV đang làm, không hiện QL/NS.
8. Nghỉ 4h + làm 4h = đủ 8h.
9. Nghỉ 4h + làm 5h = bị chặn vượt 8h.
10. Ngày đã chốt: QL/NS đều không thêm/hủy nghỉ được nếu chưa mở lại ngày.
11. Nhân viên cũ nghỉ, số thẻ cấp lại người mới: dữ liệu mới phải lưu theo `NhanVienID` mới.

## Lưu ý
- Không rollback dữ liệu Google Sheet khi rollback code.
- Rollback code về V0.11.1 vẫn để lại các cột mới đã tạo trong Sheet.
- Không xóa cột cũ `SoThe`; hệ thống vẫn cần để hiển thị và fallback dữ liệu cũ.
