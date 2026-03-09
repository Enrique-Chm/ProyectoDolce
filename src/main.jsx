import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Cambiamos la ruta para usar el archivo maestro que configuramos
import './index.css'; 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);