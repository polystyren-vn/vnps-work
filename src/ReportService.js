/**
 * VNPS Work Assign - ReportService
 * Version: V0.11_EMPLOYEE_LEAVE_HOURS_QUOTA
 *
 * Phạm vi V0.3:
 * - Dựng REPORT_NHAN_VIEN_NGAY.
 * - Dựng REPORT_HANG_MUC_NGAY.
 * - Chỉ QL được tạo báo cáo.
 * - Báo cáo bỏ qua phiếu TrangThai = DELETED.
 * - Không đổi logic đăng ký thiết bị.
 */

function parseDateKey_(value) {
  const key = dateKey_(value);
  const m = String(key || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) throw new Error('Ngày không hợp lệ: ' + value);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function addDays_(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + Number(days || 0));
}

function getDateRangeKeys_(fromDate, toDate) {
  const start = parseDateKey_(fromDate);
  const end = parseDateKey_(toDate);
  if (start.getTime() > end.getTime()) {
    throw new Error('Từ ngày không được lớn hơn đến ngày.');
  }

  const result = [];
  let cur = start;
  while (cur.getTime() <= end.getTime()) {
    result.push(Utilities.formatDate(cur, APP.TIMEZONE, 'yyyy-MM-dd'));
    cur = addDays_(cur, 1);
  }
  return result;
}

function makeEmployeeMap_() {
  const map = {};
  readObjects_(SHEETS.DM_NHAN_VIEN).forEach(e => {
    const soThe = String(e.SoThe || '').trim();
    if (soThe) map[soThe] = e;
  });
  return map;
}

function makeJobMap_() {
  const map = {};
  const ordered = [];
  readObjects_(SHEETS.DM_CONG_VIEC).forEach(j => {
    const ma = String(j.MaCongViec || '').trim();
    if (!ma) return;
    map[ma] = j;
    if (String(j.TrangThai || '').trim() === 'Đang dùng') {
      ordered.push(j);
    }
  });
  return { map, ordered };
}

function makeWorkHeaderMap_() {
  const phieuMap = {};
  ensureWorkEntryStatusSchema_();
  readObjects_(SHEETS.DATA_CONG_VIEC).forEach(r => {
    const id = String(r.PhieuID || '').trim();
    if (id && isActiveWorkEntry_(r)) phieuMap[id] = r;
  });
  return phieuMap;
}

function clearAndWriteReport_(sheetName, values) {
  const sh = getSheet_(sheetName);
  const startRow = 4;
  const startCol = 1;
  const rowCount = Math.max(values.length, 1);
  const colCount = Math.max.apply(null, values.map(r => r.length));

  if (sh.getMaxColumns() < colCount) {
    sh.insertColumnsAfter(sh.getMaxColumns(), colCount - sh.getMaxColumns());
  }
  if (sh.getMaxRows() < startRow + rowCount + 10) {
    sh.insertRowsAfter(sh.getMaxRows(), startRow + rowCount + 10 - sh.getMaxRows());
  }

  const clearRows = Math.max(sh.getMaxRows() - startRow + 1, rowCount + 20);
  const clearCols = Math.max(sh.getMaxColumns(), colCount);
  sh.getRange(startRow, startCol, clearRows, clearCols).clearContent();

  const normalized = values.map(row => {
    const r = row.slice();
    while (r.length < colCount) r.push('');
    return r;
  });

  sh.getRange(startRow, startCol, normalized.length, colCount).setValues(normalized);
  sh.getRange(startRow, startCol, 1, colCount).setFontWeight('bold').setBackground('#0F766E').setFontColor('#FFFFFF');
  sh.autoResizeColumns(1, colCount);
}

function getWorkDetailRowsInRange_(dateKeys) {
  const dateSet = {};
  dateKeys.forEach(d => dateSet[d] = true);
  const activePhieuMap = makeWorkHeaderMap_();
  return readObjects_(SHEETS.DATA_NHAN_SU_CONG_VIEC)
    .filter(r => dateSet[dateKey_(r.Ngay)])
    .filter(r => !!activePhieuMap[String(r.PhieuID || '').trim()]);
}

