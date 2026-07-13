/**
 * VNPS Work Assign - EmployeeLeaveService
 * Version: V0.12.2_MOBILE_NAV_UI_POLISH
 *
 * - Nghỉ theo giờ giữ nguyên logic V0.11.
 * - V0.11.2: NS và QL được xem/nhập/hủy nhân viên nghỉ khi ngày chưa chốt.
 * - Nhân viên nghỉ chỉ lấy ViTri=NV, TrangThai=Đang làm.
 * - Tính giờ nghỉ theo NhanVienID, fallback SoThe cho dữ liệu cũ.
 * - V0.12.2: bổ sung sửa số giờ/lý do nghỉ khi ngày chưa chốt.
 */
var EMPLOYEE_LEAVE_DATE_CACHE_ = {};

function clearEmployeeLeaveDateCache_(ngay) {
  if (!EMPLOYEE_LEAVE_DATE_CACHE_) EMPLOYEE_LEAVE_DATE_CACHE_ = {};
  if (ngay) delete EMPLOYEE_LEAVE_DATE_CACHE_[dateKey_(ngay)];
  else EMPLOYEE_LEAVE_DATE_CACHE_ = {};
}

function ensureEmployeeLeaveSheet_() {
  const db = getDb_();
  let sh = db.getSheetByName(SHEETS.DATA_NHAN_VIEN_NGHI);
  const headers = HEADERS.DATA_NHAN_VIEN_NGHI;

  if (!sh) {
    sh = db.insertSheet(SHEETS.DATA_NHAN_VIEN_NGHI);
    sh.getRange(1, 1).setValue('VNPS WORK ASSIGN - NHÂN VIÊN NGHỈ');
    sh.getRange(2, 1).setValue('Sheet tự tạo từ V0.10/V0.11. Header dòng 4, dữ liệu từ dòng 5. V0.11.2 thêm NhanVienID để tránh nhầm khi SoThe tái sử dụng.');
    sh.getRange(4, 1, 1, headers.length).setValues([headers]);
    sh.getRange(4, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#0F766E')
      .setFontColor('#FFFFFF');
    sh.setFrozenRows(4);
    SpreadsheetApp.flush();
    return getHeaderMap_(SHEETS.DATA_NHAN_VIEN_NGHI);
  }

  return ensureSheetColumns_(SHEETS.DATA_NHAN_VIEN_NGHI, headers);
}

function listActiveWorkEmployees_() {
  return listAssignableEmployees_();
}

function isActiveEmployeeLeave_(row) {
  const status = String(row && row.TrangThai || APP.LEAVE_STATUS_ACTIVE).trim() || APP.LEAVE_STATUS_ACTIVE;
  return status !== APP.LEAVE_STATUS_CANCELLED && status !== APP.ENTRY_STATUS_DELETED;
}

function normalizeLeaveHours_(value) {
  // Legacy V0.10 chưa có SoGioNghi: mặc định là nghỉ cả ngày 8h.
  if (value === null || value === undefined || String(value).trim() === '') return APP.MAX_HOURS_PER_DAY;
  const n = Number(value);
  if (isNaN(n)) return APP.MAX_HOURS_PER_DAY;
  return Math.max(0, Math.min(APP.MAX_HOURS_PER_DAY, n));
}

function getLeaveHoursFromRow_(row) {
  return normalizeLeaveHours_(row && row.SoGioNghi);
}

function getActiveLeaveRowsByDate_(ngay) {
  ensureEmployeeLeaveSheet_();
  const key = dateKey_(ngay);
  if (!key) return [];

  if (!EMPLOYEE_LEAVE_DATE_CACHE_) EMPLOYEE_LEAVE_DATE_CACHE_ = {};
  if (EMPLOYEE_LEAVE_DATE_CACHE_[key] && EMPLOYEE_LEAVE_DATE_CACHE_[key].rows) {
    return EMPLOYEE_LEAVE_DATE_CACHE_[key].rows;
  }

  const rows = readObjects_(SHEETS.DATA_NHAN_VIEN_NGHI)
    .filter(r => dateKey_(r.Ngay) === key)
    .filter(isActiveEmployeeLeave_);

  EMPLOYEE_LEAVE_DATE_CACHE_[key] = Object.assign(EMPLOYEE_LEAVE_DATE_CACHE_[key] || {}, { rows });
  return rows;
}

function getLeaveMapsByDate_(ngay) {
  const key = dateKey_(ngay);
  if (!key) return { rows: [], rowsByKey: {}, hoursByKey: {} };
  if (!EMPLOYEE_LEAVE_DATE_CACHE_) EMPLOYEE_LEAVE_DATE_CACHE_ = {};
  const cached = EMPLOYEE_LEAVE_DATE_CACHE_[key] || {};
  if (cached.rowsByKey && cached.hoursByKey) return cached;

  const rows = getActiveLeaveRowsByDate_(key);
  const rowsByKey = {};
  const hoursByKey = {};

  rows.forEach(r => {
    const empKey = rowEmployeeKey_(r);
    if (!empKey) return;
    if (!rowsByKey[empKey]) rowsByKey[empKey] = [];
    rowsByKey[empKey].push(r);
    hoursByKey[empKey] = Math.min(APP.MAX_HOURS_PER_DAY, (hoursByKey[empKey] || 0) + getLeaveHoursFromRow_(r));
  });

  EMPLOYEE_LEAVE_DATE_CACHE_[key] = Object.assign(cached, { rows, rowsByKey, hoursByKey });
  return EMPLOYEE_LEAVE_DATE_CACHE_[key];
}

function getActiveLeaveMapByDate_(ngay) {
  return getLeaveMapsByDate_(ngay).rowsByKey || {};
}

function getLeaveHoursMapByDate_(ngay) {
  return getLeaveMapsByDate_(ngay).hoursByKey || {};
}

function getLeaveReasonTextForEmployee_(leaveRows) {
  return (leaveRows || [])
    .map(r => {
      const h = getLeaveHoursFromRow_(r);
      const reason = clientSafeText_(r.LyDo || 'Có đăng ký nghỉ');
      return 'Nghỉ ' + h + 'h: ' + reason;
    })
    .join('; ');
}

function listEmployeeLeavesForClient_(ngay) {
  return getActiveLeaveRowsByDate_(ngay)
    .map(r => {
      const h = getLeaveHoursFromRow_(r);
      return {
        id: clientSafeText_(r.ID),
        ngay: dateKey_(r.Ngay),
        nhanVienID: String(r.NhanVienID || '').trim(),
        soThe: String(r.SoThe || '').trim(),
        hoTen: clientSafeText_(r.HoTen),
        soGioNghi: h,
        gioNghi: h,
        lyDo: clientSafeText_(r.LyDo),
        trangThai: String(r.TrangThai || APP.LEAVE_STATUS_ACTIVE).trim() || APP.LEAVE_STATUS_ACTIVE,
        nguoiNhap: String(r.NguoiNhap || '').trim(),
        thoiGianLuu: clientSafeText_(r.ThoiGianLuu, 'yyyy-MM-dd HH:mm:ss')
      };
    })
    .sort((a, b) => String(a.soThe).localeCompare(String(b.soThe)) || String(a.nhanVienID).localeCompare(String(b.nhanVienID)));
}

function listAssignableEmployeesByDate_(ngay) {
  const leaveHoursMap = getLeaveHoursMapByDate_(ngay);
  return listActiveWorkEmployees_()
    .map(e => {
      const key = employeeKey_(e);
      const gioNghi = Number(leaveHoursMap[key] || 0);
      return Object.assign({}, e, {
        nghi: gioNghi > 0,
        gioNghi: gioNghi
      });
    });
}

function validateEmployeesAssignableForDate_(ngay, employeeKeysOrInputs) {
  const baseMap = {};
  listActiveWorkEmployees_().forEach(e => baseMap[employeeKey_(e)] = e);

  (employeeKeysOrInputs || []).forEach(raw => {
    const emp = typeof raw === 'object' ? resolveEmployeeInput_(raw) : (getEmployeeById_(raw) || getEmployeeByCard_(raw, true));
    const key = emp ? employeeKey_(emp) : String(raw || '').trim();
    if (!key) throw new Error('Có dòng nhân viên thiếu định danh.');
    if (!emp || !baseMap[key]) {
      const label = emp ? employeeSoThe_(emp) : String(raw || '');
      throw new Error('Nhân viên ' + label + ' không được phân công công việc. Có thể là QL/NS, đã nghỉ việc hoặc không hợp lệ.');
    }
  });
}

function getEmployeeLeaveInfo(payload) {
  if (!payload) throw new Error('Thiếu dữ liệu nhân viên nghỉ.');
  if (!payload.deviceId) throw new Error('Thiếu DeviceID.');
  if (!payload.ngay) throw new Error('Thiếu ngày cần xem nhân viên nghỉ.');

  const context = getDeviceContext(payload.deviceId, payload.deviceToken);
  if (!context.ok) throw new Error(context.reason);
  if (!canManageLeave_(context)) throw new Error('Chỉ QL/NS được xem/nhập nhân viên nghỉ.');

  const key = dateKey_(payload.ngay);
  return {
    ok: true,
    ngay: key,
    employees: listActiveWorkEmployees_(),
    leaves: listEmployeeLeavesForClient_(key)
  };
}

function getEmployeeLeaveById_(leaveId) {
  ensureEmployeeLeaveSheet_();
  const id = String(leaveId || '').trim();
  if (!id) return null;
  return readObjects_(SHEETS.DATA_NHAN_VIEN_NGHI)
    .find(r => String(r.ID || '').trim() === id) || null;
}

function getNextLeaveId_(ngay, employeeKeyOrSoThe) {
  ensureEmployeeLeaveSheet_();
  const datePart = dateKey_(ngay).replace(/-/g, '');
  const safeKey = String(employeeKeyOrSoThe || '').trim().replace(/[^A-Za-z0-9_-]/g, '');
  const prefix = 'NGHI_' + datePart + '_' + safeKey + '_';
  let maxNum = 0;
  readObjects_(SHEETS.DATA_NHAN_VIEN_NGHI).forEach(r => {
    const id = String(r.ID || '').trim();
    if (id.indexOf(prefix) !== 0) return;
    const n = Number(id.slice(prefix.length));
    if (!isNaN(n)) maxNum = Math.max(maxNum, n);
  });
  return prefix + String(maxNum + 1).padStart(3, '0');
}

function saveEmployeeLeave(payload) {
  if (!payload) throw new Error('Thiếu dữ liệu lưu nhân viên nghỉ.');
  if (!payload.deviceId) throw new Error('Thiếu DeviceID.');
  if (!payload.ngay) throw new Error('Thiếu ngày nghỉ.');

  const context = getDeviceContext(payload.deviceId, payload.deviceToken);
  if (!context.ok) throw new Error(context.reason);
  if (!canManageLeave_(context)) throw new Error('Chỉ QL/NS được nhập nhân viên nghỉ.');

  const key = dateKey_(payload.ngay);
  const lyDo = String(payload.lyDo || '').trim();
  const soGioNghi = Number(payload.soGioNghi || payload.gioNghi || APP.MAX_HOURS_PER_DAY);

  if (!soGioNghi || isNaN(soGioNghi) || soGioNghi < 1 || soGioNghi > APP.MAX_HOURS_PER_DAY) {
    throw new Error('Số giờ nghỉ phải từ 1 đến 8. Nghỉ cả ngày nhập 8h.');
  }
  if (!lyDo) throw new Error('Vui lòng nhập lý do/nguyên nhân nghỉ.');

  const emp = resolveEmployeeInput_(payload);
  if (!emp || String(emp.TrangThai || '').trim() !== 'Đang làm') {
    throw new Error('Nhân viên nghỉ không hợp lệ hoặc không còn đang làm.');
  }
  if (!isAssignableEmployee_(emp)) {
    throw new Error('Chỉ nhân viên ViTri=NV mới nằm trong danh sách nhân viên nghỉ của báo cáo công việc.');
  }

  const empKey = employeeKey_(emp);

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    assertDailyOpenForChange_(key, 'nhập nhân viên nghỉ');
    ensureEmployeeLeaveSheet_();

    const duplicated = getActiveLeaveRowsByDate_(key)
      .some(r => rowEmployeeKey_(r) === empKey);
    if (duplicated) throw new Error('Nhân viên ' + employeeSoThe_(emp) + ' đã có trong danh sách nghỉ ngày ' + key + '. Nếu muốn đổi số giờ nghỉ, hãy hủy dòng nghỉ cũ rồi nhập lại.');

    const usedWork = getUsedHoursByDate_(key)[empKey] || 0;
    if (usedWork + soGioNghi > APP.MAX_HOURS_PER_DAY) {
      throw new Error('Nhân viên ' + employeeSoThe_(emp) + ' đã có ' + usedWork + 'h công việc. Không thể nhập nghỉ ' + soGioNghi + 'h vì tổng sẽ vượt 8h.');
    }

    const id = getNextLeaveId_(key, employeeId_(emp) || employeeSoThe_(emp));
    appendObject_(SHEETS.DATA_NHAN_VIEN_NGHI, {
      ID: id,
      Ngay: key,
      NhanVienID: employeeId_(emp),
      SoThe: employeeSoThe_(emp),
      HoTen: employeeHoTen_(emp),
      SoGioNghi: soGioNghi,
      LyDo: lyDo,
      TrangThai: APP.LEAVE_STATUS_ACTIVE,
      NguoiNhap: context.soThe,
      DeviceID: context.deviceId,
      ThoiGianLuu: nowText_(),
      HuyBoi: '',
      ThoiGianHuy: '',
      LyDoHuy: ''
    });
    clearEmployeeLeaveDateCache_(key);

    writeLog_(context.deviceId, context.soThe, 'NHAP_NHAN_VIEN_NGHI', key + ' · ' + employeeId_(emp) + ' · ' + employeeSoThe_(emp) + ' · nghỉ ' + soGioNghi + 'h · ' + lyDo);
    return getEmployeeLeaveInfo({ deviceId: context.deviceId, deviceToken: payload.deviceToken, ngay: key });
  } finally {
    lock.releaseLock();
  }
}

