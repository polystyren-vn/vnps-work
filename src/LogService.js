function writeLog_(deviceId, soThe, hanhDong, noiDung) {
  const logId = 'LOG_' + Utilities.formatDate(new Date(), APP.TIMEZONE, 'yyyyMMdd_HHmmss_SSS');
  appendObject_(SHEETS.LOG_THAO_TAC, {
    LogID: logId,
    ThoiGian: nowText_(),
    DeviceID: deviceId || '',
    SoThe: soThe || '',
    HanhDong: hanhDong || '',
    NoiDung: noiDung || ''
  });
  return logId;
}
