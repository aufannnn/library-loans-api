const STATUSES = ['Dipinjam', 'Dikembalikan', 'Terlambat'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const isDate = (v) => typeof v === 'string' && DATE_RE.test(v) && !Number.isNaN(Date.parse(v));
const isText = (v) => typeof v === 'string' && v.trim().length > 0;

// partial=true dipakai untuk PATCH (semua field opsional)
function validateLoan(body, { partial = false } = {}) {
  const errors = [];
  const data = {};
  const b = body && typeof body === 'object' ? body : {};

  for (const f of ['member_name', 'member_id', 'book_title']) {
    if (b[f] === undefined) {
      if (!partial) errors.push(`${f} wajib diisi`);
    } else if (!isText(b[f])) {
      errors.push(`${f} harus berupa teks tidak kosong`);
    } else data[f] = b[f].trim();
  }

  for (const f of ['borrow_date', 'due_date']) {
    if (b[f] === undefined) {
      if (!partial && f === 'due_date') errors.push('due_date wajib diisi');
    } else if (!isDate(b[f])) {
      errors.push(`${f} harus berformat YYYY-MM-DD`);
    } else data[f] = b[f];
  }

  if (b.return_date !== undefined) {
    if (b.return_date === null || isDate(b.return_date)) data.return_date = b.return_date;
    else errors.push('return_date harus berformat YYYY-MM-DD atau null');
  }

  if (b.status !== undefined) {
    if (!STATUSES.includes(b.status)) errors.push(`status harus salah satu dari: ${STATUSES.join(', ')}`);
    else data.status = b.status;
  }

  if (data.borrow_date && data.due_date && data.due_date < data.borrow_date) {
    errors.push('due_date tidak boleh sebelum borrow_date');
  }
  if (partial && Object.keys(data).length === 0 && errors.length === 0) {
    errors.push('Tidak ada field yang valid untuk diperbarui');
  }
  return { errors, data };
}

module.exports = { validateLoan, STATUSES };