function cancelEmployeeLeave(payload) {
  if (!payload) throw new Error('Thiếu dữ liệu hủy nhân viên nghỉ.');
  if (!payload.deviceId) throw new Error('Thiếu DeviceID.');
  const leaveId = String(payload.leaveId || '').trim();
  const reason = String(payload.reason || '').trim();
  if (!leaveId) throw new Error('Thiếu mã dòng nghỉ cần hủy.');
  if (!reason) throw new Error('Vui lòng nhập lý do hủy dòng nghỉ.');

  const context = getDeviceContext(payload.deviceId, payload.deviceToken);
  if (!context.ok) throw new Error(context.reason);
  if (!canManageLeave_(context)) throw new Error('Chỉ QL/NS được hủy nhân viên nghỉ.');

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const row = getEmployeeLeaveById_(leaveId);
    if (!row) throw new Error('Không tìm thấy dòng nghỉ: ' + leaveId);
    if (!isActiveEmployeeLeave_(row)) throw new Error('Dòng nghỉ này đã được hủy trước đó.');

    const key = dateKey_(row.Ngay);
    assertDailyOpenForChange_(key, 'hủy nhân viên nghỉ');

    updateObjectByRowNumber_(SHEETS.DATA_NHAN_VIEN_NGHI, row.__rowNumber, {
      TrangThai: APP.LEAVE_STATUS_CANCELLED,
      HuyBoi: context.soThe,
      ThoiGianHuy: nowText_(),
      LyDoHuy: reason
    });
    clearEmployeeLeaveDateCache_(key);

    writeLog_(context.deviceId, context.soThe, 'HUY_NHAN_VIEN_NGHI', key + ' · ' + String(row.NhanVienID || '').trim() + ' · ' + String(row.SoThe || '').trim() + ' · nghỉ ' + getLeaveHoursFromRow_(row) + 'h · ' + reason);
    return getEmployeeLeaveInfo({ deviceId: context.deviceId, deviceToken: payload.deviceToken, ngay: key });
  } finally {
    lock.releaseLock();
  }
}

