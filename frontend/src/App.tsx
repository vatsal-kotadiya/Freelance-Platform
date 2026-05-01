import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import BrowseProjectsPage from './pages/BrowseProjectsPage';
import CreateProjectPage from './pages/CreateProjectPage';
import EditProjectPage from './pages/EditProjectPage';
import MyProjectsPage from './pages/MyProjectsPage';
import MyBidsPage from './pages/MyBidsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import ProfilePage from './pages/ProfilePage';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuthStore } from './store/authStore';
import { getMe } from './api/auth';

export default function App() {
  const { token, setAuth, logout } = useAuthStore();
  const [checking, setChecking] = useState(!!token);

  useEffect(() => {
    if (!token) {
      setChecking(false);
      return;
    }
    // Validate the stored token against the DB on every app load.
    // If the user was deleted (e.g. after a DB reset) this returns 401
    // and we auto-logout so the user sees the login page cleanly.
    getMe()
      .then(({ user }) => setAuth(token, user))
      .catch(() => logout())
      .finally(() => setChecking(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />

          <Route element={<ProtectedRoute requiredRole="CLIENT" />}>
            <Route path="/my-projects" element={<MyProjectsPage />} />
            <Route path="/create-project" element={<CreateProjectPage />} />
            <Route path="/projects/:id/edit" element={<EditProjectPage />} />
          </Route>

          <Route element={<ProtectedRoute requiredRole="FREELANCER" />}>
            <Route path="/projects" element={<BrowseProjectsPage />} />
            <Route path="/my-bids" element={<MyBidsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
