# V0.11.1_EMPLOYEE_LEAVE_UI_FLOW_FIX

Baseline đầu vào: `V0.10_EMPLOYEE_LEAVE_FILTER_TEST_PASS` + bản đang test `V0.11_EMPLOYEE_LEAVE_HOURS_QUOTA`.

## Mục tiêu

Hotfix các điểm phát sinh khi test V0.11:

1. Sửa sai luồng tab **Nhân viên nghỉ**: dropdown nhân viên nghỉ phải tự có dữ liệu theo ngày, không bắt người dùng bấm `Tải danh sách nghỉ` trước rồi dropdown mới hiện list.
2. Gỡ các ô chú thích màu xanh ở đầu từng nhóm chức năng để giao diện gọn hơn trên mobile.
3. Thêm hiệu ứng đang xử lý dạng floating overlay có đồng hồ đếm giây và tự khóa nút bấm trong lúc Apps Script đang thực hiện, tránh bấm lặp 2–3 lần.

## File thay đổi

```text
src/Config.js
frontend/Index.html
frontend/Style.html
frontend/Script.html
PATCH_NOTES.md
```

## Chi tiết cập nhật

### 1. Nhân viên nghỉ tự tải dropdown

- Khi QL vào form, hệ thống tự tải dữ liệu nhân viên nghỉ theo ngày hiện tại.
- Khi đổi `Ngày` ở mục nhập công việc, ngày nghỉ được đồng bộ và danh sách nhân viên nghỉ cũng tự tải lại.
- Khi đổi `Ngày nghỉ` trực tiếp trong tab Nhân viên nghỉ, danh sách dropdown và danh sách dòng nghỉ tự cập nhật.
- Nút `Tải danh sách nghỉ` vẫn giữ lại để QL bấm refresh thủ công khi cần.

### 2. Gọn giao diện mobile

Đã bỏ các box chú thích màu xanh ở đầu các nhóm:

```text
Tổng quan QL
Duyệt thiết bị
Nhân viên nghỉ
Quản lý phiếu
Sửa phiếu
Kiểm tra / chốt ngày
Báo cáo
```

Các thông báo trạng thái, lỗi và dữ liệu rỗng vẫn giữ lại, nhưng chuyển dạng nhẹ hơn để không gây rối giao diện.

### 3. Busy overlay chống bấm lặp

Thêm overlay nổi phía dưới màn hình:

```text
Đang kiểm tra thiết bị...
Đang lưu công việc...
Đang tải danh sách nhân viên nghỉ...
Đang lưu nhân viên nghỉ...
Đang hủy dòng nghỉ...
Đang tải danh sách phiếu...
Đang lưu sửa phiếu...
Đang tạo báo cáo...
...
```

Trong lúc đang xử lý:

- Hiển thị vòng xoay + đồng hồ đếm giây.
- Tạm khóa toàn bộ nút bấm.
- Sau khi xử lý xong hoặc lỗi, nút được trả lại trạng thái ban đầu.

## Không thay đổi

Không sửa các logic nghiệp vụ đã pass:

```text
Đăng ký thiết bị token trình duyệt
Lưu nhiều nhân viên
Kiểm tra 8h/người/ngày
Sửa phiếu
Hủy mềm
Chốt/mở lại ngày
Báo cáo
Nhân viên nghỉ theo giờ
```

## Test bắt buộc

1. QL mở app, vào tab `Nhân viên nghỉ`, bấm dropdown nhân viên nghỉ phải thấy danh sách mà không cần bấm `Tải danh sách nghỉ` trước.
2. Đổi `Ngày nghỉ` sang ngày khác, dropdown và danh sách nghỉ tự cập nhật.
3. Bấm `Tải danh sách nghỉ` vẫn hoạt động như refresh thủ công.
4. Các ô chú thích màu xanh ở đầu nhóm chức năng không còn xuất hiện.
5. Khi bấm lưu/tải/sửa/hủy/tạo báo cáo, có overlay nổi + đồng hồ đếm giây.
6. Trong lúc overlay đang chạy, bấm lặp nút thao tác không được.
7. Xử lý xong thì nút bấm hoạt động lại bình thường.
8. V0.11 vẫn pass: nghỉ 8h, nghỉ 4h + làm 4h, nghỉ 4h + làm 5h bị chặn, báo cáo tính đủ giờ nghỉ.

## Chốt nếu pass

```text
V0.11.1_EMPLOYEE_LEAVE_UI_FLOW_FIX_TEST_PASS
```
