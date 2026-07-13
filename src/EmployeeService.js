/**
 * VNPS Work Assign - EmployeeService
 * Version: V0.11.2.1_EMPLOYEE_ID_NS_PERFORMANCE_FIX
 *
 * NhanVienID là khóa định danh duy nhất, không dùng lại.
 * SoThe chỉ dùng để hiển thị/nhập nhanh và có thể tái sử dụng khi nhân viên cũ đã nghỉ.
 *
 * V0.11.2.1: thêm cache theo một lần thực thi để tránh đọc DM_NHAN_VIEN lặp lại
 * trong các vòng lặp DATA_NHAN_SU_CONG_VIEC / DATA_NHAN_VIEN_NGHI.
 */
var EMPLOYEE_ID_SCHEMA_READY_ = false;
var EMPLOYEE_META_CACHE_ = null;
var EMPLOYEE_CACHE_ = null;

function resetEmployeeCache_() {
  EMPLOYEE_ID_SCHEMA_READY_ = false;
  EMPLOYEE_META_CACHE_ = null;
  EMPLOYEE_CACHE_ = null;
}

function ensureEmployeeIdSchema_() {
  if (EMPLOYEE_ID_SCHEMA_READY_ && EMPLOYEE_META_CACHE_) return EMPLOYEE_META_CACHE_;

  ensureSheetColumns_(SHEETS.DM_NHAN_VIEN, HEADERS.DM_NHAN_VIEN);
  const sh = getSheet_(SHEETS.DM_NHAN_VIEN);
  const meta = getHeaderMap_(SHEETS.DM_NHAN_VIEN);
  const idCol = meta.map.NhanVienID;
  if (idCol === undefined) {
    EMPLOYEE_META_CACHE_ = meta;
    EMPLOYEE_ID_SCHEMA_READY_ = true;
    return meta;
  }

  const startRow = meta.headerRow + 1;
  const lastRow = sh.getLastRow();
  if (lastRow < startRow) {
    EMPLOYEE_META_CACHE_ = meta;
    EMPLOYEE_ID_SCHEMA_READY_ = true;
    return meta;
  }

  const range = sh.getRange(startRow, 1, lastRow - startRow + 1, meta.headers.length);
  const values = range.getValues();
  const usedIds = {};
  let maxNum = 0;

  values.forEach(row => {
    const id = String(row[idCol] || '').trim();
    if (!id) return;
    usedIds[id] = true;
    const m = id.match(/^EMP(\d+)$/i);
    if (m) maxNum = Math.max(maxNum, Number(m[1]));
  });

  let changed = false;
  values.forEach(row => {
    if (String(row[idCol] || '').trim()) return;
    let next;
    do {
      maxNum++;
      next = 'EMP' + String(maxNum).padStart(6, '0');
    } while (usedIds[next]);
    usedIds[next] = true;
    row[idCol] = next;
    changed = true;
  });

  if (changed) {
    range.setValues(values);
    SpreadsheetApp.flush();
  }

  EMPLOYEE_META_CACHE_ = getHeaderMap_(SHEETS.DM_NHAN_VIEN);
  EMPLOYEE_ID_SCHEMA_READY_ = true;
  return EMPLOYEE_META_CACHE_;
}

function getEmployeeCache_(forceRefresh) {
  if (EMPLOYEE_CACHE_ && !forceRefresh) return EMPLOYEE_CACHE_;

  ensureEmployeeIdSchema_();
  const rows = readObjects_(SHEETS.DM_NHAN_VIEN);
  const byId = {};
  const byCardAll = {};
  const byCardActive = {};
  const duplicateActiveCards = {};

  rows.forEach(e => {
    const id = employeeId_(e);
    const card = employeeSoThe_(e);
    const active = String(e.TrangThai || '').trim() === 'Đang làm';

    if (id) byId[id] = e;
    if (card) {
      if (!byCardAll[card]) byCardAll[card] = [];
      byCardAll[card].push(e);

      if (active) {
        if (byCardActive[card]) duplicateActiveCards[card] = true;
        byCardActive[card] = e;
      }
    }
  });

  EMPLOYEE_CACHE_ = { rows, byId, byCardAll, byCardActive, duplicateActiveCards };
  return EMPLOYEE_CACHE_;
}

