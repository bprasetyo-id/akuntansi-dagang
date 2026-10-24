import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { postDoubleEntryJournal } from '../services/journalService';
import { 
  ArrowUpRight, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Wallet, 
  RefreshCw,
  FileCheck2,
  Calendar,
  Hash,
  ShoppingBag
} from 'lucide-react';

export const KasKeluar = () => {
  const { user } = useAuth();

  // State Form
  const [entryNumber, setEntryNumber] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [targetAccountId, setTargetAccountId] = useState('');
  const [cashAccountId, setCashAccountId] = useState('');
  const [description, setDescription] = useState('');
  const [sourceRef, setSourceRef] = useState('');

  // State Data Master & UI
  const [targetAccounts, setTargetAccounts] = useState([]);
  const [cashAccounts, setCashAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [successInfo, setSuccessInfo] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Generate nomor BKK otomatis
  const generateBKKNumber = () => {
    const d = new Date();
    const period = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
    const rand = Math.floor(100 + Math.random() * 900);
    return `BKK-${period}-${rand}`;
  };

  useEffect(() => {
    setEntryNumber(generateBKKNumber());
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('id, code, name, type, sub_category, normal_balance')
        .eq('is_active', true)
        .order('code', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        // 1. Akun Tujuan Pengeluaran: Beban (EXPENSE), Utang (LIABILITY), Pendapatan (REVENUE untuk koreksi/retur), atau Prive
        const targetList = data.filter(a => 
          a.type === 'EXPENSE' || 
          a.type === 'LIABILITY' ||
          a.type === 'REVENUE' ||
          a.code === '3-1002' ||
          a.name.toLowerCase().includes('utang') ||
          a.name.toLowerCase().includes('beban') ||
          a.name.toLowerCase().includes('pendapatan') ||
          a.name.toLowerCase().includes('retur')
        );
        setTargetAccounts(targetList);
        if (targetList.length > 0) setTargetAccountId(targetList[0].id);

        // 2. Akun Kas & Bank Pembayar
        const cashList = data.filter(a => 
          a.code.startsWith('1-10') || 
          a.name.toLowerCase().includes('kas') || 
          a.name.toLowerCase().includes('bank')
        );
        setCashAccounts(cashList);
        if (cashList.length > 0) setCashAccountId(cashList[0].id);
      }
    } catch (err) {
      console.warn('Menggunakan fallback data akun kas keluar:', err.message);
      const defaultTargets = [
        { id: '22222222-2222-2222-2222-222222222001', code: '2-1001', name: 'Utang Usaha / Dagang (Pelunasan Supplier)' },
        { id: '55555555-5555-5555-5555-555555555001', code: '5-2001', name: 'Pembelian Barang Dagang Tunai' },
        { id: '55555555-5555-5555-5555-555555555002', code: '5-2002', name: 'Beban Angkut Pembelian (Freight-In)' },
        { id: '66666666-6666-6666-6666-666666666001', code: '6-1001', name: 'Beban Gaji Karyawan Toko' },
        { id: '66666666-6666-6666-6666-666666666002', code: '6-2002', name: 'Beban Sewa Toko & Gudang' },
        { id: '66666666-6666-6666-6666-666666666003', code: '6-2003', name: 'Beban Listrik, Air, dan Internet' },
        { id: '33333333-3333-3333-3333-333333333002', code: '3-1002', name: 'Prive Pemilik (Pengambilan Pribadi)' },
      ];
      const defaultCash = [
        { id: '11111111-1111-1111-1111-111111111001', code: '1-1001', name: 'Kas di Tangan (Cash on Hand)' },
        { id: '11111111-1111-1111-1111-111111111002', code: '1-1002', name: 'Kas Kecil (Petty Cash)' },
        { id: '11111111-1111-1111-1111-111111111003', code: '1-1003', name: 'Bank BCA Operasional' },
        { id: '11111111-1111-1111-1111-111111111004', code: '1-1004', name: 'Bank Mandiri Giro' },
      ];
      setTargetAccounts(defaultTargets);
      setCashAccounts(defaultCash);
      setTargetAccountId(defaultTargets[0].id);
      setCashAccountId(defaultCash[0].id);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const selectedTargetObj = targetAccounts.find(a => a.id === targetAccountId);
  const selectedCashObj = cashAccounts.find(a => a.id === cashAccountId);
  const numericAmount = parseFloat(amount) || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessInfo(null);

    if (numericAmount <= 0) {
      setErrorMessage('Nominal pengeluaran kas harus lebih besar dari Rp 0.');
      return;
    }
    if (!targetAccountId || !cashAccountId) {
      setErrorMessage('Silakan pilih akun Tujuan dan akun Kas pembayar.');
      return;
    }

    setLoading(true);

    try {
      // ATURAN WAJIB DOUBLE-ENTRY:
      // 1 baris ke journal_entries (Header)
      // 2 baris ke journal_lines (Detail):
      //   - Baris 1: Debit pada Akun Tujuan (Beban / Utang Usaha / Pembelian)
      //   - Baris 2: Kredit pada Akun Kas / Bank Pembayar
      const lines = [
        {
          account_id: targetAccountId,
          debit: numericAmount,
          credit: 0,
          memo: `[Pengeluaran] ${description}`
        },
        {
          account_id: cashAccountId,
          debit: 0,
          credit: numericAmount,
          memo: `[Kas Keluar] ${description}`
        }
      ];

      await postDoubleEntryJournal({
        entryNumber,
        entryDate,
        description: description || `Pengeluaran kas untuk ${selectedTargetObj?.name || 'operasional dagang'}`,
        sourceType: 'CASH_OUT',
        sourceRef,
        lines,
        userId: user?.id
      });

      setSuccessInfo({
        entryNumber,
        amount: numericAmount,
        targetName: selectedTargetObj?.name,
        cashName: selectedCashObj?.name,
        date: entryDate
      });

      // Reset Form
      setAmount('');
      setDescription('');
      setSourceRef('');
      setEntryNumber(generateBKKNumber());
    } catch (err) {
      console.error('KasKeluar error:', err);
      setErrorMessage(err.message || 'Gagal menyimpan transaksi Kas Keluar ke Supabase.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-50 text-rose-700 rounded-lg">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Pengeluaran Kas Keluar (Cash Outflow)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan pembayaran utang dagang supplier, pembelian barang tunai, atau beban operasional.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-rose-50 text-rose-800 text-xs font-semibold rounded-lg border border-rose-200 flex items-center gap-1.5 font-mono">
            <FileCheck2 className="w-3.5 h-3.5 text-rose-600" />
            Auto Double-Entry
          </span>
          <button
            type="button"
            onClick={fetchAccounts}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
            title="Muat Ulang Akun"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Alert Error */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Gagal Menyimpan Transaksi</div>
            <div>{errorMessage}</div>
          </div>
        </div>
      )}

      {/* Alert Sukses */}
      {successInfo && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-sm">
              Transaksi {successInfo.entryNumber} Berhasil Dibukukan!
            </div>
            <p className="text-slate-600">
              Jurnal double-entry seimbang telah terposting otomatis: 
              <span className="font-semibold text-rose-800"> [Dr] {successInfo.targetName} (Rp {successInfo.amount.toLocaleString('id-ID')})</span> dan 
              <span className="font-semibold text-slate-800"> [Cr] {successInfo.cashName} (Rp {successInfo.amount.toLocaleString('id-ID')})</span>.
            </p>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        
        {/* Baris 1: No Bukti & Tanggal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-slate-400" />
              Nomor Bukti Kas Keluar (BKK)
            </label>
            <input
              type="text"
              required
              value={entryNumber}
              onChange={(e) => setEntryNumber(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 font-mono font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Tanggal Transaksi
            </label>
            <input
              type="date"
              required
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
            />
          </div>
        </div>

        {/* Baris 2: Akun Tujuan (Debit) & Rekening Kas Pembayar (Kredit) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-rose-600" />
                Akun Tujuan Pengeluaran (Beban / Utang / Koreksi)
              </span>
              <span className="text-[10px] text-rose-700 font-bold uppercase">[Debit]</span>
            </label>
            <select
              required
              disabled={loadingAccounts}
              value={targetAccountId}
              onChange={(e) => setTargetAccountId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-rose-500 font-medium"
            >
              {targetAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.code} &bull; {acc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-slate-600" />
                Sumber Kas / Bank Pembayar (Kredit)
              </span>
              <span className="text-[10px] text-slate-700 font-bold uppercase">[Kredit]</span>
            </label>
            <select
              required
              disabled={loadingAccounts}
              value={cashAccountId}
              onChange={(e) => setCashAccountId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-slate-500 font-medium"
            >
              {cashAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.code} &bull; {acc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Baris 3: Nominal & No Nota Supplier */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nominal Pengeluaran Kas (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
              <input
                type="number"
                step="any"
                min="1"
                required
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-base font-mono font-bold text-rose-700 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nomor Kuitansi / Faktur Pembelian (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: NOTA-DIST/882 atau KUITANSI-092"
              value={sourceRef}
              onChange={(e) => setSourceRef(e.target.value)}
              className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-lg"
            />
          </div>
        </div>

        {/* Baris 4: Deskripsi Transaksi */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Keterangan / Memo Pengeluaran
          </label>
          <textarea
            rows={2}
            required
            placeholder="Contoh: Pelunasan utang pembelian kain grosir kepada PT Tekstil Prima"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
          />
        </div>

        {/* Visualisasi Otomatisasi Jurnal Double-Entry */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Simulasi Ayat Jurnal Otomatis (Double-Entry Engine):</span>
            <span className="text-emerald-700 font-semibold">100% Balanced</span>
          </div>

          <div className="space-y-1 font-mono text-xs">
            {/* Baris Debit Tujuan */}
            <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-100 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">DR</span>
                <span className="font-sans font-semibold text-slate-800">
                  {selectedTargetObj ? `${selectedTargetObj.code} - ${selectedTargetObj.name}` : 'Pilih Akun Tujuan'}
                </span>
              </div>
              <span className="font-bold text-rose-600">
                Rp {numericAmount.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Baris Kredit Kas */}
            <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-100 shadow-xs pl-6">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800">CR</span>
                <span className="font-sans font-semibold text-slate-700">
                  {selectedCashObj ? `${selectedCashObj.code} - ${selectedCashObj.name}` : 'Pilih Akun Kas/Bank'}
                </span>
              </div>
              <span className="font-bold text-slate-800">
                Rp {numericAmount.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading || numericAmount <= 0}
            className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Menyimpan & Memposting Jurnal...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan & Posting Kas Keluar</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default KasKeluar;
