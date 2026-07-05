/**
 * V0.1: báo cáo sẽ làm ở bước sau.
 * Hiện giữ API đọc dữ liệu gốc để kiểm tra nhanh.
 */
function getDailyEmployeeSummary(ngay) {
  const key = dateKey_(ngay);
  const used = getUsedHoursByDate_(key);
  const employees = listActiveEmployees();
  return employees.map(e => ({
    soThe: e.soThe,
    hoTen: e.hoTen,
    tongGio: used[e.soThe] || 0,
    trangThaiGio: (used[e.soThe] || 0) === APP.MAX_HOURS_PER_DAY ? 'Đủ 8h' : 'Chưa đủ'
  }));
}
