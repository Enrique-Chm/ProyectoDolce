// src/App.jsx
import React from 'react';
import AdminPage from './modules/Admin/AdminPage';
import Login from './modules/Auth/Login';
import { Toaster } from 'react-hot-toast';
// ✅ CORRECCIÓN: AuthProvider viene de AuthContext, useAuth viene de useAuth
import { AuthProvider } from './modules/Auth/AuthContext'; 
import { useAuth } from './modules/Auth/useAuth';

function AppContent() {
  const { usuario } = useAuth();

  if (!usuario) {
    return <Login />;
  }

  return <AdminPage />;
}

function App() {
  return (
    <AuthProvider>
      <Toaster position="bottom-center" reverseOrder={false} />
      <AppContent />
    </AuthProvider>
  );
}

export default App;