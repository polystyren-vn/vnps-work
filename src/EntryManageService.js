/**
 * VNPS Work Assign - EntryManageService
 * Version: V0.11.2.1_EMPLOYEE_ID_NS_PERFORMANCE_FIX
 *
 * Quản lý phiếu vẫn chỉ dành cho QL.
 * V0.11.2: chi tiết nhân sự dùng NhanVienID, giữ snapshot SoThe/HoTen và fallback SoThe cho dữ liệu cũ.
 */
function clientSafeText_(value, pattern) {
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return Utilities.formatDate(value, APP.TIMEZONE, pattern || 'yyyy-MM-dd HH:mm:ss');
  }
  if (value === null || value === undefined) return '';
  return String(value);
}

function ensureWorkEntryStatusSchema_() {
  const required = ['TrangThai', 'HuyBoi', 'ThoiGianHuy', 'LyDoHuy', 'SuaBoi', 'ThoiGianSua', 'LyDoSua'];
  const meta = ensureSheetColumns_(SHEETS.DATA_CONG_VIEC, required);
  const sh = getSheet_(SHEETS.DATA_CONG_VIEC);
  const startRow = meta.headerRow + 1;
  const lastRow = sh.getLastRow();
  if (lastRow < startRow) return getHeaderMap_(SHEETS.DATA_CONG_VIEC);

  const statusCol = meta.map.TrangThai + 1;
  const rng = sh.getRange(startRow, statusCol, lastRow - startRow + 1, 1);
  const values = rng.getValues();
  let changed = false;
  const out = values.map(row => {
    const v = String(row[0] || '').trim();
    if (!v) {
      changed = true;
      return [APP.ENTRY_STATUS_ACTIVE];
    }
    return [v];
  });
  if (changed) rng.setValues(out);
  return getHeaderMap_(SHEETS.DATA_CONG_VIEC);
}

function isActiveWorkEntry_(row) {
  const status = String(row && row.TrangThai || APP.ENTRY_STATUS_ACTIVE).trim();
  return status !== APP.ENTRY_STATUS_DELETED;
}

function makeActiveWorkEntryMap_() {
  ensureWorkEntryStatusSchema_();
  const map = {};
  readObjects_(SHEETS.DATA_CONG_VIEC).forEach(row => {
    const id = String(row.PhieuID || '').trim();
    if (!id) return;
    if (isActiveWorkEntry_(row)) map[id] = row;
  });
  return map;
}

function listWorkEntriesForManage(payload) {
  if (!payload) throw new Error('Thiếu dữ liệu tải phiếu.');
  if (!payload.deviceId) throw new Error('Thiếu DeviceID.');
  if (!payload.ngay) throw new Error('Thiếu ngày tải phiếu.');

  const context = getDeviceContext(payload.deviceId, payload.deviceToken);
  if (!context.ok) throw new Error(context.reason);
  if (!canManageWorkEntry_(context)) throw new Error('Chỉ QL được xem/quản lý phiếu.');

  ensureWorkEntryStatusSchema_();
  ensureWorkDetailEmployeeSchema_();
  const ngayKey = dateKey_(payload.ngay);
  const details = readObjects_(SHEETS.DATA_NHAN_SU_CONG_VIEC);
  const detailMap = {};
  details.forEach(d => {
    const phieuId = String(d.PhieuID || '').trim();
    if (!phieuId) return;
    if (!detailMap[phieuId]) detailMap[phieuId] = [];
    detailMap[phieuId].push({
      nhanVienID: String(d.NhanVienID || '').trim(),
      soThe: String(d.SoThe || '').trim(),
      hoTen: clientSafeText_(d.HoTen),
      soGio: Number(d.SoGio || 0)
    });
  });

  const entries = readObjects_(SHEETS.DATA_CONG_VIEC)
    .filter(r => dateKey_(r.Ngay) === ngayKey)
    .map(r => {
      const phieuId = String(r.PhieuID || '').trim();
      const ns = detailMap[phieuId] || [];
      return {
        phieuId,
        ngay: dateKey_(r.Ngay),
        maCongViec: String(r.MaCongViec || '').trim(),
        hangMuc: clientSafeText_(r.HangMuc),
        noiDungCongViec: clientSafeText_(r.NoiDungCongViec),
        nguoiNhap: String(r.NguoiNhap || '').trim(),
        deviceId: String(r.DeviceID || '').trim(),
        thoiGianLuu: clientSafeText_(r.ThoiGianLuu, 'yyyy-MM-dd HH:mm:ss'),
        trangThai: String(r.TrangThai || APP.ENTRY_STATUS_ACTIVE).trim(),
        lyDoHuy: clientSafeText_(r.LyDoHuy),
        thoiGianSua: clientSafeText_(r.ThoiGianSua, 'yyyy-MM-dd HH:mm:ss'),
        lyDoSua: clientSafeText_(r.LyDoSua),
        nhanSuText: ns.map(x => x.soThe + '-' + x.soGio + 'h').join(', '),
        tongGio: ns.reduce((sum, x) => sum + Number(x.soGio || 0), 0),
        soNhanSu: ns.length
      };
    })
    .sort((a, b) => String(b.thoiGianLuu).localeCompare(String(a.thoiGianLuu)) || String(b.phieuId).localeCompare(String(a.phieuId)));

  writeLog_(context.deviceId, context.soThe, 'TAI_DS_PHIEU', ngayKey + ' · count=' + entries.length);
  return { ok: true, ngay: ngayKey, entries };
}

