# Ringkasan Perbaikan Project: Encore (Developer Portfolio & Interactive Mini-Games)

Dokumen ini mencatat seluruh proses investigasi, perbaikan sistematis, refaktorisasi modular, pengamanan celah keamanan, dan penambahan suite pengujian otomatis pada codebase **Encore**. Seluruh perbaikan telah diisolasi pada branch git `fix/project-improvements` dan divalidasi dengan unit test.

---

## Ringkasan Umum Project
* **Tujuan & Fitur Utama**: Website portofolio interaktif untuk developer (*Encore* / *Ryan Portfolio*) yang menyajikan showcase skill frontend dengan mengintegrasikan mini-games (*Pixel Fishing Pro*, *Snake & Ladders Realtime*, *UNO Game*), guestbook/buku tamu komunitas dengan threading dan lampiran foto yang terkompresi otomatis, manajemen akun multi-role (User, Admin, Dev) dengan session token HMAC, serta panel administrasi berbasis web.
* **Tech Stack**: React 19, TypeScript, Tailwind CSS v4, Express 4, Supabase (Realtime & Database), Framer Motion, dan Web Audio API prosedural synthesizer.
* **Cabang Git Kerja**: `fix/project-improvements` (dibuat dari branch snapshot `main`).

---

## Kekurangan yang Ditemukan (dengan prioritas)

| Tingkat Prioritas | Kategori | Deskripsi Temuan | Status |
| :--- | :--- | :--- | :--- |
| **P0 (Kritis)** | Keamanan & Auth | Otentikasi client-side: seluruh hash password akun ditarik dari database ke browser dan diverifikasi di `localStorage`. | **Tuntas Diperbaiki** |
| **P0 (Kritis)** | Database & RLS | Konflik kebijakan RLS di mana hardening database mengunci akses ke `service_role`. | **Tuntas Diperbaiki** |
| **P1 (Tinggi)** | Dead Code / Zombie Engine | File `server.ts` menjalankan server catur Socket.IO (~840 baris) dengan CPU interval ticker aktif padahal frontend tidak memiliki game catur. | **Tuntas Diperbaiki** |
| **P1 (Tinggi)** | Maintainability / God Component | `FishingGameSection.tsx` berisi 3.493 baris kode yang mencampur modal, data ikan, formula odds, dan canvas renderer. | **Tuntas Diperbaiki** |
| **P1 (Tinggi)** | Data Overhead | Foto komentar berukuran besar disimpan dalam Base64 mentah tanpa kompresi otomatis client-side. | **Tuntas Diperbaiki** |
| **P2 (Sedang)** | Testing | Tidak adanya automated test sama sekali (0% code coverage). | **Tuntas Diperbaiki (25 Tests)** |
| **P2 (Sedang)** | Metadata & Tooling | `package.json` bernama `react-example`, `metadata.json` masih mendeskripsikan game catur lama, dependensi redundant. | **Tuntas Diperbaiki** |

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

