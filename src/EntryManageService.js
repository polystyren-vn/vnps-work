/**
 * VNPS Work Assign - EntryManageService
 * Version: V0.4.1_ENTRY_LIST_LOAD_FIX
 *
 * Phạm vi:
 * - Thêm xóa mềm phiếu công việc cho QL.
 * - Không xóa vật lý dòng DATA.
 * - Báo cáo và tính giờ bỏ qua phiếu TrangThai = DELETED.
 */


function clientSafeText_(value, pattern) {
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return Utilities.formatDate(value, APP.TIMEZONE, pattern || 'yyyy-MM-dd HH:mm:ss');
  }
  if (value === null || value === undefined) return '';
  return String(value);
}

function ensureWorkEntryStatusSchema_() {
  const required = ['TrangThai', 'HuyBoi', 'ThoiGianHuy', 'LyDoHuy'];
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

  const context = getDeviceContext(payload.deviceId);
  if (!context.ok) throw new Error(context.reason);
  if (!context.isQL) throw new Error('Chỉ QL được xem/quản lý phiếu.');

  ensureWorkEntryStatusSchema_();
  const ngayKey = dateKey_(payload.ngay);
  const details = readObjects_(SHEETS.DATA_NHAN_SU_CONG_VIEC);
  const detailMap = {};
  details.forEach(d => {
    const phieuId = String(d.PhieuID || '').trim();
    if (!phieuId) return;
    if (!detailMap[phieuId]) detailMap[phieuId] = [];
    detailMap[phieuId].push({
      soThe: String(d.SoThe || '').trim(),
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
        nhanSuText: ns.map(x => x.soThe + '-' + x.soGio + 'h').join(', '),
        tongGio: ns.reduce((sum, x) => sum + Number(x.soGio || 0), 0),
        soNhanSu: ns.length
      };
    })
    .sort((a, b) => String(b.thoiGianLuu).localeCompare(String(a.thoiGianLuu)) || String(b.phieuId).localeCompare(String(a.phieuId)));

  writeLog_(context.deviceId, context.soThe, 'TAI_DS_PHIEU', ngayKey + ' · count=' + entries.length);
  return { ok: true, ngay: ngayKey, entries };
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
    const context = getDeviceContext(payload.deviceId);
    if (!context.ok) throw new Error(context.reason);
    if (!context.isQL) throw new Error('Chỉ QL được hủy phiếu.');

    ensureWorkEntryStatusSchema_();
    const rows = readObjects_(SHEETS.DATA_CONG_VIEC);
    const row = rows.find(r => String(r.PhieuID || '').trim() === phieuId);
    if (!row) throw new Error('Không tìm thấy phiếu: ' + phieuId);

    const currentStatus = String(row.TrangThai || APP.ENTRY_STATUS_ACTIVE).trim();
    if (currentStatus === APP.ENTRY_STATUS_DELETED) {
      throw new Error('Phiếu này đã được hủy trước đó.');
    }

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
