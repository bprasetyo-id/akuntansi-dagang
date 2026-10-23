import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  TrendingUp, 
  Wallet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Package, 
  AlertCircle,
  FileCheck2,
  Clock
} from 'lucide-react';

export const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    cashBalance: 125450000,
    receivables: 42300000,
    inventory: 88500000,
    payables: 31200000,
    netSalesThisMonth: 198000000,
    grossProfit: 62400000
  });

  const [recentJournals, setRecentJournals] = useState([]);

  useEffect(() => {
    const fetchRecentJournals = async () => {
      try {
        const { data, error } = await supabase
          .from('journal_entries')
          .select('id, entry_number, entry_date, description, source_type, status')
          .order('entry_date', { ascending: false })
          .limit(5);

        if (!error && data) {
          setRecentJournals(data);
        }
      } catch (err) {
        console.error('Error fetching dashboard journals:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentJournals();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-indigo-700/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold tracking-wide uppercase border border-indigo-500/30">
            Perusahaan Dagang
          </span>
          <h2 className="text-2xl font-bold mt-2 tracking-tight">Ringkasan Keuangan Operasional</h2>
          <p className="text-indigo-200 text-xs sm:text-sm mt-0.5">
            Sistem akuntansi berbasis Double-Entry dengan pencatatan mutasi kas dan persediaan *realtime*.
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-indigo-300 font-medium">Beban Pokok Penjualan (HPP) Terkendali</div>
          <div className="text-xl font-bold text-emerald-400 font-mono mt-0.5">Laba Kotor: 31.5%</div>
        </div>
      </div>

      {/* KPI Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Kas & Bank */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Kas & Bank</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            Rp {metrics.cashBalance.toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-emerald-600 font-semibold font-mono">+8.4%</span> dari bulan lalu
          </p>
        </div>

        {/* Piutang Dagang */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Piutang Dagang</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            Rp {metrics.receivables.toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-slate-500 mt-1">Jatuh tempo &lt; 30 hari</p>
        </div>

        {/* Persediaan Barang */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Persediaan Barang</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            Rp {metrics.inventory.toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-slate-500 mt-1">Metode Perpetual / Periodik</p>
        </div>

        {/* Utang Usaha */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Utang Usaha</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            Rp {metrics.payables.toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-slate-500 mt-1">Kewajiban lancar operasional</p>
        </div>
      </div>

      {/* Main Grid: Recent Transactions & Account Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Transaksi Jurnal Terakhir */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Aktivitas Jurnal Terakhir</h3>
              <p className="text-xs text-slate-500">Daftar transaksi yang terposting ke Buku Besar</p>
            </div>
            <a href="/journal" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              Lihat Semua &rarr;
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold">
                <tr>
                  <th className="p-3 rounded-l-lg">No. Bukti</th>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Keterangan</th>
                  <th className="p-3">Tipe</th>
                  <th className="p-3 text-center rounded-r-lg">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentJournals.length > 0 ? (
                  recentJournals.map((j) => (
                    <tr key={j.id} className="hover:bg-slate-50/60 transition">
                      <td className="p-3 font-mono font-medium text-slate-900">{j.entry_number}</td>
                      <td className="p-3 text-slate-500">{j.entry_date}</td>
                      <td className="p-3 font-medium">{j.description}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                          {j.source_type}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          {j.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <>
                    <tr className="hover:bg-slate-50/60 transition">
                      <td className="p-3 font-mono font-medium text-slate-900">BKM-202610-001</td>
                      <td className="p-3 text-slate-500">2026-10-22</td>
                      <td className="p-3 font-medium">Penerimaan pelunasan piutang Toko Sejahtera</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700">
                          CASH_IN
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          POSTED
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/60 transition">
                      <td className="p-3 font-mono font-medium text-slate-900">BKK-202610-002</td>
                      <td className="p-3 text-slate-500">2026-10-21</td>
                      <td className="p-3 font-medium">Pembayaran utang dagang supplier distributor kain</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700">
                          CASH_OUT
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          POSTED
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/60 transition">
                      <td className="p-3 font-mono font-medium text-slate-900">JU-202610-003</td>
                      <td className="p-3 text-slate-500">2026-10-20</td>
                      <td className="p-3 font-medium">Penyesuaian Beban Pokok Penjualan (HPP) periodik</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                          ADJUSTMENT
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          POSTED
                        </span>
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Quick Workflow Guides */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">
            Siklus Akuntansi Dagang
          </h3>

          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <div className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-indigo-600" />
                1. Bagan Akun Terstandarisasi
              </div>
              <p className="text-slate-600">
                47 akun master siap pakai mencakup akun kontra (Retur & Potongan Penjualan/Pembelian).
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <div className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                2. Otomatisasi Kas Masuk & Keluar
              </div>
              <p className="text-slate-600">
                Setiap transaksi otomatis menjurnal debit-kredit tanpa perlu memasukkan akun manual.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <div className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                3. Laporan Keuangan Realtime
              </div>
              <p className="text-slate-600">
                Neraca Saldo, Laba Rugi Multi-Step, dan Neraca Posisi Keuangan dapat dicetak kapan saja.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
