import React, { useState } from 'react';
import { ArrowUpRight, Save, CheckCircle2 } from 'lucide-react';

export const CashOut = () => {
  const [formData, setFormData] = useState({
    entry_number: `BKK-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-001`,
    entry_date: new Date().toISOString().split('T')[0],
    target_account: '2-1001', // Utang Usaha
    cash_account: '1-1001', // Kas di Tangan
    amount: '',
    description: '',
    ref_no: ''
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      alert('Nominal pengeluaran kas harus lebih besar dari 0!');
      return;
    }

    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-rose-600" />
            Bukti Kas Keluar (BKK)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Perekaman pengeluaran kas untuk pelunasan utang usaha, pembelian tunai, atau beban operasional.
          </p>
        </div>
        <span className="px-3 py-1 bg-rose-50 text-rose-700 font-mono text-xs font-semibold rounded-lg border border-rose-200">
          Auto Double-Entry
        </span>
      </div>

      {submitted && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>
            Transaksi Kas Keluar berhasil dibukukan! Ayat jurnal [Dr] Utang/Beban dan [Cr] Kas telah terposting ke Buku Besar.
          </span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Bukti Kas Keluar</label>
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">Dibayarkan untuk Akun (Debit)</label>
            <select
              value={formData.target_account}
              onChange={(e) => setFormData({ ...formData, target_account: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="2-1001">2-1001 &bull; Utang Usaha / Dagang (Supplier)</option>
              <option value="5-2001">5-2001 &bull; Pembelian Barang Dagang Tunai</option>
              <option value="5-2002">5-2002 &bull; Beban Angkut Pembelian (Freight-In)</option>
              <option value="6-1001">6-1001 &bull; Beban Gaji Karyawan Toko</option>
              <option value="6-2002">6-2002 &bull; Beban Sewa Toko & Gudang</option>
              <option value="6-2003">6-2003 &bull; Beban Listrik, Air, & Internet</option>
              <option value="3-1002">3-1002 &bull; Prive Pemilik (Pengambilan Pribadi)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Sumber Rekening Pembayaran (Kredit)</label>
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nominal Pengeluaran (Rp)</label>
            <input
              type="number"
              required
              placeholder="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg text-rose-700 font-bold focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Nota / Kuitansi Supplier (Opsional)</label>
            <input
              type="text"
              placeholder="Contoh: NOTA-SUP/9910"
              value={formData.ref_no}
              onChange={(e) => setFormData({ ...formData, ref_no: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Keterangan Pengeluaran</label>
          <textarea
            rows={2}
            required
            placeholder="Keterangan keperluan pengeluaran kas..."
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
            <span>[Debit] Rekening Target Pengeluaran</span>
            <span className="font-bold text-rose-600">Rp {Number(formData.amount || 0).toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-slate-600 pl-4">
            <span>[Kredit] Rekening Kas/Bank Pembayar</span>
            <span className="font-bold text-slate-800">Rp {Number(formData.amount || 0).toLocaleString('id-ID')}</span>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan & Posting Kas Keluar</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CashOut;
