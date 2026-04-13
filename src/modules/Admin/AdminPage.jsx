// src/modules/Admin/AdminPage.jsx
import React, { useState } from 'react';
import styles from '../../assets/styles/EstilosGenerales.module.css';

// Importamos Auth (Ruta corregida según tu estructura: ../Auth/...)
import Login from '../Auth/Login';
import { useAuth } from '../Auth/useAuth';

// Importamos las pestañas de Admin
import Pedidos from './Tabs/Pedidos/Pedidos';
import NuevoPedido from './Tabs/NuevoPedido/NuevoPedido'; 
import ChecklistPedido from './Tabs/Pedidos/ChecklistPedido'; 
import Historial from './Tabs/Historial/Historial';
import Productos from './Tabs/Productos/Productos'; 

// Sub-pestañas de Configuración
import Configuracion from './Tabs/Configuracion/Configuracion';
import Proveedores from './Tabs/Configuracion/Proveedores';
import Trabajadores from './Tabs/Configuracion/Trabajadores';
import Sucursales from './Tabs/Configuracion/Sucursales';

export default function AdminPage() {
  const { usuario, cerrarSesion } = useAuth();
  
  // Estado de navegación
  const [tabActiva, setTabActiva] = useState('pedidos');
  const [ordenIdSeleccionada, setOrdenIdSeleccionada] = useState(null);

  // --- ESCUDO DE SEGURIDAD ---
  if (!usuario) {
    return <Login onLoginSuccess={() => window.location.reload()} />;
  }

  const abrirChecklist = (id) => {
    setOrdenIdSeleccionada(id);
    setTabActiva('checklist');
  };

  const renderizarTab = () => {
    switch (tabActiva) {
      case 'pedidos':
        return <Pedidos onNuevoPedido={() => setTabActiva('nuevo_pedido')} onVerLista={abrirChecklist} />;
      
      case 'nuevo_pedido':
        return <NuevoPedido onVolver={() => setTabActiva('pedidos')} />;

      case 'checklist':
        return <ChecklistPedido ordenId={ordenIdSeleccionada} onVolver={() => setTabActiva('pedidos')} />;
      
      case 'historial':
        return <Historial onVerDetalle={abrirChecklist} />;
      
      // Ajustes: Solo si es Gerente
      case 'configuracion':
        return (
          <Configuracion 
            onAbrirProductos={() => setTabActiva('productos')} 
            onAbrirProveedores={() => setTabActiva('proveedores')}
            onAbrirTrabajadores={() => setTabActiva('trabajadores')}
            onAbrirSucursales={() => setTabActiva('sucursales')}
            onLogout={cerrarSesion}
          />
        );
      
      case 'productos':
        return <Productos onVolver={() => setTabActiva('configuracion')} />;

      case 'proveedores':
        return <Proveedores onVolver={() => setTabActiva('configuracion')} />;

      case 'trabajadores':
        return <Trabajadores onVolver={() => setTabActiva('configuracion')} />;

      case 'sucursales':
        return <Sucursales onVolver={() => setTabActiva('configuracion')} />;
      
      default:
        return <Pedidos onNuevoPedido={() => setTabActiva('nuevo_pedido')} onVerLista={abrirChecklist} />;
    }
  };

  return (
    <div className={styles.appContainer} style={{ padding: 0 }}> 
      
      <main className={styles.mainContent} style={{ padding: 'var(--space-md)', paddingBottom: '100px' }}>
        
        {/* Banner de Usuario Superior */}
        <header style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 'var(--space-md)',
          padding: '8px 4px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>person</span>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                    Hola, <b>{usuario.nombre}</b> <span style={{ opacity: 0.6 }}>({usuario.rol})</span>
                </p>
            </div>
            {tabActiva !== 'configuracion' && (
                <button onClick={cerrarSesion} style={{ background: 'none', border: 'none', color: 'var(--color-tertiary)', display: 'flex' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>logout</span>
                </button>
            )}
        </header>

        {renderizarTab()}
      </main>

      {/* Navegación Inferior Dinámica */}
      <nav className={styles.bottomNav} style={{ 
        display: 'grid', 
        gridTemplateColumns: usuario.rol === 'Gerente' ? '1fr 1fr 1fr' : '1fr 1fr' 
      }}>
        
        <button 
          className={`${styles.navItem} ${['pedidos', 'nuevo_pedido', 'checklist'].includes(tabActiva) ? styles.active : ''}`}
          onClick={() => setTabActiva('pedidos')}
        >
          <span className="material-symbols-outlined">format_list_bulleted</span>
          <span>Activos</span>
        </button>

        <button 
          className={`${styles.navItem} ${tabActiva === 'historial' ? styles.active : ''}`}
          onClick={() => setTabActiva('historial')}
        >
          <span className="material-symbols-outlined">history</span>
          <span>Historial</span>
        </button>

        {/* Solo el Gerente ve el botón de Ajustes */}
        {usuario.rol === 'Gerente' && (
          <button 
            className={`${styles.navItem} ${['configuracion', 'productos', 'proveedores', 'trabajadores', 'sucursales'].includes(tabActiva) ? styles.active : ''}`}
            onClick={() => setTabActiva('configuracion')}
          >
            <span className="material-symbols-outlined">settings</span>
            <span>Ajustes</span>
          </button>
        )}

      </nav>
    </div>
  );
}