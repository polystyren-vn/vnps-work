# TEST CASES - CONSOLIDATED V0.11.1 → V0.12.2

## 1. Smoke test sau deploy
- Mở app bằng thiết bị QL đã duyệt.
- Kiểm tra version hiển thị là `V0.12.2_MOBILE_NAV_UI_POLISH` hoặc bản consolidated tương ứng.
- Kiểm tra tab hiển thị đúng, mặc định vào Tổng quan.

## 2. Dropdown / nhập liệu
- Tab Nhập: dropdown Hạng mục mở được.
- Tab Nhập: dropdown Nhân viên mở được, chỉ có NV đang làm.
- Tab Nhập: dropdown Giờ mở được.
- Tab Nghỉ: dropdown Nhân viên nghỉ mở được, chỉ có NV đang làm.
- Tab Nghỉ: dropdown Số giờ nghỉ hiển thị 1h → 8h.
- Tab Phiếu: sửa phiếu, dropdown nhân viên/giờ hoạt động.

## 3. NhanVienID / SoThe fallback
- Nhân viên cũ chưa có `NhanVienID` vẫn dùng được sau khi hệ thống tự đảm bảo cột.
- Dòng mới trong `DATA_NHAN_SU_CONG_VIEC` có `NhanVienID`, `SoThe`, `HoTen`.
- Dòng mới trong `DATA_NHAN_VIEN_NGHI` có `NhanVienID`, `SoThe`, `HoTen`.
- Không dùng QL/NS làm đối tượng phân công hoặc nghỉ.

## 4. Phân quyền QL
- QL thấy đầy đủ tab theo quyền.
- QL nhập công việc được.
- QL sửa/hủy phiếu được khi ngày chưa chốt.
- QL nhập/sửa/hủy nghỉ được khi ngày chưa chốt.
- QL chốt/mở ngày được.
- QL tạo báo cáo được.
- QL duyệt thiết bị được.

## 5. Phân quyền NS
- NS chỉ thấy Tổng quan / Nghỉ / Báo cáo.
- NS xem tổng quan được.
- NS nhập/sửa/hủy nghỉ được khi ngày chưa chốt.
- NS tạo báo cáo được.
- NS không nhập công việc được.
- NS không sửa/hủy phiếu được.
- NS không chốt/mở ngày được.
- NS không duyệt thiết bị được.

## 6. Quy tắc 8h
- Làm 8h: đủ.
- Làm 4h + nghỉ 4h: không báo thiếu.
- Làm 3h + nghỉ 4h: báo thiếu 1h.
- Nghỉ 8h: nằm ở nhóm nghỉ, không cộng vào tổng giờ làm thực tế.
- Làm + nghỉ > 8h: bị chặn.

## 7. Tổng quan V0.12.2
- Tiêu đề là “Tổng quan”.
- Không còn cụm nút điều hướng cũ bên dưới tổng quan.
- Đã phân công không tính nhân viên chỉ nghỉ.
- Đủ 8h không tính nhân viên chỉ nghỉ.
- Tổng giờ không cộng giờ nghỉ.
- Nghỉ vẫn có mục riêng.
- Thiếu giờ vẫn cảnh báo nếu nghỉ + làm chưa đủ 8h.

## 8. Tab Nghỉ
- Danh sách nghỉ không hiện mã NV nội bộ.
- Có nút Sửa / Hủy.
- Sửa số giờ/lý do nghỉ hoạt động.
- Hủy dòng nghỉ yêu cầu lý do.

## 9. Tab Chốt
- Dòng nhân viên hiển thị ngắn gọn: Đủ 8h / Thiếu / Vượt / Nghỉ xh làm yh.
- Chốt ngày vẫn chặn lưu/sửa/hủy phiếu/nghỉ.
- Mở lại ngày cần lý do.

## 10. Trình duyệt mobile
- Test ít nhất 1 trình duyệt mobile không phải Chrome nếu Chrome không mở native dropdown.
- Nếu trình duyệt khác hoạt động bình thường, ghi chú là vấn đề Chrome mobile trên thiết bị, không rollback app.
