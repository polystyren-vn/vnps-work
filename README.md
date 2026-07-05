# VNPS Work Assign

Dự án nhập phân công công việc hằng ngày bằng Google Apps Script + Google Sheet.

## Phạm vi V0.1

- Google Sheet làm database: `VNPS_WORK_ASSIGN_DB`.
- Apps Script standalone project, trỏ tới Sheet bằng `SPREADSHEET_ID`.
- Web form cơ bản:
  - kiểm tra thiết bị đăng ký;
  - load danh mục công việc;
  - chỉ QL được thêm hạng mục mới;
  - chọn nhiều nhân viên và số giờ;
  - chặn vượt 8h/người/ngày;
  - ghi dữ liệu và log thao tác.

## Cấu trúc chính

```text
src/
  Code.js
  Config.js
  Setup.js
  SheetService.js
  AuthService.js
  DeviceService.js
  EmployeeService.js
  JobService.js
  WorkEntryService.js
  ReportService.js
  LogService.js

frontend/
  Index.html
  Style.html
  Script.html
```

## Thiết lập nhanh

1. Upload file `VNPS_WORK_ASSIGN_DB.xlsx` lên Google Drive, mở bằng Google Sheets và lấy `SPREADSHEET_ID`.
2. Tạo Apps Script standalone project bằng clasp:

```bash
npm install -g @google/clasp
clasp login
clasp create --title "VNPS_WORK_ASSIGN_APP" --type webapp
```

3. Copy `.clasp.example.json` thành `.clasp.json`, điền `scriptId`.
4. Push source:

```bash
clasp push
```

5. Mở Apps Script, chạy hàm:

```javascript
setupScriptProperties("SPREADSHEET_ID_CUA_BAN")
```

6. Deploy dạng Web app.

## Quyền

- Thiết bị phải có trong `DM_THIET_BI` và `TrangThai = Hoạt động`.
- Người phụ trách thiết bị được tra từ `SoTheDangKy`.
- `ViTri = QL` mới thấy và được dùng chức năng thêm hạng mục mới.
- Backend vẫn chặn quyền, không chỉ ẩn trên giao diện.

## Version

- `V0.1_DB_SCHEMA_AND_GAS_STARTER`
