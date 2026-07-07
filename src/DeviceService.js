/**
 * VNPS Work Assign - DeviceService
 * Version: V0.9_DEVICE_BROWSER_TOKEN_REGISTER
 *
 * Mục tiêu bảo mật V0.9:
 * - Người dùng mở WEB_APP_URL chung, không cần ?deviceId=...
 * - Mỗi trình duyệt tự có DeviceID + DeviceToken lưu localStorage.
 * - Backend chỉ duyệt thiết bị nếu DeviceID + DeviceToken khớp TokenHash trong DM_THIET_BI.
 * - Chia sẻ link không đủ để đăng nhập vì người nhận link không có DeviceToken của trình duyệt đã duyệt.
 */

function ensureDeviceSecuritySchema_() {
  return ensureSheetColumns_(SHEETS.DM_THIET_BI, HEADERS.DM_THIET_BI);
}

function hashDeviceToken_(token) {
  const raw = String(token || '').trim();
  if (!raw) return '';
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw, Utilities.Charset.UTF_8);
  return Utilities.base64Encode(bytes);
}

function getDeviceById_(deviceId) {
  ensureDeviceSecuritySchema_();
  const id = String(deviceId || '').trim();
  if (!id) return null;
  return readObjects_(SHEETS.DM_THIET_BI)
    .find(d => String(d.DeviceID).trim() === id) || null;
}

function normalizeDeviceAuth_(deviceIdOrPayload, deviceToken) {
  if (deviceIdOrPayload && typeof deviceIdOrPayload === 'object') {
    return {
      deviceId: String(deviceIdOrPayload.deviceId || '').trim(),
      deviceToken: String(deviceIdOrPayload.deviceToken || '').trim()
    };
  }
  return {
    deviceId: String(deviceIdOrPayload || '').trim(),
    deviceToken: String(deviceToken || '').trim()
  };
}

function checkDeviceToken_(device, auth) {
  const storedHash = String(device.DeviceTokenHash || '').trim();
  const incomingHash = hashDeviceToken_(auth.deviceToken);

  if (APP.DEVICE_TOKEN_REQUIRED && !auth.deviceToken) {
    return {
      ok: false,
      code: 'MISSING_DEVICE_TOKEN',
      reason: 'Thiếu mã bảo mật trình duyệt. Hãy mở link chung WEB_APP_URL để thiết bị tự đăng ký lại.'
    };
  }

  if (!storedHash) {
    return {
      ok: false,
      code: 'DEVICE_NEEDS_BROWSER_REGISTER',
      reason: 'Thiết bị này thuộc cơ chế link cũ hoặc chưa có mã trình duyệt. Hãy đăng ký lại bằng link chung trên đúng trình duyệt sử dụng.'
    };
  }

  if (!incomingHash || incomingHash !== storedHash) {
    return {
      ok: false,
      code: 'DEVICE_TOKEN_MISMATCH',
      reason: 'Thiết bị không khớp trình duyệt đã được duyệt. Nếu dùng trình duyệt/máy khác, vui lòng đăng ký thiết bị mới.'
    };
  }

  return { ok: true };
}

function getDeviceContext(deviceIdOrPayload, deviceToken) {
  const auth = normalizeDeviceAuth_(deviceIdOrPayload, deviceToken);
  const id = auth.deviceId;

  if (!id) {
    writeLog_('', '', 'CHAN_TRUY_CAP', 'Thiếu DeviceID trình duyệt');
    return {
      ok: false,
      code: 'MISSING_DEVICE_ID',
      reason: 'Thiếu mã thiết bị trình duyệt. Hãy tải lại form để hệ thống tự tạo mã thiết bị.',
      canRegister: true
    };
  }

  const device = getDeviceById_(id);

  if (!device) {
    writeLog_(id, '', 'YEU_CAU_DANG_KY_THIET_BI', 'Thiết bị trình duyệt chưa có trong DM_THIET_BI');
    return {
      ok: false,
      code: 'DEVICE_NOT_REGISTERED',
      reason: 'Trình duyệt này chưa đăng ký thiết bị. Vui lòng gửi đăng ký và chờ QL duyệt.',
      deviceId: id,
      canRegister: true
    };
  }

  const tokenCheck = checkDeviceToken_(device, auth);
  if (!tokenCheck.ok) {
    writeLog_(id, device.SoTheDangKy, 'CHAN_TRUY_CAP_TOKEN', tokenCheck.code + ' · ' + tokenCheck.reason);
    return {
      ok: false,
      code: tokenCheck.code,
      reason: tokenCheck.reason,
      deviceId: id,
      canRegister: tokenCheck.code === 'DEVICE_NEEDS_BROWSER_REGISTER'
    };
  }

  const status = String(device.TrangThai || '').trim();

  if (status === APP.DEVICE_STATUS_PENDING) {
    writeLog_(id, device.SoTheDangKy, 'CHO_DUYET_THIET_BI', 'Thiết bị đang chờ duyệt');
    return {
      ok: false,
      code: 'DEVICE_PENDING',
      reason: 'Thiết bị đã đăng ký trên trình duyệt này và đang chờ QL duyệt.',
      deviceId: id,
      canRegister: false,
      pending: true
    };
  }

  if (status !== APP.DEVICE_STATUS_ACTIVE) {
    writeLog_(id, device.SoTheDangKy, 'CHAN_TRUY_CAP', 'Thiết bị không hoạt động: ' + status);
    return {
      ok: false,
      code: 'DEVICE_BLOCKED',
      reason: 'Thiết bị không được phép sử dụng: ' + status,
      deviceId: id,
      canRegister: false
    };
  }

  const employee = getEmployeeByCard_(device.SoTheDangKy);
  if (!employee || String(employee.TrangThai).trim() !== 'Đang làm') {
    writeLog_(id, device.SoTheDangKy, 'CHAN_TRUY_CAP', 'Người đăng ký thiết bị không hợp lệ');
    return {
      ok: false,
      code: 'INVALID_DEVICE_OWNER',
      reason: 'Người đăng ký thiết bị không hợp lệ hoặc không còn đang làm.',
      deviceId: id,
      canRegister: false
    };
  }

  return {
    ok: true,
    deviceId: id,
    device,
    soThe: String(employee.SoThe).trim(),
    hoTen: employee.HoTen || '',
    viTri: employee.ViTri || '',
    isQL: String(employee.ViTri).trim() === 'QL'
  };
}

