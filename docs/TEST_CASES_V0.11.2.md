# TEST CASES - V0.11.2_EMPLOYEE_ID_AND_NS_PERMISSION_PREP

## Chuẩn bị dữ liệu
Trong `DM_NHAN_VIEN`, tạo tối thiểu:

```text
NhanVienID | SoThe | HoTen | ViTri | TrangThai
EMP000001  | 1001  | QL A  | QL    | Đang làm
EMP000002  | 1002  | NS A  | NS    | Đang làm
EMP000003  | 1003  | NV A  | NV    | Đang làm
EMP000004  | 1004  | NV B  | NV    | Đang làm
```

## Case quyền
- QL: thấy tất cả khu vực.
- NS: thấy tổng quan, nghỉ, báo cáo; không thấy nhập công việc/quản lý phiếu/chốt ngày/duyệt thiết bị.
- NV: nếu thiết bị gán NV vẫn vào được nhưng không thấy khu vực quản lý nâng cao.

## Case nghỉ/làm
- QL nhập NV A làm 4h.
- NS nhập NV A nghỉ 4h cùng ngày: pass.
- NS nhập NV A nghỉ thêm lần 2: bị chặn trùng.
- QL nhập NV A làm thêm 5h: bị chặn vượt 8h.
- Báo cáo: NV A tổng hợp lệ = 8h.

## Case tái sử dụng số thẻ
- Cho EMP000003 nghỉ/khóa.
- Thêm EMP000005 dùng lại SoThe=1003, TrangThai=Đang làm.
- Nhập dữ liệu mới phải lưu NhanVienID=EMP000005.
- Dữ liệu cũ nếu chưa có NhanVienID vẫn fallback theo SoThe.
