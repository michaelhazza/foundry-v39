import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Auth pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// Protected pages
import DashboardPage from './pages/DashboardPage';
import ProjectsListPage from './pages/projects/ProjectsListPage';
import CreateProjectPage from './pages/projects/CreateProjectPage';
import ProjectDetailPage from './pages/projects/ProjectDetailPage';
import EditProjectPage from './pages/projects/EditProjectPage';
import ProjectSettingsPage from './pages/projects/ProjectSettingsPage';
import UploadDataPage from './pages/data-sources/UploadDataPage';
import ConnectAPIPage from './pages/data-sources/ConnectAPIPage';
import DataSourceDetailPage from './pages/data-sources/DataSourceDetailPage';
import ProcessingJobsPage from './pages/processing/ProcessingJobsPage';
import JobDetailPage from './pages/processing/JobDetailPage';
import ConfigureProcessingPage from './pages/processing/ConfigureProcessingPage';
import DatasetsPage from './pages/datasets/DatasetsPage';
import ExportDatasetPage from './pages/datasets/ExportDatasetPage';
import UsersPage from './pages/users/UsersPage';
import InviteUserPage from './pages/users/InviteUserPage';
import OrganizationSettingsPage from './pages/settings/OrganizationSettingsPage';
import ProfilePage from './pages/settings/ProfilePage';

function ProtectedRoute({ children, requiredRoles }: { children: React.ReactNode; requiredRoles?: string[] }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && user && !requiredRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected routes */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />

      {/* Projects */}
      <Route path="/projects" element={<ProtectedRoute><ProjectsListPage /></ProtectedRoute>} />
      <Route path="/projects/new" element={<ProtectedRoute requiredRoles={['admin', 'member']}><CreateProjectPage /></ProtectedRoute>} />
      <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetailPage /></ProtectedRoute>} />
      <Route path="/projects/:id/edit" element={<ProtectedRoute requiredRoles={['admin', 'member']}><EditProjectPage /></ProtectedRoute>} />
      <Route path="/projects/:id/settings" element={<ProtectedRoute requiredRoles={['admin', 'member']}><ProjectSettingsPage /></ProtectedRoute>} />

      {/* Data Sources */}
      <Route path="/projects/:projectId/upload" element={<ProtectedRoute requiredRoles={['admin', 'member']}><UploadDataPage /></ProtectedRoute>} />
      <Route path="/projects/:projectId/connect-api" element={<ProtectedRoute requiredRoles={['admin', 'member']}><ConnectAPIPage /></ProtectedRoute>} />
      <Route path="/projects/:projectId/data-sources/:id" element={<ProtectedRoute><DataSourceDetailPage /></ProtectedRoute>} />

      {/* Processing */}
      <Route path="/projects/:projectId/jobs" element={<ProtectedRoute><ProcessingJobsPage /></ProtectedRoute>} />
      <Route path="/projects/:projectId/jobs/:id" element={<ProtectedRoute><JobDetailPage /></ProtectedRoute>} />
      <Route path="/projects/:projectId/configure" element={<ProtectedRoute requiredRoles={['admin', 'member']}><ConfigureProcessingPage /></ProtectedRoute>} />

      {/* Datasets */}
      <Route path="/projects/:projectId/datasets" element={<ProtectedRoute><DatasetsPage /></ProtectedRoute>} />
      <Route path="/projects/:projectId/datasets/:id/export" element={<ProtectedRoute><ExportDatasetPage /></ProtectedRoute>} />

      {/* Users */}
      <Route path="/users" element={<ProtectedRoute requiredRoles={['admin']}><UsersPage /></ProtectedRoute>} />
      <Route path="/users/invite" element={<ProtectedRoute requiredRoles={['admin']}><InviteUserPage /></ProtectedRoute>} />

      {/* Settings */}
      <Route path="/settings/organization" element={<ProtectedRoute requiredRoles={['admin']}><OrganizationSettingsPage /></ProtectedRoute>} />
      <Route path="/settings/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
