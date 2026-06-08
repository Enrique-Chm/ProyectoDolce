// src/App.jsx
import React from 'react';
import AdminPage from './modules/Admin/AdminPage';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './modules/Auth/AuthContext';

function App() {
  return (
    // AuthProvider envuelve toda la app para que cualquier componente
    // pueda acceder al estado de sesión via useAuth()
    <AuthProvider>
      <Toaster position="bottom-center" reverseOrder={false} />
      <AdminPage />
    </AuthProvider>
  );
}

export default App;