function updateEmployeeLeave(payload) {
  if (!payload) throw new Error('Thiếu dữ liệu sửa nhân viên nghỉ.');
  if (!payload.deviceId) throw new Error('Thiếu DeviceID.');
  const leaveId = String(payload.leaveId || '').trim();
  const lyDo = String(payload.lyDo || payload.reason || '').trim();
  const soGioNghi = Number(payload.soGioNghi || payload.gioNghi || 0);
  if (!leaveId) throw new Error('Thiếu mã dòng nghỉ cần sửa.');
  if (!soGioNghi || isNaN(soGioNghi) || soGioNghi < 1 || soGioNghi > APP.MAX_HOURS_PER_DAY) {
    throw new Error('Số giờ nghỉ phải từ 1 đến 8.');
  }
  if (!lyDo) throw new Error('Vui lòng nhập lý do/nguyên nhân nghỉ.');

  const context = getDeviceContext(payload.deviceId, payload.deviceToken);
  if (!context.ok) throw new Error(context.reason);
  if (!canManageLeave_(context)) throw new Error('Chỉ QL/NS được sửa nhân viên nghỉ.');

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const row = getEmployeeLeaveById_(leaveId);
    if (!row) throw new Error('Không tìm thấy dòng nghỉ: ' + leaveId);
    if (!isActiveEmployeeLeave_(row)) throw new Error('Dòng nghỉ này đã được hủy, không được sửa.');

    const key = dateKey_(row.Ngay);
    assertDailyOpenForChange_(key, 'sửa nhân viên nghỉ');

    const emp = resolveEmployeeInput_({ NhanVienID: row.NhanVienID, SoThe: row.SoThe });
    const empKey = rowEmployeeKey_(row) || (emp ? employeeKey_(emp) : '');
    if (!empKey) throw new Error('Dòng nghỉ thiếu định danh nhân viên.');

    const usedWork = getUsedHoursByDate_(key)[empKey] || 0;
    if (usedWork + soGioNghi > APP.MAX_HOURS_PER_DAY) {
      const label = String(row.SoThe || (emp ? employeeSoThe_(emp) : '') || '').trim();
      throw new Error('Nhân viên ' + label + ' đã có ' + usedWork + 'h công việc. Không thể sửa nghỉ thành ' + soGioNghi + 'h vì tổng sẽ vượt 8h.');
    }

    const oldHours = getLeaveHoursFromRow_(row);
    const oldReason = String(row.LyDo || '').trim();
    updateObjectByRowNumber_(SHEETS.DATA_NHAN_VIEN_NGHI, row.__rowNumber, {
      SoGioNghi: soGioNghi,
      LyDo: lyDo
    });
    clearEmployeeLeaveDateCache_(key);

    writeLog_(
      context.deviceId,
      context.soThe,
      'SUA_NHAN_VIEN_NGHI',
      key + ' · ' + String(row.NhanVienID || '').trim() + ' · ' + String(row.SoThe || '').trim()
        + ' · ' + oldHours + 'h → ' + soGioNghi + 'h'
        + ' · ' + oldReason + ' → ' + lyDo
    );
    return getEmployeeLeaveInfo({ deviceId: context.deviceId, deviceToken: payload.deviceToken, ngay: key });
  } finally {
    lock.releaseLock();
  }
}
