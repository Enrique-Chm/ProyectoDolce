import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Importamos la página de Admin que ya configuramos con CSS Modules
import AdminPage from './modules/Admin/AdminPage';

// Otros componentes que podrías tener (ejemplos)
// import POSPage from './modules/POS/POSPage';
// import InventoryPage from './modules/Inventory/InventoryPage';

function App() {
  /**
   * NOTA: Hemos eliminado useTheme() y cualquier lógica de 
   * inyección global de CSS para que cada módulo use sus propios .module.css
   */

  return (
    <Router>
      <div className="app-main-container">
        <Routes>
          {/* Ruta principal: por ahora redirige a Admin para probar los cambios */}
          <Route path="/" element={<Navigate to="/admin" replace />} />

          {/* Módulo de Administración (Independiente) */}
          <Route path="/admin" element={<AdminPage />} />

          {/* Rutas futuras
          <Route path="/pos" element={<POSPage />} />
          <Route path="/inventario" element={<InventoryPage />} />
          */}

          {/* Fallback para rutas no encontradas */}
          <Route path="*" element={
            <div style={{ textAlign: 'center', padding: '100px', fontFamily: 'sans-serif' }}>
              <h1>404</h1>
              <p>Página no encontrada</p>
              <a href="/admin" style={{ color: '#005696', fontWeight: 'bold' }}>Volver al Admin</a>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;