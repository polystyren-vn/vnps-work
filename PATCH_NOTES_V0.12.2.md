# VNPS WORK ASSIGN - V0.12.2_MOBILE_NAV_UI_POLISH

Baseline áp dụng: `V0.12.1_MOBILE_NAV_FUNCTION_FIX_TEST_PASS`.

## Mục tiêu

Tinh chỉnh giao diện sau khi chuyển sang Tab, không làm lại shell navigation và không sửa các logic đã pass của V0.11.2.1/V0.12.1 ngoài các phần bắt buộc cho hiển thị và nút sửa nghỉ.

## File thay đổi

- `src/Config.js`
- `src/Code.js`
- `src/EmployeeLeaveService.js`
- `src/ManagerDashboardService.js`
- `frontend/Script.html`
- `docs/TEST_CASES_V0.12.2.md`

## Nội dung cập nhật

### 1. Tab chức năng

- Đổi nhãn `Khu vực chức năng` thành `Tab chức năng`.
- Bỏ hiển thị quyền `QL/NS` bên phải dòng tiêu đề tab.
- Thêm dấu `✓` ở tab đang chọn.

### 2. Tổng quan

- Đổi tiêu đề `Tổng quan QL` thành `Tổng quan` bằng frontend script.
- Ẩn cụm nút điều hướng cũ dưới Tổng quan vì đã có thanh Tab ở trên.
- Tách giờ nghỉ khỏi các chỉ số gây nhầm:
  - `Đã phân công`: chỉ tính nhân viên có giờ làm thực tế, không tính người chỉ nghỉ.
  - `Đủ 8h`: không tính nhân viên nghỉ.
  - `Tổng giờ`: chỉ tính giờ làm thực tế, không cộng giờ nghỉ.
- Mục `Nghỉ` vẫn giữ riêng.
- Mục `Thiếu giờ` vẫn cảnh báo nhân viên nghỉ chưa đủ 8h hoặc nghỉ + làm chưa đủ 8h.

### 3. Tab Nghỉ

- Dropdown số giờ nghỉ chuẩn hóa thành `1h` đến `8h`, bỏ mô tả `nửa ngày/cả ngày`.
- Danh sách nghỉ không hiển thị `Mã NV` trên form.
- Bỏ nhãn `NGHỈ xH` ở góc phải.
- Chuyển nút `Hủy` sang cụm thao tác bên phải.
- Thêm nút `Sửa` để sửa số giờ nghỉ và lý do khi ngày chưa chốt.

### 4. Tab Chốt

- Rút gọn phần giờ bên phải mỗi nhân viên:
  - Không nghỉ, đủ 8h: `Đủ 8h`
  - Thiếu: `Thiếu xh`
  - Vượt: `Vượt xh`
  - Có nghỉ: `Làm xh · Nghỉ yh`, nếu thiếu/vượt thì thêm `Thiếu/Vượt`.

## Không thay đổi

- Không sửa DeviceID + DeviceToken.
- Không sửa NhanVienID / SoThe fallback.
- Không sửa phân quyền QL / NS / NV.
- Không sửa lưu/sửa/hủy phiếu công việc.
- Không sửa giới hạn 8h/người/ngày.
- Không sửa chốt/mở ngày.
- Không sửa báo cáo.
- Không sửa cơ chế tab đã pass ở V0.12.1.

## Deploy

```powershell
clasp push
```

Deploy Apps Script new version:

```text
V0.12.2_MOBILE_NAV_UI_POLISH
```

Chỉ tag TEST_PASS sau khi test đủ theo `docs/TEST_CASES_V0.12.2.md`.
