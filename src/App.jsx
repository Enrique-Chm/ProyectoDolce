import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSessionGuard } from './hooks/useSessionGuard'; // Importamos el guardia

// Importamos la página de Admin
import AdminPage from './modules/Admin/AdminPage';

function App() {
  /**
   * ACTIVAMOS EL GUARDIA DE SESIÓN ÚNICA
   * Este hook vigila en tiempo real si el session_id del usuario cambia en la DB.
   */
  useSessionGuard();

  return (
    <Router>
      <div className="app-main-container">
        <Routes>
          {/* Ruta principal: redirige a Admin */}
          <Route path="/" element={<Navigate to="/admin" replace />} />

          {/* Módulo de Administración */}
          <Route path="/admin" element={<AdminPage />} />

          {/* Fallback para rutas no encontradas */}
          <Route path="*" element={
            <div style={{ textAlign: 'center', padding: '100px', fontFamily: 'sans-serif' }}>
              <h1 style={{ fontSize: '4rem', color: '#cbd5e1', margin: 0 }}>404</h1>
              <p style={{ color: '#64748b', marginBottom: '20px' }}>Página no encontrada</p>
              <a href="/admin" style={{ 
                color: '#005696', 
                fontWeight: 'bold', 
                textDecoration: 'none',
                border: '1px solid #005696',
                padding: '10px 20px',
                borderRadius: '8px'
              }}>Volver al Admin</a>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;