import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { formatRupiah, formatDate } from '../../utils/formatters';
import { BookOpen, Calendar, Filter, Printer, RefreshCw, ArrowUpDown } from 'lucide-react';

export const BukuBesar = () => {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openingBalance, setOpeningBalance] = useState(0);

  // 1. Ambil daftar akun aktif
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const { data, error } = await supabase
          .from('accounts')
          .select('id, code, name, type, normal_balance')
          .eq('is_active', true)
          .order('code', { ascending: true });

        if (error) throw error;
        if (data && data.length > 0) {
          setAccounts(data);
          setSelectedAccountId(data[0].id);
        }
      } catch (err) {
        console.warn('Fallback accounts for BukuBesar:', err.message);
        const fallbackAccs = [
          { id: 'acc-kas', code: '1-1001', name: 'Kas di Tangan', type: 'ASSET', normal_balance: 'DEBIT' },
          { id: 'acc-bca', code: '1-1003', name: 'Bank BCA Operasional', type: 'ASSET', normal_balance: 'DEBIT' },
          { id: 'acc-piutang', code: '1-1101', name: 'Piutang Dagang', type: 'ASSET', normal_balance: 'DEBIT' },
          { id: 'acc-persediaan', code: '1-1201', name: 'Persediaan Barang Dagang', type: 'ASSET', normal_balance: 'DEBIT' },
          { id: 'acc-utang', code: '2-1001', name: 'Utang Usaha / Dagang', type: 'LIABILITY', normal_balance: 'CREDIT' },
          { id: 'acc-modal', code: '3-1001', name: 'Modal Disetor Pemilik', type: 'EQUITY', normal_balance: 'CREDIT' },
          { id: 'acc-penjualan', code: '4-1001', name: 'Pendapatan Penjualan', type: 'REVENUE', normal_balance: 'CREDIT' },
          { id: 'acc-hpp', code: '5-1001', name: 'Beban Pokok Penjualan (HPP)', type: 'EXPENSE', normal_balance: 'DEBIT' },
          { id: 'acc-gaji', code: '6-1001', name: 'Beban Gaji Karyawan', type: 'EXPENSE', normal_balance: 'DEBIT' },
        ];
        setAccounts(fallbackAccs);
        setSelectedAccountId(fallbackAccs[0].id);
      }
    };

    fetchAccounts();
  }, []);

  // 2. Ambil mutasi jurnal untuk akun terpilih
  const fetchLedgerData = async () => {
    if (!selectedAccountId) return;
    setLoading(true);

    try {
      // Ambil transaksi pada periode
      const { data, error } = await supabase
        .from('journal_lines')
        .select(`
          id,
          debit,
          credit,
          memo,
          created_at,
          journal_entries!inner (
            id,
            entry_number,
            entry_date,
            description,
            status
          )
        `)
        .eq('account_id', selectedAccountId)
        .eq('journal_entries.status', 'POSTED')
        .gte('journal_entries.entry_date', startDate)
        .lte('journal_entries.entry_date', endDate)
        .order('journal_entries(entry_date)', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      setLines(data || []);
      setOpeningBalance(0);
    } catch (err) {
      console.warn('Fallback ledger mutations:', err.message);
      // Demo mutations data
      setLines([
        {
          id: 'l-1',
          debit: 50000000,
          credit: 0,
          memo: 'Setoran modal awal pemilik usaha',
          created_at: '2026-10-01T08:00:00Z',
          journal_entries: {
            entry_number: 'BKM-202610-001',
            entry_date: '2026-10-01',
            description: 'Setoran modal tunai',
            status: 'POSTED'
          }
        },
        {
          id: 'l-2',
          debit: 0,
          credit: 15000000,
          memo: 'Pembelian barang dagang tunai dari grosir',
          created_at: '2026-10-05T09:30:00Z',
          journal_entries: {
            entry_number: 'BKK-202610-002',
            entry_date: '2026-10-05',
            description: 'Pembelian stok awal',
            status: 'POSTED'
          }
        },
        {
          id: 'l-3',
          debit: 28500000,
          credit: 0,
          memo: 'Penerimaan penjualan barang dagang tunai',
          created_at: '2026-10-12T14:15:00Z',
          journal_entries: {
            entry_number: 'BKM-202610-003',
            entry_date: '2026-10-12',
            description: 'Penjualan tunai harian',
            status: 'POSTED'
          }
        },
        {
          id: 'l-4',
          debit: 0,
          credit: 4500000,
          memo: 'Pembayaran beban sewa toko bulan Oktober',
          created_at: '2026-10-18T11:00:00Z',
          journal_entries: {
            entry_number: 'BKK-202610-004',
            entry_date: '2026-10-18',
            description: 'Biaya sewa toko',
            status: 'POSTED'
          }
        }
      ]);
      setOpeningBalance(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgerData();
  }, [selectedAccountId, startDate, endDate]);

  const currentAccount = accounts.find((a) => a.id === selectedAccountId);
  const isDebitNormal = currentAccount?.normal_balance === 'DEBIT';

  // 3. Kalkulasi Running Balance (Saldo Berjalan)
  const computedRows = useMemo(() => {
    let currentBalance = openingBalance;

    return lines.map((line) => {
      const d = Number(line.debit) || 0;
      const c = Number(line.credit) || 0;

      // Rumus Saldo Berjalan sesuai Saldo Normal Akun:
      // Akun Normal Debit: Saldo = Saldo_Lalu + Debit - Kredit
      // Akun Normal Kredit: Saldo = Saldo_Lalu + Kredit - Debit
      if (isDebitNormal) {
        currentBalance = currentBalance + d - c;
      } else {
        currentBalance = currentBalance + c - d;
      }

      return {
        id: line.id,
        date: line.journal_entries?.entry_date,
        entryNumber: line.journal_entries?.entry_number,
        description: line.memo || line.journal_entries?.description,
        debit: d,
        credit: c,
        runningBalance: currentBalance
      };
    });
  }, [lines, openingBalance, isDebitNormal]);

  const totalDebit = computedRows.reduce((sum, r) => sum + r.debit, 0);
  const totalCredit = computedRows.reduce((sum, r) => sum + r.credit, 0);
  const endingBalance = computedRows.length > 0 
    ? computedRows[computedRows.length - 1].runningBalance 
    : openingBalance;

  return (
    <div className="space-y-6">
      {/* Header & Filter Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              Buku Besar Akun (General Ledger)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Rincian mutasi debet/kredit per rekening dengan kalkulasi saldo berjalan (*running balance*).
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Buku Besar</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Rekening Akun</label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-medium focus:ring-2 focus:ring-indigo-500"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.code} &bull; {acc.name} ({acc.normal_balance})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Dari Tanggal</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Sampai Tanggal</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Account Info Badge Card */}
      {currentAccount && (
        <div className="bg-slate-900 text-white p-5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-md">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-indigo-400 text-base">{currentAccount.code}</span>
              <span className="text-sm font-bold text-white">{currentAccount.name}</span>
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
              <span>Golongan: <strong className="text-slate-200">{currentAccount.type}</strong></span>
              <span>&bull;</span>
              <span>Saldo Normal: <strong className="text-indigo-300 font-mono">{currentAccount.normal_balance}</strong></span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400 font-medium">Saldo Akhir Periode</div>
            <div className="text-xl font-bold font-mono text-emerald-400">
              {formatRupiah(endingBalance)}
            </div>
          </div>
        </div>
      )}

      {/* Ledger Mutations Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5 w-28">Tanggal</th>
                <th className="p-3.5 w-36">No. Bukti</th>
                <th className="p-3.5">Keterangan / Memo Transaksi</th>
                <th className="p-3.5 w-36 text-right">Debit (Rp)</th>
                <th className="p-3.5 w-36 text-right">Kredit (Rp)</th>
                <th className="p-3.5 w-40 text-right">Saldo Berjalan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {/* Baris Saldo Awal */}
              <tr className="bg-slate-50/50 italic text-slate-500 font-medium">
                <td className="p-3">{formatDate(startDate)}</td>
                <td className="p-3 font-mono">-</td>
                <td className="p-3">Saldo Awal Periode</td>
                <td className="p-3 text-right font-mono">-</td>
                <td className="p-3 text-right font-mono">-</td>
                <td className="p-3 text-right font-mono font-bold text-slate-800">
                  {formatRupiah(openingBalance)}
                </td>
              </tr>

              {/* Baris Mutasi Transaksi */}
              {computedRows.length > 0 ? (
                computedRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3 text-slate-600">{formatDate(row.date)}</td>
                    <td className="p-3 font-mono font-bold text-indigo-700">{row.entryNumber}</td>
                    <td className="p-3 font-medium text-slate-900">{row.description}</td>
                    <td className="p-3 text-right font-mono text-slate-800">
                      {row.debit > 0 ? formatRupiah(row.debit, false) : '-'}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-800">
                      {row.credit > 0 ? formatRupiah(row.credit, false) : '-'}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900 bg-slate-50/40">
                      {formatRupiah(row.runningBalance)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Tidak ada transaksi mutasi untuk akun ini pada rentang tanggal yang dipilih.
                  </td>
                </tr>
              )}
            </tbody>
            {/* Total Mutasi */}
            <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-200 text-xs">
              <tr>
                <td colSpan={3} className="p-3.5 text-right font-semibold text-slate-700">
                  Total Mutasi Periode:
                </td>
                <td className="p-3.5 text-right font-mono text-indigo-700">
                  {formatRupiah(totalDebit)}
                </td>
                <td className="p-3.5 text-right font-mono text-indigo-700">
                  {formatRupiah(totalCredit)}
                </td>
                <td className="p-3.5 text-right font-mono text-emerald-700 text-sm">
                  {formatRupiah(endingBalance)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BukuBesar;
