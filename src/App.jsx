import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import KasMasuk from './pages/KasMasuk';
import KasKeluar from './pages/KasKeluar';
import JurnalManual from './pages/JurnalManual';
import Reports from './pages/Reports';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Financial Routes inside Layout */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="accounts" element={<Accounts />} />
            <Route path="kas-masuk" element={<KasMasuk />} />
            <Route path="cash-in" element={<KasMasuk />} />
            <Route path="kas-keluar" element={<KasKeluar />} />
            <Route path="cash-out" element={<KasKeluar />} />
            <Route path="jurnal-manual" element={<JurnalManual />} />
            <Route path="journal" element={<JurnalManual />} />
            <Route path="reports" element={<Reports />} />
          </Route>

          {/* Fallback Catch-all Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
