import React, { useState } from 'react';
import BukuBesar from './reports/BukuBesar';
import NeracaSaldo from './reports/NeracaSaldo';
import LabaRugi from './reports/LabaRugi';
import Neraca from './reports/Neraca';
import { BookOpen, Scale, TrendingUp, Landmark } from 'lucide-react';

export const Reports = () => {
  const [activeTab, setActiveTab] = useState('laba_rugi'); // 'buku_besar', 'neraca_saldo', 'laba_rugi', 'neraca'

  const tabs = [
    { id: 'buku_besar', name: 'Buku Besar', icon: BookOpen },
    { id: 'neraca_saldo', name: 'Neraca Saldo', icon: Scale },
    { id: 'laba_rugi', name: 'Laba Rugi (Multi-Step)', icon: TrendingUp },
    { id: 'neraca', name: 'Neraca (Posisi Keuangan)', icon: Landmark },
  ];

  return (
    <div className="space-y-6">
      {/* Navigation Sub-Tabs */}
      <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Render Selected Financial Report */}
      <div className="transition-all duration-200">
        {activeTab === 'buku_besar' && <BukuBesar />}
        {activeTab === 'neraca_saldo' && <NeracaSaldo />}
        {activeTab === 'laba_rugi' && <LabaRugi />}
        {activeTab === 'neraca' && <Neraca />}
      </div>
    </div>
  );
};

export default Reports;

// Named exports for individual imports
export { BukuBesar, NeracaSaldo, LabaRugi, Neraca };
