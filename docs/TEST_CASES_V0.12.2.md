# TEST CASES - V0.12.2_MOBILE_NAV_UI_POLISH

Baseline: `V0.12.1_MOBILE_NAV_FUNCTION_FIX_TEST_PASS`.

## A. Kiểm tra không hồi quy chức năng

1. Đăng nhập bằng QL.
2. Tab vẫn chuyển được: Tổng quan / Nhập / Nghỉ / Báo cáo / Phiếu / Chốt / Thiết bị.
3. Dropdown ở tab Nhập vẫn mở được: Hạng mục, nhân viên, số giờ.
4. Dropdown ở tab Nghỉ vẫn mở được: nhân viên nghỉ, số giờ nghỉ.
5. Dropdown ở form sửa phiếu vẫn mở được.
6. NS chỉ thấy Tổng quan / Nghỉ / Báo cáo.
7. NV không phát sinh thêm quyền mới.

## B. Tab chức năng

1. Tiêu đề thanh tab hiển thị `Tab chức năng`.
2. Không còn chữ `QL` hoặc `NS` bên phải tiêu đề thanh tab.
3. Tab đang chọn có dấu `✓`.
4. Tab đang chọn vẫn đổi màu rõ ràng trên điện thoại.

## C. Tab Tổng quan

1. Tiêu đề khu vực là `Tổng quan`, không phải `Tổng quan QL`.
2. Cụm nút điều hướng cũ phía dưới Tổng quan không còn hiển thị.
3. Tạo dữ liệu test:
   - NV A làm 8h.
   - NV B nghỉ 8h.
   - NV C nghỉ 4h.
   - NV D nghỉ 4h + làm 4h.
4. Kết quả đúng:
   - `Đã phân công` chỉ tính NV có giờ làm thực tế, không tính người chỉ nghỉ.
   - `Tổng giờ` chỉ cộng giờ làm thực tế, không cộng giờ nghỉ.
   - `Đủ 8h` không tính người nghỉ.
   - `Nghỉ` vẫn hiển thị số nhân viên có nghỉ.
   - Nếu nhân viên nghỉ chưa đủ 8h và không làm bù đủ thì vẫn được cảnh báo thiếu giờ.

## D. Tab Nghỉ

1. Dropdown số giờ nghỉ chỉ hiển thị:
   - 1h
   - 2h
   - 3h
   - 4h
   - 5h
   - 6h
   - 7h
   - 8h
2. Danh sách nghỉ không hiện dòng `Mã NV`.
3. Góc phải dòng nghỉ không còn ghi `NGHỈ xH`.
4. Dòng nghỉ có nút `Sửa` và `Hủy`.
5. Bấm `Sửa`:
   - Nhập số giờ mới 1-8h.
   - Nhập lý do mới.
   - Lưu được khi ngày chưa chốt.
   - Không lưu được nếu giờ nghỉ mới + giờ làm vượt 8h.
6. Bấm `Hủy` vẫn hoạt động như V0.12.1.
7. Ngày đã chốt: sửa/hủy nghỉ bị chặn.

## E. Tab Chốt

1. Kiểm tra dòng nhân viên làm đủ 8h: bên phải chỉ hiển thị `Đủ 8h`.
2. Kiểm tra dòng thiếu 1h: bên phải hiển thị `Thiếu 1h`.
3. Kiểm tra dòng vượt 1h: bên phải hiển thị `Vượt 1h`.
4. Kiểm tra nghỉ 4h + làm 4h: bên phải hiển thị dạng `Làm 4h · Nghỉ 4h`.
5. Kiểm tra nghỉ 4h + làm 3h: bên phải hiển thị dạng `Làm 3h · Nghỉ 4h · Thiếu 1h`.

## F. Chốt pass

Chỉ chốt:

```text
V0.12.2_MOBILE_NAV_UI_POLISH_TEST_PASS
```

khi tất cả các case trên đạt.
