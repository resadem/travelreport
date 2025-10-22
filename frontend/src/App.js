import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { I18nProvider } from './contexts/I18nContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ReservationDetails from './pages/ReservationDetails';
import SubAgencies from './pages/SubAgencies';
import Settings from './pages/Settings';
import Suppliers from './pages/Suppliers';
import Tourists from './pages/Tourists';
import Expenses from './pages/Expenses';
import Requests from './pages/Requests';
import RequestDetails from './pages/RequestDetails';
import TopUps from './pages/TopUps';
import { Toaster } from './components/ui/sonner';
import './App.css';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-picton-blue"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <I18nProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reservations/:id"
              element={
                <ProtectedRoute>
                  <ReservationDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sub-agencies"
              element={
                <ProtectedRoute adminOnly>
                  <SubAgencies />
                </ProtectedRoute>
              }
            />
            <Route
              path="/suppliers"
              element={
                <ProtectedRoute adminOnly>
                  <Suppliers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tourists"
              element={
                <ProtectedRoute adminOnly>
                  <Tourists />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute adminOnly>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/expenses"
              element={
                <ProtectedRoute>
                  <Expenses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/requests"
              element={
                <ProtectedRoute>
                  <Requests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/requests/:id"
              element={
                <ProtectedRoute>
                  <RequestDetails />
                </ProtectedRoute>
              }
            />
          </Routes>
          <Toaster position="top-right" />
        </BrowserRouter>
      </I18nProvider>
    </AuthProvider>
  );
}

export default App;