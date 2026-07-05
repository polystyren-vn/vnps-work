# VNPS WORK ASSIGN - V0.7_DAILY_LOCK_AND_CONFIRM_FLOW

Baseline đầu vào: `V0.6_UI_MOBILE_CLEANUP_TEST_PASS`.

## Mục tiêu

Thêm lớp kiểm tra/chốt dữ liệu theo ngày cho QL, phục vụ kiểm soát dữ liệu trước khi dùng báo cáo chính thức.

## Nguyên tắc giữ ổn định

- Không đổi kiến trúc hiện tại: Google Apps Script Web App + Google Sheet + GitHub/clasp.
- Không sửa logic đã pass nếu không liên quan trực tiếp đến chốt ngày.
- Không đổi cấu trúc sheet cũ theo hướng phá dữ liệu.
- Chỉ thêm sheet mới `DATA_CHOT_NGAY` khi QL dùng chức năng kiểm tra/chốt ngày lần đầu.

## File cập nhật

Copy đè/thêm các file sau vào repo hiện tại:

```text
src/Config.js
src/Code.js
src/SheetService.js
src/WorkEntryService.js
src/EntryManageService.js
src/DailyConfirmService.js
frontend/Index.html
frontend/Style.html
frontend/Script.html
PATCH_NOTES.md
```

## Sheet mới tự tạo

Khi QL bấm kiểm tra/chốt ngày, hệ thống tự tạo sheet:

```text
DATA_CHOT_NGAY
```

Header dòng 4:

```text
Ngay | TrangThai | XacNhanBoi | ThoiGianXacNhan | GhiChu | MoLaiBoi | ThoiGianMoLai | LyDoMoLai
```

Trạng thái ngày:

```text
DRAFT      = Đang nhập
CONFIRMED  = Đã xác nhận/chốt
```

## Chức năng thêm mới

### 1. QL kiểm tra tổng giờ trong ngày

Khu vực mới trên giao diện:

```text
✅ Kiểm tra / chốt ngày
```

Hiển thị:

```text
- Phiếu ACTIVE trong ngày
- Phiếu DELETED trong ngày
- Số nhân viên đủ 8h
- Số nhân viên chưa đủ 8h
- Số nhân viên vượt 8h nếu có lỗi dữ liệu cũ
- Chi tiết giờ theo từng nhân viên
```

### 2. QL xác nhận/chốt ngày

Khi QL xác nhận ngày:

```text
DATA_CHOT_NGAY.TrangThai = CONFIRMED
```

Ghi log:

```text
LOG_THAO_TAC.HanhDong = XAC_NHAN_NGAY
```

Nếu còn nhân viên vượt 8h, hệ thống không cho chốt ngày.

### 3. Khóa thay đổi sau khi chốt

Khi ngày đã `CONFIRMED`, hệ thống chặn:

```text
- Lưu phiếu mới trong ngày đó
- Sửa phiếu trong ngày đó
- Hủy mềm phiếu trong ngày đó
```

Muốn sửa dữ liệu, QL phải dùng nút:

```text
Mở lại ngày
```

và bắt buộc nhập lý do.

### 4. QL mở lại ngày

Khi mở lại ngày:

```text
DATA_CHOT_NGAY.TrangThai = DRAFT
MoLaiBoi
ThoiGianMoLai
LyDoMoLai
```

Ghi log:

```text
LOG_THAO_TAC.HanhDong = MO_LAI_NGAY
```

## Test bắt buộc

1. QL mở form, thấy khu vực `✅ Kiểm tra / chốt ngày`.
2. NV mở form, không thấy khu vực chốt ngày.
3. QL chọn ngày có dữ liệu, bấm `Kiểm tra tổng giờ trong ngày`.
4. Hệ thống tự tạo sheet `DATA_CHOT_NGAY` nếu chưa có.
5. Bảng tổng giờ hiển thị đủ trạng thái: chưa đủ / đủ 8h / vượt 8h.
6. QL bấm `Xác nhận/chốt ngày`.
7. Kiểm tra `DATA_CHOT_NGAY`: ngày chuyển `CONFIRMED`.
8. Kiểm tra `LOG_THAO_TAC`: có `XAC_NHAN_NGAY`.
9. Sau khi chốt ngày, thử lưu phiếu mới cùng ngày → phải bị chặn.
10. Sau khi chốt ngày, thử sửa phiếu cùng ngày → phải bị chặn.
11. Sau khi chốt ngày, thử hủy phiếu cùng ngày → phải bị chặn.
12. QL nhập lý do và bấm `Mở lại ngày`.
13. Kiểm tra `DATA_CHOT_NGAY`: ngày chuyển `DRAFT`, có `LyDoMoLai`.
14. Sau khi mở lại, lưu/sửa/hủy phiếu hoạt động lại bình thường.
15. Các chức năng đã pass V0.6 vẫn hoạt động:
    - Lưu nhiều nhân viên
    - Đăng ký thiết bị
    - Báo cáo
    - Quản lý phiếu
    - Xóa mềm
    - Sửa phiếu
    - UI mobile mở/thu gọn

## Chốt pass

Nếu test pass, chốt:

```text
V0.7_DAILY_LOCK_AND_CONFIRM_FLOW_TEST_PASS
```
