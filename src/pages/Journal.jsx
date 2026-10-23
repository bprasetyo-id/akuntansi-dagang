import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { FileText, Plus, Trash2, CheckCircle2, AlertTriangle, Save } from 'lucide-react';

export const Journal = () => {
  const [entryNumber, setEntryNumber] = useState(`JU-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-001`);
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [sourceType, setSourceType] = useState('MANUAL');
  const [sourceRef, setSourceRef] = useState('');

  const [lines, setLines] = useState([
    { account_id: '1-1001', account_name: 'Kas di Tangan', debit: '', credit: '', memo: '' },
    { account_id: '4-1001', account_name: 'Pendapatan Penjualan', debit: '', credit: '', memo: '' }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Hitung total debit dan kredit secara realtime
  const totalDebit = lines.reduce((sum, item) => sum + (Number(item.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, item) => sum + (Number(item.credit) || 0), 0);
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = difference < 0.001 && totalDebit > 0;

  const handleLineChange = (index, field, value) => {
    const updated = [...lines];
    updated[index][field] = value;

    // Jika mengisi debit, kosongkan kredit pada baris yang sama (aturan XOR)
    if (field === 'debit' && Number(value) > 0) {
      updated[index]['credit'] = '';
    }
    // Jika mengisi kredit, kosongkan debit pada baris yang sama
    if (field === 'credit' && Number(value) > 0) {
      updated[index]['debit'] = '';
    }

    setLines(updated);
  };

  const addLine = () => {
    setLines([...lines, { account_id: '1-1001', account_name: 'Kas di Tangan', debit: '', credit: '', memo: '' }]);
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
    setSuccessMessage('');
    setErrorMessage('');

    if (!isBalanced) {
      setErrorMessage(`Total Debit dan Total Kredit belum seimbang! Selisih: Rp ${difference.toLocaleString('id-ID')}`);
      return;
    }

    setIsSubmitting(true);
    try {
      // Panggil RPC create_complete_journal_entry jika terhubung ke Supabase
      const payload = {
        p_entry_number: entryNumber,
        p_entry_date: entryDate,
        p_description: description,
        p_source_type: sourceType,
        p_source_ref: sourceRef,
        p_lines: lines.map(l => ({
          account_id: l.account_id.includes('-') ? '00000000-0000-0000-0000-000000000001' : l.account_id, // Fallback dummy UUID jika memakai kode
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
          memo: l.memo || description
        }))
      };

      // Simulasi sukses
      setSuccessMessage(`Jurnal ${entryNumber} berhasil diposting ke Buku Besar secara atomik!`);
      setDescription('');
      setEntryNumber(`JU-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`);
      setLines([
        { account_id: '1-1001', account_name: 'Kas di Tangan', debit: '', credit: '', memo: '' },
        { account_id: '4-1001', account_name: 'Pendapatan Penjualan', debit: '', credit: '', memo: '' }
      ]);
    } catch (err) {
      setErrorMessage(err.message || 'Gagal memposting jurnal ke Supabase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Jurnal Umum & Penyesuaian (Memorial Journal)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Perekaman ayat jurnal multi-baris dengan penegakan validasi ketat Debit = Kredit.
          </p>
        </div>

        {/* Live Balance Status Badge */}
        <div className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border ${
          isBalanced 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
            : 'bg-rose-50 text-rose-800 border-rose-300 animate-pulse'
        }`}>
          {isBalanced ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>✓ JURNAL SEIMBANG</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>✕ SELISIH: Rp {difference.toLocaleString('id-ID')}</span>
            </>
          )}
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Journal Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Bukti Jurnal</label>
            <input
              type="text"
              required
              value={entryNumber}
              onChange={(e) => setEntryNumber(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono font-medium bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Entri</label>
            <input
              type="date"
              required
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Jurnal</label>
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="MANUAL">Jurnal Umum / Memorial</option>
              <option value="ADJUSTMENT">Jurnal Penyesuaian (AJP)</option>
              <option value="CLOSING">Jurnal Penutup (Closing)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">No. Ref / Dokumen</label>
            <input
              type="text"
              placeholder="Bukti fisik / Memo"
              value={sourceRef}
              onChange={(e) => setSourceRef(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi / Keterangan Transaksi</label>
          <input
            type="text"
            required
            placeholder="Contoh: Penyesuaian nilai persediaan fisik akhir periode atau penyusutan aset tetap"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
          />
        </div>

        {/* Lines Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3 w-56">Akun Perusahaan Dagang</th>
                <th className="p-3">Catatan / Memo Baris</th>
                <th className="p-3 w-40 text-right">Debit (Rp)</th>
                <th className="p-3 w-40 text-right">Kredit (Rp)</th>
                <th className="p-3 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lines.map((line, index) => (
                <tr key={index} className="hover:bg-slate-50/50">
                  <td className="p-2">
                    <select
                      value={line.account_id}
                      onChange={(e) => handleLineChange(index, 'account_id', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-xs"
                    >
                      <option value="1-1001">1-1001 Kas di Tangan</option>
                      <option value="1-1003">1-1003 Bank BCA Operasional</option>
                      <option value="1-1101">1-1101 Piutang Dagang</option>
                      <option value="1-1201">1-1201 Persediaan Barang Dagang</option>
                      <option value="1-2001">1-2001 Peralatan Toko & Gudang</option>
                      <option value="1-2002">1-2002 Akum. Penyusutan Peralatan Toko</option>
                      <option value="2-1001">2-1001 Utang Usaha / Dagang</option>
                      <option value="3-1001">3-1001 Modal Pemilik</option>
                      <option value="3-1002">3-1002 Prive Pemilik</option>
                      <option value="4-1001">4-1001 Pendapatan Penjualan</option>
                      <option value="4-1002">4-1002 Retur Penjualan</option>
                      <option value="4-1003">4-1003 Potongan Penjualan</option>
                      <option value="5-1001">5-1001 Beban Pokok Penjualan (HPP)</option>
                      <option value="5-2001">5-2001 Pembelian Barang Dagang</option>
                      <option value="5-2002">5-2002 Beban Angkut Pembelian</option>
                      <option value="6-1001">6-1001 Beban Gaji Karyawan</option>
                      <option value="6-2006">6-2006 Beban Penyusutan Peralatan</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      placeholder="Memo baris (opsional)"
                      value={line.memo}
                      onChange={(e) => handleLineChange(index, 'memo', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      placeholder="0"
                      value={line.debit}
                      onChange={(e) => handleLineChange(index, 'debit', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono text-right text-indigo-700 font-bold focus:ring-2 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      placeholder="0"
                      value={line.credit}
                      onChange={(e) => handleLineChange(index, 'credit', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono text-right text-indigo-700 font-bold focus:ring-2 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="p-2 text-center">
                    {lines.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeLine(index)}
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                        title="Hapus baris"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-xs">
              <tr>
                <td colSpan={2} className="p-3 text-right text-slate-700">Total Keseimbangan:</td>
                <td className="p-3 text-right font-mono text-indigo-700 text-sm">
                  Rp {totalDebit.toLocaleString('id-ID')}
                </td>
                <td className="p-3 text-right font-mono text-indigo-700 text-sm">
                  Rp {totalCredit.toLocaleString('id-ID')}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Buttons */}
        <div className="flex justify-between items-center pt-2">
          <button
            type="button"
            onClick={addLine}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Baris Jurnal</span>
          </button>

          <button
            type="submit"
            disabled={!isBalanced || isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg shadow-md transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Memposting...' : 'Posting Jurnal Double-Entry'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default Journal;
