function doGet(e) {
  const t = HtmlService.createTemplateFromFile('frontend/Index');
  t.deviceId = (e && e.parameter && e.parameter.deviceId) || '';
  t.appVersion = APP.VERSION;
  return t.evaluate()
    .setTitle('VNPS Work Assign')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function apiInit(deviceId, ngay) {
  const context = getDeviceContext(deviceId);
  if (!context.ok) {
    return {
      ok: false,
      code: context.code || 'ACCESS_DENIED',
      reason: context.reason,
      deviceId: context.deviceId || deviceId || '',
      canRegister: !!context.canRegister,
      version: APP.VERSION
    };
  }

  return {
    ok: true,
    version: APP.VERSION,
    context: {
      deviceId: context.deviceId,
      soThe: context.soThe,
      hoTen: context.hoTen,
      viTri: context.viTri,
      isQL: context.isQL
    },
    jobs: listJobs(context),
    employees: getAvailableEmployees(ngay || Utilities.formatDate(new Date(), APP.TIMEZONE, 'yyyy-MM-dd'))
  };
}

function apiGetAvailableEmployees(deviceId, ngay) {
  const context = getDeviceContext(deviceId);
  if (!context.ok) {
    return {
      ok: false,
      code: context.code || 'ACCESS_DENIED',
      reason: context.reason,
      canRegister: !!context.canRegister
    };
  }
  return { ok: true, employees: getAvailableEmployees(ngay) };
}

function apiRegisterDevice(payload) {
  return registerDevice(payload);
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