function getWorkEntryHeaderById_(phieuId) {
  ensureWorkEntryStatusSchema_();
  return readObjects_(SHEETS.DATA_CONG_VIEC)
    .find(r => String(r.PhieuID || '').trim() === String(phieuId || '').trim()) || null;
}

function getWorkEntryDetailsById_(phieuId) {
  ensureWorkDetailEmployeeSchema_();
  const id = String(phieuId || '').trim();
  return readObjects_(SHEETS.DATA_NHAN_SU_CONG_VIEC)
    .filter(r => String(r.PhieuID || '').trim() === id)
    .map(r => ({
      id: clientSafeText_(r.ID),
      nhanVienID: String(r.NhanVienID || '').trim(),
      soThe: String(r.SoThe || '').trim(),
      hoTen: clientSafeText_(r.HoTen),
      soGio: Number(r.SoGio || 0)
    }));
}

function getUsedHoursByDateExcludingPhieu_(ngay, excludePhieuId) {
  ensureWorkDetailEmployeeSchema_();
  const key = dateKey_(ngay);
  const excludeId = String(excludePhieuId || '').trim();
  const activeMap = makeActiveWorkEntryMap_();
  const used = {};

  readObjects_(SHEETS.DATA_NHAN_SU_CONG_VIEC).forEach(r => {
    if (dateKey_(r.Ngay) !== key) return;
    const phieuId = String(r.PhieuID || '').trim();
    if (phieuId === excludeId) return;
    if (!activeMap[phieuId]) return;
    const empKey = rowEmployeeKey_(r);
    const gio = Number(r.SoGio || 0);
    if (!empKey) return;
    used[empKey] = (used[empKey] || 0) + gio;
  });

  return used;
}

function getAvailableEmployeesForEdit_(ngay, phieuId) {
  const used = getUsedHoursByDateExcludingPhieu_(ngay, phieuId);
  const leaveHours = getLeaveHoursMapByDate_(ngay);
  // V0.11.2.1: không gọi listAssignableEmployeesByDate_ để tránh đọc DATA_NHAN_VIEN_NGHI lặp.
  return listActiveWorkEmployees_()
    .map(e => {
      const key = employeeKey_(e);
      const daDung = used[key] || 0;
      const gioNghi = Number(leaveHours[key] || 0);
      const conLai = Math.max(0, APP.MAX_HOURS_PER_DAY - daDung - gioNghi);
      return Object.assign({}, e, { daDung, gioNghi, conLai, nghi: gioNghi > 0 });
    })
    .filter(e => e.conLai > 0);
}