function validateRegisterDevicePayload_(payload) {
  if (!payload) throw new Error('Thiếu dữ liệu đăng ký thiết bị.');

  const deviceId = String(payload.deviceId || '').trim();
  const deviceToken = String(payload.deviceToken || '').trim();
  const tokenHash = hashDeviceToken_(deviceToken);
  const tenThietBi = String(payload.tenThietBi || '').trim().replace(/\s+/g, ' ');
  const soTheDangKy = String(payload.soTheDangKy || '').trim();
  const ghiChu = String(payload.ghiChu || '').trim();

  if (!deviceId) throw new Error('Thiếu DeviceID trình duyệt. Hãy tải lại form.');
  if (!deviceToken || !tokenHash) throw new Error('Thiếu mã bảo mật trình duyệt. Hãy tải lại form để đăng ký lại.');
  if (!tenThietBi) throw new Error('Vui lòng nhập tên thiết bị.');
  if (!soTheDangKy) throw new Error('Vui lòng nhập số thẻ đăng ký.');

  const employee = getEmployeeByCard_(soTheDangKy);
  if (!employee || String(employee.TrangThai).trim() !== 'Đang làm') {
    throw new Error('Số thẻ đăng ký không hợp lệ hoặc không còn đang làm.');
  }

  return { deviceId, deviceToken, tokenHash, tenThietBi, soTheDangKy, ghiChu, employee };
}

function registerDevice(payload) {
  const input = validateRegisterDevicePayload_(payload);

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    ensureDeviceSecuritySchema_();
    const existed = getDeviceById_(input.deviceId);

    if (existed) {
      const status = String(existed.TrangThai || '').trim();
      const storedHash = String(existed.DeviceTokenHash || '').trim();
      if (storedHash && storedHash !== input.tokenHash) {
        return {
          ok: false,
          code: 'DEVICE_TOKEN_MISMATCH',
          reason: 'Mã thiết bị này đã thuộc một trình duyệt khác. Hãy bấm đăng ký lại để tạo mã thiết bị mới.'
        };
      }
      if (status === APP.DEVICE_STATUS_ACTIVE) {
        return {
          ok: false,
          code: 'DEVICE_ALREADY_ACTIVE',
          reason: 'Thiết bị này đã được duyệt hoạt động. Hãy tải lại form.'
        };
      }
      if (status === APP.DEVICE_STATUS_PENDING) {
        return {
          ok: true,
          code: 'DEVICE_ALREADY_PENDING',
          pending: true,
          reason: 'Thiết bị đã có yêu cầu đăng ký và đang chờ QL duyệt.'
        };
      }
      return {
        ok: false,
        code: 'DEVICE_BLOCKED',
        reason: 'Thiết bị đã tồn tại nhưng đang bị khóa/không hoạt động: ' + status
      };
    }

    const now = nowText_();
    const today = Utilities.formatDate(new Date(), APP.TIMEZONE, 'yyyy-MM-dd');
    appendObject_(SHEETS.DM_THIET_BI, {
      DeviceID: input.deviceId,
      TenThietBi: input.tenThietBi,
      SoTheDangKy: input.soTheDangKy,
      TrangThai: APP.DEVICE_STATUS_PENDING,
      NgayDangKy: today,
      GhiChu: input.ghiChu || 'Đăng ký từ trình duyệt web form',
      DeviceTokenHash: input.tokenHash,
      DangKyCuoi: now,
      DuyetBoi: '',
      ThoiGianDuyet: '',
      KhoaBoi: '',
      ThoiGianKhoa: ''
    });

    writeLog_(
      input.deviceId,
      input.soTheDangKy,
      'DANG_KY_THIET_BI_TOKEN',
      input.tenThietBi + ' · ' + input.employee.HoTen + ' · Trạng thái=' + APP.DEVICE_STATUS_PENDING
    );

    return {
      ok: true,
      code: 'DEVICE_REGISTERED_PENDING',
      pending: true,
      reason: 'Đã gửi đăng ký thiết bị. Vui lòng chờ QL duyệt trong app.'
    };
  } catch (err) {
    try {
      writeLog_(input.deviceId, input.soTheDangKy, 'LOI_DANG_KY_THIET_BI', err.message);
    } catch (ignore) {}
    throw err;
  } finally {
    lock.releaseLock();
  }
}

