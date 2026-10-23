import React, { useState } from 'react';
import { ArrowDownLeft, Save, Plus, FileText, CheckCircle2 } from 'lucide-react';

export const CashIn = () => {
  const [formData, setFormData] = useState({
    entry_number: `BKM-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-001`,
    entry_date: new Date().toISOString().split('T')[0],
    cash_account: '1-1001', // Kas di Tangan
    source_account: '1-1101', // Piutang Dagang
    amount: '',
    description: '',
    ref_no: ''
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      alert('Nominal penerimaan kas harus lebih besar dari 0!');
      return;
    }

    // Simulasi posting otomatis ayat jurnal double-entry:
    // [Dr] Akun Kas/Bank
    //    [Cr] Akun Sumber (Piutang / Penjualan Tunai)
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
            Bukti Kas Masuk (BKM)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan penerimaan kas dari pelunasan piutang, penjualan tunai, atau setoran modal.
          </p>
        </div>
        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-mono text-xs font-semibold rounded-lg border border-emerald-200">
          Auto Double-Entry
        </span>
      </div>

      {submitted && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>
            Transaksi Kas Masuk berhasil dibukukan! Ayat jurnal [Dr] Kas dan [Cr] Piutang telah terposting ke Buku Besar.
          </span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Bukti Kas Masuk</label>
            <input
              type="text"
              required
              value={formData.entry_number}
              onChange={(e) => setFormData({ ...formData, entry_number: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 font-mono font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Transaksi</label>
            <input
              type="date"
              required
              value={formData.entry_date}
              onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Diterima pada Rekening (Debit)</label>
            <select
              value={formData.cash_account}
              onChange={(e) => setFormData({ ...formData, cash_account: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="1-1001">1-1001 &bull; Kas di Tangan</option>
              <option value="1-1002">1-1002 &bull; Kas Kecil</option>
              <option value="1-1003">1-1003 &bull; Bank BCA Operasional</option>
              <option value="1-1004">1-1004 &bull; Bank Mandiri Giro</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Diterima dari Akun (Kredit)</label>
            <select
              value={formData.source_account}
              onChange={(e) => setFormData({ ...formData, source_account: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="1-1101">1-1101 &bull; Piutang Dagang (Pelunasan Customer)</option>
              <option value="4-1001">4-1001 &bull; Pendapatan Penjualan Tunai</option>
              <option value="3-1001">3-1001 &bull; Modal Pemilik (Setoran Modal)</option>
              <option value="4-3001">4-3001 &bull; Pendapatan Bunga Bank</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nominal Penerimaan (Rp)</label>
            <input
              type="number"
              required
              placeholder="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg text-emerald-700 font-bold focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Referensi / Faktur (Opsional)</label>
            <input
              type="text"
              placeholder="Contoh: INV-2026/X/089"
              value={formData.ref_no}
              onChange={(e) => setFormData({ ...formData, ref_no: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Keterangan Penerimaan</label>
          <textarea
            rows={2}
            required
            placeholder="Keterangan transaksi penerimaan kas..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
          />
        </div>

        {/* Visualisasi Preview Jurnal */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs space-y-1.5 font-mono">
          <div className="text-[11px] font-sans font-bold text-slate-500 uppercase tracking-wider mb-1">
            Simulasi Jurnal Otomatis yang Dibuat:
          </div>
          <div className="flex justify-between text-slate-800">
            <span>[Debit] Rekening Kas/Bank Terpilih</span>
            <span className="font-bold text-emerald-600">Rp {Number(formData.amount || 0).toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-slate-600 pl-4">
            <span>[Kredit] Rekening Sumber Penerimaan</span>
            <span className="font-bold text-indigo-600">Rp {Number(formData.amount || 0).toLocaleString('id-ID')}</span>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan & Posting Kas Masuk</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CashIn;
