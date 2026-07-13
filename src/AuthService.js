/**
 * VNPS Work Assign - AuthService
 * Version: V0.11.2.1_EMPLOYEE_ID_NS_PERFORMANCE_FIX
 *
 * Quyền chốt: QL > NS > NV
 * - QL: toàn quyền vận hành.
 * - NS: xem tổng quan, tạo/xem báo cáo, xem/nhập/hủy nhân viên nghỉ khi ngày chưa chốt.
 * - NV: chỉ là đối tượng được phân công/nghỉ, không thấy khu vực quản lý nâng cao.
 */
function getCurrentUserEmail_() {
  try {
    return Session.getActiveUser().getEmail() || '';
  } catch (err) {
    return '';
  }
}

function normalizeRole_(value) {
  return String(value || '').trim().toUpperCase();
}

function roleOf_(obj) {
  return normalizeRole_(obj && (obj.viTri !== undefined ? obj.viTri : obj.ViTri));
}

function isRoleQl_(obj) {
  return roleOf_(obj) === APP.ROLE_QL;
}

function isRoleNs_(obj) {
  return roleOf_(obj) === APP.ROLE_NS;
}

function isRoleNv_(obj) {
  return roleOf_(obj) === APP.ROLE_NV;
}

function canViewOverview_(obj) {
  return isRoleQl_(obj) || isRoleNs_(obj);
}

function canManageLeave_(obj) {
  return isRoleQl_(obj) || isRoleNs_(obj);
}

function canReport_(obj) {
  return isRoleQl_(obj) || isRoleNs_(obj);
}

function canManageWorkEntry_(obj) {
  return isRoleQl_(obj);
}

function canManageDevice_(obj) {
  return isRoleQl_(obj);
}

function canConfirmDay_(obj) {
  return isRoleQl_(obj);
}

function canAddJob_(obj) {
  return isRoleQl_(obj);
}

function isAssignableEmployee_(emp) {
  return String(emp && emp.TrangThai || '').trim() === 'Đang làm' && roleOf_(emp) === APP.ROLE_NV;
}

function permissionFlags_(obj) {
  return {
    isQL: isRoleQl_(obj),
    isNS: isRoleNs_(obj),
    isNV: isRoleNv_(obj),
    canViewOverview: canViewOverview_(obj),
    canManageLeave: canManageLeave_(obj),
    canReport: canReport_(obj),
    canManageWorkEntry: canManageWorkEntry_(obj),
    canManageDevice: canManageDevice_(obj),
    canConfirmDay: canConfirmDay_(obj),
    canAddJob: canAddJob_(obj)
  };
}
