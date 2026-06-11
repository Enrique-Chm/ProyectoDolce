// src/App.jsx
import React from 'react';
import AdminPage from './modules/Admin/AdminPage';
import Login from './modules/Auth/Login'; // Importamos Login aquí
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './modules/Auth/useAuth'; // Usamos el hook aquí

// Creamos un componente interno para poder usar el hook useAuth
// (ya que App no puede usar useAuth si es quien provee el AuthProvider)
function AppContent() {
  const { usuario } = useAuth();

  // ESCUDO GLOBAL:
  // Si no hay usuario, mostramos Login.
  // Si hay usuario, montamos AdminPage desde cero.
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