function getEmployeeLeaveRowsInRange_(dateKeys) {
  const dateSet = {};
  dateKeys.forEach(d => dateSet[d] = true);
  ensureEmployeeLeaveSheet_();
  return readObjects_(SHEETS.DATA_NHAN_VIEN_NGHI)
    .filter(r => dateSet[dateKey_(r.Ngay)])
    .filter(isActiveEmployeeLeave_);
}

function buildEmployeeReportValues_(fromDate, toDate) {
  const dateKeys = getDateRangeKeys_(fromDate, toDate);
  const detailRows = getWorkDetailRowsInRange_(dateKeys);
  const employees = makeEmployeeMap_();
  const jobs = makeJobMap_().map;
  const phieuMap = makeWorkHeaderMap_();
  const group = {};

  function ensureGroup_(ngay, soThe, hoTen) {
    const key = ngay + '|' + soThe;
    if (!group[key]) {
      group[key] = {
        ngay,
        soThe,
        hoTen: hoTen || (employees[soThe] ? employees[soThe].HoTen : ''),
        tongGio: 0,
        gioLam: 0,
        gioNghi: 0,
        details: []
      };
    }
    if (!group[key].hoTen && hoTen) group[key].hoTen = hoTen;
    return group[key];
  }

  detailRows.forEach(r => {
    const ngay = dateKey_(r.Ngay);
    const soThe = String(r.SoThe || '').trim();
    if (!ngay || !soThe) return;

    const phieu = phieuMap[String(r.PhieuID || '').trim()] || {};
    const job = jobs[String(r.MaCongViec || '').trim()] || {};
    const hangMuc = phieu.HangMuc || job.HangMuc || String(r.MaCongViec || '').trim();
    const soGio = Number(r.SoGio || 0);

    const g = ensureGroup_(ngay, soThe, employees[soThe] ? employees[soThe].HoTen : '');
    g.tongGio += soGio;
    g.gioLam += soGio;
    g.details.push(hangMuc + ' ' + soGio + 'h');
  });

  getEmployeeLeaveRowsInRange_(dateKeys).forEach(r => {
    const ngay = dateKey_(r.Ngay);
    const soThe = String(r.SoThe || '').trim();
    if (!ngay || !soThe) return;
    const soGioNghi = getLeaveHoursFromRow_(r);
    const g = ensureGroup_(ngay, soThe, clientSafeText_(r.HoTen) || (employees[soThe] ? employees[soThe].HoTen : ''));
    g.tongGio += soGioNghi;
    g.gioNghi += soGioNghi;
    g.details.push('NGHỈ ' + soGioNghi + 'h: ' + clientSafeText_(r.LyDo || 'Có đăng ký nghỉ'));
  });

  const values = [['Ngay','SoThe','HoTen','TongGio','ChiTietCongViec','TrangThaiGio']];
  Object.keys(group)
    .sort()
    .forEach(key => {
      const g = group[key];
      let status = 'Chưa đủ';
      if (g.tongGio === APP.MAX_HOURS_PER_DAY) {
        if (g.gioNghi >= APP.MAX_HOURS_PER_DAY && g.gioLam <= 0) status = 'Đủ 8h (nghỉ cả ngày)';
        else if (g.gioNghi > 0) status = 'Đủ 8h (gồm nghỉ ' + g.gioNghi + 'h)';
        else status = 'Đủ 8h';
      }
      if (g.tongGio > APP.MAX_HOURS_PER_DAY) status = 'Vượt 8h';
      values.push([g.ngay, g.soThe, g.hoTen, g.tongGio, g.details.join('; '), status]);
    });

  if (values.length === 1) {
    values.push(['', '', '', '', 'Không có dữ liệu trong khoảng ngày đã chọn', '']);
  }

  return values;
}

