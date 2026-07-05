function getEmployeeByCard_(soThe) {
  const target = String(soThe || '').trim();
  if (!target) return null;
  return readObjects_(SHEETS.DM_NHAN_VIEN).find(e => String(e.SoThe).trim() === target) || null;
}

function listActiveEmployees() {
  return readObjects_(SHEETS.DM_NHAN_VIEN)
    .filter(e => String(e.TrangThai).trim() === 'Đang làm')
    .map(e => ({
      soThe: String(e.SoThe).trim(),
      hoTen: e.HoTen || '',
      viTri: e.ViTri || ''
    }));
}
