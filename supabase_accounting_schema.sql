-- ============================================================================
-- SKRIP SQL SISTEM AKUNTANSI PERUSAHAAN DAGANG (SUPABASE POSTGRESQL)
-- Arsitektur: Double-Entry Bookkeeping Engine & Row Level Security (RLS)
-- Disusun oleh: Database Administrator & Software Architect
-- ============================================================================

-- 0. AKTIFKAN EKSTENSI POSTGRESQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. TABEL PROFILES (Terhubung dengan auth.users)
-- ============================================================================
-- Menyimpan metadata profil pengguna dan peran sistem (RBAC)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'accountant' CHECK (role IN ('owner', 'accountant', 'cashier', 'auditor')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index untuk mempercepat pencarian profil berdasarkan role
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Komentar dokumentasi tabel
COMMENT ON TABLE public.profiles IS 'Tabel profil pengguna yang tersinkronisasi langsung dengan auth.users Supabase.';

-- Trigger otomatis membuat profile ketika user baru mendaftar di Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'accountant')
    )
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================================
-- 2. TABEL ACCOUNTS (Bagan Akun / Chart of Accounts)
-- ============================================================================
-- Menyimpan master rekening/akun dengan kode, nama, tipe, dan saldo normal
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
    normal_balance VARCHAR(10) NOT NULL CHECK (normal_balance IN ('DEBIT', 'CREDIT')),
    sub_category VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index untuk optimasi query filter COA berdasarkan tipe & kode
CREATE INDEX IF NOT EXISTS idx_accounts_type ON public.accounts(type);
CREATE INDEX IF NOT EXISTS idx_accounts_code ON public.accounts(code);
CREATE INDEX IF NOT EXISTS idx_accounts_active ON public.accounts(is_active);

COMMENT ON TABLE public.accounts IS 'Master Bagan Akun (Chart of Accounts) standar akuntansi perusahaan dagang.';


-- ============================================================================
-- 3. TABEL JOURNAL_ENTRIES (Header Transaksi Jurnal)
-- ============================================================================
-- Menyimpan informasi utama transaksi: nomor bukti, tanggal, deskripsi, & status
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_number VARCHAR(50) UNIQUE NOT NULL,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT NOT NULL,
    source_type VARCHAR(30) NOT NULL DEFAULT 'MANUAL' 
        CHECK (source_type IN ('CASH_IN', 'CASH_OUT', 'MANUAL', 'PURCHASE', 'SALES', 'ADJUSTMENT', 'CLOSING')),
    source_ref VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'POSTED' 
        CHECK (status IN ('DRAFT', 'POSTED', 'VOID')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    posted_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index untuk performa pencarian jurnal berdasarkan tanggal dan status
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON public.journal_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_journal_entries_status ON public.journal_entries(status);
CREATE INDEX IF NOT EXISTS idx_journal_entries_source ON public.journal_entries(source_type);

COMMENT ON TABLE public.journal_entries IS 'Header transaksi jurnal umum, kas masuk, kas keluar, dan penyesuaian.';


-- ============================================================================
-- 4. TABEL JOURNAL_LINES (Detail Transaksi Jurnal / Double-Entry Lines)
-- ============================================================================
-- Menyimpan baris-baris debit dan kredit yang merujuk ke tabel header
CREATE TABLE IF NOT EXISTS public.journal_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
    debit NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (debit >= 0),
    credit NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (credit >= 0),
    memo TEXT,
    line_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    -- Baris jurnal hanya boleh berisi salah satu: Debit > 0 ATAU Kredit > 0
    CONSTRAINT chk_debit_xor_credit CHECK (
        (debit > 0 AND credit = 0) OR 
        (credit > 0 AND debit = 0)
    )
);

