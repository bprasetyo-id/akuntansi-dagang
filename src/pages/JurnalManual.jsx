import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { postDoubleEntryJournal } from '../services/journalService';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Hash, 
  Calendar,
  Layers,
  Scale,
  Info
} from 'lucide-react';

export const JurnalManual = () => {
  const { user } = useAuth();

  // State Header
  const [entryNumber, setEntryNumber] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [sourceType, setSourceType] = useState('MANUAL');
  const [sourceRef, setSourceRef] = useState('');

  // State Detail Lines (Minimal 2 baris awal)
  const [lines, setLines] = useState([
    { account_id: '', debit: '', credit: '', memo: '' },
    { account_id: '', debit: '', credit: '', memo: '' }
  ]);

  // Master Data & Status UI
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [successInfo, setSuccessInfo] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Generate nomor Jurnal Umum otomatis
  const generateJUNumber = () => {
    const d = new Date();
    const period = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
    const rand = Math.floor(100 + Math.random() * 900);
    return `JU-${period}-${rand}`;
  };

  useEffect(() => {
    setEntryNumber(generateJUNumber());
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('id, code, name, type, normal_balance')
        .eq('is_active', true)
        .order('code', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setAccounts(data);
        // Set akun default baris 1 dan baris 2
        setLines([
          { account_id: data[0].id, debit: '', credit: '', memo: '' },
          { account_id: data[1]?.id || data[0].id, debit: '', credit: '', memo: '' }
        ]);
      }
    } catch (err) {
      console.warn('Gagal memuat akun dari Supabase, menggunakan data fallback:', err.message);
      const fallbackAccounts = [
        { id: '11111111-1111-1111-1111-111111111001', code: '1-1001', name: 'Kas di Tangan' },
        { id: '11111111-1111-1111-1111-111111111003', code: '1-1003', name: 'Bank BCA Operasional' },
        { id: '11111111-1111-1111-1111-111111111101', code: '1-1101', name: 'Piutang Dagang' },
        { id: '11111111-1111-1111-1111-111111111201', code: '1-1201', name: 'Persediaan Barang Dagang' },
        { id: '22222222-2222-2222-2222-222222222001', code: '2-1001', name: 'Utang Usaha / Dagang' },
        { id: '33333333-3333-3333-3333-333333333001', code: '3-1001', name: 'Modal Disetor Pemilik' },
        { id: '44444444-4444-4444-4444-444444444001', code: '4-1001', name: 'Pendapatan Penjualan Barang' },
        { id: '55555555-5555-5555-5555-555555555001', code: '5-1001', name: 'Beban Pokok Penjualan (HPP)' },
        { id: '66666666-6666-6666-6666-666666666001', code: '6-1001', name: 'Beban Gaji Karyawan Toko' },
      ];
      setAccounts(fallbackAccounts);
      setLines([
        { account_id: fallbackAccounts[0].id, debit: '', credit: '', memo: '' },
        { account_id: fallbackAccounts[1].id, debit: '', credit: '', memo: '' }
      ]);
    } finally {
      setLoadingAccounts(false);
    }
  };

  // Kalkulasi Realtime Total Debit, Kredit, dan Selisih
  const totalDebit = lines.reduce((acc, curr) => acc + (parseFloat(curr.debit) || 0), 0);
  const totalCredit = lines.reduce((acc, curr) => acc + (parseFloat(curr.credit) || 0), 0);
  const difference = Math.abs(totalDebit - totalCredit);
  const hasValues = totalDebit > 0 || totalCredit > 0;
  
  // Validasi Ketat Keseimbangan
  const isBalanced = difference < 0.001 && totalDebit > 0 && lines.length >= 2;

  // Handle perubahan baris dengan aturan saling hapus Debit XOR Credit
  const handleLineChange = (index, field, value) => {
    const newLines = [...lines];
    newLines[index][field] = value;

    if (field === 'debit' && parseFloat(value) > 0) {
      newLines[index]['credit'] = '';
    } else if (field === 'credit' && parseFloat(value) > 0) {
      newLines[index]['debit'] = '';
    }

    setLines(newLines);
  };

  const addLine = () => {
    const defaultAccId = accounts.length > 0 ? accounts[0].id : '';
    setLines([...lines, { account_id: defaultAccId, debit: '', credit: '', memo: '' }]);
  };

  const removeLine = (index) => {
    if (lines.length <= 2) {
      alert('Ayat jurnal double-entry minimal harus memiliki 2 baris!');
      return;
    }
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessInfo(null);

    // Validasi penegakan di level kode
    if (!isBalanced) {
      setErrorMessage(`Jurnal belum seimbang! Total Debit (Rp ${totalDebit.toLocaleString('id-ID')}) != Total Kredit (Rp ${totalCredit.toLocaleString('id-ID')}).`);
      return;
    }

    // Periksa apakah ada akun kosong
    const hasEmptyAccount = lines.some(l => !l.account_id);
    if (hasEmptyAccount) {
      setErrorMessage('Setiap baris jurnal wajib memiliki akun yang valid.');
      return;
    }

    // Periksa apakah ada baris yang debit dan kreditnya sama-sama nol
    const hasZeroAmount = lines.some(l => (parseFloat(l.debit) || 0) === 0 && (parseFloat(l.credit) || 0) === 0);
    if (hasZeroAmount) {
      setErrorMessage('Setiap baris jurnal harus memiliki nominal Debit atau Kredit yang lebih besar dari 0.');
      return;
    }

    setLoading(true);

    try {
      const payloadLines = lines.map(l => ({
        account_id: l.account_id,
        debit: parseFloat(l.debit) || 0,
        credit: parseFloat(l.credit) || 0,
        memo: l.memo || description
      }));

      await postDoubleEntryJournal({
        entryNumber,
        entryDate,
        description: description || 'Ayat jurnal umum / memorial',
        sourceType,
        sourceRef,
        lines: payloadLines,
        userId: user?.id
      });

      setSuccessInfo({
        entryNumber,
        totalBalanced: totalDebit,
        lineCount: lines.length,
        date: entryDate
      });

      // Reset Form
      setDescription('');
      setSourceRef('');
      setEntryNumber(generateJUNumber());
      setLines([
        { account_id: accounts[0]?.id || '', debit: '', credit: '', memo: '' },
        { account_id: accounts[1]?.id || accounts[0]?.id || '', debit: '', credit: '', memo: '' }
      ]);
    } catch (err) {
      console.error('JurnalManual error:', err);
      setErrorMessage(err.message || 'Gagal memposting jurnal ke Supabase.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Entri Jurnal Umum (Memorial Journal)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Form dinamis multi-baris untuk jurnal penyesuaian (AJP), transaksi memorial, dan penutup dengan verifikasi keseimbangan ketat.
          </p>
        </div>

        {/* Live Balance Status Badge */}
        <div className="flex items-center gap-2">
          <div className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
            !hasValues
              ? 'bg-slate-100 text-slate-700 border-slate-300'
              : isBalanced
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-sm'
                : 'bg-rose-50 text-rose-800 border-rose-300 animate-pulse'
          }`}>
            {!hasValues ? (
              <>
                <Info className="w-4 h-4 text-slate-500 shrink-0" />
                <span>MENUNGGU INPUT NOMINAL</span>
              </>
            ) : isBalanced ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>✓ SEIMBANG (DEBIT = KREDIT)</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>✕ BELUM SEIMBANG (SELISIH: Rp {difference.toLocaleString('id-ID')})</span>
              </>
            )}
          </div>
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
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Validasi Jurnal Gagal</div>
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
              Jurnal {successInfo.entryNumber} Berhasil Diposting!
            </div>
            <p className="text-slate-600">
              Transaksi tersimpan dengan 1 baris header di <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono">journal_entries</code> dan {successInfo.lineCount} baris detail di <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono">journal_lines</code>. 
              Total Nominal Seimbang: <span className="font-bold text-emerald-800">Rp {successInfo.totalBalanced.toLocaleString('id-ID')}</span>.
            </p>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        
        {/* Header Transaksi */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-slate-400" />
              Nomor Jurnal
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              Klasifikasi Jurnal
            </label>
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="MANUAL">Jurnal Umum / Memorial</option>
              <option value="ADJUSTMENT">Jurnal Penyesuaian (AJP)</option>
              <option value="CLOSING">Jurnal Penutup (Closing)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              No. Bukti / Referensi
            </label>
            <input
              type="text"
              placeholder="Contoh: BUKTI-MEMO/11"
              value={sourceRef}
              onChange={(e) => setSourceRef(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Keterangan / Deskripsi Transaksi
          </label>
          <input
            type="text"
            required
            placeholder="Contoh: Penyesuaian persediaan barang dagang fisik akhir periode & penyusutan peralatan"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Tabel Baris Jurnal Dinamis */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex justify-between items-center text-xs">
            <span className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-indigo-600" />
              Baris Detail Double-Entry (Minimal 2 Baris)
            </span>
            <span className="text-slate-500 font-medium">
              Jumlah Baris: <span className="font-bold text-slate-800">{lines.length}</span>
            </span>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/75 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3 w-64">Akun Rekening</th>
                <th className="p-3">Memo / Catatan Baris</th>
                <th className="p-3 w-40 text-right">Debit (Rp)</th>
                <th className="p-3 w-40 text-right">Kredit (Rp)</th>
                <th className="p-3 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lines.map((line, index) => (
                <tr key={index} className="hover:bg-slate-50/70 transition">
                  {/* Pilihan Akun */}
                  <td className="p-2">
                    <select
                      required
                      value={line.account_id}
                      onChange={(e) => handleLineChange(index, 'account_id', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="" disabled>-- Pilih Akun --</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.code} - {acc.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Memo Baris */}
                  <td className="p-2">
                    <input
                      type="text"
                      placeholder="Catatan baris (opsional)"
                      value={line.memo}
                      onChange={(e) => handleLineChange(index, 'memo', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                  </td>

                  {/* Input Debit */}
                  <td className="p-2">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0"
                      value={line.debit}
                      onChange={(e) => handleLineChange(index, 'debit', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono text-right text-indigo-700 font-bold focus:ring-2 focus:ring-indigo-500"
                    />
                  </td>

                  {/* Input Kredit */}
                  <td className="p-2">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0"
                      value={line.credit}
                      onChange={(e) => handleLineChange(index, 'credit', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono text-right text-indigo-700 font-bold focus:ring-2 focus:ring-indigo-500"
                    />
                  </td>

                  {/* Tombol Hapus Baris */}
                  <td className="p-2 text-center">
                    {lines.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeLine(index)}
                        className="text-rose-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                        title="Hapus baris ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Footer Keseimbangan */}
            <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-200 text-xs">
              <tr>
                <td colSpan={2} className="p-3 text-right text-slate-700 font-sans">
                  Total Nilai Keseimbangan:
                </td>
                <td className="p-3 text-right font-mono text-indigo-700 text-sm">
                  Rp {totalDebit.toLocaleString('id-ID')}
                </td>
                <td className="p-3 text-right font-mono text-indigo-700 text-sm">
                  Rp {totalCredit.toLocaleString('id-ID')}
                </td>
                <td></td>
              </tr>
              {/* Notifikasi Selisih Jika Ada Ketidakseimbangan Riil */}
              {hasValues && difference >= 0.001 && (
                <tr className="bg-rose-50/60 text-rose-700">
                  <td colSpan={2} className="p-2.5 text-right font-sans text-xs">
                    Selisih Tidak Seimbang:
                  </td>
                  <td colSpan={2} className="p-2.5 text-center font-mono font-bold text-xs">
                    Rp {difference.toLocaleString('id-ID')}
                  </td>
                  <td></td>
                </tr>
              )}
            </tfoot>
          </table>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
          <button
            type="button"
            onClick={addLine}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-indigo-600" />
            <span>+ Tambah Baris Jurnal</span>
          </button>

          {/* VALIDASI KETAT: Tombol Simpan disabled jika total Debit !== total Kredit atau bernilai 0 */}
          <button
            type="submit"
            disabled={!isBalanced || loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-md transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title={
              !hasValues
                ? 'Masukkan nominal Debit dan Kredit terlebih dahulu'
                : !isBalanced
                  ? `Jurnal belum seimbang (Selisih: Rp ${difference.toLocaleString('id-ID')})`
                  : 'Simpan dan Posting Jurnal'
            }
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Memposting Jurnal...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan & Posting Jurnal Double-Entry</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default JurnalManual;