function listPendingDevicesForApprove(payload) {
  const context = getDeviceContext(payload.deviceId, payload.deviceToken);
  if (!context.ok) return { ok: false, reason: context.reason, code: context.code };
  if (!context.isQL) return { ok: false, reason: 'Chỉ QL được duyệt thiết bị.' };

  ensureDeviceSecuritySchema_();
  const rows = readObjects_(SHEETS.DM_THIET_BI)
    .filter(r => String(r.TrangThai || '').trim() === APP.DEVICE_STATUS_PENDING)
    .map(r => ({
      deviceId: clientSafeText_(r.DeviceID),
      tenThietBi: clientSafeText_(r.TenThietBi),
      soTheDangKy: clientSafeText_(r.SoTheDangKy),
      ngayDangKy: clientSafeText_(r.NgayDangKy, 'yyyy-MM-dd'),
      ghiChu: clientSafeText_(r.GhiChu),
      dangKyCuoi: clientSafeText_(r.DangKyCuoi, 'yyyy-MM-dd HH:mm:ss')
    }));

  writeLog_(context.deviceId, context.soThe, 'TAI_DS_THIET_BI_CHO_DUYET', 'count=' + rows.length);
  return { ok: true, devices: rows };
}

function approvePendingDevice(payload) {
  if (!payload) throw new Error('Thiếu dữ liệu duyệt thiết bị.');

  const context = getDeviceContext(payload.deviceId, payload.deviceToken);
  if (!context.ok) return { ok: false, reason: context.reason, code: context.code };
  if (!context.isQL) return { ok: false, reason: 'Chỉ QL được duyệt thiết bị.' };

  const targetDeviceId = String(payload.targetDeviceId || '').trim();
  const soTheDangKy = String(payload.soTheDangKy || '').trim();
  if (!targetDeviceId) return { ok: false, reason: 'Thiếu DeviceID cần duyệt.' };
  if (!soTheDangKy) return { ok: false, reason: 'Vui lòng nhập số thẻ gán cho thiết bị.' };

  const employee = getEmployeeByCard_(soTheDangKy);
  if (!employee || String(employee.TrangThai).trim() !== 'Đang làm') {
    return { ok: false, reason: 'Số thẻ gán thiết bị không hợp lệ hoặc không còn đang làm.' };
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    ensureDeviceSecuritySchema_();
    const row = getDeviceById_(targetDeviceId);
    if (!row) return { ok: false, reason: 'Không tìm thấy thiết bị cần duyệt.' };
    if (String(row.TrangThai || '').trim() !== APP.DEVICE_STATUS_PENDING) {
      return { ok: false, reason: 'Thiết bị không ở trạng thái Chờ duyệt.' };
    }
    if (!String(row.DeviceTokenHash || '').trim()) {
      return { ok: false, reason: 'Thiết bị thiếu TokenHash, cần đăng ký lại từ trình duyệt sử dụng.' };
    }

    updateObjectByRowNumber_(SHEETS.DM_THIET_BI, row.__rowNumber, {
      SoTheDangKy: soTheDangKy,
      TrangThai: APP.DEVICE_STATUS_ACTIVE,
      DuyetBoi: context.soThe,
      ThoiGianDuyet: nowText_()
    });

    writeLog_(context.deviceId, context.soThe, 'DUYET_THIET_BI', targetDeviceId + ' · gán ' + soTheDangKy + ' - ' + (employee.HoTen || ''));
    return { ok: true, deviceId: targetDeviceId, soTheDangKy, reason: 'Đã duyệt thiết bị ' + targetDeviceId + '.' };
  } finally {
    lock.releaseLock();
  }
}
