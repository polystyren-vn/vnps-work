/**
 * VNPS Work Assign - ManagerDashboardService
 * Version: V0.10_EMPLOYEE_LEAVE_FILTER
 *
 * Phạm vi:
 * - Chỉ đọc dữ liệu tổng hợp cho QL.
 * - Không sửa logic lưu/sửa/xóa/chốt/báo cáo đã pass.
 * - Không tạo sheet mới; dùng dữ liệu hiện có từ DATA_CONG_VIEC, DATA_NHAN_SU_CONG_VIEC, DATA_CHOT_NGAY.
 */

function requireQlContextForDashboard_(payload) {
  if (!payload) throw new Error('Thiếu dữ liệu dashboard.');
  if (!payload.deviceId) throw new Error('Thiếu DeviceID.');
  if (!payload.ngay) throw new Error('Thiếu ngày cần xem tổng quan.');

  const context = getDeviceContext(payload.deviceId, payload.deviceToken);
  if (!context.ok) throw new Error(context.reason);
  if (!context.isQL) throw new Error('Chỉ QL được xem dashboard tổng quan.');
  return context;
}

function buildDashboardAlerts_(status, summary, dashboard) {
  const alerts = [];
  const counts = summary.counts || { short: 0, ok: 0, over: 0, leave: 0, total: 0 };

  if (Number(counts.over || 0) > 0) {
    alerts.push('Có ' + counts.over + ' nhân viên vượt 8h. Cần sửa dữ liệu trước khi chốt ngày.');
  }
  if (status.trangThai === APP.DAY_STATUS_CONFIRMED) {
    alerts.push('Ngày đã xác nhận/chốt. Hệ thống đang chặn lưu mới, sửa phiếu và hủy phiếu.');
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
  requireQlContextForDashboard_(payload);
  const key = dateKey_(payload.ngay);
  if (!key) throw new Error('Ngày dashboard không hợp lệ.');

  const status = getDailyStatusInfo_(key);
  const summary = buildDailyEmployeeSummary_(key);
  const counts = summary.counts || { short: 0, ok: 0, over: 0, leave: 0, total: 0 };
  const employees = summary.employees || [];
  const assignedEmployees = employees.filter(e => Number(e.tongGio || 0) > 0).length;
  const totalHours = employees.reduce((sum, e) => sum + Number(e.tongGio || 0), 0);
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
    okEmployees: Number(counts.ok || 0),
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
