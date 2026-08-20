# Accounts Receivable Dashboard

Sistem internal Finance untuk mengelola Accounts Receivable — invoice, payment,
overdue/aging, collection, customer, credit control, dispute, dan reporting.
Dibangun sesuai PRD sebagai single source of truth.

## Status: Hardening Produksi — Auth, Realtime, Reliability ✅

Di atas migrasi Supabase + Auth sebelumnya, ditambahkan 6 perbaikan untuk
kesiapan produksi:

1. **Lupa Password** — halaman `/forgot-password` (kirim link reset) dan `/reset-password` (set password baru), pakai `supabase.auth.resetPasswordForEmail` + `updateUser`
2. **Cegah terindeks Google** — `<meta name="robots" content="noindex, nofollow">` + `public/robots.txt` — wajar untuk internal tool yang domainnya bisa saja publik (`*.vercel.app`)
3. **Realtime sync antar user** — perubahan data (Record Payment, Catat Aktivitas, dll) dari satu user otomatis muncul di layar user lain tanpa refresh manual, lewat `supabase.channel().on('postgres_changes', ...)` di `useARStore.ts`. **Wajib jalankan `supabase/enable-realtime.sql` sekali di SQL Editor** — tanpa ini fitur real-time tidak aktif (aplikasi tetap jalan normal, cuma tidak live-update)
4. **Error Boundary** — `src/components/ErrorBoundary.tsx`, membungkus seluruh `App.tsx`. Error render yang tak tertangani sekarang menampilkan pesan + tombol "Muat Ulang", bukan layar putih kosong
5. **Code-splitting per halaman** — tiap route (`Dashboard`, `Reports`, dst) di-`React.lazy()`, hanya diunduh saat dibuka. Bundle awal turun dari ~950kB menjadi ~461kB
6. **Daftar mandiri pakai OTP Email** — tab baru di halaman Login: masukkan email pribadi apa saja → dikirim kode 6 digit → verifikasi → akun otomatis dibuat. Lihat **catatan keamanan** di bawah, ini mengubah model akses sebelumnya

### ⚠️ Catatan keamanan penting: OTP self-signup

Sebelumnya akun **hanya** dibuat admin manual lewat Supabase Dashboard —
sekarang siapa pun yang tahu URL aplikasi bisa **mendaftar sendiri** pakai
email pribadi apa saja lewat tab "Kode Email (OTP)" di halaman Login.

Karena Row Level Security saat ini (`supabase/schema.sql`) memberi **akses
penuh baca/tulis ke semua data Finance untuk siapa pun yang berhasil
login** (tanpa RBAC, sesuai keputusan awal PRD) — ini berarti **siapa pun
yang mendaftar sendiri otomatis punya akses penuh ke seluruh data AR**,
bukan cuma lihat-lihat.

Kalau aplikasi ini akan dipakai dengan data finansial sungguhan, pertimbangkan salah satu:
- **Nonaktifkan tab OTP** (hapus toggle di `src/pages/Login.tsx`, kembali ke admin-only seperti sebelumnya) — paling aman, paling sederhana
- **Batasi domain email** — tolak pendaftaran kalau domain email bukan domain perusahaan (mis. hanya `@perusahaan.com`), perlu tambahan validasi
- **Approval manual** — akun baru dari OTP tetap dibuat tapi non-aktif sampai admin approve

Belum saya batasi otomatis karena itu bukan yang diminta — tapi tolong
putuskan salah satu sebelum aplikasi ini benar-benar dipakai dengan data
finansial asli.

## Status: Migrasi ke Supabase + Auth ✅