-- Index penting untuk agregasi Buku Besar & Laporan Finansial
CREATE INDEX IF NOT EXISTS idx_journal_lines_journal_id ON public.journal_lines(journal_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_account_id ON public.journal_lines(account_id);

COMMENT ON TABLE public.journal_lines IS 'Detail ayat jurnal double-entry: akun, mutasi debet, dan mutasi kredit.';


-- ============================================================================
-- 5. TRIGGER INTEGRITAS DOUBLE-ENTRY: VALIDASI BALANCE DEBIT = KREDIT
-- ============================================================================
-- Memastikan jurnal dengan status 'POSTED' mutlak seimbang dan minimal 2 baris
CREATE OR REPLACE FUNCTION public.fn_validate_journal_balance()
RETURNS TRIGGER AS $$
DECLARE
    v_total_debit NUMERIC(15, 2);
    v_total_credit NUMERIC(15, 2);
    v_line_count INT;
BEGIN
    IF NEW.status = 'POSTED' THEN
        SELECT 
            COALESCE(SUM(debit), 0), 
            COALESCE(SUM(credit), 0),
            COUNT(*)
        INTO 
            v_total_debit, 
            v_total_credit,
            v_line_count
        FROM public.journal_lines
        WHERE journal_id = NEW.id;

        -- Validasi jumlah baris minimal
        IF v_line_count < 2 THEN
            RAISE EXCEPTION 'Gagal memposting: Jurnal harus memiliki minimal 2 baris (1 Debit dan 1 Kredit).';
        END IF;

        -- Validasi perimbangan nilai nominal
        IF v_total_debit <> v_total_credit THEN
            RAISE EXCEPTION 'Gagal memposting: Jurnal TIDAK SEIMBANG! Total Debit (%) != Total Kredit (%). Selisih: %',
                v_total_debit, v_total_credit, ABS(v_total_debit - v_total_credit);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Constraint Trigger dievaluasi di akhir transaksi (DEFERRED)
DROP TRIGGER IF EXISTS trg_validate_journal_balance ON public.journal_entries;
CREATE CONSTRAINT TRIGGER trg_validate_journal_balance
AFTER INSERT OR UPDATE ON public.journal_entries
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION public.fn_validate_journal_balance();


-- ============================================================================
-- 6. STORED PROCEDURE / RPC: POSTING JURNAL ATOMIK (HEADER + DETAIL)
-- ============================================================================
-- Memudahkan sisi klien (React) mengirimkan header dan multi-lines dalam 1 request
CREATE OR REPLACE FUNCTION public.create_complete_journal_entry(
    p_entry_number VARCHAR,
    p_entry_date DATE,
    p_description TEXT,
    p_source_type VARCHAR,
    p_source_ref VARCHAR,
    p_lines JSONB
)
RETURNS UUID AS $$
DECLARE
    v_journal_id UUID;
    v_line RECORD;
    v_order INT := 1;
BEGIN
    -- 1. Insert Header
    INSERT INTO public.journal_entries (
        entry_number,
        entry_date,
        description,
        source_type,
        source_ref,
        status,
        created_by,
        posted_at
    ) VALUES (
        p_entry_number,
        COALESCE(p_entry_date, CURRENT_DATE),
        p_description,
        COALESCE(p_source_type, 'MANUAL'),
        p_source_ref,
        'POSTED',
        auth.uid(),
        timezone('utc'::text, now())
    )
    RETURNING id INTO v_journal_id;

    -- 2. Insert Lines dari array JSONB
    FOR v_line IN SELECT * FROM jsonb_to_recordset(p_lines) AS x(
        account_id UUID,
        debit NUMERIC,
        credit NUMERIC,
        memo TEXT
    )
    LOOP
        INSERT INTO public.journal_lines (
            journal_id,
            account_id,
            debit,
            credit,
            memo,
            line_order
        ) VALUES (
            v_journal_id,
            v_line.account_id,
            COALESCE(v_line.debit, 0),
            COALESCE(v_line.credit, 0),
            v_line.memo,
            v_order
        );
        v_order := v_order + 1;
    END LOOP;

    -- Kembalikan ID jurnal yang berhasil dibuat
    RETURN v_journal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- 7. KEBIJAKAN ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Mengamankan seluruh tabel dari akses tanpa autentikasi atau manipulasi ilegal

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_lines ENABLE ROW LEVEL SECURITY;

-- Helper Function: Mendapatkan role pengguna saat ini
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- --- A. Kebijakan RLS Tabel PROFILES ---
CREATE POLICY "Profiles dapat dibaca oleh pengguna terautentikasi"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Pengguna dapat mengupdate profil miliknya sendiri"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- --- B. Kebijakan RLS Tabel ACCOUNTS ---
CREATE POLICY "Bagan akun dapat dibaca oleh semua pengguna terautentikasi"
    ON public.accounts FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Hanya Owner dan Accountant yang dapat mengelola bagan akun"
    ON public.accounts FOR ALL
    TO authenticated
    USING (public.current_user_role() IN ('owner', 'accountant'))
    WITH CHECK (public.current_user_role() IN ('owner', 'accountant'));

-- --- C. Kebijakan RLS Tabel JOURNAL_ENTRIES ---
CREATE POLICY "Jurnal dapat dibaca oleh semua pengguna terautentikasi"
    ON public.journal_entries FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Owner, Accountant, dan Cashier dapat membuat jurnal"
    ON public.journal_entries FOR INSERT
    TO authenticated
    WITH CHECK (public.current_user_role() IN ('owner', 'accountant', 'cashier'));

CREATE POLICY "Hanya Owner dan Accountant yang dapat memperbarui jurnal"
    ON public.journal_entries FOR UPDATE
    TO authenticated
    USING (public.current_user_role() IN ('owner', 'accountant'))
    WITH CHECK (public.current_user_role() IN ('owner', 'accountant'));

CREATE POLICY "Hanya Owner yang dapat menghapus jurnal draft"
    ON public.journal_entries FOR DELETE
    TO authenticated
    USING (public.current_user_role() = 'owner' AND status = 'DRAFT');

-- --- D. Kebijakan RLS Tabel JOURNAL_LINES ---
CREATE POLICY "Baris jurnal dapat dibaca oleh pengguna terautentikasi"
    ON public.journal_lines FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Kelola baris jurnal mengikuti hak akses jurnal header"
    ON public.journal_lines FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.journal_entries e
            WHERE e.id = journal_lines.journal_id
            AND public.current_user_role() IN ('owner', 'accountant', 'cashier')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.journal_entries e
            WHERE e.id = journal_lines.journal_id
            AND public.current_user_role() IN ('owner', 'accountant', 'cashier')
        )
    );


