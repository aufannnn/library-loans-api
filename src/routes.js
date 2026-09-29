const express = require('express');
const { getDb } = require('./db');
const { validateLoan, STATUSES } = require('./validate');

const router = express.Router();
const TABLE = 'loans';

const parseId = (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ success: false, message: 'id harus berupa bilangan bulat positif' });
    return null;
  }
  return id;
};

// GET /loans?status=&member_id=&search=&page=&limit=
router.get('/loans', async (req, res, next) => {
  try {
    const { status, member_id, search } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

    if (status && !STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `status harus salah satu dari: ${STATUSES.join(', ')}`,
      });
    }

    let q = getDb()
      .from(TABLE)
      .select('*', { count: 'exact' })
      .order('id', { ascending: true })
      .range((page - 1) * limit, page * limit - 1);

    if (status) q = q.eq('status', status);
    if (member_id) q = q.eq('member_id', member_id);
    if (search) {
      const s = String(search).replace(/[,()%*]/g, ' ');
      q = q.or(`book_title.ilike.%${s}%,member_name.ilike.%${s}%`);
    }

    const { data, count, error } = await q;
    if (error) throw error;
    res.json({ success: true, page, limit, total: count, data });
  } catch (e) { next(e); }
});

// GET /loans/:id
router.get('/loans/:id', async (req, res, next) => {
  try {
    const id = parseId(req, res); if (id === null) return;
    const { data, error } = await getDb().from(TABLE).select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, message: 'Data peminjaman tidak ditemukan' });
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

// POST /loans
router.post('/loans', async (req, res, next) => {
  try {
    const { errors, data: payload } = validateLoan(req.body);
    if (errors.length) return res.status(400).json({ success: false, message: 'Validasi gagal', errors });
    const { data, error } = await getDb().from(TABLE).insert(payload).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, message: 'Peminjaman berhasil dicatat', data });
  } catch (e) { next(e); }
});

// PUT (ganti seluruh field wajib) & PATCH (sebagian)
const update = (partial) => async (req, res, next) => {
  try {
    const id = parseId(req, res); if (id === null) return;
    const { errors, data: payload } = validateLoan(req.body, { partial });
    if (errors.length) return res.status(400).json({ success: false, message: 'Validasi gagal', errors });
    payload.updated_at = new Date().toISOString();
    const { data, error } = await getDb().from(TABLE).update(payload).eq('id', id).select().maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, message: 'Data peminjaman tidak ditemukan' });
    res.json({ success: true, message: 'Data peminjaman diperbarui', data });
  } catch (e) { next(e); }
};
router.put('/loans/:id', update(false));
router.patch('/loans/:id', update(true));

// DELETE /loans/:id
router.delete('/loans/:id', async (req, res, next) => {
  try {
    const id = parseId(req, res); if (id === null) return;
    const { data, error } = await getDb().from(TABLE).delete().eq('id', id).select().maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, message: 'Data peminjaman tidak ditemukan' });
    res.json({ success: true, message: 'Data peminjaman dihapus', data });
  } catch (e) { next(e); }
});

module.exports = router;