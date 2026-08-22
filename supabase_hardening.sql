-- ==============================================================================
-- SUPABASE SECURITY HARDENING & ROW LEVEL SECURITY (RLS) POLICIES
-- Jalankan skrip ini di: Supabase Dashboard -> SQL Editor -> New Query
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABEL KOMENTAR (comments)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.comments (
  id text PRIMARY KEY,
  username text NOT NULL,
  text text NOT NULL,
  photo_base64 text,
  timestamp bigint NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz
);

-- Pastikan semua kolom komentar ada
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS photo_base64 text;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS timestamp bigint DEFAULT (extract(epoch from now()) * 1000)::bigint;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS updated_at timestamptz;

-- Aktifkan RLS pada tabel comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read comments" ON public.comments;
CREATE POLICY "Public read comments" ON public.comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert comments" ON public.comments;
CREATE POLICY "Public insert comments" ON public.comments FOR INSERT WITH CHECK (
  char_length(username) >= 1 AND char_length(username) <= 50 AND
  char_length(text) >= 1 AND char_length(text) <= 2500
);

DROP POLICY IF EXISTS "Allow update comments" ON public.comments;
CREATE POLICY "Allow update comments" ON public.comments FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow delete comments" ON public.comments;
CREATE POLICY "Allow delete comments" ON public.comments FOR DELETE USING (true);


-- ------------------------------------------------------------------------------
-- 2. TABEL GUEST ACCOUNTS (guest_accounts)
-- Digunakan untuk akun pemain/tamu umum dengan kolom plain 'password'
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.guest_accounts (
  id text PRIMARY KEY,
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Pastikan semua kolom ada (mencegah error jika tabel sudah pernah dibuat)
ALTER TABLE public.guest_accounts ADD COLUMN IF NOT EXISTS id text;
ALTER TABLE public.guest_accounts ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE public.guest_accounts ADD COLUMN IF NOT EXISTS password text;
ALTER TABLE public.guest_accounts ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';
ALTER TABLE public.guest_accounts ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.guest_accounts ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Aktifkan RLS pada tabel guest_accounts
ALTER TABLE public.guest_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public select guest_accounts" ON public.guest_accounts;
CREATE POLICY "Public select guest_accounts" ON public.guest_accounts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert guest_accounts" ON public.guest_accounts;
CREATE POLICY "Public insert guest_accounts" ON public.guest_accounts FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update guest_accounts" ON public.guest_accounts;
CREATE POLICY "Allow update guest_accounts" ON public.guest_accounts FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow delete guest_accounts" ON public.guest_accounts;
CREATE POLICY "Allow delete guest_accounts" ON public.guest_accounts FOR DELETE USING (true);


-- ------------------------------------------------------------------------------
-- 3. TABEL ADMIN ACCOUNTS (admin_accounts)
-- Digunakan untuk akun administrator dengan kolom plain 'password'
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_accounts (
  id text PRIMARY KEY,
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  role text NOT NULL DEFAULT 'admin',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Pastikan semua kolom ada
ALTER TABLE public.admin_accounts ADD COLUMN IF NOT EXISTS id text;
ALTER TABLE public.admin_accounts ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE public.admin_accounts ADD COLUMN IF NOT EXISTS password text;
ALTER TABLE public.admin_accounts ADD COLUMN IF NOT EXISTS role text DEFAULT 'admin';
ALTER TABLE public.admin_accounts ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.admin_accounts ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Aktifkan RLS pada tabel admin_accounts
ALTER TABLE public.admin_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public select admin_accounts" ON public.admin_accounts;
CREATE POLICY "Public select admin_accounts" ON public.admin_accounts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert admin_accounts" ON public.admin_accounts;
CREATE POLICY "Allow insert admin_accounts" ON public.admin_accounts FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update admin_accounts" ON public.admin_accounts;
CREATE POLICY "Allow update admin_accounts" ON public.admin_accounts FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow delete admin_accounts" ON public.admin_accounts;
CREATE POLICY "Allow delete admin_accounts" ON public.admin_accounts FOR DELETE USING (true);


-- ------------------------------------------------------------------------------
-- 4. DEFAULT MASTER ADMIN (AdminKawaaii / password: admin123)
-- ------------------------------------------------------------------------------
INSERT INTO public.admin_accounts (id, username, password, role, created_at)
VALUES (
  'root-admin-kawaaii',
  'AdminKawaaii',
  'admin123',
  'admin',
  now()
)
ON CONFLICT (username) DO UPDATE 
SET password = COALESCE(admin_accounts.password, EXCLUDED.password);
