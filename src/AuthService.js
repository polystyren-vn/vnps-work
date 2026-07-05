/**
 * Hiện tại quyền chính dựa trên thiết bị + SoTheDangKy trong DM_THIET_BI.
 * File này giữ chỗ để sau này bổ sung email Google, mã PIN hoặc vai trò ADMIN.
 */
function getCurrentUserEmail_() {
  try {
    return Session.getActiveUser().getEmail() || '';
  } catch (err) {
    return '';
  }
}