function getWorkEntryDetailForEdit(payload) {
  if (!payload) throw new Error('Thiếu dữ liệu tải chi tiết phiếu.');
  if (!payload.deviceId) throw new Error('Thiếu DeviceID.');
  const phieuId = String(payload.phieuId || '').trim();
  if (!phieuId) throw new Error('Thiếu mã phiếu cần sửa.');

  const context = getDeviceContext(payload.deviceId, payload.deviceToken);
  if (!context.ok) throw new Error(context.reason);
  if (!canManageWorkEntry_(context)) throw new Error('Chỉ QL được sửa phiếu.');

  const row = getWorkEntryHeaderById_(phieuId);
  if (!row) throw new Error('Không tìm thấy phiếu: ' + phieuId);
  if (!isActiveWorkEntry_(row)) throw new Error('Phiếu đã hủy, không được sửa.');

  const ngayKey = dateKey_(row.Ngay);
  const details = getWorkEntryDetailsById_(phieuId);
  const employees = getAvailableEmployeesForEdit_(ngayKey, phieuId);

  writeLog_(context.deviceId, context.soThe, 'TAI_CHI_TIET_PHIEU', phieuId);

  return {
    ok: true,
    entry: {
      phieuId,
      ngay: ngayKey,
      maCongViec: String(row.MaCongViec || '').trim(),
      hangMuc: clientSafeText_(row.HangMuc),
      noiDungCongViec: clientSafeText_(row.NoiDungCongViec),
      nguoiNhap: String(row.NguoiNhap || '').trim(),
      deviceId: String(row.DeviceID || '').trim(),
      thoiGianLuu: clientSafeText_(row.ThoiGianLuu, 'yyyy-MM-dd HH:mm:ss'),
      trangThai: String(row.TrangThai || APP.ENTRY_STATUS_ACTIVE).trim(),
      thoiGianSua: clientSafeText_(row.ThoiGianSua, 'yyyy-MM-dd HH:mm:ss'),
      lyDoSua: clientSafeText_(row.LyDoSua),
      details
    },
    employees
  };
}

function validateEditPayload_(payload) {
  if (!payload) throw new Error('Thiếu dữ liệu sửa phiếu.');
  payload = normalizeNhanSuPayload_(payload);

  if (!payload.deviceId) throw new Error('Thiếu DeviceID.');
  if (!payload.phieuId) throw new Error('Thiếu mã phiếu cần sửa.');
  if (!payload.nhanSu || !payload.nhanSu.length) throw new Error('Phiếu sửa phải có ít nhất 1 nhân viên.');
  const reason = String(payload.reason || '').trim();
  if (!reason) throw new Error('Vui lòng nhập lý do sửa phiếu.');

  const seen = {};
  payload.nhanSu.forEach(item => {
    const key = item.nhanVienID || item.soThe;
    const gio = Number(item.soGio || 0);
    if (!key) throw new Error('Có dòng nhân viên thiếu định danh.');
    if (!gio || gio < 1 || gio > APP.MAX_HOURS_PER_DAY) throw new Error('Số giờ phải từ 1 đến 8.');
    if (seen[key]) throw new Error('Nhân viên ' + key + ' bị chọn trùng trong phiếu sửa.');
    seen[key] = true;
  });

  return payload;
}

function deleteDetailRowsByPhieuId_(phieuId) {
  const id = String(phieuId || '').trim();
  if (!id) return 0;
  return deleteRowsWhere_(SHEETS.DATA_NHAN_SU_CONG_VIEC, row => String(row.PhieuID || '').trim() === id);
}

