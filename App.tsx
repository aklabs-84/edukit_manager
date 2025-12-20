import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import InventoryFormPage from './components/InventoryFormPage';
import CategoryManager from './components/CategoryManager';
import LocationManager from './components/LocationManager';
import HowTo from './components/HowTo';
import StartPage from './components/StartPage';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import AdminSchoolEditPage from './components/AdminSchoolEditPage';

// 인증이 필요한 라우트를 보호하는 컴포넌트
const ProtectedRoute: React.FC<{ children: React.ReactNode; requireAdmin?: boolean }> = ({
  children,
  requireAdmin = false,
}) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/school/dashboard" replace />;
  }

  return <>{children}</>;
};

// 학교 사용자용 라우트
const SchoolRoutes: React.FC = () => {
  return (
    <Layout>
      <Routes>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="inventory/new" element={<InventoryFormPage />} />
        <Route path="categories" element={<CategoryManager />} />
        <Route path="locations" element={<LocationManager />} />
        <Route path="guide" element={<HowTo />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </Layout>
  );
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <Routes>
      {/* 공개 라우트 */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to={isAdmin ? '/admin' : '/school/dashboard'} replace />
          ) : (
            <StartPage />
          )
        }
      />
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* 관리자 라우트 */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/schools/:code"
        element={
          <ProtectedRoute requireAdmin>
            <AdminSchoolEditPage />
          </ProtectedRoute>
        }
      />

      {/* 학교 사용자 라우트 */}
      <Route
        path="/school/*"
        element={
          <ProtectedRoute>
            <SchoolRoutes />
          </ProtectedRoute>
        }
      />

      {/* 기본 리다이렉트 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppProvider>
        <LocationProvider>
          <HashRouter>
            <AppRoutes />
          </HashRouter>
        </LocationProvider>
      </AppProvider>
    </AuthProvider>
  );
};

export default App;
