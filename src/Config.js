/**
 * VNPS Work Assign - Config
 * Version: V0.2_DEVICE_REGISTER_FLOW
 */
const APP = {
  NAME: 'VNPS_WORK_ASSIGN_APP',
  VERSION: 'V0.2_DEVICE_REGISTER_FLOW',
  TIMEZONE: 'Asia/Ho_Chi_Minh',
  MAX_HOURS_PER_DAY: 8,
  ADD_NEW_JOB_VALUE: '__ADD_NEW_JOB__',
  DEVICE_STATUS_ACTIVE: 'Hoạt động',
  DEVICE_STATUS_PENDING: 'Chờ duyệt',
  DEVICE_STATUS_LOCKED: 'Khóa'
};

const SHEETS = {
  DM_CONG_VIEC: 'DM_CONG_VIEC',
  DM_NHAN_VIEN: 'DM_NHAN_VIEN',
  DM_THIET_BI: 'DM_THIET_BI',
  DATA_CONG_VIEC: 'DATA_CONG_VIEC',
  DATA_NHAN_SU_CONG_VIEC: 'DATA_NHAN_SU_CONG_VIEC',
  REPORT_HANG_MUC_NGAY: 'REPORT_HANG_MUC_NGAY',
  REPORT_NHAN_VIEN_NGAY: 'REPORT_NHAN_VIEN_NGAY',
  LOG_THAO_TAC: 'LOG_THAO_TAC'
};

const HEADERS = {
  DM_CONG_VIEC: ['MaCongViec','HangMuc','Nhom','TrangThai','NguonTao','NguoiTao','NgayTao','GhiChu'],
  DM_NHAN_VIEN: ['SoThe','HoTen','ViTri','TrangThai','GhiChu'],
  DM_THIET_BI: ['DeviceID','TenThietBi','SoTheDangKy','TrangThai','NgayDangKy','GhiChu'],
  DATA_CONG_VIEC: ['PhieuID','Ngay','MaCongViec','HangMuc','NoiDungCongViec','NguoiNhap','DeviceID','ThoiGianLuu'],
  DATA_NHAN_SU_CONG_VIEC: ['ID','PhieuID','Ngay','MaCongViec','SoThe','SoGio'],
  LOG_THAO_TAC: ['LogID','ThoiGian','DeviceID','SoThe','HanhDong','NoiDung']
};

function getSpreadsheetId_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('Chưa cấu hình SPREADSHEET_ID. Hãy chạy setupScriptProperties(spreadsheetId).');
  return id;
}
