# V0.5_EDIT_ENTRY_DETAIL

## Baseline đầu vào
`V0.4.1_ENTRY_LIST_LOAD_FIX_TEST_PASS`

## Mục tiêu
Bổ sung chức năng **QL sửa phiếu đã nhập sai** nhưng vẫn giữ truy vết.

## Nội dung thêm
- QL chọn phiếu trong khu vực `Quản lý phiếu đã nhập`.
- Thêm nút `Sửa phiếu` cho phiếu `ACTIVE`.
- Tải chi tiết phiếu gồm:
  - Mã phiếu
  - Hạng mục
  - Nội dung công việc
  - Danh sách nhân viên và số giờ
- Cho sửa:
  - Nội dung công việc
  - Danh sách nhân viên
  - Số giờ từng nhân viên
- Bắt buộc nhập lý do sửa.
- Kiểm tra lại tổng giờ không vượt 8h/người/ngày sau khi sửa.
- Ghi log `SUA_PHIEU`.
- Phiếu `DELETED` không được sửa.

## Cột bổ sung tự động vào DATA_CONG_VIEC
- `SuaBoi`
- `ThoiGianSua`
- `LyDoSua`

## Phạm vi giữ nguyên
- Không sửa logic lưu phiếu mới.
- Không sửa logic đăng ký thiết bị.
- Không sửa logic thêm hạng mục mới.
- Không sửa logic xóa mềm đã pass.
- Không sửa logic báo cáo đã pass, chỉ để báo cáo lấy dữ liệu mới sau khi sửa.

## Test bắt buộc
1. QL mở `?deviceId=PC_TO_01`.
2. Tải danh sách phiếu theo ngày.
3. Bấm `Sửa phiếu`.
4. Sửa nội dung và giờ/nhân viên.
5. Lưu sửa với lý do.
6. Kiểm tra `DATA_CONG_VIEC` có `SuaBoi`, `ThoiGianSua`, `LyDoSua`.
7. Kiểm tra `DATA_NHAN_SU_CONG_VIEC` đã thay chi tiết mới.
8. Kiểm tra `LOG_THAO_TAC` có `SUA_PHIEU`.
9. Tạo lại báo cáo, dữ liệu phản ánh nội dung sau sửa.
10. Phiếu `DELETED` không có nút sửa hoặc không sửa được.