Seluruh 7 phase awal sudah selesai (lihat riwayat di bawah). Di atas itu,
data layer sudah dimigrasikan dari IndexedDB (per-browser) ke **Supabase
(Postgres, terpusat)**, dan ditambahkan **login sederhana (email/password)**
karena database sekarang dipakai bersama oleh tim, bukan lagi per-device.
Ini mengubah dua aturan eksplisit dari PRD awal ("tanpa backend", "tanpa
login") — perubahan yang disengaja atas permintaan, dikonfirmasi sebelum
dikerjakan.

**Yang berubah secara arsitektur:**
- `src/lib/db.ts` (Dexie/IndexedDB) → `src/lib/supabaseClient.ts` + query langsung di `useARStore.ts`
- Tidak ada perubahan tampilan/komponen sama sekali — semua halaman tetap bicara ke `useARStore`, hanya "mesin" di baliknya yang diganti
- Login (`src/pages/Login.tsx`) + `ProtectedRoute` — redirect ke `/login` kalau belum ada sesi
- Tombol Logout ditambahkan di Sidebar (sebelumnya sengaja tidak ada karena tanpa auth)
- Tombol "Reset ke Data Contoh" di Settings sekarang **hanya muncul di mode development** (`import.meta.env.DEV`) — karena database sekarang dipakai bersama, tombol ini bisa menghapus data semua orang kalau dibiarkan aktif di produksi

### Setup Supabase (wajib sebelum menjalankan aplikasi)

1. Buat project baru di [supabase.com](https://supabase.com) (gratis untuk skala tim kecil)
2. Buka **SQL Editor** di dashboard Supabase, jalankan seluruh isi file `supabase/schema.sql` — ini membuat 5 tabel (customers, invoices, payments, collection_activities, disputes) beserta Row Level Security policy
3. Masih di **SQL Editor**, jalankan juga `supabase/enable-realtime.sql` — supaya perubahan data live-update antar user (langkah 3 di atas)
4. Buka **Authentication > Users**, klik **Add User** untuk membuat akun tim Finance secara manual (email + password) — kalau Anda tetap memakai mode admin-only. Kalau tab OTP self-signup diaktifkan, akun baru juga bisa terbentuk otomatis lewat halaman Login (lihat catatan keamanan di atas)
5. Buka **Project Settings > API**, salin **Project URL** dan **anon public key**
6. Salin `.env.example` menjadi `.env`, isi dengan kedua nilai tersebut:
   ```
   VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```
7. Jalankan `npm install && npm run dev` — saat pertama kali dibuka, aplikasi otomatis mengisi data contoh ke database (sama seperti mock data sebelumnya) kalau tabel masih kosong

### Data contoh (opsional, hanya lewat aksi eksplisit)


Aplikasi **tidak pernah mengisi data contoh secara otomatis** — baik saat
`npm run dev` lokal maupun di produksi. Database Supabase yang baru
dijalankan skema-nya akan tampil kosong (EmptyState) di semua halaman
sampai Anda mengisi data lewat salah satu dari dua cara:

- **Import Wizard** (Settings → Mulai Import) — untuk data asli
- **Tombol "Reset ke Data Contoh"** di Settings — hanya muncul saat `npm run dev` (mode development), untuk keperluan testing/demo. Tombol ini tidak pernah muncul di build produksi

Kalau sebelumnya Anda sempat mengisi data contoh (dari versi awal migrasi
Supabase yang masih auto-seed) dan ingin membersihkannya, jalankan
`supabase/clear-dummy-data.sql` di Supabase Dashboard → SQL Editor.

### Deploy ke Vercel

1. Push project ini ke GitHub
2. Import repo di [vercel.com](https://vercel.com) → New Project
3. Di pengaturan **Environment Variables**, tambahkan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` dengan nilai yang sama seperti di `.env` — **jangan pernah commit file `.env` ke git** (sudah masuk `.gitignore`)
4. Deploy. File `vercel.json` sudah disiapkan agar routing client-side (React Router) tidak 404 saat diakses langsung lewat URL
5. Bagikan URL Vercel + buatkan akun lewat Supabase Dashboard untuk tiap anggota tim Finance yang perlu akses

**Catatan keamanan**: anon key Supabase memang didesain aman untuk ditaruh di kode frontend (bukan secret) — perlindungan sebenarnya ada di Row Level Security policy (`supabase/schema.sql`), yang mewajibkan status login sebelum bisa baca/tulis data apa pun.

## Status: Semua 7 Phase Selesai ✅ (riwayat build awal)

Seluruh roadmap implementasi (Phase 1-7) telah dibangun sebagai internal tool
AR tanpa backend/auth, data tersimpan lokal di IndexedDB. **Catatan: bagian
data layer ini sudah digantikan oleh migrasi Supabase + Auth di atas** — teks
di bawah ini dipertahankan sebagai riwayat proses pembangunan fitur per fase,
bukan deskripsi arsitektur yang berjalan saat ini.

## Status: Phase 7 — Excel/CSV Import ✅

Ditambahkan pada tahap ini (di atas Phase 1-6, fase terakhir roadmap):

- **Import Wizard** — modal 5 langkah: Pilih Jenis Data & Upload → Mapping Kolom → Validasi → Preview → Hasil, untuk 3 jenis data: Master Invoices, Master Customers, Collection Activity
- **Parser** — membaca `.xlsx`, `.xls`, `.csv` (SheetJS, lazy-loaded)
- **Auto-mapping kolom** — mencocokkan header file ke field sistem berdasarkan kemiripan nama, tetap bisa disesuaikan manual
- **Validasi** — cek field wajib, tipe data (angka/tanggal/enum), dan validasi referensial (customer_code/invoice_number harus sudah ada di sistem sebelum invoice/aktivitas bisa diimpor)
- **Deteksi duplikat** — baris dengan kode/nomor yang sudah ada akan meng-update data lama (upsert), bukan menduplikasi
- **Preview** sebelum konfirmasi — menampilkan data yang sudah divalidasi & ditransformasi, bukan data mentah
- **Auto risk-level** — jika kolom risk_level dikosongkan saat import Customer, sistem menghitungnya otomatis dari credit utilization (fungsi yang sama dipakai generator data contoh, sekarang benar-benar satu sumber logika lewat `getRiskLevel()`)
- Tombol "Impor Excel" di Header dan halaman Settings & Data Management kini benar-benar membuka wizard ini (sebelumnya placeholder)

Setelah import Customer/Invoice/Activity, seluruh Dashboard, tabel, dan
laporan otomatis mencerminkan data baru tanpa perlu reload — karena semuanya
tetap membaca dari `useARStore` yang sama.

## Status: Phase 6 — Reports ✅

Ditambahkan pada tahap ini (di atas Phase 1-5):

- **Halaman Reports & Analytics** — KPI strip (Total AR Balance, Rata-rata DSO, Overdue >30 Hari, Collection Efficiency)
- **AR Aging Schedule** — chart + tabel detail (jumlah invoice, nilai, persentase per bucket)
- **Monthly Collection Trend** — chart Ditagihkan vs Tertagih, selektor rentang 3/6/12 bulan
- **Overdue Analysis per Industri** — tabel exposure & >90 hari dikelompokkan per industri
- **Customer Exposure** — tabel top 10 customer berdasarkan total exposure, dengan status Eskalasi/Disengketa/Normal
- **Export Excel** — satu file `.xlsx` berisi 4 sheet (Aging Schedule, Monthly Collection, Overdue by Industry, Customer Exposure), benar-benar ter-generate dan terunduh
- **Export PDF** — ringkasan laporan (Aging Schedule + Customer Exposure) dalam format PDF siap cetak

**Catatan performa**: `xlsx` dan `jsPDF` (yang cukup berat, terutama karena
dependency `html2canvas`) di-*lazy-load* — baru dimuat saat tombol export
benar-benar ditekan, bukan saat aplikasi pertama kali dibuka. Ini menjaga
initial bundle tetap ringan (~812kB, turun dari sempat 1,5MB saat kedua
library di-import statis).

## Status: Phase 5 — Customer ✅

Ditambahkan pada tahap ini (di atas Phase 1-4):

- **Customer Directory** — KPI strip (Total Customer, Customer Aktif, Total Exposure, Risiko Tinggi/Kritis), filter berdasarkan risk profile, search, tabel dengan kolom Credit Utilization bervisual progress bar
- **Customer Detail** (full page, bukan drawer — sesuai keputusan arsitektur karena datanya banyak) — profil, ringkasan finansial (outstanding, overdue, terbayar, DSO), panel Credit Control (utilization, sisa kredit tersedia)
- **3 Riwayat dalam tab**: Riwayat Invoice, Riwayat Pembayaran, Riwayat Aktivitas — masing-masing pakai komponen reusable yang sama dengan halaman lain (DataTable, CollectionHistoryList)
- Klik invoice di tab Riwayat Invoice membuka **Invoice Detail Drawer** yang sama persis dengan yang dipakai di halaman Invoices — tidak ada implementasi ganda
- Tombol "Catat Pembayaran" di header customer membuka modal global dengan invoice picker

Semua angka (outstanding, overdue, DSO, credit utilization) dihitung ulang dari
data invoice customer tersebut — konsisten dengan angka yang sama di Customer
Directory dan Dashboard.

## Status: Phase 4 — Collection ✅

Ditambahkan pada tahap ini (di atas Phase 1-3):

- **Halaman Collection & Activity** — KPI strip (Aktivitas Bulan Ini, Follow Up Perlu Tindakan, PTP Aktif, Nilai PTP Aktif), filter Semua/Follow Up/Promise to Pay, search
- **Catat Aktivitas** — modal **global** (dipicu dari halaman Collection, Invoice Detail Drawer, atau widget Dashboard "Log Call") dengan pencarian invoice, pilihan jenis aktivitas, tanggal follow up berikutnya, dan toggle **Promise to Pay** (tanggal + jumlah janji bayar)
- **Follow Up List** — panel terpisah menampilkan jadwal follow up terdekat, menyorot yang sudah lewat jadwal (overdue)
- **CollectionHistoryList** — komponen reusable untuk menampilkan riwayat aktivitas, dipakai baik di halaman Collection maupun Invoice Detail Drawer (tidak ada duplikasi rendering)

Mencatat aktivitas dari mana pun langsung muncul di Activity Log, Follow Up List, dan
riwayat aktivitas pada Invoice Detail — satu data, banyak tampilan.

## Status: Phase 3 — AR Management ✅

Ditambahkan pada tahap ini (di atas Phase 1 & 2):

- **Halaman Invoices** — KPI strip, filter chip berjumlah dinamis (Semua/Belum Jatuh Tempo/Overdue/Lunas/Disengketa/Eskalasi), search customer/invoice, tabel sortable dengan pagination
- **Invoice Detail Drawer** — buka dari klik baris tabel: ringkasan invoice, status dispute aktif (jika ada), riwayat pembayaran, riwayat aktivitas collection, aksi Catat Pembayaran / Kirim Pengingat / Eskalasi
- **Record Payment** — modal **global** (bisa dipicu dari Sidebar, Drawer, atau widget Dashboard) dengan pencarian invoice, validasi jumlah terhadap outstanding, benar-benar menyimpan ke store & IndexedDB
- **Kirim Pengingat** — modal global, preview pesan Email/WhatsApp otomatis dari data invoice, pengiriman disimulasikan dan tercatat sebagai Collection Activity
- **Dispute Center** — KPI strip (Total Disengketa, Dispute Aktif, Rata-rata Waktu Resolusi, Perlu Perhatian Segera), filter + search, tabel Dispute Queue dengan indikator hari terbuka
- **Validasi Dokumen** — modal untuk memperbarui status dispute, tersambung ke store

Semua aksi baru (Record Payment, Eskalasi, Validasi Dokumen, Kirim Pengingat) benar-benar
mengubah data di `useARStore`/IndexedDB — bukan dummy — sehingga langsung terlihat konsisten
di Dashboard, tabel Invoice, dan Dispute Center tanpa reload manual.

## Status: Phase 2 — Dashboard ✅

Ditambahkan pada tahap ini (di atas fondasi Phase 1):

- **AR Aging Schedule** (bar chart) — distribusi outstanding per bucket umur piutang (Current/1-30/31-60/61-90/>90), warna semantic sesuai urutan risiko
- **Cash Inflow Trend** (area chart) — total pembayaran masuk per bulan, 6 bulan terakhir, agregat langsung dari data Payment
- **High Priority Overdue widget** — tabel invoice overdue/eskalasi diurutkan berdasarkan prioritas, dengan aksi **Eskalasi yang benar-benar fungsional** (mengubah status invoice via store, tersimpan ke IndexedDB, langsung terlihat di seluruh halaman). Aksi "Log Call" mengarahkan ke halaman Collection; "Kirim Pengingat" placeholder menunggu Phase 3
- **Dispute widget** — ringkasan nilai & jumlah dispute aktif, tombol "Tinjau Sekarang" menuju Dispute Center
- **Collection Progress widget** — collection rate dengan progress bar bertingkat warna (hijau/kuning/merah)

Semua widget membaca dari `useARStore` yang sama tanpa data terpisah — mengubah
data (mis. eskalasi invoice) langsung tercermin di KPI card dan chart tanpa reload manual.

## Status: Phase 1 — Foundation ✅

Yang sudah dibangun pada tahap ini:

- **Project setup**: Vite + React 18 + TypeScript + Tailwind CSS v4
- **Design tokens**: warna (`#0f172a` + semantic), font Inter (UI) & JetBrains Mono (data numerik), radius, shape sesuai sistem desain yang disepakati
- **Routing**: React Router, seluruh struktur halaman sesuai Application Structure PRD
- **Layout**: Sidebar navigasi (dengan submenu AR Management) + Header (search, Export, Impor Excel) + tombol global "Catat Pembayaran"
- **State management**: Zustand sebagai single source of truth, tersambung ke IndexedDB (Dexie) untuk persistence lokal (tidak ada backend/auth sesuai batasan PRD)
- **Business logic**: kalkulasi status invoice, aging bucket, outstanding, DSO, collection rate — semua computed dari data, tidak ada field hardcode (lib/calculations.ts)
- **Mock data**: generator data contoh realistis Bahasa Indonesia (25 customer, ~130 invoice dengan distribusi aging representatif)
- **Reusable components**: Button, Badge (Status/Aging/Dispute/Risk), KPICard, DataTable (generic + sorting), FilterBar, Pagination, Modal, Drawer, ConfirmationDialog, Toast, ProgressBar, LoadingState/EmptyState/ErrorState
- **Dashboard**: KPI strip (Total Outstanding, Total Overdue, DSO, Collection Rate) tersambung end-to-end ke store — membuktikan alur data bekerja

Halaman lain (Invoices, Dispute Center, Collection, Customers, Reports, Settings→Import)
tampil sebagai placeholder yang menandakan phase pembangunannya, sesuai roadmap.

## Menjalankan proyek

```bash
npm install
npm run dev
```

Build produksi:

```bash
npm run build
npm run preview
```

## Struktur folder

```
src/
  types/          # Definisi tipe seluruh entity (Customer, Invoice, Payment, dst)
  lib/
    calculations.ts  # Status/aging/outstanding/DSO logic (satu-satunya sumber kebenaran)
    format.ts         # Format IDR & tanggal Indonesia
    db.ts             # Dexie (IndexedDB) wrapper
    mockData.ts        # Generator data contoh
  store/
    useARStore.ts     # Zustand store — single source of truth
  components/
    layout/          # Sidebar, Header, AppLayout
    ui/              # Komponen reusable
  pages/             # Satu file per halaman/route
```

## Catatan Arsitektur

- Semua field turunan (status, aging, outstanding) **dihitung**, tidak pernah disimpan manual — lihat `lib/calculations.ts`.
- Data tersimpan lokal di browser (IndexedDB) karena aplikasi tanpa login/backend. Bisa direset ke data contoh dari halaman Settings.
- Tidak ada duplikasi data per halaman — semua page membaca dari `useARStore` yang sama.

## Selanjutnya

Semua phase pada roadmap awal sudah selesai. Kandidat lanjutan (menunggu
arahan Anda):
- Polish/refinement UI berdasarkan feedback pemakaian langsung
- Code-splitting rute (React.lazy per halaman) untuk mempercepat initial load lebih jauh
- Penyesuaian aturan bisnis spesifik (mis. threshold aging, kebijakan eskalasi) jika ada perubahan kebijakan Finance
- Fitur di luar PRD awal, jika dibutuhkan (didiskusikan dulu sebelum dibangun, sesuai prinsip "jangan overengineering")
