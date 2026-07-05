function getDeviceById_(deviceId) {
  const id = String(deviceId || '').trim();
  if (!id) return null;
  return readObjects_(SHEETS.DM_THIET_BI)
    .find(d => String(d.DeviceID).trim() === id) || null;
}

function getDeviceContext(deviceId) {
  const id = String(deviceId || '').trim();
  if (!id) {
    writeLog_('', '', 'CHAN_TRUY_CAP', 'Thiếu DeviceID');
    return {
      ok: false,
      code: 'MISSING_DEVICE_ID',
      reason: 'Thiếu DeviceID. Hãy mở link có dạng ?deviceId=PC_TO_01.'
    };
  }

  const device = getDeviceById_(id);

  if (!device) {
    writeLog_(id, '', 'YEU_CAU_DANG_KY_THIET_BI', 'Thiết bị chưa có trong DM_THIET_BI');
    return {
      ok: false,
      code: 'DEVICE_NOT_REGISTERED',
      reason: 'Thiết bị chưa đăng ký.',
      deviceId: id,
      canRegister: true
    };
  }

  const status = String(device.TrangThai || '').trim();

  if (status === APP.DEVICE_STATUS_PENDING) {
    writeLog_(id, device.SoTheDangKy, 'CHO_DUYET_THIET_BI', 'Thiết bị đang chờ duyệt');
    return {
      ok: false,
      code: 'DEVICE_PENDING',
      reason: 'Thiết bị đã đăng ký và đang chờ duyệt.',
      deviceId: id,
      canRegister: false
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
      reason: 'Người đăng ký thiết bị không hợp lệ.',
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
  const tenThietBi = String(payload.tenThietBi || '').trim().replace(/\s+/g, ' ');
  const soTheDangKy = String(payload.soTheDangKy || '').trim();
  const ghiChu = String(payload.ghiChu || '').trim();

  if (!deviceId) throw new Error('Thiếu DeviceID.');
  if (!tenThietBi) throw new Error('Vui lòng nhập tên thiết bị.');
  if (!soTheDangKy) throw new Error('Vui lòng nhập số thẻ đăng ký.');

  const employee = getEmployeeByCard_(soTheDangKy);
  if (!employee || String(employee.TrangThai).trim() !== 'Đang làm') {
    throw new Error('Số thẻ đăng ký không hợp lệ hoặc không còn đang làm.');
  }

  return { deviceId, tenThietBi, soTheDangKy, ghiChu, employee };
}

/**
 * V0.2: đăng ký thiết bị mới từ giao diện.
 * Thiết bị mới luôn lưu trạng thái Chờ duyệt; admin/QL duyệt thủ công trong DM_THIET_BI.
 */
function registerDevice(payload) {
  const input = validateRegisterDevicePayload_(payload);

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const existed = getDeviceById_(input.deviceId);

    if (existed) {
      const status = String(existed.TrangThai || '').trim();
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
          reason: 'Thiết bị đã có yêu cầu đăng ký và đang chờ duyệt.'
        };
      }
      return {
        ok: false,
        code: 'DEVICE_BLOCKED',
        reason: 'Thiết bị đã tồn tại nhưng đang bị khóa/không hoạt động: ' + status
      };
    }

    const today = Utilities.formatDate(new Date(), APP.TIMEZONE, 'yyyy-MM-dd');
    appendObject_(SHEETS.DM_THIET_BI, {
      DeviceID: input.deviceId,
      TenThietBi: input.tenThietBi,
      SoTheDangKy: input.soTheDangKy,
      TrangThai: APP.DEVICE_STATUS_PENDING,
      NgayDangKy: today,
      GhiChu: input.ghiChu || 'Đăng ký từ web form'
    });

    writeLog_(
      input.deviceId,
      input.soTheDangKy,
      'DANG_KY_THIET_BI',
      input.tenThietBi + ' · ' + input.employee.HoTen + ' · Trạng thái=' + APP.DEVICE_STATUS_PENDING
    );

    return {
      ok: true,
      code: 'DEVICE_REGISTERED_PENDING',
      pending: true,
      reason: 'Đã gửi đăng ký thiết bị. Vui lòng chờ duyệt trong DM_THIET_BI.'
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
