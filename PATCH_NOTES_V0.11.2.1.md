# V0.11.2.1_EMPLOYEE_ID_NS_PERFORMANCE_FIX

## Lý do tạo bản fix
Sau khi triển khai V0.11.2_EMPLOYEE_ID_AND_NS_PERMISSION_PREP, thao tác lưu/tải/xác nhận bị chậm bất thường, có tác vụ kéo dài hơn 1 phút.

## Nguyên nhân chính
V0.11.2 chuyển tính giờ từ SoThe sang NhanVienID nhưng helper fallback dữ liệu cũ đã gọi tra nhân viên theo số thẻ trong từng dòng dữ liệu.

Ví dụ các hàm tổng hợp giờ đọc nhiều dòng trong:
- DATA_NHAN_SU_CONG_VIEC
- DATA_NHAN_VIEN_NGHI

Mỗi dòng legacy chưa có NhanVienID lại gọi getEmployeeByCard_(), trong đó đọc lại DM_NHAN_VIEN. Khi dữ liệu nhiều, Apps Script phải đọc Google Sheet lặp hàng chục/hàng trăm lần trong một tác vụ.

## Nội dung fix
1. Thêm cache nhân viên theo một lần thực thi trong EmployeeService.js.
2. rowEmployeeKey_() không còn đọc DM_NHAN_VIEN lặp theo từng dòng.
3. getEmployeeById_(), getEmployeeByCard_(), listActiveEmployees() dùng cache chung.
4. Thêm cache dữ liệu nghỉ theo ngày trong EmployeeLeaveService.js.
5. getAvailableEmployees() không đọc DATA_NHAN_VIEN_NGHI lần 2.
6. getAvailableEmployeesForEdit_() không đọc DATA_NHAN_VIEN_NGHI lần 2.
7. DailyConfirmService dùng leave maps cache để giảm đọc sheet lặp.
8. ReportService dùng employee cache khi dựng employee map.
9. Giữ nguyên phân quyền NS/QL/NV và logic NhanVienID của V0.11.2.

## Không thay đổi
- Không đổi DeviceID + DeviceToken.
- Không đổi logic đăng ký/duyệt thiết bị.
- Không đổi giới hạn 8h/người/ngày.
- Không đổi chốt/mở ngày.
- Không đổi xóa mềm phiếu.
- Không đổi nghỉ theo giờ.
- Không đổi overlay xử lý.

## File cần chép đè
- src/Config.js
- src/EmployeeService.js
- src/EmployeeLeaveService.js
- src/WorkEntryService.js
- src/EntryManageService.js
- src/DailyConfirmService.js
- src/ReportService.js

Các file còn lại được giữ trong gói để đồng bộ version V0.11.2.1.

## Test ưu tiên
1. Mở app bằng thiết bị QL: apiInit phải tải nhanh.
2. Đổi ngày nhập công việc: danh sách nhân viên phải tải nhanh.
3. Lưu phiếu 2-3 nhân viên: không chậm bất thường.
4. Nhập nhân viên nghỉ 4h/8h: không chậm bất thường.
5. Kiểm tra/chốt ngày: không còn kéo dài hơn 1 phút.
6. Tạo báo cáo 1 ngày: giữ đúng dữ liệu nghỉ + làm.
7. Dữ liệu cũ chưa có NhanVienID vẫn được tính bằng fallback SoThe.