function buildJobDailyReportValues_(fromDate, toDate) {
  const dateKeys = getDateRangeKeys_(fromDate, toDate);
  const detailRows = getWorkDetailRowsInRange_(dateKeys);
  const jobInfo = makeJobMap_();
  const jobs = jobInfo.map;
  const phieuMap = makeWorkHeaderMap_();
  const cellMap = {};
  const employeeByDate = {};
  const jobNameMap = {};
  const jobOrder = [];

  jobInfo.ordered.forEach(j => {
    const ma = String(j.MaCongViec || '').trim();
    if (!ma) return;
    jobNameMap[ma] = j.HangMuc || ma;
    jobOrder.push(ma);
  });

  detailRows.forEach(r => {
    const ngay = dateKey_(r.Ngay);
    const ma = String(r.MaCongViec || '').trim();
    const soThe = String(r.SoThe || '').trim();
    const soGio = Number(r.SoGio || 0);
    if (!ngay || !ma || !soThe) return;

    const phieu = phieuMap[String(r.PhieuID || '').trim()] || {};
    const job = jobs[ma] || {};
    if (!jobNameMap[ma]) {
      jobNameMap[ma] = phieu.HangMuc || job.HangMuc || ma;
      jobOrder.push(ma);
    }

    const k = ma + '|' + ngay;
    if (!cellMap[k]) cellMap[k] = [];
    cellMap[k].push(soThe + '-' + soGio + 'h');

    if (!employeeByDate[ngay]) employeeByDate[ngay] = {};
    employeeByDate[ngay][soThe] = true;
  });

  const header = ['STT','HangMuc'].concat(dateKeys);
  const values = [header];
  let stt = 1;

  jobOrder.forEach(ma => {
    const row = [stt++, jobNameMap[ma] || ma];
    dateKeys.forEach(ngay => {
      row.push((cellMap[ma + '|' + ngay] || []).join(', '));
    });
    values.push(row);
  });

  const totalRow = ['', 'Tổng số nhân viên'];
  dateKeys.forEach(ngay => {
    totalRow.push(Object.keys(employeeByDate[ngay] || {}).length || '');
  });
  values.push(totalRow);

  const leaveRows = getEmployeeLeaveRowsInRange_(dateKeys);
  const leaveByDate = {};
  leaveRows.forEach(r => {
    const ngay = dateKey_(r.Ngay);
    if (!leaveByDate[ngay]) leaveByDate[ngay] = [];
    const label = String(r.SoThe || '').trim()
      + (r.HoTen ? '-' + clientSafeText_(r.HoTen) : '')
      + '-' + getLeaveHoursFromRow_(r) + 'h'
      + (r.LyDo ? ' (' + clientSafeText_(r.LyDo) + ')' : '');
    leaveByDate[ngay].push(label);
  });
  const leaveReportRow = ['', 'Nhân viên nghỉ'];
  dateKeys.forEach(ngay => leaveReportRow.push((leaveByDate[ngay] || []).join(', ')));
  values.push(leaveReportRow);

  return values;
}

function generateBasicReports(payload) {
  if (!payload) throw new Error('Thiếu dữ liệu tạo báo cáo.');
  if (!payload.deviceId) throw new Error('Thiếu DeviceID.');
  if (!payload.fromDate || !payload.toDate) throw new Error('Thiếu từ ngày/đến ngày.');

  const context = getDeviceContext(payload.deviceId, payload.deviceToken);
  if (!context.ok) throw new Error(context.reason);
  if (!context.isQL) throw new Error('Chỉ QL được tạo báo cáo.');

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const employeeValues = buildEmployeeReportValues_(payload.fromDate, payload.toDate);
    const jobDailyValues = buildJobDailyReportValues_(payload.fromDate, payload.toDate);

    clearAndWriteReport_(SHEETS.REPORT_NHAN_VIEN_NGAY, employeeValues);
    clearAndWriteReport_(SHEETS.REPORT_HANG_MUC_NGAY, jobDailyValues);

    writeLog_(context.deviceId, context.soThe, 'TAO_BAO_CAO', payload.fromDate + ' → ' + payload.toDate);

    return {
      ok: true,
      fromDate: dateKey_(payload.fromDate),
      toDate: dateKey_(payload.toDate),
      employeeRows: Math.max(0, employeeValues.length - 1),
      jobRows: Math.max(0, jobDailyValues.length - 2)
    };
  } finally {
    lock.releaseLock();
  }
}
