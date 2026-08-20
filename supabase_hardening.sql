-- ==============================================================================
-- SUPABASE SECURITY HARDENING & ROW LEVEL SECURITY (RLS) POLICIES
-- Jalankan skrip ini di: Supabase Dashboard -> SQL Editor -> New Query
-- ==============================================================================

-- 1. Tabel Komentar Aman dengan RLS
CREATE TABLE IF NOT EXISTS public.comments (
  id text PRIMARY KEY,
  username text NOT NULL,
  text text NOT NULL,
  photo_base64 text,
  timestamp bigint NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
  created_at timestamptz DEFAULT now()
);

-- Aktifkan RLS pada tabel comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Policy 1: Publik diizinkan membaca semua komentar
DROP POLICY IF EXISTS "Public read comments" ON public.comments;
CREATE POLICY "Public read comments" 
  ON public.comments 
  FOR SELECT 
  USING (true);

-- Policy 2: Pengguna publik boleh memposting komentar dengan validasi teks & username
DROP POLICY IF EXISTS "Public insert comments" ON public.comments;
CREATE POLICY "Public insert comments" 
  ON public.comments 
  FOR INSERT 
  WITH CHECK (
    char_length(username) >= 1 AND char_length(username) <= 50 AND
    char_length(text) >= 1 AND char_length(text) <= 2500
  );

-- Policy 3: Membatasi update/delete hanya untuk service role atau authenticated admin
DROP POLICY IF EXISTS "Admin update comments" ON public.comments;
CREATE POLICY "Admin update comments" 
  ON public.comments 
  FOR UPDATE 
  USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin delete comments" ON public.comments;
CREATE POLICY "Admin delete comments" 
  ON public.comments 
  FOR DELETE 
  USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');


-- ==============================================================================
-- 2. Proteksi Akun Admin & Guest (Mencegah Eksposur Password Hash ke Publik)
-- ==============================================================================

-- Pastikan tabel admin_accounts tidak dapat dibaca bebas oleh anon key
ALTER TABLE IF EXISTS public.admin_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read admin_accounts" ON public.admin_accounts;
DROP POLICY IF EXISTS "Public insert admin_accounts" ON public.admin_accounts;
DROP POLICY IF EXISTS "Public update admin_accounts" ON public.admin_accounts;
DROP POLICY IF EXISTS "Public delete admin_accounts" ON public.admin_accounts;

-- Hanya Service Role (Backend) yang boleh mengelola admin_accounts
CREATE POLICY "Service Role Only on admin_accounts" 
  ON public.admin_accounts 
  FOR ALL 
  USING (auth.role() = 'service_role');
