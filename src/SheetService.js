function getDb_() {
  return SpreadsheetApp.openById(getSpreadsheetId_());
}

function getSheet_(sheetName) {
  const sh = getDb_().getSheetByName(sheetName);
  if (!sh) throw new Error('Không tìm thấy sheet: ' + sheetName);
  return sh;
}

function getHeaderMap_(sheetName) {
  const sh = getSheet_(sheetName);
  const headerRow = 4; // File mẫu đặt header tại dòng 4.
  const lastCol = sh.getLastColumn();
  const headers = sh.getRange(headerRow, 1, 1, lastCol).getValues()[0].map(String);
  const map = {};
  headers.forEach((h, idx) => {
    if (h) map[h] = idx;
  });
  return { headers, map, headerRow };
}

function readObjects_(sheetName) {
  const sh = getSheet_(sheetName);
  const meta = getHeaderMap_(sheetName);
  const startRow = meta.headerRow + 1;
  const lastRow = sh.getLastRow();
  if (lastRow < startRow) return [];
  const values = sh.getRange(startRow, 1, lastRow - startRow + 1, meta.headers.length).getValues();
  return values
    .filter(row => row.some(v => v !== '' && v !== null))
    .map((row, rowIndex) => {
      const obj = { __rowNumber: startRow + rowIndex };
      meta.headers.forEach((h, idx) => obj[h] = row[idx]);
      return obj;
    });
}

function appendObject_(sheetName, obj) {
  const sh = getSheet_(sheetName);
  const meta = getHeaderMap_(sheetName);
  const row = meta.headers.map(h => obj[h] !== undefined ? obj[h] : '');
  sh.appendRow(row);
  return row;
}

/**
 * V0.1.1: ghi nhiều dòng ổn định hơn.
 * Không phụ thuộc Excel table import, luôn ghi đúng số dòng theo mảng objects.
 */
function appendObjects_(sheetName, objects) {
  if (!objects || !objects.length) return 0;
  const sh = getSheet_(sheetName);
  const meta = getHeaderMap_(sheetName);
  const rows = objects.map(obj => meta.headers.map(h => obj[h] !== undefined ? obj[h] : ''));
  const startRow = sh.getLastRow() + 1;
  sh.getRange(startRow, 1, rows.length, meta.headers.length).setValues(rows);
  SpreadsheetApp.flush();
  return rows.length;
}

function nowText_() {
  return Utilities.formatDate(new Date(), APP.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
}

function normalizeText_(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function dateKey_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return Utilities.formatDate(value, APP.TIMEZONE, 'yyyy-MM-dd');
  }
  return String(value || '').trim().slice(0, 10);
}