-- ============================================================================
-- 8. SKRIP INSERT DATA AWAL (SEEDER) BAGAN AKUN PERUSAHAAN DAGANG
-- ============================================================================
-- Standar Chart of Accounts lengkap untuk operasional perusahaan dagang
INSERT INTO public.accounts (code, name, type, normal_balance, sub_category) VALUES
-- 1. ASET (ASSETS)
('1-1001', 'Kas di Tangan (Cash on Hand)', 'ASSET', 'DEBIT', 'CURRENT_ASSET'),
('1-1002', 'Kas Kecil (Petty Cash)', 'ASSET', 'DEBIT', 'CURRENT_ASSET'),
('1-1003', 'Bank BCA Operasional', 'ASSET', 'DEBIT', 'CURRENT_ASSET'),
('1-1004', 'Bank Mandiri Giro', 'ASSET', 'DEBIT', 'CURRENT_ASSET'),
('1-1101', 'Piutang Dagang (Accounts Receivable)', 'ASSET', 'DEBIT', 'CURRENT_ASSET'),
('1-1102', 'Cadangan Kerugian Piutang', 'ASSET', 'CREDIT', 'CURRENT_ASSET'), -- Akun Kontra Aset
('1-1201', 'Persediaan Barang Dagang (Merchandise Inventory)', 'ASSET', 'DEBIT', 'CURRENT_ASSET'),
('1-1301', 'Perlengkapan Toko (Store Supplies)', 'ASSET', 'DEBIT', 'CURRENT_ASSET'),
('1-1302', 'Perlengkapan Kantor (Office Supplies)', 'ASSET', 'DEBIT', 'CURRENT_ASSET'),
('1-1401', 'Sewa Dibayar di Muka (Prepaid Rent)', 'ASSET', 'DEBIT', 'CURRENT_ASSET'),
('1-1402', 'Asuransi Dibayar di Muka (Prepaid Insurance)', 'ASSET', 'DEBIT', 'CURRENT_ASSET'),
('1-2001', 'Peralatan Toko & Gudang (Store Equipment)', 'ASSET', 'DEBIT', 'FIXED_ASSET'),
('1-2002', 'Akumulasi Penyusutan Peralatan Toko', 'ASSET', 'CREDIT', 'FIXED_ASSET'), -- Akun Kontra Aset
('1-2101', 'Kendaraan Operasional (Vehicles)', 'ASSET', 'DEBIT', 'FIXED_ASSET'),
('1-2102', 'Akumulasi Penyusutan Kendaraan', 'ASSET', 'CREDIT', 'FIXED_ASSET'), -- Akun Kontra Aset
('1-2201', 'Bangunan Toko & Kantor (Building)', 'ASSET', 'DEBIT', 'FIXED_ASSET'),
('1-2202', 'Akumulasi Penyusutan Bangunan', 'ASSET', 'CREDIT', 'FIXED_ASSET'), -- Akun Kontra Aset
('1-2301', 'Tanah (Land)', 'ASSET', 'DEBIT', 'FIXED_ASSET'),

