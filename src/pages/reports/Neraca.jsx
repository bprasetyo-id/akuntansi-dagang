import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { formatRupiah, formatDate } from '../../utils/formatters';
import { Landmark, Calendar, Printer, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export const Neraca = () => {
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  const [accounts, setAccounts] = useState([]);
  const [journalLines, setJournalLines] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: accData, error: accError } = await supabase
        .from('accounts')
        .select('id, code, name, type, sub_category, normal_balance')
        .eq('is_active', true)
        .order('code', { ascending: true });

      if (accError) throw accError;

      const { data: linesData, error: linesError } = await supabase
        .from('journal_lines')
        .select(`
          account_id,
          debit,
          credit,
          journal_entries!inner (
            entry_date,
            status
          )
        `)
        .eq('journal_entries.status', 'POSTED')
        .lte('journal_entries.entry_date', asOfDate);

      if (linesError) throw linesError;

      setAccounts(accData || []);
      setJournalLines(linesData || []);
    } catch (err) {
      console.warn('Fallback data for Neraca:', err.message);
      // Demo accounts
      const fallbackAccs = [
        // ASET
        { id: '1', code: '1-1001', name: 'Kas di Tangan', type: 'ASSET', sub_category: 'CURRENT_ASSET', normal_balance: 'DEBIT' },
        { id: '2', code: '1-1003', name: 'Bank BCA Operasional', type: 'ASSET', sub_category: 'CURRENT_ASSET', normal_balance: 'DEBIT' },
        { id: '3', code: '1-1101', name: 'Piutang Dagang', type: 'ASSET', sub_category: 'CURRENT_ASSET', normal_balance: 'DEBIT' },
        { id: '4', code: '1-1201', name: 'Persediaan Barang Dagang', type: 'ASSET', sub_category: 'CURRENT_ASSET', normal_balance: 'DEBIT' },
        { id: '5', code: '1-2001', name: 'Peralatan Toko & Gudang', type: 'ASSET', sub_category: 'FIXED_ASSET', normal_balance: 'DEBIT' },
        { id: '6', code: '1-2002', name: 'Akumulasi Penyusutan Peralatan', type: 'ASSET', sub_category: 'FIXED_ASSET', normal_balance: 'CREDIT' },
        // LIABILITAS
        { id: '7', code: '2-1001', name: 'Utang Usaha / Dagang', type: 'LIABILITY', sub_category: 'CURRENT_LIABILITY', normal_balance: 'CREDIT' },
        { id: '8', code: '2-1002', name: 'Beban yang Masih Harus Dibayar', type: 'LIABILITY', sub_category: 'CURRENT_LIABILITY', normal_balance: 'CREDIT' },
        // EKUITAS
        { id: '9', code: '3-1001', name: 'Modal Disetor Pemilik', type: 'EQUITY', sub_category: 'OWNERS_EQUITY', normal_balance: 'CREDIT' },
        { id: '10', code: '3-1002', name: 'Prive Pemilik', type: 'EQUITY', sub_category: 'OWNERS_EQUITY', normal_balance: 'DEBIT' },
        { id: '11', code: '3-2001', name: 'Laba Ditahan Historis', type: 'EQUITY', sub_category: 'RETAINED_EARNINGS', normal_balance: 'CREDIT' },
        // PENDAPATAN & BEBAN (Untuk kalkulasi laba berjalan)
        { id: '12', code: '4-1001', name: 'Pendapatan Penjualan', type: 'REVENUE', sub_category: 'OPERATING_REVENUE', normal_balance: 'CREDIT' },
        { id: '13', code: '4-1002', name: 'Retur Penjualan (Kontra)', type: 'REVENUE', sub_category: 'SALES_CONTRA', normal_balance: 'DEBIT' },
        { id: '14', code: '5-1001', name: 'Beban Pokok Penjualan (HPP)', type: 'EXPENSE', sub_category: 'COST_OF_GOODS_SOLD', normal_balance: 'DEBIT' },
        { id: '15', code: '6-1001', name: 'Beban Gaji & Operasional', type: 'EXPENSE', sub_category: 'OPERATING_EXPENSE', normal_balance: 'DEBIT' },
      ];

      const demoLines = [
        { account_id: '1', debit: 65450000, credit: 0 },
        { account_id: '2', debit: 60000000, credit: 0 },
        { account_id: '3', debit: 42300000, credit: 0 },
        { account_id: '4', debit: 88500000, credit: 0 },
        { account_id: '5', debit: 95000000, credit: 0 },
        { account_id: '6', debit: 0, credit: 21000000 },
        { account_id: '7', debit: 0, credit: 31200000 },
        { account_id: '8', debit: 0, credit: 5050000 },
        { account_id: '9', debit: 0, credit: 210000000 },
        { account_id: '10', debit: 5000000, credit: 0 },
        { account_id: '11', debit: 0, credit: 50000000 },
        { account_id: '12', debit: 0, credit: 215000000 },
        { account_id: '13', debit: 17000000, credit: 0 },
        { account_id: '14', debit: 135000000, credit: 0 },
        { account_id: '15', debit: 34000000, credit: 0 },
      ];

      setAccounts(fallbackAccs);
      setJournalLines(demoLines);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [asOfDate]);

  // Kalkulasi Struktur Neraca Posisi Keuangan
  const balanceSheetData = useMemo(() => {
    // 1. Akumulasi mutasi debit dan kredit per akun
    const balanceMap = {};
    journalLines.forEach((line) => {
      if (!balanceMap[line.account_id]) {
        balanceMap[line.account_id] = { debit: 0, credit: 0 };
      }
      balanceMap[line.account_id].debit += Number(line.debit) || 0;
      balanceMap[line.account_id].credit += Number(line.credit) || 0;
    });

    const currentAssets = [];
    const fixedAssets = [];
    let totalCurrentAssets = 0;
    let totalFixedAssets = 0;

    const currentLiabilities = [];
    const longTermLiabilities = [];
    let totalLiabilities = 0;

    const equityAccountsList = [];
    let totalBaseEquity = 0;

    // Untuk Laba Bersih Berjalan: (Pendapatan - Beban)
    let totalRevenue = 0;
    let totalExpenses = 0;

    accounts.forEach((acc) => {
      const summary = balanceMap[acc.id] || { debit: 0, credit: 0 };
      const d = summary.debit;
      const c = summary.credit;

      // --- POS ASET ---
      if (acc.type === 'ASSET') {
        // Normal Debit: Net = Debit - Kredit. (Jika akun kontra akumulasi penyusutan, kredit > debit sehingga net negatif)
        const net = d - c;
        if (net !== 0) {
          const item = { code: acc.code, name: acc.name, amount: net };
          if (acc.sub_category === 'FIXED_ASSET' || acc.code.startsWith('1-2')) {
            fixedAssets.push(item);
            totalFixedAssets += net;
          } else {
            currentAssets.push(item);
            totalCurrentAssets += net;
          }
        }
      }

      // --- POS LIABILITAS ---
      else if (acc.type === 'LIABILITY') {
        // Normal Kredit: Net = Kredit - Debit
        const net = c - d;
        if (net !== 0) {
          const item = { code: acc.code, name: acc.name, amount: net };
          if (acc.sub_category === 'LONG_TERM_LIABILITY' || acc.code.startsWith('2-2')) {
            longTermLiabilities.push(item);
          } else {
            currentLiabilities.push(item);
          }
          totalLiabilities += net;
        }
      }

      // --- POS EKUITAS DASAR ---
      else if (acc.type === 'EQUITY') {
        // Akun modal biasa: Normal Kredit (c - d)
        // Akun Prive: Normal Debit (d - c), sehingga mengurangi ekuitas
        const isDrawing = acc.code === '3-1002' || acc.normal_balance === 'DEBIT';
        const net = isDrawing ? -(d - c) : (c - d);

        if (net !== 0) {
          equityAccountsList.push({ code: acc.code, name: acc.name, amount: net, isDrawing });
          totalBaseEquity += net;
        }
      }

      // --- PERHITUNGAN LABA BERSIH BERJALAN ---
      else if (acc.type === 'REVENUE') {
        const isContra = acc.sub_category === 'SALES_CONTRA' || acc.normal_balance === 'DEBIT';
        const net = isContra ? -(d - c) : (c - d);
        totalRevenue += net;
      } else if (acc.type === 'EXPENSE') {
        const net = d - c;
        totalExpenses += net;
      }
    });

    // Laba Bersih Berjalan = Pendapatan Bersih - (HPP + Beban)
    const currentYearEarnings = totalRevenue - totalExpenses;

    // Total Ekuitas = Ekuitas Akun + Laba Bersih Berjalan
    const totalFinalEquity = totalBaseEquity + currentYearEarnings;

    const totalAssets = totalCurrentAssets + totalFixedAssets;
    const totalLiabilitiesAndEquity = totalLiabilities + totalFinalEquity;

    // Verifikasi rumus: Aset = Kewajiban + (Ekuitas + Laba Bersih berjalan)
    const difference = Math.abs(totalAssets - totalLiabilitiesAndEquity);
    const isBalanced = difference < 0.01;

    return {
      currentAssets,
      fixedAssets,
      totalCurrentAssets,
      totalFixedAssets,
      totalAssets,
      currentLiabilities,
      longTermLiabilities,
      totalLiabilities,
      equityAccountsList,
      currentYearEarnings,
      totalFinalEquity,
      totalLiabilitiesAndEquity,
      isBalanced,
      difference
    };
  }, [accounts, journalLines]);

  return (
    <div className="space-y-6">
      {/* Header & Filter Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Landmark className="w-5 h-5 text-indigo-600" />
            Laporan Posisi Keuangan (Neraca)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Persamaan Akuntansi: Aset = Kewajiban + (Ekuitas + Laba Bersih Berjalan).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Per Tanggal:</span>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="font-medium bg-transparent border-none text-slate-800"
            />
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Neraca</span>
          </button>
        </div>
      </div>

      {/* Balance Verification Banner */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
        balanceSheetData.isBalanced 
          ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
          : 'bg-rose-50 border-rose-200 text-rose-900'
      }`}>
        <div className="flex items-center gap-3">
          {balanceSheetData.isBalanced ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <div>
            <div className="font-bold text-sm">
              {balanceSheetData.isBalanced ? '✓ Persamaan Neraca Sempurna Terpenuhi' : '✕ Neraca Tidak Seimbang'}
            </div>
            <p className="text-xs opacity-80 mt-0.5">
              Rumus: <strong>Aset ({formatRupiah(balanceSheetData.totalAssets)}) = Kewajiban ({formatRupiah(balanceSheetData.totalLiabilities)}) + Ekuitas Termasuk Laba Berjalan ({formatRupiah(balanceSheetData.totalFinalEquity)})</strong>.
            </p>
          </div>
        </div>

        <div className="text-right font-mono text-xs">
          <div>Selisih Persamaan:</div>
          <div className={`text-base font-bold ${balanceSheetData.isBalanced ? 'text-emerald-700' : 'text-rose-700'}`}>
            {formatRupiah(balanceSheetData.difference)}
          </div>
        </div>
      </div>

      {/* Main Two-Column Balance Sheet Layout (Aktiva vs Pasiva) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 max-w-5xl mx-auto space-y-6">
        <div className="text-center pb-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 uppercase">PT Niaga Makmur Sejahtera</h3>
          <h4 className="text-sm font-semibold text-indigo-700">Laporan Posisi Keuangan (Neraca)</h4>
          <p className="text-xs text-slate-500 mt-0.5">Per {formatDate(asOfDate)}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs font-sans">
          
          {/* KOLOM KIRI: ASET (AKTIVA) */}
          <div className="space-y-5">
            <div className="font-bold text-sm text-slate-900 uppercase pb-1.5 border-b-2 border-indigo-600 flex justify-between">
              <span>Aset (Aktiva)</span>
              <span className="font-mono text-indigo-600">IDR</span>
            </div>

            {/* Aset Lancar */}
            <div className="space-y-2">
              <div className="font-bold text-slate-800 uppercase tracking-wide text-[11px]">
                Aset Lancar (Current Assets)
              </div>
              <div className="space-y-1.5 pl-3 border-l-2 border-slate-100">
                {balanceSheetData.currentAssets.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-slate-700">
                    <span>
                      <strong className="text-slate-800 font-mono text-[11px] mr-1.5">{item.code}</strong>
                      {item.name}
                    </span>
                    <span className="font-mono text-slate-900">{formatRupiah(item.amount, false)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center py-1.5 px-2 bg-slate-50 rounded font-semibold text-slate-800">
                <span>Total Aset Lancar</span>
                <span className="font-mono text-indigo-700">{formatRupiah(balanceSheetData.totalCurrentAssets)}</span>
              </div>
            </div>

            {/* Aset Tetap */}
            <div className="space-y-2">
              <div className="font-bold text-slate-800 uppercase tracking-wide text-[11px]">
                Aset Tetap (Fixed Assets)
              </div>
              <div className="space-y-1.5 pl-3 border-l-2 border-slate-100">
                {balanceSheetData.fixedAssets.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-slate-700">
                    <span>
                      <strong className="text-slate-800 font-mono text-[11px] mr-1.5">{item.code}</strong>
                      {item.name}
                    </span>
                    <span className={`font-mono ${item.amount < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                      {item.amount < 0 ? `(${formatRupiah(Math.abs(item.amount), false)})` : formatRupiah(item.amount, false)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center py-1.5 px-2 bg-slate-50 rounded font-semibold text-slate-800">
                <span>Total Aset Tetap Bersih</span>
                <span className="font-mono text-indigo-700">{formatRupiah(balanceSheetData.totalFixedAssets)}</span>
              </div>
            </div>

            {/* Total Aset Box */}
            <div className="flex justify-between items-center p-3.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold text-sm">
              <span className="uppercase tracking-wide">TOTAL ASET (AKTIVA)</span>
              <span className="font-mono text-indigo-700 text-base">{formatRupiah(balanceSheetData.totalAssets)}</span>
            </div>
          </div>

          {/* KOLOM KANAN: LIABILITAS & EKUITAS (PASIVA) */}
          <div className="space-y-5">
            <div className="font-bold text-sm text-slate-900 uppercase pb-1.5 border-b-2 border-slate-800 flex justify-between">
              <span>Kewajiban & Ekuitas (Pasiva)</span>
              <span className="font-mono text-slate-800">IDR</span>
            </div>

            {/* Kewajiban / Liabilitas */}
            <div className="space-y-2">
              <div className="font-bold text-slate-800 uppercase tracking-wide text-[11px]">
                Kewajiban (Liabilities)
              </div>
              <div className="space-y-1.5 pl-3 border-l-2 border-slate-100">
                {balanceSheetData.currentLiabilities.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-slate-700">
                    <span>
                      <strong className="text-slate-800 font-mono text-[11px] mr-1.5">{item.code}</strong>
                      {item.name}
                    </span>
                    <span className="font-mono text-slate-900">{formatRupiah(item.amount, false)}</span>
                  </div>
                ))}
                {balanceSheetData.longTermLiabilities.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-slate-700">
                    <span>
                      <strong className="text-slate-800 font-mono text-[11px] mr-1.5">{item.code}</strong>
                      {item.name}
                    </span>
                    <span className="font-mono text-slate-900">{formatRupiah(item.amount, false)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center py-1.5 px-2 bg-slate-50 rounded font-semibold text-slate-800">
                <span>Total Kewajiban</span>
                <span className="font-mono text-slate-800">{formatRupiah(balanceSheetData.totalLiabilities)}</span>
              </div>
            </div>

            {/* Ekuitas Pemilik */}
            <div className="space-y-2">
              <div className="font-bold text-slate-800 uppercase tracking-wide text-[11px]">
                Ekuitas Pemilik (Owner's Equity)
              </div>
              <div className="space-y-1.5 pl-3 border-l-2 border-slate-100">
                {balanceSheetData.equityAccountsList.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-slate-700">
                    <span>
                      <strong className="text-slate-800 font-mono text-[11px] mr-1.5">{item.code}</strong>
                      {item.name}
                    </span>
                    <span className={`font-mono ${item.amount < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                      {item.amount < 0 ? `(${formatRupiah(Math.abs(item.amount), false)})` : formatRupiah(item.amount, false)}
                    </span>
                  </div>
                ))}

                {/* INJEKSI LABA BERSIH BERJALAN */}
                <div className="flex justify-between items-center text-emerald-800 bg-emerald-50/70 p-1.5 rounded border border-emerald-200/60">
                  <span className="font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Laba Bersih Periode Berjalan
                  </span>
                  <span className="font-mono font-bold text-emerald-700">
                    {formatRupiah(balanceSheetData.currentYearEarnings, false)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center py-1.5 px-2 bg-slate-50 rounded font-semibold text-slate-800">
                <span>Total Ekuitas (+ Laba Berjalan)</span>
                <span className="font-mono text-indigo-700">{formatRupiah(balanceSheetData.totalFinalEquity)}</span>
              </div>
            </div>

            {/* Total Pasiva Box */}
            <div className="flex justify-between items-center p-3.5 rounded-lg bg-slate-900 text-white font-bold text-sm shadow-sm">
              <span className="uppercase tracking-wide">TOTAL KEWAJIBAN & EKUITAS</span>
              <span className="font-mono text-emerald-400 text-base">{formatRupiah(balanceSheetData.totalLiabilitiesAndEquity)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Neraca;
