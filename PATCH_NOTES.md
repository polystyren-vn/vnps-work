# V0.6_UI_MOBILE_CLEANUP

Baseline đầu vào: `V0.5_EDIT_ENTRY_DETAIL_TEST_PASS`

## Mục tiêu

Chuẩn hóa giao diện mobile cho VNPS WORK ASSIGN, vẫn giữ nguyên kiến trúc cũ:

- Người dùng truy cập qua Google Apps Script Web App URL.
- Frontend vẫn render bởi Apps Script HTML Service.
- Backend vẫn là Apps Script.
- Database vẫn là Google Sheet.
- GitHub chỉ quản lý source/version/tag.

## Nguyên tắc cập nhật

- Không đổi schema dữ liệu.
- Không đổi logic lưu phiếu mới.
- Không đổi logic kiểm tra 8h/người/ngày.
- Không đổi logic đăng ký thiết bị.
- Không đổi logic thêm hạng mục mới.
- Không đổi logic xóa mềm phiếu.
- Không đổi logic sửa phiếu.
- Không đổi logic báo cáo.

## File thay đổi

```text
src/Config.js
frontend/Index.html
frontend/Style.html
frontend/Script.html
PATCH_NOTES.md
```

## Nội dung cập nhật chính

### 1. Chuẩn hóa bố cục mobile

Tách màn hình chính thành 3 khu vực rõ ràng:

1. Nhập công việc
2. Quản lý phiếu đã nhập
3. Báo cáo

Mỗi khu vực có nút mở/thu gọn để giảm cuộn dài trên điện thoại.

### 2. Thông tin thiết bị/người dùng rõ hơn

Khu vực đầu form hiển thị dạng thẻ:

- Người nhập
- Thiết bị
- Quyền
- Trạng thái
- Version

### 3. Nút thao tác dễ bấm hơn

Tăng kích thước vùng bấm cho các nút chính:

- Lưu công việc
- Tải danh sách phiếu
- Sửa phiếu
- Hủy phiếu
- Tạo báo cáo

### 4. Cảnh báo dễ đọc hơn

Các thông báo thành công/lỗi/cảnh báo có nền màu riêng để dễ nhìn trên điện thoại.

### 5. Responsive nhỏ hơn 520px và 360px

Bổ sung layout riêng cho điện thoại màn hình nhỏ, tránh vỡ form khi chọn nhân viên và số giờ.

## Test bắt buộc

### A. Kiểm tra quyền và hiển thị

1. Mở bằng QL: `?deviceId=PC_TO_01`
2. Thấy đủ 3 khu vực:
   - Nhập công việc
   - Quản lý phiếu đã nhập
   - Báo cáo
3. Mở bằng NV: `?deviceId=PC_TO_03`
4. NV chỉ thấy khu vực nhập công việc, không thấy quản lý phiếu/báo cáo.

### B. Kiểm tra mở/thu gọn

1. Bấm mở/thu gọn từng khu vực.
2. Không mất dữ liệu đang nhập trong khu vực.
3. Không lệch layout trên điện thoại.

### C. Kiểm tra nghiệp vụ đã pass

1. Lưu phiếu mới nhiều nhân viên.
2. Kiểm tra giới hạn 8h/người/ngày.
3. Tải danh sách phiếu.
4. Hủy mềm phiếu.
5. Sửa phiếu.
6. Tạo báo cáo.
7. Phiếu DELETED vẫn không được tính trong báo cáo.

## Chốt pass

Nếu tất cả test đạt, chốt:

```text
V0.6_UI_MOBILE_CLEANUP_TEST_PASS
```