### 2. Implementasi Signed Session Token (HMAC-SHA256) & Proteksi Endpoint Admin (P0/P1)
* **File yang Diubah / Dibuat**:
  * [`src/lib/sessionAuth.ts`](file:///data/data/com.termux/files/home/encore/src/lib/sessionAuth.ts) (Baru)
  * [`src/lib/sessionAuth.test.ts`](file:///data/data/com.termux/files/home/encore/src/lib/sessionAuth.test.ts) (Baru)
  * [`server.ts`](file:///data/data/com.termux/files/home/encore/server.ts)
  * [`src/context/AuthContext.tsx`](file:///data/data/com.termux/files/home/encore/src/context/AuthContext.tsx)
* **Penjelasan Fix**:
  * Menambahkan generator dan validator session token stateless menggunakan HMAC-SHA256 (`createSessionToken` dan `verifySessionToken`) dengan perbandingan konstan (`crypto.timingSafeEqual`) untuk menangkal timing attack.
  * Endpoint admin `/api/auth/users/:username/role` dan `DELETE /api/auth/users/:username` kini diverifikasi melalui middleware `requireAdminAuth` berbasis header `Authorization: Bearer <token>`.

### 3. Pembersihan Dead Code Backend & Zombie Chess Engine (P1)
* **File yang Diubah / Dihapus**:
  * [`server.ts`](file:///data/data/com.termux/files/home/encore/server.ts)
  * [`src/data/countries.ts`](file:///data/data/com.termux/files/home/encore/src/data/countries.ts) (Dihapus)
* **Penjelasan Fix**:
  * Menghapus ~840 baris logika server catur Socket.IO (`chess.js`, room garbage collector, interval clock ticker per 1 detik) dari `server.ts`.
  * Menghapus file statis `src/data/countries.ts` yang tidak pernah diimpor oleh modul mana pun.
  * Mengurangi beban memory server dan overhead event loop Node.js secara signifikan.

### 4. Modularisasi Komponen Game Memancing & Dekomposisi Modal (P1)
* **File yang Diubah / Dibuat**:
  * [`src/data/equipmentDatabase.ts`](file:///data/data/com.termux/files/home/encore/src/data/equipmentDatabase.ts) (Baru)
  * [`src/data/fishDatabase.ts`](file:///data/data/com.termux/files/home/encore/src/data/fishDatabase.ts) (Baru)
  * [`src/components/fishing/FishingJournalModal.tsx`](file:///data/data/com.termux/files/home/encore/src/components/fishing/FishingJournalModal.tsx) (Baru)
  * [`src/components/fishing/FishingOddsModal.tsx`](file:///data/data/com.termux/files/home/encore/src/components/fishing/FishingOddsModal.tsx) (Baru)
  * [`src/components/fishing/FishingShopModal.tsx`](file:///data/data/com.termux/files/home/encore/src/components/fishing/FishingShopModal.tsx) (Baru)
  * [`src/components/FishingGameSection.tsx`](file:///data/data/com.termux/files/home/encore/src/components/FishingGameSection.tsx)
* **Penjelasan Fix**:
  * Mengekstraksi database joran & umpan (`RODS_DATABASE`, `BAITS_DATABASE`) ke `equipmentDatabase.ts`.
  * Mengekstraksi database 40+ spesies ikan (`FISH_DATABASE`), formula probabilitas cuaca & equipment (`calculateRarityRates`), serta helper randomizer (`getRandomFish`) ke `fishDatabase.ts`.
  * Mengekstraksi seluruh modal ensiklopedia jurnal (`FishingJournalModal`), modal peluang odds & admin god mode (`FishingOddsModal`), serta toko alat pancing (`FishingShopModal`) ke folder `src/components/fishing/`.
  * Ukuran `FishingGameSection.tsx` berkurang drastis dari **3.493 baris menjadi 2.074 baris** (pengurangan >1.400 baris) dengan mempertahankan 100% fungsionalitas gameplay dan visual.

### 5. Kompresi Gambar Otomatis & Sanitasi XSS Komentar (P1)
* **File yang Diubah / Dibuat**:
  * [`src/lib/imageCompressor.ts`](file:///data/data/com.termux/files/home/encore/src/lib/imageCompressor.ts) (Baru)
  * [`src/lib/imageCompressor.test.ts`](file:///data/data/com.termux/files/home/encore/src/lib/imageCompressor.test.ts) (Baru)
  * [`src/lib/commentHelpers.ts`](file:///data/data/com.termux/files/home/encore/src/lib/commentHelpers.ts) (Baru)
  * [`src/components/CommentSection.tsx`](file:///data/data/com.termux/files/home/encore/src/components/CommentSection.tsx)
* **Penjelasan Fix**:
  * Menambahkan engine kompresi gambar berbasis HTML5 Canvas (`compressImageFile`) yang secara otomatis mengubah skala foto resolusi tinggi (hingga 5MB) menjadi WebP/JPEG berukuran max 800x800px dengan kualitas 0.75 (~30-50KB).
  * Menambahkan validator tipe gambar raster (`isValidRasterDataUrl`) untuk mencegah injeksi skrip SVG/XML.
  * Mengekstraksi logika parsing teks (`parseCommentText`), serialisasi header sematan/balasan (`serializeCommentText`), dan sanitasi entitas HTML (`sanitizeText`).

### 6. Penambahan Automated Unit Testing Suite (25 Tests / 5 Suites) (P2)
* **File Test yang Dibuat**:
  * [`src/lib/commentHelpers.test.ts`](file:///data/data/com.termux/files/home/encore/src/lib/commentHelpers.test.ts) (Baru)
  * [`src/lib/unoLogic.test.ts`](file:///data/data/com.termux/files/home/encore/src/lib/unoLogic.test.ts) (Baru)
  * [`src/data/fishDatabase.test.ts`](file:///data/data/com.termux/files/home/encore/src/data/fishDatabase.test.ts) (Baru)
  * [`src/lib/imageCompressor.test.ts`](file:///data/data/com.termux/files/home/encore/src/lib/imageCompressor.test.ts) (Baru)
  * [`src/lib/sessionAuth.test.ts`](file:///data/data/com.termux/files/home/encore/src/lib/sessionAuth.test.ts) (Baru)
* **Hasil Pengujian**:
  * **25/25 Unit Test Lulus (100% Pass Rate)** menggunakan runner bawaan Node (`npm test`):
    * 6 test untuk integritas database ikan, rentang bobot, dan formula odds equipment/cuaca.
    * 6 test untuk parsing unpinned/pinned comments, reply threading `[REPLY_TO]`, dan sanitasi XSS.
    * 5 test untuk komposisi 108 kartu deck UNO, validasi pencocokan warna/angka, dan aturan kartu Wild/Draw 4.
    * 5 test untuk pembuatan dan verifikasi session token HMAC-SHA256, proteksi expiry, dan penolakan manipulasi payload.
    * 3 test untuk validasi data URL raster dan penolakan muatan SVG XSS.

### 7. Pembersihan Dependensi & Penyesuaian Metadata (P2)
* **File yang Diubah**:
  * [`package.json`](file:///data/data/com.termux/files/home/encore/package.json)
  * [`metadata.json`](file:///data/data/com.termux/files/home/encore/metadata.json)
* **Penjelasan Fix**:
  * Mengubah nama package dari `react-example` menjadi `encore-portfolio` v1.0.0.
  * Menghapus dependensi yang tidak terpakai: `chess.js`, `socket.io`.
  * Memperbarui deskripsi `metadata.json` agar akurat mencerminkan fitur portofolio dan mini-games saat ini.
  * Menambahkan script `npm test` dan merapikan script `npm run lint`.

---

## Rekomendasi Selanjutnya

1. **Merge Branch**:
   Semua perubahan sudah tersimpan dan terverifikasi di branch `fix/project-improvements`. Untuk menggabungkannya ke branch `main`:
   ```bash
   git checkout main
   git merge fix/project-improvements
   ```
2. **Jalankan Test Kapan Saja**:
   ```bash
   npm test
   ```
3. **Deployment**:
   Aplikasi siap di-build menggunakan `npm run build` dan dijalankan dengan `npm start`.
