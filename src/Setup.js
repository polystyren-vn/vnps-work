/**
 * Chạy 1 lần sau khi tạo Apps Script project.
 */
function setupScriptProperties(spreadsheetId) {
  if (!spreadsheetId) throw new Error('Thiếu spreadsheetId.');
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', spreadsheetId);
  PropertiesService.getScriptProperties().setProperty('APP_VERSION', APP.VERSION);
  return {
    ok: true,
    spreadsheetId,
    version: APP.VERSION
  };
}

/**
 * Kiểm tra nhanh cấu hình.
 */
function healthCheck() {
  const ss = getDb_();
  return {
    ok: true,
    app: APP.NAME,
    version: APP.VERSION,
    spreadsheetName: ss.getName(),
    spreadsheetId: ss.getId()
  };
}