function employeeId_(e) {
  return String((e && (e.nhanVienID !== undefined ? e.nhanVienID : e.NhanVienID)) || '').trim();
}

function employeeSoThe_(e) {
  return String((e && (e.soThe !== undefined ? e.soThe : e.SoThe)) || '').trim();
}

function employeeHoTen_(e) {
  return String((e && (e.hoTen !== undefined ? e.hoTen : e.HoTen)) || '').trim();
}

function employeeViTri_(e) {
  return String((e && (e.viTri !== undefined ? e.viTri : e.ViTri)) || '').trim();
}

function employeeKey_(e) {
  const id = employeeId_(e);
  if (id) return id;
  const soThe = employeeSoThe_(e);
  return soThe ? 'CARD:' + soThe : '';
}

function rowEmployeeKey_(row) {
  const id = String(row && row.NhanVienID || '').trim();
  if (id) return id;

  const soThe = String(row && row.SoThe || '').trim();
  if (!soThe) return '';

  // V0.11.2.1: không gọi getEmployeeByCard_ trong từng dòng vì sẽ đọc Sheet lặp lại.
  const cache = getEmployeeCache_();
  const emp = cache.byCardActive[soThe] || ((cache.byCardAll[soThe] || [])[0]);
  return emp ? employeeKey_(emp) : 'CARD:' + soThe;
}

function getEmployeeById_(nhanVienID) {
  const target = String(nhanVienID || '').trim();
  if (!target) return null;
  return getEmployeeCache_().byId[target] || null;
}

function getEmployeeByCard_(soThe, preferActive) {
  const target = String(soThe || '').trim();
  if (!target) return null;

  const cache = getEmployeeCache_();
  if (cache.duplicateActiveCards[target]) {
    throw new Error('Số thẻ ' + target + ' đang bị trùng ở nhiều nhân viên Đang làm. Hãy kiểm tra DM_NHAN_VIEN.');
  }

  if (cache.byCardActive[target]) return cache.byCardActive[target];
  const matches = cache.byCardAll[target] || [];
  if (!matches.length) return null;
  return matches[0];
}

function resolveEmployeeInput_(input) {
  if (!input) return null;
  if (typeof input === 'string') {
    return getEmployeeById_(input) || getEmployeeByCard_(input, true);
  }
  const id = String(input.nhanVienID || input.NhanVienID || '').trim();
  if (id) return getEmployeeById_(id);
  const soThe = String(input.soThe || input.SoThe || '').trim();
  if (soThe) return getEmployeeByCard_(soThe, true);
  return null;
}

function listActiveEmployees() {
  return getEmployeeCache_().rows
    .filter(e => String(e.TrangThai).trim() === 'Đang làm')
    .map(e => toClientEmployee_(e));
}

function listAssignableEmployees_() {
  return listActiveEmployees()
    .filter(e => normalizeRole_(e.viTri) === APP.ROLE_NV)
    .map(e => e);
}

function toClientEmployee_(e, extra) {
  return Object.assign({
    nhanVienID: employeeId_(e),
    employeeKey: employeeKey_(e),
    soThe: employeeSoThe_(e),
    hoTen: employeeHoTen_(e),
    viTri: employeeViTri_(e)
  }, extra || {});
}

function ensureUniqueActiveCard_(soThe, excludeNhanVienID) {
  const card = String(soThe || '').trim();
  if (!card) return;
  const excludeId = String(excludeNhanVienID || '').trim();
  const duplicated = getEmployeeCache_().rows.some(e => {
    if (String(e.SoThe || '').trim() !== card) return false;
    if (String(e.TrangThai || '').trim() !== 'Đang làm') return false;
    if (excludeId && String(e.NhanVienID || '').trim() === excludeId) return false;
    return true;
  });
  if (duplicated) throw new Error('Số thẻ ' + card + ' đang được một nhân viên Đang làm sử dụng. Không được dùng trùng số thẻ khi còn đang làm.');
}
