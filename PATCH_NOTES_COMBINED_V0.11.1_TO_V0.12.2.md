# PATCH NOTES - CONSOLIDATED V0.11.1 → V0.12.2

## Baseline áp dụng
- Áp dụng trực tiếp trên baseline: `V0.11.1_EMPLOYEE_LEAVE_UI_FLOW_FIX_TEST_PASS`.
- Gói này gom các cập nhật hợp lệ từ sau V0.11.1 đến `V0.12.2_MOBILE_NAV_UI_POLISH`.
- Không bao gồm các bản vá thử nghiệm sau V0.12.2 như V0.12.2.1 / V0.12.2.2 / V0.12.2.3 / V0.12.2.4 / V0.12.2.5.

## Thứ tự cập nhật đã được gom
1. `V0.11.2_EMPLOYEE_ID_AND_NS_PERMISSION_PREP`
2. `V0.11.2.1_EMPLOYEE_ID_NS_PERFORMANCE_FIX_TEST_PASS`
3. `V0.12_MOBILE_NAV_SHELL`
4. `V0.12.1_MOBILE_NAV_FUNCTION_FIX_TEST_PASS`
5. `V0.12.2_MOBILE_NAV_UI_POLISH`

## Nội dung chính
### 1. Định danh nhân viên
- Thêm `NhanVienID` cho `DM_NHAN_VIEN`.
- Không dùng `SoThe` làm khóa định danh chính tuyệt đối.
- `SoThe` vẫn dùng để hiển thị/nhập nhanh và snapshot dữ liệu.
- Dữ liệu cũ chưa có `NhanVienID` vẫn fallback theo `SoThe`.
- Dữ liệu mới lưu thêm `NhanVienID`, `SoThe`, `HoTen`.

### 2. Phân quyền QL / NS / NV
- Thêm quyền `NS`.
- `QL`: toàn quyền.
- `NS`: xem Tổng quan, nhập/xem/hủy/sửa nghỉ, tạo báo cáo.
- `NS` không được nhập công việc, sửa/hủy phiếu, chốt/mở ngày, duyệt thiết bị.
- Dropdown nhân viên làm việc/nghỉ chỉ lấy `ViTri = NV` và `TrangThai = Đang làm`.

### 3. Tối ưu hiệu năng
- Dùng cache nhân viên trong `EmployeeService.js`.
- Giảm đọc lặp Google Sheet trong các hàm fallback theo `NhanVienID` / `SoThe`.
- Tối ưu các phần lấy nhân viên khả dụng, nghỉ theo ngày, báo cáo và chốt ngày.

### 4. Tab giao diện mobile
- Chuyển giao diện cuộn dài thành shell dạng tab.
- Mặc định vào tab Tổng quan.
- QL thấy các tab theo quyền QL.
- NS chỉ thấy các tab Tổng quan / Nghỉ / Báo cáo.
- Bản `V0.12.1` đã fix dropdown trong phạm vi app. Lưu ý lỗi dropdown riêng của Chrome mobile đã được xác định là do trình duyệt, không phải app.

### 5. UI polish V0.12.2
- Đổi tiêu đề “Tổng quan QL” thành “Tổng quan”.
- Đổi “Khu vực chức năng” thành “Tab chức năng”.
- Bỏ chữ quyền ở cạnh tiêu đề khu vực chức năng.
- Thêm dấu ✓ cho tab đang chọn.
- Tổng quan không cộng giờ nghỉ vào tổng giờ làm thực tế / đã phân công / đủ 8h.
- Giữ mục nghỉ riêng.
- Thiếu giờ vẫn cảnh báo nếu nghỉ + làm chưa đủ 8h.
- Tab Nghỉ: số giờ nghỉ hiển thị 1h → 8h.
- Danh sách nghỉ: thêm nút Sửa / Hủy.
- Tab Chốt: rút gọn thông tin giờ bên phải từng dòng.

## File trong gói
- `src/Config.js`
- `src/AuthService.js`
- `src/EmployeeService.js`
- `src/DeviceService.js`
- `src/JobService.js`
- `src/WorkEntryService.js`
- `src/EmployeeLeaveService.js`
- `src/EntryManageService.js`
- `src/DailyConfirmService.js`
- `src/ReportService.js`
- `src/ManagerDashboardService.js`
- `src/Code.js`
- `frontend/Script.html`
- Các file ghi chú và test case đi kèm.

## Cách deploy
1. Đảm bảo repo local đang ở đúng baseline `V0.11.1_EMPLOYEE_LEAVE_UI_FLOW_FIX_TEST_PASS`.
2. Giải nén gói này.
3. Chép đè toàn bộ file vào repo local.
4. Chạy `clasp push`.
5. Deploy Apps Script new version với mô tả: `V0.12.2_MOBILE_NAV_UI_POLISH_CONSOLIDATED_FROM_V0.11.1`.
6. Test theo `docs/TEST_CASES_COMBINED_V0.11.1_TO_V0.12.2.md`.

## Lưu ý Chrome mobile
- Nếu dropdown không mở trên Chrome mobile nhưng hoạt động trên trình duyệt mobile khác, không kết luận app lỗi ngay.
- Đây là hiện tượng đã được khoanh vùng là vấn đề riêng của Chrome mobile trên thiết bị test.
