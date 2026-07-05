# V0.4.1_ENTRY_LIST_LOAD_FIX

## Mục tiêu
Sửa lỗi khu vực **Quản lý phiếu đã nhập** bị kẹt ở trạng thái `Đang tải danh sách phiếu...`.

## Nguyên nhân khả năng cao
`apiListWorkEntries()` trả dữ liệu có giá trị ngày/giờ dạng Date từ Google Sheet (`ThoiGianLuu`). `google.script.run` dễ lỗi khi trả object chứa Date về HTML client.

## Nội dung sửa
- `EntryManageService.js`: chuyển toàn bộ giá trị trả về client sang text an toàn, đặc biệt `ThoiGianLuu`.
- `Config.js`: nâng version lên `V0.4.1_ENTRY_LIST_LOAD_FIX`.
- `frontend/Script.html`: thêm timeout 20 giây để không kẹt im lặng nếu server không phản hồi.

## Phạm vi giữ nguyên
- Không đổi logic lưu phiếu.
- Không đổi logic đăng ký thiết bị.
- Không đổi báo cáo V0.3.
- Không đổi cấu trúc DATA.

## Test
1. Mở bằng QL `?deviceId=PC_TO_01`.
2. Chọn ngày có phiếu.
3. Bấm `Tải danh sách phiếu`.
4. Danh sách phải hiện ra hoặc báo lỗi rõ ràng, không kẹt mãi.
