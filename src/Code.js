function doGet(e) {
  const t = HtmlService.createTemplateFromFile('frontend/Index');
  t.deviceId = (e && e.parameter && e.parameter.deviceId) || ''; // V0.9: chỉ giữ để cảnh báo link cũ, không dùng làm khóa đăng nhập
  t.appVersion = APP.VERSION;
  return t.evaluate()
    .setTitle('VNPS Work Assign')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function apiInit(authPayload, ngay) {
  const payload = normalizeApiAuthPayload_(authPayload, ngay);
  const context = getDeviceContext(payload.deviceId, payload.deviceToken);
  if (!context.ok) {
    return {
      ok: false,
      code: context.code || 'ACCESS_DENIED',
      reason: context.reason,
      deviceId: context.deviceId || payload.deviceId || '',
      canRegister: !!context.canRegister,
      pending: !!context.pending,
      version: APP.VERSION
    };
  }

  return {
    ok: true,
    version: APP.VERSION,
    context: {
      deviceId: context.deviceId,
      nhanVienID: context.nhanVienID,
      soThe: context.soThe,
      hoTen: context.hoTen,
      viTri: context.viTri,
      isQL: context.isQL,
      isNS: context.isNS,
      isNV: context.isNV,
      canViewOverview: context.canViewOverview,
      canManageLeave: context.canManageLeave,
      canReport: context.canReport,
      canManageWorkEntry: context.canManageWorkEntry,
      canManageDevice: context.canManageDevice,
      canConfirmDay: context.canConfirmDay,
      canAddJob: context.canAddJob
    },
    jobs: listJobs(context),
    employees: context.canManageWorkEntry ? getAvailableEmployees(payload.ngay || Utilities.formatDate(new Date(), APP.TIMEZONE, 'yyyy-MM-dd')) : []
  };
}

function apiGetAvailableEmployees(authPayload, ngay) {
  const payload = normalizeApiAuthPayload_(authPayload, ngay);
  const context = getDeviceContext(payload.deviceId, payload.deviceToken);
  if (!context.ok) {
    return {
      ok: false,
      code: context.code || 'ACCESS_DENIED',
      reason: context.reason,
      canRegister: !!context.canRegister
    };
  }
  if (!canManageWorkEntry_(context)) return { ok: false, reason: 'Chỉ QL được tải danh sách nhân viên phân công.' };
  return { ok: true, employees: getAvailableEmployees(payload.ngay) };
}

function normalizeApiAuthPayload_(authPayload, ngay) {
  if (authPayload && typeof authPayload === 'object') {
    return {
      deviceId: String(authPayload.deviceId || '').trim(),
      deviceToken: String(authPayload.deviceToken || '').trim(),
      ngay: authPayload.ngay || ngay || ''
    };
  }
  return {
    deviceId: String(authPayload || '').trim(),
    deviceToken: '',
    ngay: ngay || ''
  };
}

function apiRegisterDevice(payload) {
  return registerDevice(payload);
}

function apiListPendingDevices(payload) {
  return listPendingDevicesForApprove(payload);
}

function apiApproveDevice(payload) {
  return approvePendingDevice(payload);
}

function apiSaveWorkEntry(payload) {
  return saveWorkEntry(payload);
}

function apiGenerateReports(payload) {
  return generateBasicReports(payload);
}

function apiListWorkEntries(payload) {
  return listWorkEntriesForManage(payload);
}

function apiSoftDeleteWorkEntry(payload) {
  return softDeleteWorkEntry(payload);
}

function apiGetWorkEntryDetail(payload) {
  return getWorkEntryDetailForEdit(payload);
}

function apiUpdateWorkEntry(payload) {
  return updateWorkEntryDetail(payload);
}

function apiGetDailyConfirmInfo(payload) {
  return getDailyConfirmInfo(payload);
}

function apiConfirmDaily(payload) {
  return confirmDaily(payload);
}

function apiReopenDaily(payload) {
  return reopenDaily(payload);
}

function apiGetManagerDashboard(payload) {
  return getManagerDashboardOverview(payload);
}

function apiGetEmployeeLeaveInfo(payload) {
  return getEmployeeLeaveInfo(payload);
}

function apiSaveEmployeeLeave(payload) {
  return saveEmployeeLeave(payload);
}

function apiCancelEmployeeLeave(payload) {
  return cancelEmployeeLeave(payload);
}

function apiUpdateEmployeeLeave(payload) {
  return updateEmployeeLeave(payload);
}
