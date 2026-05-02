// src/modules/Admin/AdminPage.jsx
import React, { useState, useEffect } from 'react';
import styles from '../../assets/styles/EstilosGenerales.module.css';

// Importamos Auth
import Login from '../Auth/Login';
import { useAuth } from '../Auth/useAuth';
import { AuthService } from '../Auth/Auth.service';
import { supabase } from '../../lib/supabaseClient';

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
import Roles from './Tabs/Configuracion/Roles'; 
import Categorias from './Tabs/Configuracion/Categorias';

export default function AdminPage() {
  const { usuario, cerrarSesion } = useAuth();
  
  // Estado de navegación
  const [tabActiva, setTabActiva] = useState('pedidos');
  const [ordenIdSeleccionada, setOrdenIdSeleccionada] = useState(null);

  // Estados locales para simulación
  const [rolesSimulacion, setRolesSimulacion] = useState([]);
  const [rolA_Simular, setRolA_Simular] = useState('');

  // Identificación de permisos de Administrador
  const esAdminReal = AuthService.getSesionReal()?.rol_nombre === 'Administrador';
  const simulandoActivo = AuthService.estaSimulando();

  // Cargamos los roles disponibles únicamente si somos administradores reales
  useEffect(() => {
    if (esAdminReal && rolesSimulacion.length === 0) {
      const cargarRolesSimulacion = async () => {
        const { data } = await supabase
          .from('Cat_Roles')
          .select('id, nombre, permisos')
          .order('nombre');
        
        if (data) {
          // Filtramos para no simular al mismo Administrador
          setRolesSimulacion(data.filter(r => r.nombre !== 'Administrador'));
        }
      };
      cargarRolesSimulacion();
    }
  }, [esAdminReal, rolesSimulacion.length]);

  // --- ESCUDO DE SEGURIDAD ---
  if (!usuario) {
    return <Login onLoginSuccess={() => window.location.reload()} />;
  }

  // Extraemos los permisos para facilitar la lectura en el código
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
            onAbrirRoles={() => setTabActiva('roles')} 
            onAbrirCategorias={() => setTabActiva('categorias')}
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
      
      case 'roles': 
        return <Roles onVolver={() => setTabActiva('configuracion')} />;

      case 'categorias':
        return <Categorias onVolver={() => setTabActiva('configuracion')} />;
      
      default:
        return <Pedidos onNuevoPedido={() => setTabActiva('nuevo_pedido')} onVerLista={abrirChecklist} />;
    }
  };

  const puedeConfigurar = permisos.configuracion?.leer || false;

  return (
    <div className={styles.appContainer} style={{ padding: 0 }}> 
      
      <main className={styles.mainContent} style={{ padding: 'var(--space-md)', paddingBottom: '100px' }}>
        
        {/* --- CABECERA DE USUARIO CON SIMULACIÓN INTEGRADA Y DISCRETA --- */}
        <header style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 'var(--space-md)',
          padding: '8px 4px',
          borderBottom: '1px solid var(--border-ghost)',
          paddingBottom: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="material-symbols-outlined" style={{ color: simulandoActivo ? '#ba1a1a' : 'var(--color-primary)', fontSize: '1.5rem' }}>
              {simulandoActivo ? 'visibility' : 'person'}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                Hola, <b>{usuario.nombre_completo || usuario.nombre}</b>
              </p>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                <span style={{ fontSize: '0.65rem', opacity: 0.8, color: simulandoActivo ? '#ba1a1a' : 'var(--color-primary)', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  {usuario.rol_nombre || 'Usuario'}
                </span>

                {/* Selección de rol rápida (Solo visible para el Admin Real) */}
                {esAdminReal && !simulandoActivo && (
                  <select 
                    value={rolA_Simular}
                    onChange={(e) => {
                      setRolA_Simular(e.target.value);
                      const rol = rolesSimulacion.find(r => r.id === e.target.value);
                      if (rol) AuthService.iniciarSimulacion(rol);
                    }}
                    style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      border: '1px solid var(--border-ghost)',
                      fontSize: '0.625rem',
                      backgroundColor: 'var(--color-surface-low)',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontWeight: '600',
                      outline: 'none'
                    }}
                  >
                    <option value="">Simular rol...</option>
                    {rolesSimulacion.map(r => (
                      <option key={r.id} value={r.id}>{r.nombre}</option>
                    ))}
                  </select>
                )}

                {/* Botón de salida del rol simulado */}
                {simulandoActivo && (
                  <button 
                    onClick={() => AuthService.detenerSimulacion()} 
                    style={{
                      backgroundColor: '#ba1a1a',
                      color: 'white',
                      border: 'none',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.6rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '2px'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '0.75rem' }}>cancel</span>
                    Salir
                  </button>
                )}
              </div>
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
            className={`${styles.navItem} ${['configuracion', 'productos', 'proveedores', 'trabajadores', 'sucursales', 'roles', 'categorias'].includes(tabActiva) ? styles.active : ''}`}
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