// src/modules/Admin/AdminPage.jsx
import React, { useState } from 'react';
import styles from '../../assets/styles/EstilosGenerales.module.css';

// Importamos Auth
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
import Roles from './Tabs/Configuracion/Roles'; // <-- Nuevo componente importado

export default function AdminPage() {
  const { usuario, cerrarSesion } = useAuth();
  
  // Estado de navegación
  const [tabActiva, setTabActiva] = useState('pedidos');
  const [ordenIdSeleccionada, setOrdenIdSeleccionada] = useState(null);

  // --- ESCUDO DE SEGURIDAD ---
  if (!usuario) {
    return <Login onLoginSuccess={() => window.location.reload()} />;
  }

  // Extraemos los permisos para facilitar la lectura en el código
  // Asumimos que el objeto usuario tiene: { ..., rol: { nombre: '...', permisos: { ... } } }
  const permisos = usuario.permisos || {};

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
      
      case 'configuracion':
        return (
          <Configuracion 
            onAbrirProductos={() => setTabActiva('productos')} 
            onAbrirProveedores={() => setTabActiva('proveedores')}
            onAbrirTrabajadores={() => setTabActiva('trabajadores')}
            onAbrirSucursales={() => setTabActiva('sucursales')}
            onAbrirRoles={() => setTabActiva('roles')} // <-- Nuevo callback
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
      
      case 'roles': // <-- Caso para la nueva pestaña
        return <Roles onVolver={() => setTabActiva('configuracion')} />;
      
      default:
        return <Pedidos onNuevoPedido={() => setTabActiva('nuevo_pedido')} onVerLista={abrirChecklist} />;
    }
  };

  // Variable para controlar si el usuario puede ver el botón de Ajustes
  // Ahora depende de si tiene permiso de 'leer' en el módulo de configuración
  const puedeConfigurar = permisos.configuracion?.leer || false;

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
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                      Hola, <b>{usuario.nombre_completo || usuario.nombre}</b>
                  </p>
                  <span style={{ fontSize: '0.65rem', opacity: 0.7, color: 'var(--color-primary)', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    {usuario.rol_nombre || 'Usuario'}
                  </span>
                </div>
            </div>
            {tabActiva !== 'configuracion' && (
                <button onClick={cerrarSesion} style={{ background: 'none', border: 'none', color: 'var(--color-tertiary)', display: 'flex', cursor: 'pointer' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>logout</span>
                </button>
            )}
        </header>

        {renderizarTab()}
      </main>

      {/* Navegación Inferior Dinámica */}
      <nav className={styles.bottomNav} style={{ 
        display: 'grid', 
        // Si tiene permiso de configuración, dividimos en 3 columnas, si no, en 2.
        gridTemplateColumns: puedeConfigurar ? '1fr 1fr 1fr' : '1fr 1fr' 
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

        {/* El botón de Ajustes ahora es dinámico por permiso JSON */}
        {puedeConfigurar && (
          <button 
            className={`${styles.navItem} ${['configuracion', 'productos', 'proveedores', 'trabajadores', 'sucursales', 'roles'].includes(tabActiva) ? styles.active : ''}`}
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