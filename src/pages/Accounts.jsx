import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { BookOpen, Search, Plus, Filter, Tag, CheckCircle2 } from 'lucide-react';

export const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('code', { ascending: true });

      if (error) throw error;
      setAccounts(data || []);
    } catch (err) {
      console.warn('Gagal memuat akun dari Supabase, menampilkan data lokal:', err.message);
      // Fallback demo data jika DB Supabase belum diisi seeder
      setAccounts([
        { id: '1', code: '1-1001', name: 'Kas di Tangan (Cash on Hand)', type: 'ASSET', normal_balance: 'DEBIT', sub_category: 'CURRENT_ASSET', is_active: true },
        { id: '2', code: '1-1003', name: 'Bank BCA Operasional', type: 'ASSET', normal_balance: 'DEBIT', sub_category: 'CURRENT_ASSET', is_active: true },
        { id: '3', code: '1-1101', name: 'Piutang Dagang (Accounts Receivable)', type: 'ASSET', normal_balance: 'DEBIT', sub_category: 'CURRENT_ASSET', is_active: true },
        { id: '4', code: '1-1201', name: 'Persediaan Barang Dagang (Merchandise Inventory)', type: 'ASSET', normal_balance: 'DEBIT', sub_category: 'CURRENT_ASSET', is_active: true },
        { id: '5', code: '2-1001', name: 'Utang Usaha / Dagang (Accounts Payable)', type: 'LIABILITY', normal_balance: 'CREDIT', sub_category: 'CURRENT_LIABILITY', is_active: true },
        { id: '6', code: '3-1001', name: 'Modal Disetor Pemilik (Owner Capital)', type: 'EQUITY', normal_balance: 'CREDIT', sub_category: 'OWNERS_EQUITY', is_active: true },
        { id: '7', code: '4-1001', name: 'Pendapatan Penjualan Barang Dagang (Sales)', type: 'REVENUE', normal_balance: 'CREDIT', sub_category: 'OPERATING_REVENUE', is_active: true },
        { id: '8', code: '4-1002', name: 'Retur Penjualan (Sales Returns & Allowances)', type: 'REVENUE', normal_balance: 'DEBIT', sub_category: 'SALES_CONTRA', is_active: true },
        { id: '9', code: '5-1001', name: 'Beban Pokok Penjualan (HPP)', type: 'EXPENSE', normal_balance: 'DEBIT', sub_category: 'COST_OF_GOODS_SOLD', is_active: true },
        { id: '10', code: '6-1001', name: 'Beban Gaji Karyawan Toko & Sales', type: 'EXPENSE', normal_balance: 'DEBIT', sub_category: 'OPERATING_EXPENSE', is_active: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAccounts = accounts.filter((acc) => {
    const matchesSearch = 
      acc.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'ALL' || acc.type === selectedType;
    return matchesSearch && matchesType;
  });

  const typeColorBadges = {
    ASSET: 'bg-blue-50 text-blue-700 border-blue-200',
    LIABILITY: 'bg-rose-50 text-rose-700 border-rose-200',
    EQUITY: 'bg-purple-50 text-purple-700 border-purple-200',
    REVENUE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    EXPENSE: 'bg-amber-50 text-amber-700 border-amber-200',
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            Bagan Akun (Chart of Accounts)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Daftar seluruh rekening akun keuangan perusahaan dagang dengan aturan saldo normal.
          </p>
        </div>
        <button
          onClick={() => alert('Fitur tambah akun kustom: Hubungi Akuntan / Owner.')}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Akun Baru</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari kode atau nama akun..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {['ALL', 'ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'].map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                selectedType === t
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t === 'ALL' ? 'Semua Akun' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5 w-32">Kode Akun</th>
                <th className="p-3.5">Nama Rekening / Akun</th>
                <th className="p-3.5 w-36">Kategori Utama</th>
                <th className="p-3.5 w-32 text-center">Saldo Normal</th>
                <th className="p-3.5 w-24 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredAccounts.length > 0 ? (
                filteredAccounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5 font-mono font-bold text-indigo-700">{acc.code}</td>
                    <td className="p-3.5 font-medium text-slate-900">{acc.name}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${typeColorBadges[acc.type] || 'bg-slate-100 text-slate-700'}`}>
                        {acc.type}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        acc.normal_balance === 'DEBIT' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {acc.normal_balance}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    Tidak ada akun yang sesuai dengan kriteria pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Accounts;
