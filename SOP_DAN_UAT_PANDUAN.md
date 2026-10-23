# PANDUAN OPERASIONAL STANDAR (SOP) & USER ACCEPTANCE TESTING (UAT)
## Sistem Informasi Akuntansi Web Perusahaan Dagang (React + Supabase)

**Dokumen Versi:** 1.0.0  
**Tanggal:** Oktober 2026  
**Otoritas:** Senior System Analyst & Software Architect  

---

## 1. PANDUAN ADMIN: PENGELOLAAN PENGGUNA (USER MANAGEMENT)

Sistem menggunakan integrasi **Supabase Auth** dan tabel `public.profiles` dengan aturan keamanan *Row Level Security (RLS)*. Terdapat 4 peran (*roles*):
- `owner`: Memiliki hak penuh (*Full Admin*), verifikasi laporan, penutupan periode fiskal.
- `accountant`: Pengelolaan bagan akun, entri seluruh transaksi, posting jurnal, dan cetak laporan.
- `cashier`: Khusus akses entri Kas Masuk (BKM) dan Kas Keluar (BKK).
- `auditor`: Akses hanya-baca (*Read-Only*) untuk peninjauan pembukuan dan *audit trail*.

### Langkah Menambahkan Staf / Pengguna Baru:

#### Metode 1: Melalui Supabase Dashboard (Direkomendasikan)
1. Buka [Supabase Dashboard](https://supabase.com/dashboard) dan pilih proyek Anda.
2. Pada navigasi sisi kiri, klik menu **Authentication** > **Users**.
3. Klik tombol **Add User** (hijau/kanan atas), lalu pilih **Create User**.
4. Masukkan:
   - **Email**: contoh `kasir1@perusahaan.com` atau `akuntan@perusahaan.com`.
   - **Password**: Buat kata sandi sementara yang aman (minimal 8 karakter).
   - **Auto Confirm User?**: Centang opsi ini agar pengguna bisa langsung masuk tanpa verifikasi email.
5. Klik **Create User**.
6. Secara otomatis, trigger PostgreSQL `on_auth_user_created` akan membuat baris baru di tabel `public.profiles`.

#### Metode 2: Mengatur Hak Akses (Role) Pengguna
Secara default, pengguna baru mendapatkan role `accountant`. Untuk mengubah role staf menjadi `cashier`, `owner`, atau `auditor`:
1. Buka menu **Table Editor** > pilih tabel `profiles`.
2. Temukan baris dengan nama/email staf terkait.
3. Ubah kolom `role` menjadi: `cashier`, `accountant`, `owner`, atau `auditor`.
4. Klik **Save**. Hak akses RLS pengguna langsung terisolasi sesuai tabel hak akses di sistem.

*Atau eksekusi melalui SQL Editor:*
```sql
UPDATE public.profiles 
SET role = 'cashier', full_name = 'Siti Rahma (Kasir)' 
WHERE id = 'UUID-PENGGUNA-DARI-AUTH-USERS';
```

---

## 2. SKENARIO PENGUJIAN TRANSAKSI (USER ACCEPTANCE TESTING - UAT)

Pengujian ini mensimulasikan siklus operasional riil perusahaan dagang untuk membuktikan integritas prinsip *Double-Entry Bookkeeping*.

### Skenario 1: Setoran Modal Awal Pemilik Usaha Rp 100.000.000 (Tunai)
*Tujuan: Memverifikasi saldo kas masuk dan pembentukan ekuitas awal.*

| Langkah | Aksi Pengguna | Data yang Diinputkan |
| :---: | :--- | :--- |
| **1.1** | Buka menu navigasi **Kas Masuk** (`/kas-masuk`) | - |
| **1.2** | Nomor Bukti Kas Masuk | Biarkan terisi otomatis (contoh: `BKM-202610-001`) |
| **1.3** | Tanggal Transaksi | `2026-10-01` |
| **1.4** | Diterima pada Rekening Kas (Debit) | Pilih `1-1001 • Kas di Tangan` |
| **1.5** | Akun Sumber Penerimaan (Kredit) | Pilih `3-1001 • Modal Disetor Pemilik` |
| **1.6** | Nominal Penerimaan (Rp) | `100000000` |
| **1.7** | Keterangan | `Setoran modal tunai awal operasional perusahaan dagang` |
| **1.8** | Klik tombol **Simpan & Posting Kas Masuk** | Sistem menyimpan 1 baris header di `journal_entries` dan 2 baris seimbang di `journal_lines`. |

**Ayat Jurnal yang Terposting:**
- `[Debit]  1-1001 Kas di Tangan             Rp 100.000.000`
- `[Kredit] 3-1001 Modal Disetor Pemilik     Rp 100.000.000`

---

### Skenario 2: Pembelian Persediaan Barang Dagang Rp 20.000.000 (Tunai)
*Tujuan: Memverifikasi pengurangan saldo kas dan penambahan nilai persediaan barang dagang.*

| Langkah | Aksi Pengguna | Data yang Diinputkan |
| :---: | :--- | :--- |
| **2.1** | Buka menu navigasi **Kas Keluar** (`/kas-keluar`) | - |
| **2.2** | Nomor Bukti Kas Keluar | Terisi otomatis (contoh: `BKK-202610-001`) |
| **2.3** | Tanggal Transaksi | `2026-10-05` |
| **2.4** | Dibayarkan untuk Akun Tujuan (Debit) | Pilih `1-1201 • Persediaan Barang Dagang` (atau `5-2001`) |
| **2.5** | Sumber Rekening Kas Pembayar (Kredit)| Pilih `1-1001 • Kas di Tangan` |
| **2.6** | Nominal Pengeluaran (Rp) | `20000000` |
| **2.7** | Nomor Referensi / Nota Supplier | `NOTA-GROSIR/889` |
| **2.8** | Keterangan | `Pembelian stok awal barang dagang secara tunai` |
| **2.9** | Klik tombol **Simpan & Posting Kas Keluar** | Transaksi terposting secara double-entry. |

**Ayat Jurnal yang Terposting:**
- `[Debit]  1-1201 Persediaan Barang Dagang   Rp 20.000.000`
- `[Kredit] 1-1001 Kas di Tangan              Rp 20.000.000`

---

### Skenario 3: Penjualan Barang Dagang Rp 5.000.000 (Tunai) & Pengakuan HPP Rp 3.000.000
*Tujuan: Mencatat realisasi pendapatan penjualan kas dan pengakuan Beban Pokok Penjualan (HPP) atas barang yang terjual.*

#### Bagian 3A: Penerimaan Kas dari Penjualan Tunai
| Langkah | Aksi Pengguna | Data yang Diinputkan |
| :---: | :--- | :--- |
| **3A.1** | Buka menu navigasi **Kas Masuk** (`/kas-masuk`) | - |
| **3A.2** | No. Bukti & Tanggal | `BKM-202610-002` & `2026-10-15` |
| **3A.3** | Rekening Kas Penerima (Debit) | Pilih `1-1001 • Kas di Tangan` |
| **3A.4** | Akun Sumber Penerimaan (Kredit) | Pilih `4-1001 • Pendapatan Penjualan Barang Dagang` |
| **3A.5** | Nominal (Rp) | `5000000` |
| **3A.6** | Keterangan | `Penjualan tunai barang dagang ke Pelanggan Retail` |
| **3A.7** | Klik tombol **Simpan & Posting Kas Masuk** | Terposting. |

**Ayat Jurnal Terposting (3A):**
- `[Debit]  1-1001 Kas di Tangan             Rp 5.000.000`
- `[Kredit] 4-1001 Pendapatan Penjualan      Rp 5.000.000`

#### Bagian 3B: Pengakuan Beban Pokok Penjualan (HPP Metode Perpetual)
| Langkah | Aksi Pengguna | Data yang Diinputkan |
| :---: | :--- | :--- |
| **3B.1** | Buka menu navigasi **Jurnal Umum** (`/jurnal-manual`) | - |
| **3B.2** | No. Jurnal & Tanggal | `JU-202610-001` & `2026-10-15` |
| **3B.3** | Jenis Jurnal & Deskripsi | `Jurnal Umum`, Keterangan: `Pengakuan HPP atas penjualan tunai BKM-002` |
| **3B.4** | **Baris 1** | Akun: `5-1001 Beban Pokok Penjualan (HPP)`<br/>Debit: `3000000`, Kredit: `0` |
| **3B.5** | **Baris 2** | Akun: `1-1201 Persediaan Barang Dagang`<br/>Debit: `0`, Kredit: `3000000` |
| **3B.6** | Cek Status Keseimbangan | Indikator menunjukkan: `✓ SEIMBANG (DEBIT = KREDIT)` |
| **3B.7** | Klik **Simpan & Posting Jurnal** | Terposting ke Buku Besar. |

**Ayat Jurnal Terposting (3B):**
- `[Debit]  5-1001 Beban Pokok Penjualan (HPP) Rp 3.000.000`
- `[Kredit] 1-1201 Persediaan Barang Dagang    Rp 3.000.000`

---

## 3. PANDUAN REKONSILIASI & PENCOCOKAN LAPORAN SECARA REAL-TIME

Setelah Skenario 1, 2, dan 3 dieksekusi, buka menu **Laporan Keuangan** (`/reports`). Cocokkan seluruh nilai nominal dengan lembar pembuktian matematis berikut:

### 3.1 Pencocokan Buku Besar (General Ledger)
Pilih akun pada dropdown Buku Besar:
1. **Akun `1-1001 Kas di Tangan` (Saldo Normal Debit)**:
   - Mutasi Masuk (Skenario 1): `+ Rp 100.000.000`
   - Mutasi Keluar (Skenario 2): `- Rp 20.000.000`
   - Mutasi Masuk (Skenario 3A): `+ Rp 5.000.000`
   - **Saldo Berjalan Akhir Kas = Rp 85.000.000 (DEBIT)**
2. **Akun `1-1201 Persediaan Barang Dagang` (Saldo Normal Debit)**:
   - Pembelian Masuk (Skenario 2): `+ Rp 20.000.000`
   - Terjual ke HPP (Skenario 3B): `- Rp 3.000.000`
   - **Saldo Berjalan Akhir Persediaan = Rp 17.000.000 (DEBIT)**
3. **Akun `3-1001 Modal Disetor Pemilik` (Saldo Normal Kredit)**:
   - Saldo Akhir = **Rp 100.000.000 (KREDIT)**
4. **Akun `4-1001 Pendapatan Penjualan` (Saldo Normal Kredit)**:
   - Saldo Akhir = **Rp 5.000.000 (KREDIT)**
5. **Akun `5-1001 Beban Pokok Penjualan (HPP)` (Saldo Normal Debit)**:
   - Saldo Akhir = **Rp 3.000.000 (DEBIT)**

---

### 3.2 Pencocokan Neraca Saldo (Trial Balance)
Buka tab **Neraca Saldo**. Tabel harus menampilkan:
| Kode Akun | Nama Akun | Saldo Debit (Rp) | Saldo Kredit (Rp) |
| :--- | :--- | :---: | :---: |
| `1-1001` | Kas di Tangan | 85.000.000 | - |
| `1-1201` | Persediaan Barang Dagang | 17.000.000 | - |
| `3-1001` | Modal Disetor Pemilik | - | 100.000.000 |
| `4-1001` | Pendapatan Penjualan | - | 5.000.000 |
| `5-1001` | Beban Pokok Penjualan (HPP) | 3.000.000 | - |
| **TOTAL** | **KESEIMBANGAN (BALANCED)** | **Rp 105.000.000** | **Rp 105.000.000** |

*Status Banner: **✓ Neraca Saldo Mutlak Seimbang (Selisih: Rp 0)**.*

---

### 3.3 Pencocokan Laporan Laba Rugi (Income Statement)
Buka tab **Laba Rugi (Multi-Step)**. Kalkulasi yang tampil:
$$\begin{aligned}
\text{Penjualan Bersih} &= \text{Rp } 5.000.000 \\
\text{Beban Pokok Penjualan (HPP)} &= (\text{Rp } 3.000.000) \\
\hline
\text{Laba Kotor (Gross Profit)} &= \text{Rp } 2.000.000 \\
\text{Total Beban Operasional} &= \text{Rp } 0 \\
\hline
\mathbf{\text{Laba Bersih Operasional (Net Income)}} &= \mathbf{\text{Rp } 2.000.000} \quad (\text{Margin: } 40.0\%)
\end{aligned}$$

---

### 3.4 Pencocokan Laporan Posisi Keuangan (Neraca)
Buka tab **Neraca (Posisi Keuangan)**. Sistem membuktikan pemenuhan rumus dasar:

$$\mathbf{\text{Total Aset}} \equiv \mathbf{\text{Total Kewajiban}} + \big(\mathbf{\text{Ekuitas}} + \mathbf{\text{Laba Bersih Berjalan}}\big)$$

#### Sisi Aktiva (Aset):
- Kas di Tangan: Rp 85.000.000
- Persediaan Barang Dagang: Rp 17.000.000
- **TOTAL ASET = Rp 102.000.000**

#### Sisi Pasiva (Kewajiban & Ekuitas):
- Total Kewajiban / Utang: **Rp 0**
- Modal Disetor Pemilik: Rp 100.000.000
- **Laba Bersih Periode Berjalan (Injeksi Real-time)**: **Rp 2.000.000**
- Total Ekuitas Pemilik: Rp 102.000.000
- **TOTAL KEWAJIBAN & EKUITAS = Rp 102.000.000**

**Hasil Verifikasi:**
$$\text{Rp } 102.000.000 = \text{Rp } 0 + \text{Rp } 102.000.000 \quad \implies \quad \mathbf{\text{Selisih: Rp 0 (100\% SEIMBANG)}}$$

---

## 4. PANDUAN RINGKAS DEPLOYMENT KE VERCEL

Aplikasi web React (Vite) ini telah dilengkapi dengan berkas [vercel.json](file:///d:/projects/Akuntansi%20Dagang/vercel.json) untuk mengatasi *routing single-page application (SPA)* agar tidak terjadi error 404 saat pengguna me-refresh halaman.

### Metode A: Menggunakan Vercel CLI (Paling Cepat)

1. Pasang Vercel CLI secara global (jika belum ada):
   ```bash
   npm install -g vercel
   ```
2. Dari direktori proyek `d:\projects\Akuntansi Dagang`, jalankan:
   ```bash
   vercel
   ```
3. Ikuti wizard terminal:
   - *Set up and deploy?* &rarr; Ketik `y` (Yes)
   - *Which scope?* &rarr; Pilih akun Vercel Anda
   - *Link to existing project?* &rarr; Ketik `n` (No)
   - *Project name?* &rarr; Tekan Enter (gunakan default: `akuntansi-dagang`)
   - *Directory located?* &rarr; Tekan Enter (`./`)
   - *Want to modify settings?* &rarr; Ketik `n` (No, Vite terdeteksi otomatis)
4. Masukkan Environment Variables di Vercel:
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   ```
5. Deploy versi produksi:
   ```bash
   vercel --prod
   ```

---

### Metode B: Melalui GitHub & Vercel Dashboard (CI/CD Otomatis)

1. **Unggah Proyek ke GitHub**:
   ```bash
   git init
   git add .
   git commit -m "feat: core accounting system release 1.0.0"
   git branch -M main
   git remote add origin https://github.com/USERNAME/akuntansi-dagang.git
   git push -u origin main
   ```
2. **Impor ke Vercel**:
   - Buka [Vercel Dashboard](https://vercel.com/new).
   - Klik **Import** pada repositori `akuntansi-dagang`.
   - Pada bagian **Framework Preset**, pastikan terpilih **Vite**.
   - Buka dropdown **Environment Variables**, lalu tambahkan:
     - `VITE_SUPABASE_URL`: URL API Supabase Anda (`https://xyz.supabase.co`).
     - `VITE_SUPABASE_ANON_KEY`: Kunci anon/public Supabase Anda.
3. **Klik Tombol Deploy**:
   - Vercel akan menjalankan `npm install` dan `npm run build`.
   - Dalam ~30 detik, aplikasi live di URL produksi (contoh: `https://akuntansi-dagang.vercel.app`).
   - Setiap push baru ke branch `main` akan di-deploy secara otomatis.

---
Dokumen ini menjadi standar acuan operasional tim akuntansi dan tim pengembang.
