/**
 * VNPS Work Assign - DailyConfirmService
 * Version: V0.10_EMPLOYEE_LEAVE_FILTER
 *
 * Phạm vi:
 * - Tạo sheet DATA_CHOT_NGAY tự động nếu chưa có.
 * - QL kiểm tra tổng giờ theo nhân viên trong ngày.
 * - QL xác nhận/chốt ngày và mở lại ngày có lý do.
 * - Khi ngày CONFIRMED: chặn lưu phiếu mới, sửa phiếu, hủy phiếu.
 */

function ensureDailyStatusSheet_() {
  const db = getDb_();
  let sh = db.getSheetByName(SHEETS.DATA_CHOT_NGAY);
  const headers = HEADERS.DATA_CHOT_NGAY;

  if (!sh) {
    sh = db.insertSheet(SHEETS.DATA_CHOT_NGAY);
    sh.getRange(1, 1).setValue('VNPS WORK ASSIGN - CHỐT NGÀY');
    sh.getRange(2, 1).setValue('Sheet tự tạo từ V0.7. Header nằm ở dòng 4, dữ liệu từ dòng 5.');
    sh.getRange(4, 1, 1, headers.length).setValues([headers]);
    sh.getRange(4, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#0F766E')
      .setFontColor('#FFFFFF');
    sh.setFrozenRows(4);
    SpreadsheetApp.flush();
    return getHeaderMap_(SHEETS.DATA_CHOT_NGAY);
  }

  return ensureSheetColumns_(SHEETS.DATA_CHOT_NGAY, headers);
}

function getDailyStatusRow_(ngay) {
  ensureDailyStatusSheet_();
  const key = dateKey_(ngay);
  if (!key) return null;
  return readObjects_(SHEETS.DATA_CHOT_NGAY)
    .find(r => dateKey_(r.Ngay) === key) || null;
}

function getDailyStatusInfo_(ngay) {
  const key = dateKey_(ngay);
  const row = getDailyStatusRow_(key);
  if (!row) {
    return {
      ngay: key,
      trangThai: APP.DAY_STATUS_DRAFT,
      trangThaiText: 'Đang nhập',
      xacNhanBoi: '',
      thoiGianXacNhan: '',
      ghiChu: '',
      moLaiBoi: '',
      thoiGianMoLai: '',
      lyDoMoLai: ''
    };
  }

  const status = String(row.TrangThai || APP.DAY_STATUS_DRAFT).trim() || APP.DAY_STATUS_DRAFT;
  return {
    ngay: key,
    trangThai: status,
    trangThaiText: status === APP.DAY_STATUS_CONFIRMED ? 'Đã xác nhận' : 'Đang nhập',
    xacNhanBoi: clientSafeText_(row.XacNhanBoi),
    thoiGianXacNhan: clientSafeText_(row.ThoiGianXacNhan, 'yyyy-MM-dd HH:mm:ss'),
    ghiChu: clientSafeText_(row.GhiChu),
    moLaiBoi: clientSafeText_(row.MoLaiBoi),
    thoiGianMoLai: clientSafeText_(row.ThoiGianMoLai, 'yyyy-MM-dd HH:mm:ss'),
    lyDoMoLai: clientSafeText_(row.LyDoMoLai)
  };
}

function isDailyConfirmed_(ngay) {
  return getDailyStatusInfo_(ngay).trangThai === APP.DAY_STATUS_CONFIRMED;
}

function assertDailyOpenForChange_(ngay, actionText) {
  const info = getDailyStatusInfo_(ngay);
  if (info.trangThai === APP.DAY_STATUS_CONFIRMED) {
    throw new Error('Ngày ' + info.ngay + ' đã xác nhận/chốt. Không được ' + (actionText || 'thay đổi dữ liệu') + '. QL cần mở lại ngày và nhập lý do trước khi sửa dữ liệu.');
  }
}

function makeDailyWorkHeaderMap_(ngay) {
  const key = dateKey_(ngay);
  const map = {};
  let activeEntries = 0;
  let deletedEntries = 0;

  ensureWorkEntryStatusSchema_();
  readObjects_(SHEETS.DATA_CONG_VIEC).forEach(r => {
    if (dateKey_(r.Ngay) !== key) return;
    const id = String(r.PhieuID || '').trim();
    if (!id) return;
    if (isActiveWorkEntry_(r)) {
      activeEntries++;
      map[id] = r;
    } else {
      deletedEntries++;
    }
  });

  return { map, activeEntries, deletedEntries };
}

function buildDailyEmployeeSummary_(ngay) {
  const key = dateKey_(ngay);
  if (!key) throw new Error('Ngày kiểm tra không hợp lệ.');

  const activeEmployees = listActiveWorkEmployees_(); // V0.10: loại QL khỏi nhóm phân công công việc.
  const leaveMap = getActiveLeaveMapByDate_(key);
  const employeeMap = {};
  const group = {};

  activeEmployees.forEach(e => {
    const soThe = String(e.soThe || '').trim();
    if (!soThe) return;
    employeeMap[soThe] = e;
    const leaveRows = leaveMap[soThe] || [];
    group[soThe] = {
      soThe,
      hoTen: e.hoTen || '',
      tongGio: 0,
      chiTiet: leaveRows.length ? ['Nghỉ: ' + clientSafeText_(leaveRows[0].LyDo || 'Có đăng ký nghỉ')] : [],
      isLeave: leaveRows.length > 0
    };
  });

  const headerInfo = makeDailyWorkHeaderMap_(key);
  const activePhieuMap = headerInfo.map;

  readObjects_(SHEETS.DATA_NHAN_SU_CONG_VIEC).forEach(r => {
    if (dateKey_(r.Ngay) !== key) return;
    const phieuId = String(r.PhieuID || '').trim();
    const phieu = activePhieuMap[phieuId];
    if (!phieu) return;

    const soThe = String(r.SoThe || '').trim();
    if (!soThe) return;
    if (!group[soThe]) {
      // Dữ liệu cũ có thể chứa nhân viên QL/đã khóa; vẫn hiển thị để QL phát hiện và sửa.
      group[soThe] = {
        soThe,
        hoTen: employeeMap[soThe] ? employeeMap[soThe].hoTen : '',
        tongGio: 0,
        chiTiet: [],
        isLeave: !!leaveMap[soThe]
      };
      if (group[soThe].isLeave) group[soThe].chiTiet.push('Nghỉ: ' + clientSafeText_(leaveMap[soThe][0].LyDo || 'Có đăng ký nghỉ'));
    }

    const gio = Number(r.SoGio || 0);
    const hangMuc = clientSafeText_(phieu.HangMuc || r.MaCongViec || phieuId);
    group[soThe].tongGio += gio;
    group[soThe].chiTiet.push(hangMuc + ' ' + gio + 'h');
  });

  const rows = Object.keys(group).sort().map(soThe => {
    const item = group[soThe];
    let trangThaiGio = 'Chưa đủ';
    let statusCode = 'SHORT';

    if (item.isLeave && Number(item.tongGio || 0) <= 0) {
      trangThaiGio = 'Nghỉ';
      statusCode = 'LEAVE';
    } else if (item.isLeave && Number(item.tongGio || 0) > 0) {
      trangThaiGio = 'Nghỉ nhưng có giờ';
      statusCode = 'OVER';
    } else if (Number(item.tongGio) === APP.MAX_HOURS_PER_DAY) {
      trangThaiGio = 'Đủ 8h';
      statusCode = 'OK';
    } else if (Number(item.tongGio) > APP.MAX_HOURS_PER_DAY) {
      trangThaiGio = 'Vượt 8h';
      statusCode = 'OVER';
    }

    return {
      soThe: item.soThe,
      hoTen: item.hoTen || '',
      tongGio: Number(item.tongGio || 0),
      chiTiet: item.chiTiet.join('; '),
      trangThaiGio,
      statusCode,
      isLeave: !!item.isLeave
    };
  });

  const counts = { short: 0, ok: 0, over: 0, leave: 0, total: rows.length };
  rows.forEach(r => {
    if (r.statusCode === 'OK') counts.ok++;
    else if (r.statusCode === 'OVER') counts.over++;
    else if (r.statusCode === 'LEAVE') counts.leave++;
    else counts.short++;
  });

  return {
    ngay: key,
    activeEntries: headerInfo.activeEntries,
    deletedEntries: headerInfo.deletedEntries,
    leaveEntries: counts.leave,
    counts,
    employees: rows,
    leaves: listEmployeeLeavesForClient_(key)
  };
}

function upsertDailyStatus_(ngay, patch) {
  ensureDailyStatusSheet_();
  const key = dateKey_(ngay);
  const row = getDailyStatusRow_(key);
  const base = row ? {
    Ngay: dateKey_(row.Ngay) || key,
    TrangThai: row.TrangThai || APP.DAY_STATUS_DRAFT,
    XacNhanBoi: row.XacNhanBoi || '',
    ThoiGianXacNhan: row.ThoiGianXacNhan || '',
    GhiChu: row.GhiChu || '',
    MoLaiBoi: row.MoLaiBoi || '',
    ThoiGianMoLai: row.ThoiGianMoLai || '',
    LyDoMoLai: row.LyDoMoLai || ''
  } : {
    Ngay: key,
    TrangThai: APP.DAY_STATUS_DRAFT,
    XacNhanBoi: '',
    ThoiGianXacNhan: '',
    GhiChu: '',
    MoLaiBoi: '',
    ThoiGianMoLai: '',
    LyDoMoLai: ''
  };
  const obj = Object.assign(base, patch || {}, { Ngay: key });

  if (row && row.__rowNumber) {
    updateObjectByRowNumber_(SHEETS.DATA_CHOT_NGAY, row.__rowNumber, obj);
  } else {
    appendObject_(SHEETS.DATA_CHOT_NGAY, obj);
    SpreadsheetApp.flush();
  }
  return getDailyStatusInfo_(key);
}

function requireQlContextForDaily_(payload) {
  if (!payload) throw new Error('Thiếu dữ liệu chốt ngày.');
  if (!payload.deviceId) throw new Error('Thiếu DeviceID.');
  if (!payload.ngay) throw new Error('Thiếu ngày cần kiểm tra/chốt.');

  const context = getDeviceContext(payload.deviceId, payload.deviceToken);
  if (!context.ok) throw new Error(context.reason);
  if (!context.isQL) throw new Error('Chỉ QL được kiểm tra/chốt ngày.');
  return context;
}

function getDailyConfirmInfo(payload) {
  const context = requireQlContextForDaily_(payload);
  const key = dateKey_(payload.ngay);
  const status = getDailyStatusInfo_(key);
  const summary = buildDailyEmployeeSummary_(key);
  writeLog_(context.deviceId, context.soThe, 'KIEM_TRA_NGAY', key + ' · OK=' + summary.counts.ok + ' · thiếu=' + summary.counts.short + ' · vượt=' + summary.counts.over);
  return { ok: true, status, summary };
}

function confirmDaily(payload) {
  const context = requireQlContextForDaily_(payload);
  const key = dateKey_(payload.ngay);
  const summary = buildDailyEmployeeSummary_(key);
  if (summary.counts.over > 0) {
    throw new Error('Không thể xác nhận ngày ' + key + ' vì còn nhân viên vượt 8h. Hãy sửa dữ liệu trước khi chốt.');
  }

  const status = upsertDailyStatus_(key, {
    TrangThai: APP.DAY_STATUS_CONFIRMED,
    XacNhanBoi: context.soThe,
    ThoiGianXacNhan: nowText_(),
    GhiChu: String(payload.ghiChu || '').trim(),
    MoLaiBoi: '',
    ThoiGianMoLai: '',
    LyDoMoLai: ''
  });

  writeLog_(context.deviceId, context.soThe, 'XAC_NHAN_NGAY', key + ' · ' + String(payload.ghiChu || '').trim());
  return { ok: true, status, summary };
}

function reopenDaily(payload) {
  const context = requireQlContextForDaily_(payload);
  const key = dateKey_(payload.ngay);
  const reason = String(payload.reason || payload.ghiChu || '').trim();
  if (!reason) throw new Error('Vui lòng nhập lý do mở lại ngày.');

  const status = upsertDailyStatus_(key, {
    TrangThai: APP.DAY_STATUS_DRAFT,
    MoLaiBoi: context.soThe,
    ThoiGianMoLai: nowText_(),
    LyDoMoLai: reason
  });
  const summary = buildDailyEmployeeSummary_(key);

  writeLog_(context.deviceId, context.soThe, 'MO_LAI_NGAY', key + ' · ' + reason);
  return { ok: true, status, summary };
}
