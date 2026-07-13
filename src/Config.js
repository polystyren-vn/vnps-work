/**
 * VNPS Work Assign - Config
 * Version: V0.12.1_MOBILE_NAV_FUNCTION_FIX
 */
const APP = {
  NAME: 'VNPS_WORK_ASSIGN_APP',
  VERSION: 'V0.12.2_MOBILE_NAV_UI_POLISH',
  TIMEZONE: 'Asia/Ho_Chi_Minh',
  MAX_HOURS_PER_DAY: 8,
  ADD_NEW_JOB_VALUE: '__ADD_NEW_JOB__',
  DEVICE_STATUS_ACTIVE: 'Hoạt động',
  DEVICE_STATUS_PENDING: 'Chờ duyệt',
  DEVICE_STATUS_LOCKED: 'Khóa',
  ENTRY_STATUS_ACTIVE: 'ACTIVE',
  ENTRY_STATUS_DELETED: 'DELETED',
  DAY_STATUS_DRAFT: 'DRAFT',
  DAY_STATUS_CONFIRMED: 'CONFIRMED',
  DEVICE_TOKEN_REQUIRED: true,
  LEAVE_STATUS_ACTIVE: 'ACTIVE',
  LEAVE_STATUS_CANCELLED: 'CANCELLED',
  ROLE_QL: 'QL',
  ROLE_NS: 'NS',
  ROLE_NV: 'NV'
};

const SHEETS = {
  DM_CONG_VIEC: 'DM_CONG_VIEC',
  DM_NHAN_VIEN: 'DM_NHAN_VIEN',
  DM_THIET_BI: 'DM_THIET_BI',
  DATA_CONG_VIEC: 'DATA_CONG_VIEC',
  DATA_NHAN_SU_CONG_VIEC: 'DATA_NHAN_SU_CONG_VIEC',
  DATA_CHOT_NGAY: 'DATA_CHOT_NGAY',
  DATA_NHAN_VIEN_NGHI: 'DATA_NHAN_VIEN_NGHI',
  REPORT_HANG_MUC_NGAY: 'REPORT_HANG_MUC_NGAY',
  REPORT_NHAN_VIEN_NGAY: 'REPORT_NHAN_VIEN_NGAY',
  LOG_THAO_TAC: 'LOG_THAO_TAC'
};

const HEADERS = {
  DM_CONG_VIEC: ['MaCongViec','HangMuc','Nhom','TrangThai','NguonTao','NguoiTao','NgayTao','GhiChu'],
  // V0.11.2: thêm NhanVienID làm định danh duy nhất, SoThe chỉ còn là mã hiển thị/có thể tái sử dụng.
  DM_NHAN_VIEN: ['NhanVienID','SoThe','HoTen','ViTri','TrangThai','GhiChu'],
  // V0.11.2: thiết bị vẫn cho nhập số thẻ nhanh, nhưng lưu thêm NhanVienIDDangKy/HoTenDangKy để tránh nhầm khi số thẻ tái sử dụng.
  DM_THIET_BI: ['DeviceID','TenThietBi','NhanVienIDDangKy','SoTheDangKy','HoTenDangKy','TrangThai','NgayDangKy','GhiChu','DeviceTokenHash','DangKyCuoi','DuyetBoi','ThoiGianDuyet','KhoaBoi','ThoiGianKhoa'],
  DATA_CONG_VIEC: ['PhieuID','Ngay','MaCongViec','HangMuc','NoiDungCongViec','NguoiNhap','DeviceID','ThoiGianLuu','TrangThai','HuyBoi','ThoiGianHuy','LyDoHuy','SuaBoi','ThoiGianSua','LyDoSua'],
  // V0.11.2: lưu thêm NhanVienID + snapshot SoThe/HoTen tại thời điểm lưu.
  DATA_NHAN_SU_CONG_VIEC: ['ID','PhieuID','Ngay','MaCongViec','NhanVienID','SoThe','HoTen','SoGio'],
  DATA_CHOT_NGAY: ['Ngay','TrangThai','XacNhanBoi','ThoiGianXacNhan','GhiChu','MoLaiBoi','ThoiGianMoLai','LyDoMoLai'],
  // V0.11.2: lưu thêm NhanVienID nhưng vẫn giữ SoThe/HoTen snapshot để báo cáo dễ đọc.
  DATA_NHAN_VIEN_NGHI: ['ID','Ngay','NhanVienID','SoThe','HoTen','SoGioNghi','LyDo','TrangThai','NguoiNhap','DeviceID','ThoiGianLuu','HuyBoi','ThoiGianHuy','LyDoHuy'],
  LOG_THAO_TAC: ['LogID','ThoiGian','DeviceID','SoThe','HanhDong','NoiDung'],
  REPORT_NHAN_VIEN_NGAY: ['Ngay','NhanVienID','SoThe','HoTen','TongGio','ChiTietCongViec','TrangThaiGio'],
  REPORT_HANG_MUC_NGAY: ['STT','HangMuc']
};

function getSpreadsheetId_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('Chưa cấu hình SPREADSHEET_ID. Hãy chạy setupScriptProperties(spreadsheetId).');
  return id;
}
