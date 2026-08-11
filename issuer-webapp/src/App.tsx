import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { IssueWizard } from './pages/IssueWizard/IssueWizard';
import { CredentialsList } from './pages/CredentialsList';
import { CredentialDetail } from './pages/CredentialDetail';
import type { ReactNode } from 'react';

function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/issue" replace /> : <LoginPage />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <SettingsProvider>
              <Layout>
                <Routes>
                  <Route path="/issue" element={<IssueWizard />} />
                  <Route path="/credentials" element={<CredentialsList />} />
                  <Route path="/credentials/:id" element={<CredentialDetail />} />
                  <Route path="*" element={<Navigate to="/issue" replace />} />
                </Routes>
              </Layout>
            </SettingsProvider>
          </RequireAuth>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
