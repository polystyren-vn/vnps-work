# TEST CASES V0.11.2.1_EMPLOYEE_ID_NS_PERFORMANCE_FIX

## Mục tiêu
Xác nhận bản V0.11.2.1 khắc phục lỗi chậm sau khi bổ sung NhanVienID và quyền NS.

## Case hiệu năng bắt buộc
| STT | Thao tác | Kết quả kỳ vọng |
|---|---|---|
| 1 | Mở app bằng thiết bị QL đã duyệt | Không bị treo lâu ở bước kiểm tra thiết bị |
| 2 | Đổi ngày ở Nhập công việc | Danh sách nhân viên tải lại nhanh |
| 3 | Lưu phiếu gồm 2-3 nhân viên | Hoàn tất rõ ràng, không kéo dài > 1 phút |
| 4 | Nhập nhân viên nghỉ 4h | Lưu xong và danh sách nghỉ cập nhật nhanh |
| 5 | Hủy dòng nghỉ | Hoàn tất và cập nhật danh sách nhanh |
| 6 | Kiểm tra tổng giờ/chốt ngày | Không bị treo lâu; tổng làm + nghỉ vẫn đúng |
| 7 | Tạo báo cáo 1 ngày | Báo cáo vẫn tính nghỉ + làm đúng |

## Case nghiệp vụ vẫn phải pass
| Case | Kết quả đúng |
|---|---|
| QL | Toàn quyền như V0.11.2 |
| NS | Xem tổng quan, tạo báo cáo, xem/nhập/hủy nghỉ |
| NS | Không được nhập/sửa/hủy phiếu, chốt/mở ngày, duyệt thiết bị |
| Dropdown nhân viên làm việc | Chỉ hiện NV đang làm |
| Dropdown nhân viên nghỉ | Chỉ hiện NV đang làm |
| Nghỉ 4h + làm 4h | Đủ 8h |
| Nghỉ 4h + làm 5h | Chặn vượt 8h |
| Dữ liệu cũ chưa có NhanVienID | Vẫn tính được bằng fallback SoThe |
