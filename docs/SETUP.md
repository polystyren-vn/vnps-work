# SETUP

## B1. Tạo Google Sheet database

Upload `VNPS_WORK_ASSIGN_DB.xlsx` lên Google Drive, mở bằng Google Sheets.

## B2. Tạo Apps Script standalone

```bash
npm install -g @google/clasp
clasp login
clasp create --title "VNPS_WORK_ASSIGN_APP" --type webapp
```

## B3. Gắn Spreadsheet ID

Trong Apps Script, chạy:

```javascript
setupScriptProperties("SPREADSHEET_ID")
```

## B4. Deploy Web App

Chọn Deploy > New deployment > Web app.

Khuyến nghị:
- Execute as: Me.
- Who has access: tùy môi trường thực tế. Nếu nội bộ có Google Workspace, ưu tiên giới hạn trong domain.

## B5. Test

Mở link web app kèm DeviceID mẫu:

```text
https://script.google.com/.../exec?deviceId=PC_TO_01
```
