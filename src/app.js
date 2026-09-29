require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    name: 'Library Loans API',
    endpoints: ['GET /loans', 'GET /loans/:id', 'POST /loans', 'PUT /loans/:id', 'PATCH /loans/:id', 'DELETE /loans/:id'],
  });
});
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use(routes);

app.use((req, res) => res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'JSON tidak valid' });
  }
  console.error(err);
  res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
});

module.exports = app;