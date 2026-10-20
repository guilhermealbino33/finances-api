import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AccountsPage } from '@/pages/AccountsPage';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { PartiesPage } from '@/pages/PartiesPage';
import { PeriodPage } from '@/pages/PeriodPage';
import { paths } from '@/paths';

export default function App() {
  return (
    <Routes>
      <Route path={paths.login} element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path={paths.home} element={<HomePage />} />
        <Route path={paths.accounts} element={<AccountsPage />} />
        <Route path={paths.parties} element={<PartiesPage />} />
        <Route path="/meses/:year/:month" element={<PeriodPage />} />
      </Route>
      <Route path="*" element={<Navigate to={paths.home} replace />} />
    </Routes>
  );
}
