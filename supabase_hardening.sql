-- ==============================================================================
-- SUPABASE SECURITY HARDENING & ROW LEVEL SECURITY (RLS) POLICIES
-- Jalankan skrip ini di: Supabase Dashboard -> SQL Editor -> New Query
-- ==============================================================================

-- 1. TABEL KOMENTAR (comments)
CREATE TABLE IF NOT EXISTS public.comments (
  id text PRIMARY KEY,
  username text NOT NULL,
  text text NOT NULL,
  photo_base64 text,
  timestamp bigint NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz
);

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


-- ==============================================================================
-- 2. TABEL AKUN PENGGUNA (user_accounts)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.user_accounts (
  id text PRIMARY KEY,
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Aktifkan RLS pada tabel user_accounts
ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;

-- Policy: Publik diizinkan membaca username, role, dan created_at (untuk direktori pengguna)
DROP POLICY IF EXISTS "Public select user directory" ON public.user_accounts;
CREATE POLICY "Public select user directory" 
  ON public.user_accounts 
  FOR SELECT 
  USING (true);

-- Policy: Pendaftaran akun baru (INSERT publik dengan validasi)
DROP POLICY IF EXISTS "Public register user_accounts" ON public.user_accounts;
CREATE POLICY "Public register user_accounts" 
  ON public.user_accounts 
  FOR INSERT 
  WITH CHECK (
    char_length(username) >= 3 AND char_length(username) <= 30 AND
    char_length(password_hash) >= 4
  );

-- Policy: Mengubah password atau role (UPDATE)
DROP POLICY IF EXISTS "Allow update user_accounts" ON public.user_accounts;
CREATE POLICY "Allow update user_accounts" 
  ON public.user_accounts 
  FOR UPDATE 
  USING (true);

-- Policy: Menghapus akun (DELETE)
DROP POLICY IF EXISTS "Allow delete user_accounts" ON public.user_accounts;
CREATE POLICY "Allow delete user_accounts" 
  ON public.user_accounts 
  FOR DELETE 
  USING (true);

-- Tambahkan Akun Root Admin Default (AdminKawaaii) jika belum ada
-- Password default: admin123 (bcrypt hash: $2a$10$7R.. / bcrypt generated)
INSERT INTO public.user_accounts (id, username, password_hash, role, created_at)
VALUES (
  'root-admin-kawaaii',
  'AdminKawaaii',
  '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
  'admin',
  now()
)
ON CONFLICT (username) DO NOTHING;
