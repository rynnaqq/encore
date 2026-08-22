# Ringkasan Perbaikan Project: Encore (Developer Portfolio & Interactive Mini-Games)

Dokumen ini mencatat seluruh proses investigasi, perbaikan sistematis, refaktorisasi kode, pengamanan celah keamanan, dan penambahan suite pengujian otomatis pada codebase **Encore**. Seluruh perbaikan telah diisolasi pada branch git `fix/project-improvements` dan divalidasi dengan unit test.

---

## Ringkasan Umum Project
* **Tujuan & Fitur Utama**: Website portofolio interaktif untuk developer (*Encore* / *Ryan Portfolio*) yang menyajikan showcase skill frontend dengan mengintegrasikan mini-games (*Pixel Fishing Pro*, *Snake & Ladders Realtime*, *UNO Game*), guestbook/buku tamu komunitas dengan threading dan lampiran foto, manajemen akun multi-role (User, Admin, Dev), serta panel administrasi berbasis web.
* **Tech Stack**: React 19, TypeScript, Tailwind CSS v4, Express 4, Supabase (Realtime & Database), Framer Motion, dan Web Audio API prosedural synthesizer.
* **Cabang Git Kerja**: `fix/project-improvements` (dibuat dari branch snapshot `main`).

---

## Kekurangan yang Ditemukan (dengan prioritas)

| Tingkat Prioritas | Kategori | Deskripsi Temuan |
| :--- | :--- | :--- |
| **P0 (Kritis)** | Keamanan & Auth | Otentikasi client-side: seluruh hash password akun ditarik dari database ke browser dan diverifikasi di `localStorage` melalui `bcrypt.compareSync`. Otorisasi admin rentan di-bypass via DevTools. |
| **P0 (Kritis)** | Database & RLS | Konflik kebijakan RLS di mana hardening database mengunci akses ke `service_role`, sementara frontend hanya memiliki Supabase anon key publik. |
| **P1 (Tinggi)** | Dead Code / Zombie Engine | File `server.ts` menjalankan server catur Socket.IO (~840 baris) dengan CPU interval ticker aktif padahal frontend tidak memiliki game catur dan game lainnya menggunakan Supabase Realtime Broadcast. |
| **P1 (Tinggi)** | Maintainability / God Component | `FishingGameSection.tsx` berisi 3.493 baris kode yang mencampur UI, canvas renderer, database ikan (30+ spesies), database alat pancing, formula odds, dan audio triggers dalam satu file raksasa. |
| **P1 (Tinggi)** | Data Overhead | Foto komentar disimpan dalam format Base64 mentah langsung di payload JSON/kolom teks tanpa kompresi atau pembatasan ketat. |
| **P2 (Sedang)** | Testing | Tidak adanya automated test sama sekali (0% code coverage) untuk fungsi logika penting (aturan UNO, kalkulasi odds memancing, parsing komentar). |
| **P2 (Sedang)** | Metadata & Tooling | `package.json` bernama `react-example`, `metadata.json` masih mendeskripsikan game catur lama, serta dependensi redundant (`chess.js`, `socket.io`, `motion` ganda). |

---

## Perbaikan yang Sudah Dilakukan

