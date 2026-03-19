// Archivo: src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; // 👈 IMPORTANTE: Importamos el Toaster

// Importamos la página de Admin
import AdminPage from './modules/Admin/AdminPage';
// Importamos la página de Login
import { Login } from './modules/Admin/Login';

function App() {
  // 🛑 ELIMINAMOS useSessionGuard() DE AQUÍ 
  // Ahora el guardia solo vivirá dentro de AdminPage.jsx o donde realmente haya una sesión activa.

  return (
    <Router>
      {/* 👈 Aquí vive el Toaster: escuchará las notificaciones de cualquier parte de tu app */}
      <Toaster position="top-right" reverseOrder={false} />

      <div className="app-main-container">
        <Routes>
          {/* Ruta principal: redirige a /home (Ajustado para que coincida con tu ruta de abajo) */}
          <Route path="/" element={<Navigate to="/home" replace />} />

          {/* Ruta oficial de Login */}
          <Route path="/login" element={<Login />} />

          {/* Módulo de Administración */}
          <Route path="/home" element={<AdminPage />} />

          {/* Fallback para rutas no encontradas */}
          <Route path="*" element={
            <div style={{ textAlign: 'center', padding: '100px', fontFamily: 'sans-serif' }}>
              <h1 style={{ fontSize: '4rem', color: '#cbd5e1', margin: 0 }}>404</h1>
              <p style={{ color: '#64748b', marginBottom: '20px' }}>Página no encontrada</p>
              <a href="/home" style={{ 
                color: '#005696', 
                fontWeight: 'bold', 
                textDecoration: 'none',
                border: '1px solid #005696',
                padding: '10px 20px',
                borderRadius: '8px'
              }}>Volver al Inicio</a>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;