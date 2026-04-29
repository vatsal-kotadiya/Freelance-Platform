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

export default function App() {
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
