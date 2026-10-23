import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { postDoubleEntryJournal } from '../services/journalService';
import { 
  ArrowDownLeft, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Wallet, 
  RefreshCw,
  FileCheck2,
  Calendar,
  Hash,
  FileText
} from 'lucide-react';

export const KasMasuk = () => {
  const { user } = useAuth();

  // State Form
  const [entryNumber, setEntryNumber] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [cashAccountId, setCashAccountId] = useState('');
  const [sourceAccountId, setSourceAccountId] = useState('');
  const [description, setDescription] = useState('');
  const [sourceRef, setSourceRef] = useState('');

  // State Data Master & UI
  const [cashAccounts, setCashAccounts] = useState([]);
  const [sourceAccounts, setSourceAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [successInfo, setSuccessInfo] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Generate nomor BKM otomatis
  const generateBKMNumber = () => {
    const d = new Date();
    const period = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
    const rand = Math.floor(100 + Math.random() * 900);
    return `BKM-${period}-${rand}`;
  };

  useEffect(() => {
    setEntryNumber(generateBKMNumber());
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
        // 1. Akun Kas & Bank (Kas di Tangan, Kas Kecil, Rekening Bank)
        const cashList = data.filter(a => 
          a.code.startsWith('1-10') || 
          a.name.toLowerCase().includes('kas') || 
          a.name.toLowerCase().includes('bank')
        );
        setCashAccounts(cashList);
        if (cashList.length > 0) setCashAccountId(cashList[0].id);

        // 2. Akun Sumber Penerimaan: Pendapatan atau Piutang Dagang
        const sourceList = data.filter(a => 
          a.type === 'REVENUE' || 
          a.code === '1-1101' || 
          a.name.toLowerCase().includes('piutang')
        );
        setSourceAccounts(sourceList);
        if (sourceList.length > 0) setSourceAccountId(sourceList[0].id);
      }
    } catch (err) {
      console.warn('Menggunakan fallback data akun kas masuk:', err.message);
      // Fallback data standar perusahaan dagang jika DB belum terkoneksi
      const defaultCash = [
        { id: '11111111-1111-1111-1111-111111111001', code: '1-1001', name: 'Kas di Tangan (Cash on Hand)' },
        { id: '11111111-1111-1111-1111-111111111002', code: '1-1002', name: 'Kas Kecil (Petty Cash)' },
        { id: '11111111-1111-1111-1111-111111111003', code: '1-1003', name: 'Bank BCA Operasional' },
        { id: '11111111-1111-1111-1111-111111111004', code: '1-1004', name: 'Bank Mandiri Giro' },
      ];
      const defaultSources = [
        { id: '11111111-1111-1111-1111-111111111101', code: '1-1101', name: 'Piutang Dagang (Pelunasan Piutang Pelanggan)' },
        { id: '44444444-4444-4444-4444-444444444001', code: '4-1001', name: 'Pendapatan Penjualan Barang Dagang Tunai' },
        { id: '44444444-4444-4444-4444-444444444002', code: '4-2001', name: 'Pendapatan Ongkos Kirim / Ekspedisi' },
        { id: '44444444-4444-4444-4444-444444444003', code: '4-3001', name: 'Pendapatan Bunga Bank' },
      ];
      setCashAccounts(defaultCash);
      setSourceAccounts(defaultSources);
      setCashAccountId(defaultCash[0].id);
      setSourceAccountId(defaultSources[0].id);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const selectedCashObj = cashAccounts.find(a => a.id === cashAccountId);
  const selectedSourceObj = sourceAccounts.find(a => a.id === sourceAccountId);
  const numericAmount = parseFloat(amount) || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessInfo(null);

    if (numericAmount <= 0) {
      setErrorMessage('Nominal kas masuk harus lebih besar dari Rp 0.');
      return;
    }
    if (!cashAccountId || !sourceAccountId) {
      setErrorMessage('Silakan pilih akun Kas dan akun Sumber penerimaan.');
      return;
    }

    setLoading(true);

    try {
      // ATURAN WAJIB DOUBLE-ENTRY:
      // 1 baris ke journal_entries (Header)
      // 2 baris ke journal_lines (Detail):
      //   - Baris 1: Debit pada Akun Kas / Bank
      //   - Baris 2: Kredit pada Akun Sumber (Pendapatan / Piutang)
      const lines = [
        {
          account_id: cashAccountId,
          debit: numericAmount,
          credit: 0,
          memo: `[Kas Masuk] ${description}`
        },
        {
          account_id: sourceAccountId,
          debit: 0,
          credit: numericAmount,
          memo: `[Sumber Dana] ${description}`
        }
      ];

      const result = await postDoubleEntryJournal({
        entryNumber,
        entryDate,
        description: description || `Penerimaan kas dari ${selectedSourceObj?.name || 'transaksi dagang'}`,
        sourceType: 'CASH_IN',
        sourceRef,
        lines,
        userId: user?.id
      });

      setSuccessInfo({
        entryNumber,
        amount: numericAmount,
        cashName: selectedCashObj?.name,
        sourceName: selectedSourceObj?.name,
        date: entryDate
      });

      // Reset form
      setAmount('');
      setDescription('');
      setSourceRef('');
      setEntryNumber(generateBKMNumber());
    } catch (err) {
      console.error('KasMasuk error:', err);
      setErrorMessage(err.message || 'Gagal menyimpan transaksi Kas Masuk ke Supabase.');
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
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Penerimaan Kas Masuk (Cash Inflow)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Mencatat penerimaan dana dari pelunasan piutang pelanggan atau penjualan barang dagang tunai.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-200 flex items-center gap-1.5 font-mono">
            <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
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
              <span className="font-semibold text-emerald-800"> [Dr] {successInfo.cashName} (Rp {successInfo.amount.toLocaleString('id-ID')})</span> dan 
              <span className="font-semibold text-indigo-800"> [Cr] {successInfo.sourceName} (Rp {successInfo.amount.toLocaleString('id-ID')})</span>.
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
              Nomor Bukti Kas Masuk (BKM)
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
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Baris 2: Rekening Kas (Debit) & Akun Sumber (Kredit) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                Diterima pada Rekening Kas/Bank (Debit)
              </span>
              <span className="text-[10px] text-emerald-700 font-bold uppercase">[Debit]</span>
            </label>
            <select
              required
              disabled={loadingAccounts}
              value={cashAccountId}
              onChange={(e) => setCashAccountId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              {cashAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.code} &bull; {acc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                Akun Sumber Penerimaan (Kredit)
              </span>
              <span className="text-[10px] text-indigo-700 font-bold uppercase">[Kredit]</span>
            </label>
            <select
              required
              disabled={loadingAccounts}
              value={sourceAccountId}
              onChange={(e) => setSourceAccountId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              {sourceAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.code} &bull; {acc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Baris 3: Nominal & Nomor Referensi Faktur */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nominal Penerimaan Kas (Rp)
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
                className="w-full pl-9 pr-3 py-2.5 text-base font-mono font-bold text-emerald-700 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nomor Referensi / No. Faktur Penjualan (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: INV-2026/X/0089 atau Kuitansi #441"
              value={sourceRef}
              onChange={(e) => setSourceRef(e.target.value)}
              className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-lg"
            />
          </div>
        </div>

        {/* Baris 4: Deskripsi Transaksi */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Keterangan / Memo Transaksi
          </label>
          <textarea
            rows={2}
            required
            placeholder="Contoh: Pelunasan piutang atas faktur INV-2026/X/0089 dari Toko Sejahtera Abadi"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Visualisasi Otomatisasi Jurnal Double-Entry */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Simulasi Ayat Jurnal Otomatis (Double-Entry Engine):</span>
            <span className="text-emerald-700 font-semibold">100% Balanced</span>
          </div>

          <div className="space-y-1 font-mono text-xs">
            {/* Baris Debit Kas */}
            <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-100 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">DR</span>
                <span className="font-sans font-semibold text-slate-800">
                  {selectedCashObj ? `${selectedCashObj.code} - ${selectedCashObj.name}` : 'Pilih Akun Kas/Bank'}
                </span>
              </div>
              <span className="font-bold text-emerald-600">
                Rp {numericAmount.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Baris Kredit Sumber */}
            <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-100 shadow-xs pl-6">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">CR</span>
                <span className="font-sans font-semibold text-slate-700">
                  {selectedSourceObj ? `${selectedSourceObj.code} - ${selectedSourceObj.name}` : 'Pilih Akun Sumber'}
                </span>
              </div>
              <span className="font-bold text-indigo-600">
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
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
                <span>Simpan & Posting Kas Masuk</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default KasMasuk;