-- 2. LIABILITAS (LIABILITIES)
('2-1001', 'Utang Usaha / Dagang (Accounts Payable)', 'LIABILITY', 'CREDIT', 'CURRENT_LIABILITY'),
('2-1002', 'Beban yang Masih Harus Dibayar (Accrued Expenses)', 'LIABILITY', 'CREDIT', 'CURRENT_LIABILITY'),
('2-1003', 'Utang Gaji Karyawan (Salaries Payable)', 'LIABILITY', 'CREDIT', 'CURRENT_LIABILITY'),
('2-1004', 'Utang Pajak (PPN / PPh Payable)', 'LIABILITY', 'CREDIT', 'CURRENT_LIABILITY'),
('2-1005', 'Pendapatan Diterima di Muka (Unearned Revenue)', 'LIABILITY', 'CREDIT', 'CURRENT_LIABILITY'),
('2-2001', 'Utang Bank Jangka Panjang (Long-Term Loans)', 'LIABILITY', 'CREDIT', 'LONG_TERM_LIABILITY'),

-- 3. EKUITAS (EQUITY)
('3-1001', 'Modal Disetor Pemilik (Owner Capital)', 'EQUITY', 'CREDIT', 'OWNERS_EQUITY'),
('3-1002', 'Prive Pemilik (Owner Drawings)', 'EQUITY', 'DEBIT', 'OWNERS_EQUITY'), -- Akun Kontra Ekuitas
('3-2001', 'Laba Ditahan (Retained Earnings)', 'EQUITY', 'CREDIT', 'RETAINED_EARNINGS'),
('3-3001', 'Ikhtisar Laba Rugi (Income Summary)', 'EQUITY', 'CREDIT', 'INCOME_SUMMARY'),

-- 4. PENDAPATAN (REVENUE)
('4-1001', 'Pendapatan Penjualan Barang Dagang (Sales)', 'REVENUE', 'CREDIT', 'OPERATING_REVENUE'),
('4-1002', 'Retur Penjualan (Sales Returns & Allowances)', 'REVENUE', 'DEBIT', 'SALES_CONTRA'), -- Akun Kontra Penjualan
('4-1003', 'Potongan Penjualan (Sales Discounts)', 'REVENUE', 'DEBIT', 'SALES_CONTRA'), -- Akun Kontra Penjualan
('4-2001', 'Pendapatan Ongkos Kirim / Handling', 'REVENUE', 'CREDIT', 'OPERATING_REVENUE'),
('4-3001', 'Pendapatan Bunga Bank (Interest Income)', 'REVENUE', 'CREDIT', 'NON_OPERATING_REVENUE'),
('4-3002', 'Pendapatan Lain-Lain (Other Income)', 'REVENUE', 'CREDIT', 'NON_OPERATING_REVENUE'),

