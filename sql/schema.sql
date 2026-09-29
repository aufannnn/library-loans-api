-- Jalankan di Supabase Dashboard > SQL Editor
create table if not exists public.loans (
  id           bigint generated always as identity primary key,
  member_name  text        not null,
  member_id    text        not null,
  book_title   text        not null,
  borrow_date  date        not null default current_date,
  due_date     date        not null,
  return_date  date,
  status       text        not null default 'Dipinjam'
               check (status in ('Dipinjam', 'Dikembalikan', 'Terlambat')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check (due_date >= borrow_date)
);

create index if not exists loans_status_idx on public.loans (status);

-- API memakai service_role key (melewati RLS); aktifkan RLS agar akses langsung
-- dengan anon key ke tabel ini tertutup.
alter table public.loans enable row level security;

-- (Opsional) data contoh
insert into public.loans (member_name, member_id, book_title, borrow_date, due_date, status) values
  ('Budi Santoso', 'M001', 'Clean Code', '2026-09-01', '2026-09-08', 'Terlambat'),
  ('Siti Aminah',  'M002', 'Introduction to Algorithms', '2026-09-20', '2026-09-27', 'Dipinjam');