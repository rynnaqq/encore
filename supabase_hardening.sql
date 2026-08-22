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

-- Pastikan semua kolom komentar ada meskipun tabel sudah dibuat sebelumnya
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS photo_base64 text;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS timestamp bigint DEFAULT (extract(epoch from now()) * 1000)::bigint;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS updated_at timestamptz;

-- Aktifkan RLS pada tabel comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Policy: Publik diizinkan membaca semua komentar
DROP POLICY IF EXISTS "Public read comments" ON public.comments;
CREATE POLICY "Public read comments" 
  ON public.comments 
  FOR SELECT 
  USING (true);

-- Policy: Pengguna publik boleh memposting komentar dengan validasi teks & username
DROP POLICY IF EXISTS "Public insert comments" ON public.comments;
CREATE POLICY "Public insert comments" 
  ON public.comments 
  FOR INSERT 
  WITH CHECK (
    char_length(username) >= 1 AND char_length(username) <= 50 AND
    char_length(text) >= 1 AND char_length(text) <= 2500
  );

-- Policy: Update komentar
DROP POLICY IF EXISTS "Allow update comments" ON public.comments;
CREATE POLICY "Allow update comments" 
  ON public.comments 
  FOR UPDATE 
  USING (true);

-- Policy: Delete komentar
DROP POLICY IF EXISTS "Allow delete comments" ON public.comments;
CREATE POLICY "Allow delete comments" 
  ON public.comments 
  FOR DELETE 
  USING (true);


-- ------------------------------------------------------------------------------
-- 2. TABEL GUEST ACCOUNTS (guest_accounts)
-- Digunakan untuk seluruh akun tamu / user umum
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.guest_accounts (
  id text PRIMARY KEY,
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Pastikan semua kolom ada (mencegah error 42703 jika tabel sudah ada sebelumnya)
ALTER TABLE public.guest_accounts ADD COLUMN IF NOT EXISTS id text;
ALTER TABLE public.guest_accounts ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE public.guest_accounts ADD COLUMN IF NOT EXISTS password_hash text;
ALTER TABLE public.guest_accounts ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';
ALTER TABLE public.guest_accounts ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.guest_accounts ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Migrasikan data kolom lama 'password' ke 'password_hash' jika ada
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='guest_accounts' AND column_name='password') THEN 
    UPDATE public.guest_accounts SET password_hash = password WHERE password_hash IS NULL; 
  END IF; 
END $$;

-- Aktifkan RLS pada tabel guest_accounts
ALTER TABLE public.guest_accounts ENABLE ROW LEVEL SECURITY;

-- Policy: Publik boleh melihat username, role, created_at untuk direktori akun
DROP POLICY IF EXISTS "Public select guest_accounts" ON public.guest_accounts;
CREATE POLICY "Public select guest_accounts" 
  ON public.guest_accounts 
  FOR SELECT 
  USING (true);

-- Policy: Pendaftaran akun guest baru (INSERT)
DROP POLICY IF EXISTS "Public insert guest_accounts" ON public.guest_accounts;
CREATE POLICY "Public insert guest_accounts" 
  ON public.guest_accounts 
  FOR INSERT 
  WITH CHECK (
    char_length(username) >= 3 AND char_length(username) <= 30
  );

-- Policy: Ubah password guest_accounts (UPDATE)
DROP POLICY IF EXISTS "Allow update guest_accounts" ON public.guest_accounts;
CREATE POLICY "Allow update guest_accounts" 
  ON public.guest_accounts 
  FOR UPDATE 
  USING (true);

-- Policy: Hapus guest_accounts (DELETE)
DROP POLICY IF EXISTS "Allow delete guest_accounts" ON public.guest_accounts;
CREATE POLICY "Allow delete guest_accounts" 
  ON public.guest_accounts 
  FOR DELETE 
  USING (true);


-- ------------------------------------------------------------------------------
-- 3. TABEL ADMIN ACCOUNTS (admin_accounts)
-- Digunakan khusus untuk akun administrator
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_accounts (
  id text PRIMARY KEY,
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'admin',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Pastikan semua kolom ada (mencegah error 42703 jika tabel sudah ada sebelumnya)
ALTER TABLE public.admin_accounts ADD COLUMN IF NOT EXISTS id text;
ALTER TABLE public.admin_accounts ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE public.admin_accounts ADD COLUMN IF NOT EXISTS password_hash text;
ALTER TABLE public.admin_accounts ADD COLUMN IF NOT EXISTS role text DEFAULT 'admin';
ALTER TABLE public.admin_accounts ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.admin_accounts ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Migrasikan data kolom lama 'password' ke 'password_hash' jika ada
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_accounts' AND column_name='password') THEN 
    UPDATE public.admin_accounts SET password_hash = password WHERE password_hash IS NULL; 
  END IF; 
END $$;

-- Aktifkan RLS pada tabel admin_accounts
ALTER TABLE public.admin_accounts ENABLE ROW LEVEL SECURITY;

-- Policy: Publik boleh membaca data admin_accounts untuk badge dan verifikasi role
DROP POLICY IF EXISTS "Public select admin_accounts" ON public.admin_accounts;
CREATE POLICY "Public select admin_accounts" 
  ON public.admin_accounts 
  FOR SELECT 
  USING (true);

-- Policy: Kelola admin_accounts (INSERT)
DROP POLICY IF EXISTS "Allow insert admin_accounts" ON public.admin_accounts;
CREATE POLICY "Allow insert admin_accounts" 
  ON public.admin_accounts 
  FOR INSERT 
  WITH CHECK (
    char_length(username) >= 3 AND char_length(username) <= 30
  );

-- Policy: Ubah password admin_accounts (UPDATE)
DROP POLICY IF EXISTS "Allow update admin_accounts" ON public.admin_accounts;
CREATE POLICY "Allow update admin_accounts" 
  ON public.admin_accounts 
  FOR UPDATE 
  USING (true);

-- Policy: Hapus admin_accounts (DELETE)
DROP POLICY IF EXISTS "Allow delete admin_accounts" ON public.admin_accounts;
CREATE POLICY "Allow delete admin_accounts" 
  ON public.admin_accounts 
  FOR DELETE 
  USING (true);


-- ------------------------------------------------------------------------------
-- 4. INSERT DEFAULT MASTER ADMIN (AdminKawaaii)
-- ------------------------------------------------------------------------------
INSERT INTO public.admin_accounts (id, username, password_hash, role, created_at)
VALUES (
  'root-admin-kawaaii',
  'AdminKawaaii',
  '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
  'admin',
  now()
)
ON CONFLICT (username) DO UPDATE 
SET password_hash = COALESCE(admin_accounts.password_hash, EXCLUDED.password_hash);