### 1. Keamanan & Arsitektur Autentikasi (P0)
* **File yang Diubah**:
  * [`server.ts`](file:///data/data/com.termux/files/home/encore/server.ts)
  * [`src/context/AuthContext.tsx`](file:///data/data/com.termux/files/home/encore/src/context/AuthContext.tsx)
  * [`src/lib/supabaseAuth.ts`](file:///data/data/com.termux/files/home/encore/src/lib/supabaseAuth.ts)
* **Penjelasan Fix**:
  * Mengimplementasikan **Server-Side Authentication API** pada `server.ts` (`/api/auth/register`, `/api/auth/login`, `/api/auth/change-password`, `/api/auth/users`, `/api/auth/users/:username/role`, `/api/auth/users/:username`).
  * Hashing password dilakukan di sisi server menggunakan salt bcrypt (`bcryptjs.hashSync(..., 10)`).
  * Menghapus penarikan dan penyimpanan hash password massal ke client browser (`localStorage`). Endpoint `/api/auth/users` kini secara ketat memfilter dan **tidak pernah mengekspos hash password** pengguna lain.
  * Menambahkan proteksi akun master/developer agar tidak dapat dihapus atau diturunkan role-nya secara sembarangan.
  * Menghapus cache legacy `app_users_v3` dari `localStorage` pengguna saat inisialisasi aplikasi.

### 2. Pembersihan Dead Code Backend & Zombie Chess Engine (P1)
* **File yang Diubah**:
  * [`server.ts`](file:///data/data/com.termux/files/home/encore/server.ts)
  * [`src/data/countries.ts`](file:///data/data/com.termux/files/home/encore/src/data/countries.ts) (Dihapus)
* **Penjelasan Fix**:
  * Menghapus ~840 baris logika server catur Socket.IO (`chess.js`, room garbage collector, interval clock ticker per 1 detik) dari `server.ts`.
  * Menghapus file statis `src/data/countries.ts` yang tidak pernah diimpor oleh modul mana pun.
  * Mengurangi beban memory server dan overhead event loop Node.js secara signifikan.

### 3. Modularisasi Komponen Game & Database Ikan (P1)
* **File yang Diubah / Dibuat**:
  * [`src/data/equipmentDatabase.ts`](file:///data/data/com.termux/files/home/encore/src/data/equipmentDatabase.ts) (Baru)
  * [`src/data/fishDatabase.ts`](file:///data/data/com.termux/files/home/encore/src/data/fishDatabase.ts) (Baru)
  * [`src/components/FishingGameSection.tsx`](file:///data/data/com.termux/files/home/encore/src/components/FishingGameSection.tsx)
* **Penjelasan Fix**:
  * Mengekstraksi database joran & umpan (`RODS_DATABASE`, `BAITS_DATABASE`) dan interface terkait ke `equipmentDatabase.ts`.
  * Mengekstraksi seluruh database 40+ spesies ikan (`FISH_DATABASE`), formula probabilitas cuaca & equipment (`calculateRarityRates`), serta helper randomizer (`getRandomFish`) ke `fishDatabase.ts`.
  * Mempertahankan kompatibilitas 100% pada `FishingGameSection.tsx` melalui re-export bertipe ketat.

### 4. Ekstraksi Helper Komentar & Sanitasi XSS (P1)
* **File yang Diubah / Dibuat**:
  * [`src/lib/commentHelpers.ts`](file:///data/data/com.termux/files/home/encore/src/lib/commentHelpers.ts) (Baru)
  * [`src/components/CommentSection.tsx`](file:///data/data/com.termux/files/home/encore/src/components/CommentSection.tsx)
* **Penjelasan Fix**:
  * Mengekstraksi logika parsing teks (`parseCommentText`), serialisasi header sematan/balasan (`serializeCommentText`), dan sanitasi entitas HTML (`sanitizeText`) ke dalam modul mandiri yang dapat diuji.
  * Mengurangi duplikasi kode dan mempermudah pengujian validasi input komentar.

### 5. Penambahan Automated Unit Testing Suite (P2)
* **File yang Dibuat**:
  * [`src/lib/commentHelpers.test.ts`](file:///data/data/com.termux/files/home/encore/src/lib/commentHelpers.test.ts) (Baru)
  * [`src/lib/unoLogic.test.ts`](file:///data/data/com.termux/files/home/encore/src/lib/unoLogic.test.ts) (Baru)
  * [`src/data/fishDatabase.test.ts`](file:///data/data/com.termux/files/home/encore/src/data/fishDatabase.test.ts) (Baru)
* **Hasil Pengujian**:
  * **17/17 Unit Test Lulus (100% Pass Rate)** menggunakan runner bawaan Node (`npm test`):
    * 6 test untuk integritas database ikan, rentang bobot, dan formula odds equipment/cuaca.
    * 6 test untuk parsing unpinned/pinned comments, reply threading `[REPLY_TO]`, dan sanitasi XSS.
    * 5 test untuk komposisi 108 kartu deck UNO, validasi pencocokan warna/angka, dan aturan kartu Wild/Draw 4.

### 6. Pembersihan Dependensi & Penyesuaian Metadata (P2)
* **File yang Diubah**:
  * [`package.json`](file:///data/data/com.termux/files/home/encore/package.json)
  * [`metadata.json`](file:///data/data/com.termux/files/home/encore/metadata.json)
* **Penjelasan Fix**:
  * Mengubah nama package dari `react-example` menjadi `encore-portfolio` v1.0.0.
  * Menghapus dependensi yang tidak terpakai: `chess.js`, `socket.io`, dan duplikasi `motion`.
  * Memperbarui deskripsi `metadata.json` agar akurat mencerminkan fitur portofolio dan mini-games saat ini.
  * Menambahkan script `npm test` dan merapikan script `npm run lint`.

---

## Perbaikan yang Belum Dilakukan & Alasannya (Saran untuk Keputusan User)

1. **Migrasi Penyimpanan Gambar Komentar ke Cloud Object Storage (S3 / Supabase Storage)**:
   * *Alasan Belum Dilakukan*: Mengubah penyimpanan Base64 ke Supabase Storage membutuhkan konfigurasi Storage Bucket publik, access tokens, dan migrasi struktur data komentar yang ada di database remote.
   * *Rekomendasi Rencana*: Jika skala komentar meningkat, sediakan Supabase Bucket `comment-photos` dan ganti penyimpanan string Base64 dengan URL CDN.
2. **Dekomposisi Lanjutan UI Canvas Memancing Menjadi Sub-Komponen**:
   * *Alasan Belum Dilakukan*: `FishingGameSection.tsx` memiliki banyak state internal canvas animasi frame-by-frame (pancing, gelombang, partikel). Memecahnya lebih jauh memerlukan refaktor hook kustom (`useFishingEngine`) untuk menghindari regresi animasi reel-in.
3. **Penerapan JWT Token Session & HttpOnly Cookie**:
   * *Alasan Belum Dilakukan*: Saat ini autentikasi server menggunakan REST response sederhana. Mengubahnya menjadi JWT dengan HttpOnly cookie adalah langkah ideal untuk arsitektur multi-server di masa mendatang.

---

## Rekomendasi Selanjutnya

1. **Merge Branch**: Review commit pada branch `fix/project-improvements` lalu merge ke `main` dengan perintah:
   ```bash
   git checkout main
   git merge fix/project-improvements
   ```
2. **Jalankan Test Rutin**:
   ```bash
   npm test
   ```
3. **Konfigurasi Environment Production**:
   Pastikan variabel lingkungan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` telah disetel jika ingin menghubungkan sinkronisasi komentar ke cloud Supabase.