-- 5. BEBAN POKOK PENJUALAN (HPP / COST OF GOODS SOLD)
('5-1001', 'Beban Pokok Penjualan (HPP)', 'EXPENSE', 'DEBIT', 'COST_OF_GOODS_SOLD'),
('5-2001', 'Pembelian Barang Dagang (Purchases)', 'EXPENSE', 'DEBIT', 'COST_OF_GOODS_SOLD'),
('5-2002', 'Beban Angkut Pembelian (Freight-In)', 'EXPENSE', 'DEBIT', 'COST_OF_GOODS_SOLD'),
('5-2003', 'Retur Pembelian (Purchase Returns)', 'EXPENSE', 'CREDIT', 'PURCHASE_CONTRA'), -- Akun Kontra Pembelian
('5-2004', 'Potongan Pembelian (Purchase Discounts)', 'EXPENSE', 'CREDIT', 'PURCHASE_CONTRA'), -- Akun Kontra Pembelian

-- 6. BEBAN OPERASIONAL (OPERATING EXPENSES)
('6-1001', 'Beban Gaji Karyawan Toko & Sales', 'EXPENSE', 'DEBIT', 'OPERATING_EXPENSE'),
('6-1002', 'Beban Komisi Penjualan', 'EXPENSE', 'DEBIT', 'OPERATING_EXPENSE'),
('6-1003', 'Beban Iklan & Promosi (Advertising)', 'EXPENSE', 'DEBIT', 'OPERATING_EXPENSE'),
('6-1004', 'Beban Pengiriman Penjualan (Freight-Out)', 'EXPENSE', 'DEBIT', 'OPERATING_EXPENSE'),
('6-2001', 'Beban Gaji Staf Administrasi & Kantor', 'EXPENSE', 'DEBIT', 'OPERATING_EXPENSE'),
('6-2002', 'Beban Sewa Toko & Gudang', 'EXPENSE', 'DEBIT', 'OPERATING_EXPENSE'),
('6-2003', 'Beban Listrik, Air, dan Internet', 'EXPENSE', 'DEBIT', 'OPERATING_EXPENSE'),
('6-2004', 'Beban Perlengkapan Toko', 'EXPENSE', 'DEBIT', 'OPERATING_EXPENSE'),
('6-2005', 'Beban Perlengkapan Kantor', 'EXPENSE', 'DEBIT', 'OPERATING_EXPENSE'),
('6-2006', 'Beban Penyusutan Peralatan Toko', 'EXPENSE', 'DEBIT', 'OPERATING_EXPENSE'),
('6-2007', 'Beban Penyusutan Kendaraan', 'EXPENSE', 'DEBIT', 'OPERATING_EXPENSE'),
('6-2008', 'Beban Penyusutan Bangunan', 'EXPENSE', 'DEBIT', 'OPERATING_EXPENSE'),
('6-2009', 'Beban Pemeliharaan & Perbaikan Toko', 'EXPENSE', 'DEBIT', 'OPERATING_EXPENSE'),
('6-2010', 'Beban Asuransi Operasional', 'EXPENSE', 'DEBIT', 'OPERATING_EXPENSE'),
('6-2011', 'Beban Administrasi Bank', 'EXPENSE', 'DEBIT', 'OPERATING_EXPENSE'),
('6-3001', 'Beban Bunga Pinjaman Bank', 'EXPENSE', 'DEBIT', 'NON_OPERATING_EXPENSE'),
('6-3002', 'Beban Lain-Lain', 'EXPENSE', 'DEBIT', 'NON_OPERATING_EXPENSE')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- SELESAI. SKRIP SIAP DIJALANKAN DI SUPABASE SQL EDITOR
-- ============================================================================
