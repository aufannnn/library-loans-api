# 📚 Library Loans API

REST API sederhana untuk **pencatatan peminjaman buku perpustakaan** oleh anggota. Dibuat untuk Responsi PPB 2026 menggunakan Node.js, Express.js, dan Supabase (PostgreSQL), lalu di-deploy ke Vercel.

- **Repository:** https://github.com/aufannnn/library-loans-api
- **Base URL (Vercel):** https://library-loans-api.vercel.app

## Daftar Isi
1. [Deskripsi & Tujuan](#deskripsi--tujuan)
2. [Fitur](#fitur)
3. [Tech Stack](#tech-stack)
4. [Struktur Data](#struktur-data)
5. [Endpoint](#endpoint)
6. [Contoh Request & Response](#contoh-request--response)
7. [Instalasi & Menjalankan Lokal](#instalasi--menjalankan-lokal)
8. [Deployment ke Vercel](#deployment-ke-vercel)
9. [Struktur Proyek](#struktur-proyek)
10. [Catatan & Batasan](#catatan--batasan)

## Deskripsi & Tujuan
Perpustakaan membutuhkan cara untuk mencatat siapa meminjam buku apa, kapan harus dikembalikan, dan apakah sudah dikembalikan. Proyek ini menyediakan REST API untuk mengelola data tersebut (tambah, lihat, ubah, hapus) serta menyaring data berdasarkan status, misalnya menampilkan semua peminjaman yang `Terlambat`.

Tujuan proyek: mempraktikkan pembuatan REST API dengan Express.js, integrasi database cloud (Supabase), validasi input, dan deployment publik di Vercel.

## Fitur
- CRUD data peminjaman buku (Create, Read, Update, Delete).
- Filter query: `status`, `member_id`, dan pencarian `search` (judul buku atau nama anggota).
- Pagination (`page`, `limit`).
- Validasi input dan pesan error yang jelas (JSON).
- Deployment serverless di Vercel.

## Tech Stack
| Komponen | Teknologi |
|---|---|
| Runtime | Node.js (≥ 18) |
| Framework | Express.js |
| Database | Supabase (PostgreSQL) via `@supabase/supabase-js` |
| Deployment | Vercel |

## Struktur Data
Tabel `loans` (skrip lengkap: [`sql/schema.sql`](sql/schema.sql)).

| Kolom | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `id` | bigint (PK, auto) | otomatis | ID peminjaman |
| `member_name` | text | ya | Nama anggota |
| `member_id` | text | ya | ID/NIM anggota |
| `book_title` | text | ya | Judul buku |
| `borrow_date` | date | tidak | Tanggal pinjam, format `YYYY-MM-DD`. Default: hari ini |
| `due_date` | date | ya | Batas pengembalian. Tidak boleh sebelum `borrow_date` |
| `return_date` | date | tidak | Tanggal dikembalikan. Boleh `null` |
| `status` | text | tidak | `Dipinjam` (default), `Dikembalikan`, atau `Terlambat` |
| `created_at` | timestamptz | otomatis | Waktu data dibuat |
| `updated_at` | timestamptz | otomatis | Waktu data terakhir diubah |

> `status` disimpan sebagai kolom biasa dan diatur oleh klien. Status **tidak** dihitung otomatis dari `due_date`.

## Endpoint
| Method | Path | Fungsi |
|---|---|---|
| GET | `/` | Info API dan daftar endpoint |
| GET | `/health` | Cek status API |
| GET | `/loans` | Daftar peminjaman (mendukung filter dan pagination) |
| GET | `/loans/:id` | Detail satu peminjaman |
| POST | `/loans` | Tambah peminjaman |
| PUT | `/loans/:id` | Ganti data (field wajib harus lengkap) |
| PATCH | `/loans/:id` | Ubah sebagian field |
| DELETE | `/loans/:id` | Hapus peminjaman |

### Query untuk `GET /loans`
| Parameter | Contoh | Keterangan |
|---|---|---|
| `status` | `?status=Terlambat` | Salah satu dari `Dipinjam`, `Dikembalikan`, `Terlambat` (peka huruf besar/kecil) |
| `member_id` | `?member_id=M001` | Peminjaman milik satu anggota |
| `search` | `?search=clean` | Cari di judul buku atau nama anggota (tidak peka huruf besar/kecil) |
| `page` | `?page=2` | Nomor halaman (default 1) |
| `limit` | `?limit=10` | Jumlah data per halaman (default 20, maksimum 100) |

Parameter bisa digabung, contoh: `/loans?status=Dipinjam&member_id=M002&limit=5`.

### Kode status HTTP
| Kode | Arti |
|---|---|
| 200 | Berhasil |
| 201 | Data berhasil dibuat |
| 400 | Input tidak valid (validasi, id bukan angka, JSON rusak) |
| 404 | Data atau endpoint tidak ditemukan |
| 500 | Kesalahan server (misalnya konfigurasi database salah) |

## Contoh Request & Response
Contoh memakai `curl`. Ganti `BASE_URL` dengan `https://library-loans-api.vercel.app` atau `http://localhost:3000`.

### 1. Tambah peminjaman: `POST /loans`
```bash
curl -X POST "$BASE_URL/loans" \
  -H "Content-Type: application/json" \
  -d '{
    "member_name": "Budi Santoso",
    "member_id": "M001",
    "book_title": "Clean Code",
    "borrow_date": "2026-09-01",
    "due_date": "2026-09-08"
  }'
```
Response `201 Created`:
```json
{
  "success": true,
  "message": "Peminjaman berhasil dicatat",
  "data": {
    "id": 3,
    "member_name": "Budi Santoso",
    "member_id": "M001",
    "book_title": "Clean Code",
    "borrow_date": "2026-09-01",
    "due_date": "2026-09-08",
    "return_date": null,
    "status": "Dipinjam",
    "created_at": "2026-09-29T07:00:00+00:00",
    "updated_at": "2026-09-29T07:00:00+00:00"
  }
}
```

### 2. Daftar peminjaman: `GET /loans`
```bash
curl "$BASE_URL/loans"
```
Response `200 OK`:
```json
{
  "success": true,
  "page": 1,
  "limit": 20,
  "total": 2,
  "data": [
    {
      "id": 1,
      "member_name": "Budi Santoso",
      "member_id": "M001",
      "book_title": "Clean Code",
      "borrow_date": "2026-09-01",
      "due_date": "2026-09-08",
      "return_date": null,
      "status": "Terlambat",
      "created_at": "2026-09-29T07:00:00+00:00",
      "updated_at": "2026-09-29T07:00:00+00:00"
    }
  ]
}
```
(Contoh dipotong; `data` berisi semua baris pada halaman itu.)

### 3. Filter berdasarkan status: `GET /loans?status=Terlambat`
```bash
curl "$BASE_URL/loans?status=Terlambat"
```
Response `200 OK`: struktur sama seperti di atas, `data` hanya berisi peminjaman berstatus `Terlambat`, dan `total` adalah jumlah keseluruhan yang cocok.

### 4. Detail satu data: `GET /loans/:id`
```bash
curl "$BASE_URL/loans/1"
```
Response `200 OK`:
```json
{ "success": true, "data": { "id": 1, "member_name": "Budi Santoso", "status": "Terlambat" } }
```
(Contoh dipotong; response asli memuat semua kolom.)

### 5. Ubah sebagian: `PATCH /loans/:id` (pengembalian buku)
```bash
curl -X PATCH "$BASE_URL/loans/1" \
  -H "Content-Type: application/json" \
  -d '{ "status": "Dikembalikan", "return_date": "2026-09-10" }'
```
Response `200 OK`:
```json
{
  "success": true,
  "message": "Data peminjaman diperbarui",
  "data": { "id": 1, "status": "Dikembalikan", "return_date": "2026-09-10" }
}
```
(Contoh dipotong.)

### 6. Ganti data: `PUT /loans/:id`
Field wajib harus lengkap (`member_name`, `member_id`, `book_title`, `due_date`).
```bash
curl -X PUT "$BASE_URL/loans/1" \
  -H "Content-Type: application/json" \
  -d '{
    "member_name": "Budi Santoso",
    "member_id": "M001",
    "book_title": "Clean Code",
    "borrow_date": "2026-09-01",
    "due_date": "2026-09-15",
    "status": "Dipinjam"
  }'
```

### 7. Hapus: `DELETE /loans/:id`
```bash
curl -X DELETE "$BASE_URL/loans/1"
```
Response `200 OK`:
```json
{ "success": true, "message": "Data peminjaman dihapus", "data": { "id": 1 } }
```
(Contoh dipotong; `data` berisi baris yang dihapus.)

### Contoh error
Validasi gagal, `400 Bad Request`:
```json
{
  "success": false,
  "message": "Validasi gagal",
  "errors": ["member_id wajib diisi", "book_title wajib diisi", "due_date wajib diisi"]
}
```
Status tidak valid, `400 Bad Request` (`GET /loans?status=Foo`):
```json
{ "success": false, "message": "status harus salah satu dari: Dipinjam, Dikembalikan, Terlambat" }
```
Data tidak ditemukan, `404 Not Found` (`GET /loans/9999`):
```json
{ "success": false, "message": "Data peminjaman tidak ditemukan" }
```

## Instalasi & Menjalankan Lokal

### Prasyarat
- Node.js versi 18 atau lebih baru (`node -v`)
- Git
- Akun [Supabase](https://supabase.com)

### 1. Clone repository
```bash
git clone https://github.com/aufannnn/library-loans-api.git
cd library-loans-api
npm install
```

### 2. Siapkan database Supabase
1. Buat project baru di Supabase.
2. Buka **SQL Editor**, tempel seluruh isi [`sql/schema.sql`](sql/schema.sql), lalu klik **Run**. Pesan "Success. No rows returned" adalah hasil yang normal.
3. Buka **Table Editor** dan pastikan tabel `loans` ada (berisi 2 baris contoh).

### 3. Atur environment variable
```bash
cp .env.example .env     # Windows CMD: copy .env.example .env
```
Isi `.env`:
```
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_KEY=<secret key / service_role key>
PORT=3000
```
- `SUPABASE_URL` hanya alamat dasar project. **Jangan** tambahkan `/rest/v1/` di belakangnya, dan jangan beri `/` di akhir.
- `SUPABASE_KEY` adalah **secret key** (atau `service_role` key) dari **Project Settings → API Keys**. Key ini bersifat rahasia: jangan di-commit dan jangan dipakai di sisi klien.
- Tanpa tanda kutip dan tanpa spasi di sekitar `=`.

### 4. Jalankan server
```bash
npm run dev      # mode watch
# atau
npm start
```
Server berjalan di http://localhost:3000. Tes cepat:
```bash
curl http://localhost:3000/health
```
Setiap kali `.env` diubah, hentikan server (Ctrl+C) lalu jalankan lagi.

## Deployment ke Vercel
1. Push repository ke GitHub.
2. Di [vercel.com](https://vercel.com), pilih **Add New → Project** dan import repository ini.
3. Biarkan Root Directory `./`. Build Command dan Output Directory dikosongkan.
4. Tambahkan **Environment Variables**:
   - `SUPABASE_URL` (tanpa `/rest/v1/`)
   - `SUPABASE_KEY`
5. Klik **Deploy**. Setiap kali ada perubahan di-push ke branch `main`, Vercel akan men-deploy ulang otomatis. Setelah mengubah environment variable, lakukan **Redeploy**.

`vercel.json` mengarahkan semua path ke `api/index.js`, yang mengekspor aplikasi Express sebagai serverless function.

**Link deployment:** https://library-loans-api.vercel.app

Contoh: [`/health`](https://library-loans-api.vercel.app/health) · [`/loans`](https://library-loans-api.vercel.app/loans) · [`/loans?status=Terlambat`](https://library-loans-api.vercel.app/loans?status=Terlambat)

## Struktur Proyek
```
library-loans-api/
├── api/
│   └── index.js        # entry point serverless untuk Vercel
├── sql/
│   └── schema.sql      # skema tabel dan data contoh
├── src/
│   ├── app.js          # konfigurasi Express, middleware, error handler
│   ├── db.js           # klien Supabase
│   ├── routes.js       # endpoint CRUD /loans
│   ├── server.js       # menjalankan server lokal
│   └── validate.js     # validasi input
├── .env.example        # contoh environment variable
├── .gitignore
├── package.json
├── vercel.json         # konfigurasi routing Vercel
└── README.md
```

## Catatan & Batasan
- API ini **tidak memiliki autentikasi**, sehingga siapa pun yang tahu URL-nya dapat menambah, mengubah, atau menghapus data. Ini sengaja, karena kebutuhan responsi tidak mencakup autentikasi.
- `status` (termasuk `Terlambat`) diatur oleh klien dan tidak dihitung otomatis dari `due_date`, sehingga data bisa tidak konsisten (misalnya `Dipinjam` padahal sudah lewat jatuh tempo).
- Tabel memakai Row Level Security tanpa policy. API mengakses database dengan secret/service_role key di sisi server, sehingga akses langsung dengan anon key ke tabel ini ditutup.
- Data contoh di `sql/schema.sql` akan tergandakan jika skrip dijalankan berkali-kali.

## Lisensi
MIT