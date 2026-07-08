/**
 * VNPS Work Assign - EmployeeLeaveService
 * Version: V0.11_EMPLOYEE_LEAVE_HOURS_QUOTA
 *
 * Phạm vi:
 * - Loại nhân viên quyền QL khỏi danh sách phân công công việc.
 * - QL nhập nhân viên nghỉ theo ngày kèm số giờ nghỉ.
 * - Nghỉ cả ngày = 8h, nghỉ theo giờ vẫn được tính vào đủ 8h/ngày.
 * - Dropdown phân công chỉ còn số giờ làm việc sau khi trừ giờ đã làm + giờ nghỉ.
 */

function ensureEmployeeLeaveSheet_() {
  const db = getDb_();
  let sh = db.getSheetByName(SHEETS.DATA_NHAN_VIEN_NGHI);
  const headers = HEADERS.DATA_NHAN_VIEN_NGHI;

  if (!sh) {
    sh = db.insertSheet(SHEETS.DATA_NHAN_VIEN_NGHI);
    sh.getRange(1, 1).setValue('VNPS WORK ASSIGN - NHÂN VIÊN NGHỈ');
    sh.getRange(2, 1).setValue('Sheet tự tạo từ V0.10/V0.11. Header dòng 4, dữ liệu từ dòng 5. V0.11 thêm SoGioNghi để tính đủ giờ khi nghỉ theo giờ.');
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

function employeeSoThe_(e) {
  return String((e && (e.soThe !== undefined ? e.soThe : e.SoThe)) || '').trim();
}

function employeeHoTen_(e) {
  return String((e && (e.hoTen !== undefined ? e.hoTen : e.HoTen)) || '').trim();
}

function employeeViTri_(e) {
  return String((e && (e.viTri !== undefined ? e.viTri : e.ViTri)) || '').trim();
}

function isQlEmployee_(e) {
  return employeeViTri_(e).toUpperCase() === 'QL';
}

function toClientEmployee_(e, extra) {
  return Object.assign({
    soThe: employeeSoThe_(e),
    hoTen: employeeHoTen_(e),
    viTri: employeeViTri_(e)
  }, extra || {});
}

function listActiveWorkEmployees_() {
  // Dùng lại danh mục nhân viên hiện có, chỉ loại QL khỏi nhóm được phân công công việc.
  return listActiveEmployees()
    .filter(e => employeeSoThe_(e))
    .filter(e => !isQlEmployee_(e))
    .map(e => toClientEmployee_(e));
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
  return readObjects_(SHEETS.DATA_NHAN_VIEN_NGHI)
    .filter(r => dateKey_(r.Ngay) === key)
    .filter(isActiveEmployeeLeave_);
}

function getActiveLeaveMapByDate_(ngay) {
  const map = {};
  getActiveLeaveRowsByDate_(ngay).forEach(r => {
    const soThe = String(r.SoThe || '').trim();
    if (!soThe) return;
    if (!map[soThe]) map[soThe] = [];
    map[soThe].push(r);
  });
  return map;
}

function getLeaveHoursMapByDate_(ngay) {
  const map = {};
  getActiveLeaveRowsByDate_(ngay).forEach(r => {
    const soThe = String(r.SoThe || '').trim();
    if (!soThe) return;
    map[soThe] = Math.min(APP.MAX_HOURS_PER_DAY, (map[soThe] || 0) + getLeaveHoursFromRow_(r));
  });
  return map;
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
    .sort((a, b) => String(a.soThe).localeCompare(String(b.soThe)));
}

function listAssignableEmployeesByDate_(ngay) {
  const leaveHoursMap = getLeaveHoursMapByDate_(ngay);
  return listActiveWorkEmployees_()
    .map(e => {
      const gioNghi = Number(leaveHoursMap[e.soThe] || 0);
      return Object.assign({}, e, {
        nghi: gioNghi > 0,
        gioNghi: gioNghi
      });
    });
}

function validateEmployeesAssignableForDate_(ngay, soTheList) {
  const baseMap = {};
  listActiveWorkEmployees_().forEach(e => baseMap[e.soThe] = e);

  (soTheList || []).forEach(soTheRaw => {
    const soThe = String(soTheRaw || '').trim();
    if (!soThe) throw new Error('Có dòng nhân viên thiếu số thẻ.');
    if (!baseMap[soThe]) {
      throw new Error('Số thẻ ' + soThe + ' không được phân công công việc. Có thể là QL, đã nghỉ việc hoặc không hợp lệ.');
    }
  });
}

function getEmployeeLeaveInfo(payload) {
  if (!payload) throw new Error('Thiếu dữ liệu nhân viên nghỉ.');
  if (!payload.deviceId) throw new Error('Thiếu DeviceID.');
  if (!payload.ngay) throw new Error('Thiếu ngày cần xem nhân viên nghỉ.');

  const context = getDeviceContext(payload.deviceId, payload.deviceToken);
  if (!context.ok) throw new Error(context.reason);
  if (!context.isQL) throw new Error('Chỉ QL được xem/nhập nhân viên nghỉ.');

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

function getNextLeaveId_(ngay, soThe) {
  ensureEmployeeLeaveSheet_();
  const datePart = dateKey_(ngay).replace(/-/g, '');
  const prefix = 'NGHI_' + datePart + '_' + String(soThe || '').trim() + '_';
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
  if (!context.isQL) throw new Error('Chỉ QL được nhập nhân viên nghỉ.');

  const key = dateKey_(payload.ngay);
  const soThe = String(payload.soThe || '').trim();
  const lyDo = String(payload.lyDo || '').trim();
  const soGioNghi = Number(payload.soGioNghi || payload.gioNghi || APP.MAX_HOURS_PER_DAY);

  if (!soThe) throw new Error('Vui lòng chọn nhân viên nghỉ.');
  if (!soGioNghi || isNaN(soGioNghi) || soGioNghi < 1 || soGioNghi > APP.MAX_HOURS_PER_DAY) {
    throw new Error('Số giờ nghỉ phải từ 1 đến 8. Nghỉ cả ngày nhập 8h.');
  }
  if (!lyDo) throw new Error('Vui lòng nhập lý do/nguyên nhân nghỉ.');

  const emp = getEmployeeByCard_(soThe);
  if (!emp || String(emp.TrangThai || '').trim() !== 'Đang làm') {
    throw new Error('Nhân viên nghỉ không hợp lệ hoặc không còn đang làm.');
  }
  if (isQlEmployee_(emp)) {
    throw new Error('Nhân viên quyền QL không nằm trong danh sách phân công công việc nên không nhập vào mục nhân viên nghỉ của báo cáo công việc.');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    assertDailyOpenForChange_(key, 'nhập nhân viên nghỉ');
    ensureEmployeeLeaveSheet_();

    const duplicated = getActiveLeaveRowsByDate_(key)
      .some(r => String(r.SoThe || '').trim() === soThe);
    if (duplicated) throw new Error('Nhân viên ' + soThe + ' đã có trong danh sách nghỉ ngày ' + key + '. Nếu muốn đổi số giờ nghỉ, hãy hủy dòng nghỉ cũ rồi nhập lại.');

    const usedWork = getUsedHoursByDate_(key)[soThe] || 0;
    if (usedWork + soGioNghi > APP.MAX_HOURS_PER_DAY) {
      throw new Error('Số thẻ ' + soThe + ' đã có ' + usedWork + 'h công việc. Không thể nhập nghỉ ' + soGioNghi + 'h vì tổng sẽ vượt 8h.');
    }

    const id = getNextLeaveId_(key, soThe);
    appendObject_(SHEETS.DATA_NHAN_VIEN_NGHI, {
      ID: id,
      Ngay: key,
      SoThe: soThe,
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

    writeLog_(context.deviceId, context.soThe, 'NHAP_NHAN_VIEN_NGHI', key + ' · ' + soThe + ' · nghỉ ' + soGioNghi + 'h · ' + lyDo);
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
  if (!context.isQL) throw new Error('Chỉ QL được hủy nhân viên nghỉ.');

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

    writeLog_(context.deviceId, context.soThe, 'HUY_NHAN_VIEN_NGHI', key + ' · ' + String(row.SoThe || '').trim() + ' · nghỉ ' + getLeaveHoursFromRow_(row) + 'h · ' + reason);
    return getEmployeeLeaveInfo({ deviceId: context.deviceId, deviceToken: payload.deviceToken, ngay: key });
  } finally {
    lock.releaseLock();
  }
}
