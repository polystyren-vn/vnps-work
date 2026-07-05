# V0.3_REPORT_BASIC

## Baseline đầu vào

- `V0.2_DEVICE_REGISTER_FLOW_TEST_PASS`
- Giữ nguyên logic đã pass:
  - đăng ký thiết bị;
  - thiết bị chờ duyệt/khóa/hoạt động;
  - phân quyền QL/NV;
  - lưu 1 phiếu với nhiều nhân viên;
  - kiểm tra 8h/người/ngày.

## Mục tiêu V0.3

Thêm chức năng tạo báo cáo cơ bản từ dữ liệu gốc.

## File cập nhật

Copy đè các file sau vào repo hiện tại:

```text
src/Config.js
src/Code.js
src/ReportService.js
frontend/Index.html
frontend/Style.html
frontend/Script.html
```

## Chức năng mới

### 1. Báo cáo theo nhân viên/ngày

Ghi vào sheet:

```text
REPORT_NHAN_VIEN_NGAY
```

Cấu trúc:

```text
Ngay | SoThe | HoTen | TongGio | ChiTietCongViec | TrangThaiGio
```

`TrangThaiGio`:

```text
Đủ 8h
Chưa đủ
Vượt 8h
```

### 2. Báo cáo ngang theo hạng mục/ngày

Ghi vào sheet:

```text
REPORT_HANG_MUC_NGAY
```

Cấu trúc:

```text
STT | HangMuc | yyyy-mm-dd | yyyy-mm-dd | ...
```

Mỗi ô ngày hiển thị dạng:

```text
1002-4h, 1004-2h
```

Dòng cuối là:

```text
Tổng số nhân viên
```

Tổng số nhân viên đếm số thẻ không trùng trong từng ngày.

## Quyền tạo báo cáo

Chỉ thiết bị đang đăng nhập với người phụ trách có `ViTri = QL` mới hiện và được gọi API tạo báo cáo.

Backend vẫn chặn nếu không phải QL, không chỉ ẩn trên giao diện.

## Cách cập nhật

```bash
clasp push
```

Sau đó deploy Web App phiên bản mới:

```text
Deploy → Manage deployments → Edit deployment → New version
Description: V0.3_REPORT_BASIC
```

## Test bắt buộc

1. Mở `?deviceId=PC_TO_01`:
   - vào form bình thường;
   - có khu vực Báo cáo.
2. Mở `?deviceId=PC_TO_03`:
   - vào form bình thường;
   - không có khu vực Báo cáo.
3. Dùng QL tạo báo cáo:
   - `REPORT_NHAN_VIEN_NGAY` được dựng lại;
   - `REPORT_HANG_MUC_NGAY` được dựng lại;
   - `LOG_THAO_TAC` có `TAO_BAO_CAO`.
4. Test lại lưu công việc nhiều nhân viên:
   - vẫn ghi đúng nhiều dòng nhân sự.
5. Test lại đăng ký thiết bị mới:
   - vẫn ghi `DM_THIET_BI` trạng thái `Chờ duyệt`.

## Chốt pass

Nếu các case trên đúng, chốt:

```text
V0.3_REPORT_BASIC_TEST_PASS
```
