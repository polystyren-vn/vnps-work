# TEST CASES

| Case | Kết quả đúng |
|---|---|
| `PC_TO_01` hoạt động, người phụ trách QL | Vào form, thấy nút thêm hạng mục |
| `PC_TO_03` hoạt động, người phụ trách NV | Vào form, không thấy thêm hạng mục |
| `UNKNOWN_001` chờ duyệt | Bị chặn |
| `LOCKED_001` khóa | Bị chặn |
| QL thêm hạng mục mới | Lưu vào `DM_CONG_VIEC` |
| Thêm hạng mục trùng tên | Không thêm dòng trùng, dùng mã cũ |
| Nhân viên đã đủ 8h | Không còn trong danh sách còn giờ |
| Nhân viên có 6h | Chỉ được lưu thêm tối đa 2h |
| Nhập vượt 8h | Chặn lưu |
| Lưu nhiều nhân viên | Ghi 1 dòng `DATA_CONG_VIEC`, nhiều dòng `DATA_NHAN_SU_CONG_VIEC` |
