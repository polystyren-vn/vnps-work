# TEST CASES - V0.12.1_MOBILE_NAV_FUNCTION_FIX

## Mục tiêu
Xác nhận lỗi dropdown/select sau V0.12 đã được sửa, các chức năng V0.11.2.1 vẫn hoạt động.

## Test bắt buộc trên điện thoại

### 1. Tab Tổng quan
- Mở app bằng thiết bị QL.
- Tab mặc định là Tổng quan.
- Bấm các tab khác không làm treo app.

### 2. Tab Nhập
- Bấm tab Nhập.
- Dropdown Hạng mục công việc mở được.
- Dropdown Nhân viên mở được.
- Dropdown Giờ mở được.
- Chọn nhân viên thì dropdown Giờ cập nhật theo số giờ còn lại.
- Lưu thử 1 phiếu nhỏ nếu ngày chưa chốt.

### 3. Tab Nghỉ
- Bấm tab Nghỉ.
- Dropdown Nhân viên nghỉ mở được.
- Dropdown Số giờ nghỉ mở được.
- Lưu thử một dòng nghỉ nếu ngày chưa chốt.
- Hủy dòng nghỉ có nhập lý do.

### 4. Tab Phiếu
- Tải danh sách phiếu.
- Bấm sửa phiếu.
- Dropdown nhân viên trong form sửa mở được.
- Dropdown giờ trong form sửa mở được.

### 5. Tab Báo cáo / Chốt / Thiết bị
- Các nút thao tác vẫn hoạt động như V0.12.
- Không phát sinh lỗi trắng màn hình hoặc treo overlay.

## Test quyền NS
- NS chỉ thấy Tổng quan / Nghỉ / Báo cáo.
- Dropdown trong tab Nghỉ mở được.
- NS không thấy Nhập / Phiếu / Chốt / Thiết bị.

## Điều kiện pass
- Tất cả dropdown/select mở và chọn được trên điện thoại.
- Không lỗi chức năng lưu/nghỉ/sửa/chốt đã pass ở V0.11.2.1.
