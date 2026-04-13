// src/App.jsx
import React from 'react';
import AdminPage from './modules/Admin/AdminPage';
import { Toaster } from 'react-hot-toast'; // <-- 1. Importa esto

function App() {
  return (
    <>
      {/* 2. Coloca el Toaster aquí arriba (puede ir en cualquier parte dentro del return) */}
      <Toaster position="bottom-center" reverseOrder={false} /> 
      
      <AdminPage />
    </>
  );
}

export default App;