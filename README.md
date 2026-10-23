# Sistem Informasi Akuntansi Perusahaan Dagang (Double-Entry Bookkeeping)

Aplikasi akuntansi berbasis web modern khusus untuk perusahaan dagang dengan arsitektur **Double-Entry Bookkeeping**, dibangun menggunakan **React**, **Tailwind CSS**, dan **Supabase (PostgreSQL)**.

---

## 🚀 Fitur Utama

1. **Autentikasi & Keamanan (Role-Based Access Control):**
   - Terintegrasi dengan **Supabase Auth** & **Row Level Security (RLS)**.
   - Hak akses berjenjang: *Owner*, *Accountant*, *Cashier*, dan *Auditor*.
2. **Bagan Akun (Chart of Accounts):**
   - Standar bagan akun lengkap untuk operasional perusahaan dagang (Aset, Liabilitas, Ekuitas, Pendapatan, HPP, Beban).
3. **Modul Transaksi (Core Double-Entry Engine):**
   - **Kas Masuk:** Otomatis mendebit akun Kas/Bank dan mengkredit akun sumber pendapatan/piutang.
   - **Kas Keluar:** Otomatis mengkredit akun Kas/Bank dan mendebit akun beban/utang.
   - **Jurnal Manual:** Input jurnal umum dinamis multi-baris dengan validasi keseimbangan debit-kredit (*balanced transaction validation*).
4. **Modul Pelaporan Keuangan Real-Time:**
   - **Buku Besar (General Ledger):** Menampilkan mutasi transaksi per akun beserta perhitungan saldo berjalan (*running balance*).
   - **Neraca Saldo (Trial Balance):** Ringkasan saldo akhir debit/kredit seluruh akun dengan validasi seimbang.
   - **Laporan Laba Rugi (Income Statement):** Kalkulasi Pendapatan Bersih - (HPP + Beban Operasional).
   - **Laporan Neraca (Balance Sheet):** Verifikasi persamaan dasar akuntansi: `Aset = Kewajiban + (Ekuitas + Laba Periode Berjalan)`.

---

## 🛠️ Teknologi yang Digunakan

- **Frontend:** [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Backend & Database:** [Supabase](https://supabase.com/) (PostgreSQL dengan RLS & Triggers)
- **Deployment Ready:** Vercel / Netlify (`vercel.json` & SPA redirects configured)

---

## ⚙️ Panduan Menjalankan Secara Lokal

### 1. Klon Repositori
```bash
git clone https://github.com/bprasetyo-id/akuntansi-dagang.git
cd akuntansi-dagang
```

### 2. Instal Dependensi
```bash
npm install
```

### 3. Konfigurasi Lingkungan (`.env`)
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Isi kredensial Supabase Anda di `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Eksekusi Skrip Database
Jalankan seluruh isi skrip [supabase_accounting_schema.sql](./supabase_accounting_schema.sql) di **Supabase SQL Editor** untuk membuat tabel, trigger, RLS policies, dan seeder bagan akun.

### 5. Jalankan Server Development
```bash
npm run dev
```
Aplikasi akan aktif di `http://localhost:3000`.

---

## 📄 Lisensi
Hak Cipta © 2026. Lisensi MIT.
