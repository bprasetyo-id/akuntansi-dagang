import React, { useState } from 'react';
import { NavLink, Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  BarChart3,
  LogOut,
  Building2,
  Menu,
  X,
  User,
  Shield,
  ChevronRight,
  Calendar
} from 'lucide-react';

export const Layout = () => {
  const { user, profile, loading, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 1. Loading state saat verifikasi sesi
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 text-sm font-medium">Memuat Sesi Keuangan...</p>
      </div>
    );
  }

  // 2. Proteksi Akses: Redirect ke /login jika belum login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const handleLogout = async () => {
    if (window.confirm('Apakah Anda yakin ingin keluar dari sistem akuntansi?')) {
      try {
        await signOut();
        navigate('/login', { replace: true });
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Bagan Akun (COA)', path: '/accounts', icon: BookOpen },
    { name: 'Kas Masuk', path: '/kas-masuk', icon: ArrowDownLeft },
    { name: 'Kas Keluar', path: '/kas-keluar', icon: ArrowUpRight },
    { name: 'Jurnal Umum', path: '/jurnal-manual', icon: FileText },
    { name: 'Laporan Keuangan', path: '/reports', icon: BarChart3 },
  ];

  const currentRole = profile?.role || 'accountant';
  const roleDisplayNames = {
    owner: 'Owner / Direktur',
    accountant: 'Akuntan Senior',
    cashier: 'Kasir Keuangan',
    auditor: 'Auditor Independen'
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans">
      {/* Mobile Top Navbar */}
      <div className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight">Akuntansi Dagang</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-transform duration-200 md:static md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800/80 bg-slate-950/40">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-white tracking-tight">SIA Dagang</div>
              <div className="text-[10px] text-indigo-400 font-medium uppercase tracking-wider">Enterprise ERP</div>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            <div className="px-3 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Menu Utama
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition duration-150 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800/80 bg-slate-950/30">
          <div className="flex items-center gap-3 mb-3 p-2 rounded-lg bg-slate-800/40">
            <div className="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
              <User className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-slate-200 truncate">
                {profile?.full_name || user.email?.split('@')[0] || 'User Akuntansi'}
              </div>
              <div className="text-[11px] text-indigo-400 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                <span className="truncate">{roleDisplayNames[currentRole] || currentRole}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition duration-150 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500 font-medium">Akuntansi Dagang</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="text-slate-800 font-semibold capitalize">
              {location.pathname === '/' 
                ? 'Dashboard' 
                : navItems.find((n) => n.path === location.pathname)?.name || location.pathname.replace('/', '')}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 font-medium">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>Periode: Oktober 2026</span>
            </div>

            <NavLink
              to="/jurnal-manual"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition"
            >
              + Transaksi Baru
            </NavLink>
          </div>
        </header>

        <main className="p-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
