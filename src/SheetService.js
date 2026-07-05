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


/**
 * V0.4: bổ sung cột mới an toàn cho sheet hiện hữu.
 * Không xóa/sắp xếp lại cột cũ; chỉ append header còn thiếu ở cuối dòng 4.
 */
function ensureSheetColumns_(sheetName, requiredHeaders) {
  const sh = getSheet_(sheetName);
  const headerRow = 4;
  let lastCol = Math.max(sh.getLastColumn(), 1);
  let headers = sh.getRange(headerRow, 1, 1, lastCol).getValues()[0].map(String);
  const exists = {};
  headers.forEach(h => { if (h) exists[h] = true; });

  const missing = (requiredHeaders || []).filter(h => h && !exists[h]);
  if (missing.length) {
    sh.getRange(headerRow, lastCol + 1, 1, missing.length).setValues([missing]);
    sh.getRange(headerRow, lastCol + 1, 1, missing.length)
      .setFontWeight('bold')
      .setBackground('#0F766E')
      .setFontColor('#FFFFFF');
    SpreadsheetApp.flush();
  }
  return getHeaderMap_(sheetName);
}

function updateObjectByRowNumber_(sheetName, rowNumber, patch) {
  if (!rowNumber || rowNumber < 1) throw new Error('rowNumber không hợp lệ.');
  const sh = getSheet_(sheetName);
  const meta = getHeaderMap_(sheetName);
  Object.keys(patch || {}).forEach(key => {
    if (meta.map[key] === undefined) return;
    sh.getRange(rowNumber, meta.map[key] + 1).setValue(patch[key]);
  });
  SpreadsheetApp.flush();
}

/**
 * V0.5: xóa vật lý các dòng chi tiết theo điều kiện kỹ thuật.
 * Chỉ dùng cho DATA_NHAN_SU_CONG_VIEC khi sửa phiếu:
 * - Header phiếu vẫn giữ nguyên.
 * - Chi tiết cũ được thay bằng chi tiết mới.
 * - LOG_THAO_TAC vẫn ghi truy vết SUA_PHIEU.
 */
function deleteRowsWhere_(sheetName, predicate) {
  const sh = getSheet_(sheetName);
  const meta = getHeaderMap_(sheetName);
  const startRow = meta.headerRow + 1;
  const lastRow = sh.getLastRow();
  if (lastRow < startRow) return 0;

  const values = sh.getRange(startRow, 1, lastRow - startRow + 1, meta.headers.length).getValues();
  const rowsToDelete = [];
  values.forEach((row, idx) => {
    const obj = { __rowNumber: startRow + idx };
    meta.headers.forEach((h, colIdx) => obj[h] = row[colIdx]);
    if (predicate(obj)) rowsToDelete.push(obj.__rowNumber);
  });

  rowsToDelete.sort((a, b) => b - a).forEach(rowNumber => sh.deleteRow(rowNumber));
  if (rowsToDelete.length) SpreadsheetApp.flush();
  return rowsToDelete.length;
}