function updateWorkEntryDetail(payload) {
  payload = validateEditPayload_(payload);

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const context = getDeviceContext(payload.deviceId, payload.deviceToken);
    if (!context.ok) throw new Error(context.reason);
    if (!canManageWorkEntry_(context)) throw new Error('Chỉ QL được sửa phiếu.');

    const phieuId = String(payload.phieuId || '').trim();
    const row = getWorkEntryHeaderById_(phieuId);
    if (!row) throw new Error('Không tìm thấy phiếu: ' + phieuId);
    if (!isActiveWorkEntry_(row)) throw new Error('Phiếu đã hủy, không được sửa.');

    const ngayKey = dateKey_(row.Ngay);
    assertDailyOpenForChange_(ngayKey, 'sửa phiếu');
    const maCongViec = String(row.MaCongViec || '').trim();
    const resolvedNhanSu = resolveNhanSuForSave_(payload.nhanSu);

    const batchAdd = {};
    resolvedNhanSu.forEach(item => {
      batchAdd[item.key] = (batchAdd[item.key] || 0) + Number(item.soGio || 0);
    });

    const used = getUsedHoursByDateExcludingPhieu_(ngayKey, phieuId);
    const leaveHours = getLeaveHoursMapByDate_(ngayKey);
    Object.keys(batchAdd).forEach(empKey => {
      const nghi = Number(leaveHours[empKey] || 0);
      const total = (used[empKey] || 0) + batchAdd[empKey] + nghi;
      if (total > APP.MAX_HOURS_PER_DAY) {
        const emp = resolvedNhanSu.find(x => x.key === empKey) || {};
        throw new Error('Nhân viên ' + (emp.soThe || empKey) + ' vượt 8h/ngày sau khi sửa. Đã có ngoài phiếu này ' + (used[empKey] || 0) + 'h làm, nghỉ ' + nghi + 'h, phiếu sửa nhập ' + batchAdd[empKey] + 'h.');
      }
    });

    const deletedDetailRows = deleteDetailRowsByPhieuId_(phieuId);
    ensureWorkDetailEmployeeSchema_();
    const detailRows = resolvedNhanSu.map(item => ({
      ID: phieuId + '_' + (item.nhanVienID || item.soThe),
      PhieuID: phieuId,
      Ngay: ngayKey,
      MaCongViec: maCongViec,
      NhanVienID: item.nhanVienID,
      SoThe: item.soThe,
      HoTen: item.hoTen,
      SoGio: Number(item.soGio)
    }));
    const insertedDetailRows = appendObjects_(SHEETS.DATA_NHAN_SU_CONG_VIEC, detailRows);

    updateObjectByRowNumber_(SHEETS.DATA_CONG_VIEC, row.__rowNumber, {
      NoiDungCongViec: payload.noiDungCongViec || '',
      SuaBoi: context.soThe,
      ThoiGianSua: nowText_(),
      LyDoSua: String(payload.reason || '').trim()
    });

    writeLog_(context.deviceId, context.soThe, 'SUA_PHIEU', phieuId + ' · oldNS=' + deletedDetailRows + ' · newNS=' + insertedDetailRows + ' · ' + String(payload.reason || '').trim());

    return {
      ok: true,
      phieuId,
      updatedNhanSu: insertedDetailRows,
      removedOldRows: deletedDetailRows
    };
  } catch (err) {
    try {
      writeLog_(payload.deviceId, '', 'LOI_SUA_PHIEU', String(payload.phieuId || '') + ' · ' + err.message);
    } catch (ignore) {}
    throw err;
  } finally {
    lock.releaseLock();
  }
}

function softDeleteWorkEntry(payload) {
  if (!payload) throw new Error('Thiếu dữ liệu hủy phiếu.');
  if (!payload.deviceId) throw new Error('Thiếu DeviceID.');
  const phieuId = String(payload.phieuId || '').trim();
  if (!phieuId) throw new Error('Thiếu mã phiếu cần hủy.');
  const reason = String(payload.reason || '').trim();
  if (!reason) throw new Error('Vui lòng nhập lý do hủy phiếu.');

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const context = getDeviceContext(payload.deviceId, payload.deviceToken);
    if (!context.ok) throw new Error(context.reason);
    if (!canManageWorkEntry_(context)) throw new Error('Chỉ QL được hủy phiếu.');

    ensureWorkEntryStatusSchema_();
    const rows = readObjects_(SHEETS.DATA_CONG_VIEC);
    const row = rows.find(r => String(r.PhieuID || '').trim() === phieuId);
    if (!row) throw new Error('Không tìm thấy phiếu: ' + phieuId);

    const currentStatus = String(row.TrangThai || APP.ENTRY_STATUS_ACTIVE).trim();
    if (currentStatus === APP.ENTRY_STATUS_DELETED) {
      throw new Error('Phiếu này đã được hủy trước đó.');
    }

    assertDailyOpenForChange_(row.Ngay, 'hủy phiếu');

    updateObjectByRowNumber_(SHEETS.DATA_CONG_VIEC, row.__rowNumber, {
      TrangThai: APP.ENTRY_STATUS_DELETED,
      HuyBoi: context.soThe,
      ThoiGianHuy: nowText_(),
      LyDoHuy: reason
    });

    writeLog_(context.deviceId, context.soThe, 'HUY_PHIEU', phieuId + ' · ' + reason);

    return {
      ok: true,
      phieuId,
      status: APP.ENTRY_STATUS_DELETED,
      reason
    };
  } finally {
    lock.releaseLock();
  }
}
