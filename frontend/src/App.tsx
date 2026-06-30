import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import AppLayout from '@/components/layout/AppLayout';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import BikesPage from '@/pages/bikes/BikesPage';
import FuelPage from '@/pages/fuel/FuelPage';
import ServicesPage from '@/pages/services/ServicesPage';
import ExpensesPage from '@/pages/expenses/ExpensesPage';
import RemindersPage from '@/pages/reminders/RemindersPage';
import StatsPage from '@/pages/stats/StatsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="bikes" element={<BikesPage />} />
        <Route path="fuel" element={<FuelPage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="reminders" element={<RemindersPage />} />
        <Route path="stats" element={<StatsPage />} />
      </Route>
    </Routes>
  );
}
