# PANDUAN LENGKAP PERSIAPAN & ONBOARDING KLIEN BARU
## SISTEM INFORMASI AKUNTANSI PERUSAHAAN DAGANG (SIA DAGANG CLOUD ERP)
### Dokumen Standar Operasional Prosedur (SOP) Implementasi Teknis, Akuntansi, Legal, dan Layanan Klien

---

## DAFTAR ISI
1. [Pendahuluan & Prinsip Layanan B2B](#1-pendahuluan--prinsip-layanan-b2b)
2. [Pilar 1: Sisi Arsitektur & Infrastruktur Deployment](#2-pilar-1-sisi-arsitektur--infrastruktur-deployment)
3. [Pilar 2: Sisi Akuntansi & Master Data Onboarding](#3-pilar-2-sisi-akuntansi--master-data-onboarding)
4. [Pilar 3: Sisi Pengguna, Hak Akses & Hardware Toko](#4-pilar-3-sisi-pengguna-hak-akses--hardware-toko)
5. [Pilar 4: Sisi Pelatihan Staf & SOP Operasional](#5-pilar-4-sisi-pelatihan-staf--sop-operasional)
6. [Pilar 5: Sisi Legalitas, Kontrak Kerja Sama & Kerahasiaan Data](#6-pilar-5-sisi-legalitas-kontrak-kerja-sama--kerahasiaan-data)
7. [Pilar 6: Sisi Finansial, Billing & Skema Monetisasi](#7-pilar-6-sisi-finansial-billing--skema-monetisasi)
8. [Pilar 7: Sisi Support, Maintenance & Customer Success](#8-pilar-7-sisi-support-maintenance--customer-success)
9. [Jadwal Implementasi Standar: 7 Hari Menuju Go-Live](#9-jadwal-implementasi-standar-7-hari-menuju-go-live)
10. [Lampiran: Formulir Kebutuhan Data & Checklist Serah Terima](#10-lampiran-formulir-kebutuhan-data--checklist-serah-terima)

---

## 1. PENDAHULUAN & PRINSIP LAYANAN B2B

### 1.1 Latar Belakang
Menjual software akuntansi ke perusahaan dagang (toko ritel, grosir, distributor, agen) memiliki karakteristik yang sangat unik dibanding aplikasi konsumen biasa. Data keuangan adalah aset paling rahasia dan paling vital bagi pemilik bisnis (*business owner*). Kesalahan dalam pencatatan atau kegagalan sistem dapat menghentikan operasional toko dan menimbulkan kerugian materiil.

Oleh karena itu, ketika seorang klien memutuskan untuk **Deal** menggunakan **SIA Dagang**, penyedia solusi tidak hanya menyerahkan tautan login, melainkan memberikan **Layanan Onboarding Terstruktur** yang menjamin:
1. **Keamanan & Isolasi Data:** Data keuangan klien terlindungi dan tidak bercampur dengan bisnis lain.
2. **Kesesuaian Akuntansi:** Bagan akun dan saldo awal mencerminkan kondisi riil toko.
3. **Kesiapan Staf:** Kasir dan akuntan memahami alur input harian tanpa kecanggungan.
4. **Kepastian Layanan:** Adanya kontrak legal dan saluran bantuan jika terjadi kendala teknis.

---

## 2. PILAR 1: SISI ARSITEKTUR & INFRASTRUKTUR DEPLOYMENT

Setiap klien yang bergabung memerlukan ruang komputasi dan penyimpanan data yang aman, andal, dan berkecepatan tinggi.

### 2.1 Analisis & Alternatif Model Deployment

| Parameter | Opsi A: Dedicated Project per Klien *(Rekomendasi Utama)* | Opsi B: Shared Multi-Tenant Database | Opsi C: On-Premise / Private VPS Klien |
| :--- | :--- | :--- | :--- |
| **Deskripsi** | 1 Klien = 1 Project Supabase + 1 Subdomain Web (misal: `tokomaju.siadagang.com`). | 1 Database besar bersama, data dipisahkan kolom `tenant_id` dan Row Level Security. | Sistem diinstal di komputer server fisik toko klien atau VPS privat sewaan klien. |
| **Isolasi Data** | **Sangat Tinggi (100% Terpisah)**. Tidak ada risiko data tertukar antar toko. | Sedang. Bergantung sepenuhnya pada kebenaran logika RLS di database. | Sangat Tinggi. Server di bawah penguasaan fisik klien sendiri. |
| **Biaya Server** | Sangat hemat untuk 1–15 klien pertama (dapat memanfaatkan tier Supabase & Vercel). | Paling hemat jika sudah memiliki puluhan hingga ratusan klien aktif. | Biaya hardware server atau VPS bulanan dibebankan kepada klien. |
| **Kemudahan Backup** | Sangat mudah. Cukup dump database 1 project tanpa mengganggu klien lain. | Rumit saat klien meminta ekspor database penuh secara mandiri. | Harus mengatur script backup otomatis lokal di server klien. |
| **Target Klien** | Toko ritel berkembang, grosir, dan distributor (1–5 cabang). | SaaS massal untuk UMKM mikro dengan harga langganan sangat murah. | Perusahaan dagang skala menengah-besar yang memiliki kebijakan audit ketat. |

> **Rekomendasi Standar Operasional:**  
> Untuk 1–20 klien pertama, gunakan **Opsi A (Dedicated Project)**. Skema ini memberikan rasa aman maksimal bagi klien karena database mereka berdiri sendiri secara eksklusif.

### 2.2 Prosedur Teknis Setup Infrastruktur Baru
1. **Penyediaan Database:** Buat project baru di Supabase dengan nama `sia-[nama-klien]` pada region terdekat (misal: Singapore `ap-southeast-1` untuk latensi rendah di Indonesia).
2. **Eksekusi Skema Database:** Jalankan skrip DDL `supabase_accounting_schema.sql` untuk membuat tabel `profiles`, `accounts`, `journal_entries`, `journal_lines`, dan fungsi trigger terkait.
3. **Penyediaan Domain / Subdomain:** Tambahkan subdomain baru di dashboard Vercel (contoh: `toko-berkah.siadagang.com`) yang mengarah ke build produksi dengan environment variable URL dan Anon Key klien tersebut.
4. **Konfigurasi Automated Backup:** Aktifkan backup harian (*Point-in-Time Recovery* atau scheduled export) untuk memastikan keamanan data jangka panjang.

---

## 3. PILAR 2: SISI AKUNTANSI & MASTER DATA ONBOARDING

Aplikasi akuntansi hanya akan menghasilkan laporan yang valid jika data awal yang dimasukkan akurat dan taat asas.

### 3.1 Kustomisasi Bagan Akun (Chart of Accounts - COA)
Setiap sektor perdagangan memiliki kebutuhan rekening yang spesifik:
* **Toko Bahan Bangunan:** Butuh akun *Beban Sewa Armada Truk*, *Persediaan Semen & Pasir*, *Utang Pabrik Semen*.
* **Toko Pakaian & Fashion:** Butuh akun *Beban Packaging Butik*, *Persediaan Pakaian Pria/Wanita*, *Retur Penjualan*.
* **Toko Sembako & FMCG:** Butuh akun *Beban Kerusakan Barang Kadaluarsa*, *Kasir Toko 1*, *Kasir Toko 2*.

### 3.2 Penentuan Tanggal Cut-Off Migrasi
* **SOP Baku:** Tanggal cut-off perpindahan sistem pembukuan lama ke SIA Dagang wajib ditentukan di awal.
* **Waktu Terbaik:** Pukul 00:01 pada **Hari Pertama Awal Bulan** (misal: 1 November 2026).
* Semua transaksi sebelum tanggal cut-off diselesaikan dan diarsipkan di sistem/buku lama.

### 3.3 Penarikan Saldo Awal Neraca (Opening Balance)
Data awal yang wajib disiapkan oleh klien sebelum hari pertama penggunaan:
1. **Kas Fisik:** Jumlah uang tunai di laci kasir dan brankas per tanggal cut-off.
2. **Saldo Bank:** Saldo rekening koran BCA, Mandiri, BRI, dll. per tanggal cut-off.
3. **Nilai Persediaan Barang Dagang:** Total nilai rupiah stok barang hasil *Stock Opname* fisik terakhir.
4. **Daftar Saldo Piutang Usaha:** Rincian piutang per pelanggan yang belum tertagih.
5. **Daftar Saldo Utang Usaha:** Rincian utang ke pemasok/distributor yang belum jatuh tempo.
6. **Modal Disetor Pemilik:** Selisih antara Total Aset dikurangi Total Utang pada neraca awal.

---

## 4. PILAR 3: SISI PENGGUNA, HAK AKSES & HARDWARE TOKO

Penerapan prinsip *Segregation of Duties (SoD)* mencegah kebocoran kas dengan membatasi wewenang setiap orang sesuai tugas pokoknya.

### 4.1 Matriks Pembuatan Akun Staf Pertama
Untuk setiap klien yang deal, siapkan kredensial akses berikut:

| Tingkatan User | Email Standar Klien | Peran Sistem | Wewenang Utama |
| :--- | :--- | :--- | :--- |
| **Level 1: Owner** | `owner@tokoklien.com` | `owner` | Akses penuh seluruh modul, Laba Rugi, Neraca, tutup buku, dan manajemen user. |
| **Level 2: Akuntan** | `finance@tokoklien.com`| `accountant` | Perekaman jurnal umum, AJP, rekonsiliasi kas/bank, dan penerbitan laporan keuangan. |
| **Level 3: Kasir** | `kasir1@tokoklien.com` | `cashier` | Pencatatan mutasi kas masuk/keluar dan cetak voucher. **DILARANG** melihat laba rugi. |
| **Level 4: Auditor**| `auditor@tokoklien.com`| `auditor` | Mode *Read-Only* untuk pemeriksaan keabsahan transaksi dan bukti voucher. |

### 4.2 Uji Kelayakan Perangkat Keras (Hardware Checklist)
* **Komputer / Laptop Kasir:** Minimal RAM 4GB, OS Windows 10/11 atau macOS, browser Google Chrome / Microsoft Edge versi terbaru.
* **Printer Kasir / Kantor:** 
  * Printer Thermal 80mm / 58mm untuk struk mutasi cepat.
  * Printer Inkjet / Laserjet / Dot-Matrix ukuran A4/A5 untuk mencetak Bukti Kas Masuk (BKM) dan Bukti Kas Keluar (BKK) resmi.
* **Koneksi Jaringan:** Akses internet stabil (minimal 5 Mbps) untuk sinkronisasi database cloud.

---

## 5. PILAR 4: SISI PELATIHAN STAF & SOP OPERASIONAL

Keberhasilan implementasi ditentukan oleh pemahaman pengguna akhir di lapangan.

### 5.1 Kurikulum Pelatihan Staf (Waktu Efektif: 2 Jam)
1. **Sesi Kasir (Durasi: 30 Menit):**
   * Cara login dan logout yang aman.
   * Alur input Kas Masuk (penjualan tunai & pelunasan piutang).
   * Alur input Kas Keluar (belanja kas kecil & operasional toko).
   * Cara mencetak Bukti Kas dan meminta tanda tangan pihak yang menerima uang.
2. **Sesi Akuntan Toko (Durasi: 45 Menit):**
   * Verifikasi mutasi kasir harian.
   * Input Jurnal Penyesuaian (AJP) dan Jurnal Memorial multi-baris.
   * Membaca dan memverifikasi keseimbangan Neraca Saldo (*Trial Balance*).
   * Rekonsiliasi saldo kas/bank fisik dengan buku besar.
3. **Sesi Pemilik Toko / Owner (Durasi: 30 Menit):**
   * Memantau kesehatan arus kas dari smartphone / tablet.
   * Membaca Laporan Laba Rugi Komprehensif (Gross Margin, HPP, Net Profit).
   * Memeriksa Neraca dan pertumbuhan Ekuitas Toko.

### 5.2 Lembar SOP Harian Kasir (Ditempel di Meja Kasir)
* **Pagi Hari:** Cek uang modal kembalian awal di laci, pastikan printer menyala.
* **Sepanjang Hari:** Setiap ada uang masuk atau keluar, langsung diinput ke SIA Dagang dan dicetak vouchernya detik itu juga.
* **Malam Hari (Closing):**
  1. Cetak Rekap Mutasi Kas Harian dari sistem.
  2. Hitung fisik uang di laci.
  3. Lakukan serah terima fisik uang dan bukti voucher ke Owner / Manajer Toko.
  4. Tandatangani berita acara serah terima kas harian.

---

## 6. PILAR 5: SISI LEGALITAS, KONTRAK KERJA SAMA & KERAHASIAAN DATA

Hubungan bisnis profesional memerlukan landasan hukum tertulis untuk melindungi kedua belah pihak.

### 6.1 Perjanjian Kerja Sama (PKS / Service Agreement)
Dokumen kontrak wajib memuat klausul:
1. **Ruang Lingkup Layanan:** Hak penggunaan lisensi cloud, kuota user, dan fasilitas pemeliharaan server.
2. **Jangka Waktu & Biaya:** Masa aktif langganan (bulanan/tahunan) dan termin pembayaran.
3. **Batasan Tanggung Jawab:** Penyedia software bertanggung jawab atas ketersediaan sistem dan akurasi komputasi, namun tidak bertanggung jawab atas kesalahan input angka (*human error*) oleh staf klien.

### 6.2 Perjanjian Kerahasiaan Data (Non-Disclosure Agreement - NDA)
* **Klausul Kunci:** Penyedia solusi menjamin dengan sanksi hukum bahwa seluruh data finansial, daftar pelanggan, omzet penjualan, dan margin keuntungan klien berstatus **Rahasia Mutlak**.
* Data tidak akan diperjualbelikan, dimanfaatkan untuk keperluan periklanan, atau diungkapkan kepada pihak mana pun tanpa persetujuan tertulis pemilik toko.

### 6.3 Jaminan Kepemilikan Data (Data Ownership Guarantee)
* Data keuangan adalah milik sah Klien 100%.
* Jika di masa depan klien memutuskan untuk tidak memperpanjang langganan, penyedia solusi berkewajiban menyerahkan seluruh basis data historis klien dalam format file terbuka (Excel / CSV / SQL dump) dalam waktu maksimal 7 hari kerja.

---

## 7. PILAR 6: SISI FINANSIAL, BILLING & SKEMA MONETISASI

### 7.1 Pilihan Model Bisnis & Skema Tagihan

| Skema Bisnis | Struktur Harga | Keuntungan bagi Vendor | Keuntungan bagi Klien |
| :--- | :--- | :--- | :--- |
| **Model A: SaaS Subscription Tahunan** *(Direkomendasikan)* | **Rp 2.500.000 – Rp 3.500.000 / tahun** (Termasuk setup perdana dan maintenance 12 bulan). | • Arus kas masuk besar di muka.<br>• Retensi klien terkunci 1 tahun penuh.<br>• Biaya operasional tertutup rapi. | • Biaya tahunan lebih hemat dibanding bulanan.<br>• Kepastian sistem berjalan tanpa terpotong-potong per bulan. |
| **Model B: SaaS Subscription Bulanan** | Setup Fee Rp 500.000 + **Rp 199.000 – Rp 299.000 / bulan**. | Pendapatan berulang bulanan (*Monthly Recurring Revenue*). | Biaya komitmen awal sangat terjangkau bagi toko baru. |
| **Model C: Lisensi Mandiri + Maintenance** | Biaya Pembelian Lisensi **Rp 10.000.000 – Rp 20.000.000** (one-time) + Maintenance 15%/tahun. | Nilai deal sangat besar untuk modal pengembangan awal. | Kepemilikan sistem permanen di server privat toko sendiri. |

### 7.2 Prosedur Penagihan & Pembayaran
1. Terbitkan **Invoice Resmi** dengan nomor seri baku, tanggal jatuh tempo, dan rincian rekening penampungan bisnis Anda.
2. Sediakan metode pembayaran yang mudah (Transfer Bank BCA, Mandiri, atau link QRIS / Virtual Account).
3. Berikan **Tanda Terima Pembayaran Sah (Kuitansi Digital)** setelah pembayaran diverifikasi.
4. Terapkan masa tenggang (*grace period*) 5 hari sebelum pemblokiran akses jika langganan terlambat diperpanjang.

---

## 8. PILAR 7: SISI SUPPORT, MAINTENANCE & CUSTOMER SUCCESS

### 8.1 Kanal Komunikasi Dukungan Resmi
* **Grup WhatsApp Khusus Klien:** Dibuat dengan format `[Support SIA] - Toko [Nama Klien]`.
  * Anggota: Tim Teknis Anda, Pemilik Toko, dan Staf Akuntan.
  * Mempermudah koordinasi cepat tanpa birokrasi tiket yang kaku.
* **Bantuan Jarak Jauh (Remote Desktop):**
  * Sediakan software **AnyDesk** atau **TeamViewer** untuk mendampingi staf klien jika terjadi kendala teknis pada printer atau peramban kasir.

### 8.2 Service Level Agreement (SLA) & Jam Layanan
* **Jam Kerja Standar:** Senin – Sabtu, pukul 08.00 – 18.00 WIB.
* **Waktu Respon Darurat (Severity 1 - Kasir Tidak Bisa Input):** Maksimal 15 menit respon awal.
* **Waktu Respon Konsultasi (Severity 2 - Pertanyaan Pembukuan):** Maksimal 2–4 jam kerja.
* **Jaminan Ketersediaan Sistem (Uptime Guarantee):** 99.5% per bulan.

---

## 9. JADWAL IMPLEMENTASI STANDAR: 7 HARI MENUJU GO-LIVE

Penerapan timeline baku 7 hari memberikan kesan profesional dan menjamin proses migrasi berjalan tertib tanpa mengganggu jalannya toko:

```
┌────────────────────────────────────────────────────────────────────────┐
│               TIMELINE ONBOARDING KLIEN SIA DAGANG (7 HARI)           │
├─────────┬──────────────────────────────────────────────────────────────┤
│ HARI 1  │ Penandatanganan PKS & NDA, Pembayaran Invoice Perdana,       │
│         │ dan Pembuatan Project Database Cloud Dedicated.              │
├─────────┼──────────────────────────────────────────────────────────────┤
│ HARI 2  │ Klien Mengisi Formulir Data Akun Kas/Bank & Rekening Toko.    │
├─────────┼──────────────────────────────────────────────────────────────┤
│ HARI 3  │ Kustomisasi Bagan Akun (COA) dan Pembuatan Akun Staf (Kasir, │
│         │ Akuntan, Owner).                                             │
├─────────┼──────────────────────────────────────────────────────────────┤
│ HARI 4  │ Input Saldo Awal Neraca (Kas, Bank, Persediaan, Utang/Piutang)│
│         │ per Tanggal Cut-Off Migrasi.                                 │
├─────────┼──────────────────────────────────────────────────────────────┤
│ HARI 5  │ Sesi Pelatihan Staf (Kasir, Akuntan, Owner) & Uji Coba Cetak │
│         │ Bukti Voucher BKM/BKK di Printer Toko.                       │
├─────────┼──────────────────────────────────────────────────────────────┤
│ HARI 6  │ Uji Coba Transaksi Paralel (Dry Run) 5–10 Transaksi Simulasi │
│         │ untuk Memastikan Kelancaran Alur Kerja Staf.                 │
├─────────┼──────────────────────────────────────────────────────────────┤
│ HARI 7  │ RESMI GO-LIVE! Toko Mulai Mencatat Seluruh Mutasi Finansial  │
│         │ Secara Real-Time Menggunakan SIA Dagang.                     │
└─────────┴──────────────────────────────────────────────────────────────┘
```

---

## 10. LAMPIRAN: FORMULIR KEBUTUHAN DATA & CHECKLIST SERAH TERIMA

### Lampiran A: Formulir Identitas Klien & Data Rekening Toko
* **Nama Resmi Usaha / Toko:** ________________________________________
* **Nama Pemilik / Direktur:** ________________________________________
* **Alamat Lengkap Toko:** ____________________________________________
* **Nomor WhatsApp Utama:** __________________________________________
* **Subdomain yang Diinginkan:** `https://[________________].siadagang.com`
* **Daftar Rekening Kas & Bank:**
  1. Kasir / Kas Tunai : _____________________________________________
  2. Rekening Bank 1   : Bank: _________ No. Rek: _________ A/N: _________
  3. Rekening Bank 2   : Bank: _________ No. Rek: _________ A/N: _________

### Lampiran B: Berita Acara Serah Terima Sistem (BAST)
*Dengan ini menyatakan bahwa pada hari ini [Hari, Tanggal], Sistem Informasi Akuntansi SIA Dagang telah berhasil diinstalasi, dikonfigurasi, dan diserahterimakan kepada pihak Klien dalam keadaan baik, lengkap dengan akun pengguna aktif dan sesi pelatihan staf.*

* **Pihak Pertama (Penyedia Solusi):** ( Tanda Tangan & Nama Terang )
* **Pihak Kedua (Pemilik Toko / Klien):** ( Tanda Tangan & Nama Terang )

---
*Dokumen ini diterbitkan sebagai panduan resmi tata kelola implementasi klien Sistem Informasi Akuntansi Perusahaan Dagang.*
