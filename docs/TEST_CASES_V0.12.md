# TEST CASES - V0.12_MOBILE_NAV_SHELL

Baseline: `V0.11.2.1_EMPLOYEE_ID_NS_PERFORMANCE_FIX_TEST_PASS`

## 1. QL đăng nhập

Kỳ vọng:

- Mặc định mở tab `Tổng quan`.
- Thấy các tab: Tổng quan, Nhập, Nghỉ, Báo cáo, Phiếu, Chốt, Thiết bị.
- Chỉ một nhóm chức năng hiển thị tại một thời điểm.
- Chuyển tab không làm mất DeviceID/DeviceToken.

## 2. NS đăng nhập

Kỳ vọng:

- Mặc định mở tab `Tổng quan`.
- Chỉ thấy: Tổng quan, Nghỉ, Báo cáo.
- Không thấy Nhập, Phiếu, Chốt, Thiết bị.
- Vẫn nhập/hủy nhân viên nghỉ được khi ngày chưa chốt.
- Vẫn tạo báo cáo được.

## 3. Nhập công việc của QL

Kỳ vọng:

- Chọn tab `Nhập`.
- Chọn ngày, hạng mục, nhân viên, số giờ.
- Lưu phiếu thành công.
- Giới hạn 8h vẫn hoạt động.
- Dropdown nhân viên vẫn chỉ hiện NV đang làm.

## 4. Nhân viên nghỉ của QL/NS

Kỳ vọng:

- Chọn tab `Nghỉ`.
- Danh sách nhân viên nghỉ vẫn tự load theo ngày.
- Nhập nghỉ 4h/8h được nếu ngày chưa chốt.
- Ngày đã chốt vẫn bị chặn thêm/hủy nghỉ.

## 5. Báo cáo của QL/NS

Kỳ vọng:

- Chọn tab `Báo cáo`.
- Tạo báo cáo ngày/khoảng ngày thành công.
- Không thay đổi logic báo cáo đã pass.

## 6. Quản lý phiếu của QL

Kỳ vọng:

- Chọn tab `Phiếu`.
- Tải danh sách phiếu, sửa phiếu, hủy phiếu như bản V0.11.2.1.
- NS không có tab này.

## 7. Chốt ngày của QL

Kỳ vọng:

- Chọn tab `Chốt`.
- Kiểm tra ngày, chốt ngày, mở lại ngày hoạt động như cũ.
- NS không có tab này.

## 8. Duyệt thiết bị của QL

Kỳ vọng:

- Chọn tab `Thiết bị`.
- Tải thiết bị chờ duyệt và duyệt thiết bị hoạt động như cũ.
- NS không có tab này.

## 9. Quick actions trong Tổng quan

Kỳ vọng:

- Bấm Nhập công việc / Nhân viên nghỉ / Quản lý phiếu / Chốt ngày / Báo cáo trong Tổng quan sẽ chuyển sang đúng tab.
- Không còn cuộn dài toàn trang.
- Các nút không đủ quyền bị ẩn đúng.

## 10. Mobile UX

Kỳ vọng:

- Thanh tab bám phía trên khi cuộn trong nội dung.
- Không che overlay xử lý.
- Không vỡ layout trên màn hình hẹp.
- Nút đủ lớn để bấm trên điện thoại.
