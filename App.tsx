import React from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import NgoDashboardPage from './pages/NgoDashboardPage';
import ResourceFormPage from './pages/ResourceFormPage';
import PendingApprovalPage from './pages/PendingApprovalPage';
import ProtectedRoute from './components/ProtectedRoute';
import DonationsPage from './pages/DonationsPage';
import ResourceDetailPage from './pages/ResourceDetailPage';

const AppContent: React.FC = () => {
  const location = useLocation();
  const hasFullWidthLayout = ['/'].includes(location.pathname);

  const mainClasses = hasFullWidthLayout
    ? "flex-grow"
    : "flex-grow container mx-auto px-4 py-8";

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className={mainClasses}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/pending-approval" element={<PendingApprovalPage />} />
          
          <Route path="/doacoes" element={<ProtectedRoute userType="organization"><DonationsPage /></ProtectedRoute>} />
          <Route path="/painel-ong" element={<ProtectedRoute userType="organization"><NgoDashboardPage /></ProtectedRoute>} />
          <Route path="/painel-ong/recursos/novo" element={<ProtectedRoute userType="organization"><ResourceFormPage /></ProtectedRoute>} />
          <Route path="/painel-ong/recursos/editar/:type/:id" element={<ProtectedRoute userType="organization"><ResourceFormPage /></ProtectedRoute>} />
          <Route path="/recurso/:type/:id" element={<ProtectedRoute userType="organization"><ResourceDetailPage /></ProtectedRoute>} />

        </Routes>
      </main>
      <footer className="bg-gray-800 text-white text-center p-4">
        <p>&copy; 2024 PetConnect. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <DataProvider>
        <HashRouter>
          <AppContent />
        </HashRouter>
      </DataProvider>
    </AuthProvider>
  );
};

export default App;