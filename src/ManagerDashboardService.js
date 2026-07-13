/**
 * VNPS Work Assign - ManagerDashboardService
 * Version: V0.12.2_MOBILE_NAV_UI_POLISH
 *
 * Dashboard là phần đọc tổng quan, QL/NS được xem. V0.12.2 tách giờ nghỉ khỏi các chỉ số phân công/đủ 8h/tổng giờ để tránh nhầm lẫn.
 */
function requireOverviewContext_(payload) {
  if (!payload) throw new Error('Thiếu dữ liệu dashboard.');
  if (!payload.deviceId) throw new Error('Thiếu DeviceID.');
  if (!payload.ngay) throw new Error('Thiếu ngày cần xem tổng quan.');

  const context = getDeviceContext(payload.deviceId, payload.deviceToken);
  if (!context.ok) throw new Error(context.reason);
  if (!canViewOverview_(context)) throw new Error('Chỉ QL/NS được xem dashboard tổng quan.');
  return context;
}

function buildDashboardAlerts_(status, summary, dashboard) {
  const alerts = [];
  const counts = summary.counts || { short: 0, ok: 0, over: 0, leave: 0, total: 0 };

  if (Number(counts.over || 0) > 0) {
    alerts.push('Có ' + counts.over + ' nhân viên vượt 8h. Cần QL sửa dữ liệu trước khi chốt ngày.');
  }
  if (status.trangThai === APP.DAY_STATUS_CONFIRMED) {
    alerts.push('Ngày đã xác nhận/chốt. Hệ thống đang chặn lưu mới, sửa phiếu, hủy phiếu và thay đổi nghỉ.');
  }
  if (Number(dashboard.activeEntries || 0) === 0) {
    alerts.push('Chưa có phiếu ACTIVE trong ngày này.');
  }
  if (Number(counts.short || 0) > 0) {
    alerts.push('Có ' + counts.short + ' nhân viên chưa đủ 8h.');
  }
  if (Number(counts.leave || 0) > 0) {
    alerts.push('Có ' + counts.leave + ' nhân viên nghỉ trong ngày. Báo cáo sẽ ghi riêng mục nhân viên nghỉ.');
  }
  if (!alerts.length) {
    alerts.push('Dữ liệu ngày đang ổn định: không có nhân viên vượt 8h.');
  }

  return alerts;
}

function getManagerDashboardOverview(payload) {
  requireOverviewContext_(payload);
  const key = dateKey_(payload.ngay);
  if (!key) throw new Error('Ngày dashboard không hợp lệ.');

  const status = getDailyStatusInfo_(key);
  const summary = buildDailyEmployeeSummary_(key);
  const counts = summary.counts || { short: 0, ok: 0, over: 0, leave: 0, total: 0 };
  const employees = summary.employees || [];
  // V0.12.2: Dashboard tách giờ nghỉ khỏi các chỉ số phân công/đủ 8h/tổng giờ.
  // Nghỉ vẫn có ô riêng và vẫn tham gia cảnh báo thiếu giờ nếu nghỉ + làm chưa đủ 8h.
  const workEmployees = employees.filter(e => !e.isLeave && Number(e.gioLam || 0) > 0);
  const assignedEmployees = workEmployees.length;
  const totalHours = employees.reduce((sum, e) => sum + Number(e.gioLam || 0), 0);
  const okWorkEmployees = employees.filter(e => !e.isLeave && String(e.statusCode || '') === 'OK').length;
  const confirmed = status.trangThai === APP.DAY_STATUS_CONFIRMED;

  let alertLevel = 'OK';
  if (Number(counts.over || 0) > 0) alertLevel = 'DANGER';
  else if (confirmed) alertLevel = 'LOCKED';
  else if (Number(counts.short || 0) > 0 || Number(summary.activeEntries || 0) === 0) alertLevel = 'WARN';

  const dashboard = {
    ngay: key,
    trangThaiNgay: status.trangThai,
    trangThaiNgayText: status.trangThaiText,
    confirmed,
    xacNhanBoi: status.xacNhanBoi || '',
    thoiGianXacNhan: status.thoiGianXacNhan || '',
    moLaiBoi: status.moLaiBoi || '',
    thoiGianMoLai: status.thoiGianMoLai || '',
    activeEntries: Number(summary.activeEntries || 0),
    deletedEntries: Number(summary.deletedEntries || 0),
    totalEmployees: Number(counts.total || 0),
    assignedEmployees,
    okEmployees: okWorkEmployees,
    shortEmployees: Number(counts.short || 0),
    overEmployees: Number(counts.over || 0),
    leaveEmployees: Number(counts.leave || 0),
    totalHours,
    alertLevel,
    updatedAt: nowText_()
  };

  dashboard.alerts = buildDashboardAlerts_(status, summary, dashboard);

  return {
    ok: true,
    dashboard,
    status,
    summary: {
      ngay: summary.ngay,
      activeEntries: summary.activeEntries,
      deletedEntries: summary.deletedEntries,
      counts: summary.counts
    }
  };
}
