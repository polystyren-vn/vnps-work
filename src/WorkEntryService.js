function ensureWorkDetailEmployeeSchema_() {
  return ensureSheetColumns_(SHEETS.DATA_NHAN_SU_CONG_VIEC, HEADERS.DATA_NHAN_SU_CONG_VIEC);
}

function getUsedHoursByDate_(ngay) {
  ensureWorkDetailEmployeeSchema_();
  const key = dateKey_(ngay);
  const activeMap = makeActiveWorkEntryMap_();
  const rows = readObjects_(SHEETS.DATA_NHAN_SU_CONG_VIEC);
  const used = {};
  rows.forEach(r => {
    if (dateKey_(r.Ngay) !== key) return;
    const phieuId = String(r.PhieuID || '').trim();
    if (!activeMap[phieuId]) return;
    const empKey = rowEmployeeKey_(r);
    if (!empKey) return;
    const gio = Number(r.SoGio || 0);
    used[empKey] = (used[empKey] || 0) + gio;
  });
  return used;
}

function getAvailableEmployees(ngay) {
  const used = getUsedHoursByDate_(ngay);
  const leaveHours = getLeaveHoursMapByDate_(ngay);
  // V0.11.2.1: dùng listActiveWorkEmployees_ để tránh đọc DATA_NHAN_VIEN_NGHI lần 2.
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

function getNextPhieuId_(ngay, maCongViec) {
  ensureWorkEntryStatusSchema_();
  const datePart = dateKey_(ngay).replace(/-/g, '');
  const prefix = datePart + '_' + maCongViec + '_';
  const rows = readObjects_(SHEETS.DATA_CONG_VIEC);
  let maxNum = 0;
  rows.forEach(r => {
    const id = String(r.PhieuID || '');
    if (id.indexOf(prefix) === 0) {
      const tail = id.slice(prefix.length);
      const n = Number(tail);
      if (!isNaN(n)) maxNum = Math.max(maxNum, n);
    }
  });
  return prefix + String(maxNum + 1).padStart(3, '0');
}

function resolveJobForSave_(payload, context) {
  if (payload.maCongViec === APP.ADD_NEW_JOB_VALUE) {
    return addJobIfAllowed_(payload.hangMucMoi, context);
  }

  const job = findJobByCode_(payload.maCongViec);
  if (!job) throw new Error('Hạng mục công việc không hợp lệ.');
  return job;
}

/**
 * V0.11.2: chuẩn hóa danh sách nhân sự theo NhanVienID, vẫn nhận SoThe để tương thích dữ liệu/frontend cũ.
 */
function normalizeNhanSuPayload_(payload) {
  let list = [];

  if (Array.isArray(payload.nhanSu)) {
    list = payload.nhanSu;
  }

  if ((!list || !list.length) && payload.nhanSuJson) {
    try {
      const parsed = JSON.parse(payload.nhanSuJson);
      if (Array.isArray(parsed)) list = parsed;
    } catch (err) {
      throw new Error('Danh sách nhân sự không đúng định dạng JSON.');
    }
  }

  payload.nhanSu = (list || [])
    .map(item => ({
      nhanVienID: String(item.nhanVienID || item.NhanVienID || '').trim(),
      soThe: String(item.soThe || item.SoThe || '').trim(),
      soGio: Number(item.soGio || item.SoGio || 0)
    }))
    .filter(item => (item.nhanVienID || item.soThe) && item.soGio);

  return payload;
}

function validateWorkEntryPayload_(payload) {
  if (!payload) throw new Error('Thiếu dữ liệu lưu.');
  payload = normalizeNhanSuPayload_(payload);

  if (!payload.deviceId) throw new Error('Thiếu DeviceID.');
  if (!payload.deviceToken) throw new Error('Thiếu mã bảo mật trình duyệt. Hãy tải lại form.');
  if (!payload.ngay) throw new Error('Thiếu ngày.');
  if (!payload.maCongViec) throw new Error('Thiếu hạng mục công việc.');
  if (!payload.nhanSu || !payload.nhanSu.length) throw new Error('Chưa chọn nhân viên.');

  payload.nhanSu.forEach(item => {
    if (!item.nhanVienID && !item.soThe) throw new Error('Có dòng nhân viên thiếu định danh.');
    const gio = Number(item.soGio);
    if (!gio || gio < 1 || gio > APP.MAX_HOURS_PER_DAY) {
      throw new Error('Số giờ phải từ 1 đến 8.');
    }
  });

  return payload;
}

function resolveNhanSuForSave_(nhanSuList) {
  return (nhanSuList || []).map(item => {
    const emp = resolveEmployeeInput_(item);
    if (!emp) {
      throw new Error('Không tìm thấy nhân viên: ' + (item.nhanVienID || item.soThe || ''));
    }
    if (!isAssignableEmployee_(emp)) {
      throw new Error('Nhân viên ' + employeeSoThe_(emp) + ' không được phân công công việc. Chỉ nhân viên ViTri=NV và TrangThai=Đang làm được chọn.');
    }
    return {
      nhanVienID: employeeId_(emp),
      soThe: employeeSoThe_(emp),
      hoTen: employeeHoTen_(emp),
      key: employeeKey_(emp),
      soGio: Number(item.soGio || 0)
    };
  });
}

function saveWorkEntry(payload) {
  payload = validateWorkEntryPayload_(payload);

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const context = getDeviceContext(payload.deviceId, payload.deviceToken);
    if (!context.ok) throw new Error(context.reason);
    if (!canManageWorkEntry_(context)) throw new Error('Chỉ QL được lưu phiếu công việc.');

    // V0.7: ngày đã xác nhận/chốt thì không được phát sinh phiếu mới.
    assertDailyOpenForChange_(payload.ngay, 'lưu phiếu mới');

    const job = resolveJobForSave_(payload, context);
    const used = getUsedHoursByDate_(payload.ngay);
    const resolvedNhanSu = resolveNhanSuForSave_(payload.nhanSu);

    const batchAdd = {};
    resolvedNhanSu.forEach(item => {
      batchAdd[item.key] = (batchAdd[item.key] || 0) + Number(item.soGio || 0);
    });

    const leaveHours = getLeaveHoursMapByDate_(payload.ngay);
    Object.keys(batchAdd).forEach(empKey => {
      const nghi = Number(leaveHours[empKey] || 0);
      const total = (used[empKey] || 0) + batchAdd[empKey] + nghi;
      if (total > APP.MAX_HOURS_PER_DAY) {
        const emp = resolvedNhanSu.find(x => x.key === empKey) || {};
        throw new Error('Nhân viên ' + (emp.soThe || empKey) + ' vượt 8h/ngày. Đã có ' + (used[empKey] || 0) + 'h làm, nghỉ ' + nghi + 'h, nhập thêm ' + batchAdd[empKey] + 'h.');
      }
    });

    const maCongViec = String(job.MaCongViec).trim();
    const phieuId = getNextPhieuId_(payload.ngay, maCongViec);
    const ngayKey = dateKey_(payload.ngay);
    const now = nowText_();

    ensureWorkEntryStatusSchema_();
    appendObject_(SHEETS.DATA_CONG_VIEC, {
      PhieuID: phieuId,
      Ngay: ngayKey,
      MaCongViec: maCongViec,
      HangMuc: job.HangMuc,
      NoiDungCongViec: payload.noiDungCongViec || '',
      NguoiNhap: context.soThe,
      DeviceID: context.deviceId,
      ThoiGianLuu: now,
      TrangThai: APP.ENTRY_STATUS_ACTIVE,
      HuyBoi: '',
      ThoiGianHuy: '',
      LyDoHuy: '',
      SuaBoi: '',
      ThoiGianSua: '',
      LyDoSua: ''
    });

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

    writeLog_(context.deviceId, context.soThe, 'LUU_CONG_VIEC', phieuId + ' · NS=' + insertedDetailRows);

    return {
      ok: true,
      phieuId,
      maCongViec,
      hangMuc: job.HangMuc,
      soDongNhanSu: insertedDetailRows,
      receivedNhanSu: resolvedNhanSu
    };
  } catch (err) {
    try {
      writeLog_(payload.deviceId, '', 'LOI_LUU_CONG_VIEC', err.message);
    } catch (ignore) {}
    throw err;
  } finally {
    lock.releaseLock();
  }
}
