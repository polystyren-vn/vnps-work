function listJobs(context) {
  const jobs = readObjects_(SHEETS.DM_CONG_VIEC)
    .filter(j => String(j.TrangThai).trim() === 'Đang dùng')
    .map(j => ({
      maCongViec: String(j.MaCongViec).trim(),
      hangMuc: j.HangMuc || '',
      nhom: j.Nhom || ''
    }));

  if (context && canAddJob_(context)) {
    jobs.push({
      maCongViec: APP.ADD_NEW_JOB_VALUE,
      hangMuc: '+ THÊM HẠNG MỤC MỚI',
      nhom: 'Hệ thống'
    });
  }

  return jobs;
}

function findJobByCode_(maCongViec) {
  const target = String(maCongViec || '').trim();
  return readObjects_(SHEETS.DM_CONG_VIEC)
    .find(j => String(j.MaCongViec).trim() === target && String(j.TrangThai).trim() === 'Đang dùng') || null;
}

function findJobByName_(hangMuc) {
  const norm = normalizeText_(hangMuc);
  if (!norm) return null;
  return readObjects_(SHEETS.DM_CONG_VIEC)
    .find(j => normalizeText_(j.HangMuc) === norm && String(j.TrangThai).trim() === 'Đang dùng') || null;
}

function getNextJobCode_() {
  const jobs = readObjects_(SHEETS.DM_CONG_VIEC);
  let maxNum = 0;
  jobs.forEach(j => {
    const m = String(j.MaCongViec || '').match(/^CV(\d+)$/i);
    if (m) maxNum = Math.max(maxNum, Number(m[1]));
  });
  return 'CV' + String(maxNum + 1).padStart(3, '0');
}

function addJobIfAllowed_(hangMuc, context) {
  if (!context || !canAddJob_(context)) {
    throw new Error('Chỉ QL được thêm hạng mục mới.');
  }

  const cleanName = String(hangMuc || '').trim().replace(/\s+/g, ' ');
  if (!cleanName) throw new Error('Tên hạng mục mới không được trống.');

  const existed = findJobByName_(cleanName);
  if (existed) return existed;

  const maCongViec = getNextJobCode_();
  const obj = {
    MaCongViec: maCongViec,
    HangMuc: cleanName,
    Nhom: 'Phát sinh',
    TrangThai: 'Đang dùng',
    NguonTao: 'QL thêm',
    NguoiTao: context.soThe,
    NgayTao: Utilities.formatDate(new Date(), APP.TIMEZONE, 'yyyy-MM-dd'),
    GhiChu: 'Tự thêm từ web form'
  };

  appendObject_(SHEETS.DM_CONG_VIEC, obj);
  writeLog_(context.deviceId, context.soThe, 'THEM_HANG_MUC', maCongViec + ' - ' + cleanName);
  return obj;
}
