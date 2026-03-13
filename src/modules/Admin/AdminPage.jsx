// Archivo: src/modules/Admin/AdminPage.jsx
import React, { useState, useEffect } from "react";
import s from "./AdminPage.module.css";
import { authService } from "../../services/Auth.service";
import { sucursalesService } from "../../services/Sucursales.service";
import { useSessionGuard } from "../../hooks/useSessionGuard";

// Componentes de las pestañas
import { Login } from "./Login";
import { AnaliticaTab } from "./components/AnaliticaTab"; // Nueva Tab integrada
import { ConfigTab } from "./components/ConfigTab"; 
import { ProveedoresTab } from "./components/ProveedoresTab";
import { InsumosTab } from "./components/InsumosTab";
import { RecetasTab } from "./components/RecetasTab";
import { ProductosTab } from "./components/ProductosTab";
import { EmpleadosTab } from "./components/EmpleadosTab";
import { MeseroTab } from "./components/MeseroTab"; 
import { CajeroTab } from "./components/CajeroTab";
import { ImpresorasTab } from "./components/ImpresorasTab";
import InventariosTab from "./components/InventariosTab"; 
import EstimacionesTab from "./components/EstimacionesTab"; 

const AdminPage = () => {
  /**
   * 🛡️ VIGILANCIA DE SESIÓN ACTIVA
   */
  useSessionGuard();

  const [userSession, setUserSession] = useState(authService.getCurrentSession());
  const [activeTab, setActiveTab] = useState('analitica'); // Analítica como tab inicial
  const [filterSucursal, setFilterSucursal] = useState(userSession?.user?.sucursal_id || 1);
  const [listaSucursales, setListaSucursales] = useState([]);

  const isAdmin = userSession?.user?.roles?.nombre_rol === 'Administrador';

  useEffect(() => {
    if (userSession) { 
      cargarSucursales(); 
    }
  }, [userSession]);

  const cargarSucursales = async () => {
    const { data } = await sucursalesService.getAll();
    setListaSucursales(data || []);
  };

  /**
   * 📋 CONFIGURACIÓN DE NAVEGACIÓN (RBAC)
   */
  const getTabsConfig = () => [
    { id: 'analitica', label: 'Dashboard Analítica', permiso: 'ver_config' }, // Permiso de nivel admin
    { id: 'mesero', label: 'Mesero (Ventas)', permiso: 'ver_ventas' },
    { id: 'cajero', label: 'Caja (Cobros)', permiso: 'ver_ventas' },
    { id: 'insumos', label: 'Catálogo Insumos', permiso: 'ver_insumos' },
    { id: 'kardex', label: 'Auditoría Inventarios', permiso: 'ver_insumos' }, 
    { id: 'estimaciones', label: 'Proyección Compras', permiso: 'ver_insumos' },
    { id: 'recetas', label: 'Recetas', permiso: 'ver_recetas' },
    { id: 'productos', label: 'Productos', permiso: 'ver_productos' },
    { id: 'proveedores', label: 'Proveedores', permiso: 'ver_proveedores' },
    { id: 'empleados', label: 'Empleados', permiso: 'ver_empleados' },
    { id: 'impresoras', label: 'Impresoras', permiso: 'ver_config' }, 
    { id: 'config', label: 'Configuración', permiso: 'ver_config' } 
  ];

  const visibleTabs = getTabsConfig().filter(tab => {
    if (!userSession) return false;
    if (isAdmin) return true;
    
    // Casos especiales para configuración
    if (tab.id === 'config' || tab.id === 'impresoras' || tab.id === 'analitica') {
      return userSession.permisos.includes('ver_unidades') || 
             userSession.permisos.includes('ver_categorias') || 
             userSession.permisos.includes('ver_config');
    }
    return userSession.permisos.includes(tab.permiso);
  });

  const handleLogout = () => {
    authService.logout();
    setUserSession(null);
  };

  if (!userSession) {
    return <Login onLoginSuccess={(session) => setUserSession(session)} />;
  }

  return (
    <div className={s.adminContainer}>
      
      {/* BARRA LATERAL (SIDEBAR FIJO) */}
      <aside className={s.sidebar}>
        <div className={s.sidebarHeader}>
          <h2>CloudKitchen <span style={{ color: 'var(--color-primary)' }}>Admin</span></h2>
        </div>
        
        <nav className={s.sidebarNav}>
          {visibleTabs.map((tab) => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)} 
              className={`${s.navItem} ${activeTab === tab.id ? s.activeNavItem : ''}`}
            >
              {tab.label.toUpperCase()}
            </button>
          ))}
        </nav>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className={s.mainContent}>
        <header className={s.topBar}>
          <div className={s.userInfo}>
            {isAdmin && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-text-muted)' }}>
                  SUCURSAL:
                </label>
                <select 
                  style={{ 
                    padding: '8px 12px', 
                    borderRadius: 'var(--radius-ui)', 
                    border: '1px solid var(--color-border)',
                    fontSize: '0.9rem',
                    background: 'white'
                  }}
                  value={filterSucursal} 
                  onChange={(e) => setFilterSucursal(parseInt(e.target.value))}
                >
                  {listaSucursales.map(suc => (
                    <option key={suc.id} value={suc.id}>{suc.nombre}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span className={s.userName}>
              {userSession.user.nombre} 
              <small style={{ display: 'block', fontSize: '10px', color: 'var(--color-text-muted)', textAlign: 'right' }}>
                {!isAdmin ? `Sucursal: ${userSession.user.sucursal_id}` : 'Administrador Global'}
              </small>
            </span>
            <button onClick={handleLogout} className={s.btnLogout}>
              SALIR ✕
            </button>
          </div>
        </header>

        {/* CONTENIDO DE TABS DINÁMICO */}
        <section className={s.tabContent}>
           {activeTab === 'analitica' && <AnaliticaTab sucursalId={filterSucursal} />}
           {activeTab === 'mesero' && <MeseroTab sucursalId={filterSucursal} usuarioId={userSession.user.id} />}
           {activeTab === 'cajero' && <CajeroTab sucursalId={filterSucursal} usuarioId={userSession.user.id} />}
           {activeTab === 'insumos' && <InsumosTab sucursalId={filterSucursal} />}
           {activeTab === 'kardex' && <InventariosTab sucursalId={filterSucursal} usuarioId={userSession.user.id} />}
           {activeTab === 'estimaciones' && <EstimacionesTab sucursalId={filterSucursal} />}
           {activeTab === 'recetas' && <RecetasTab sucursalId={filterSucursal} />}
           {activeTab === 'productos' && <ProductosTab sucursalId={filterSucursal} />}
           {activeTab === 'proveedores' && <ProveedoresTab sucursalId={filterSucursal} />}
           {activeTab === 'empleados' && <EmpleadosTab />}
           {activeTab === 'impresoras' && <ImpresorasTab sucursalId={filterSucursal} />}
           {activeTab === 'config' && <ConfigTab />}
        </section>
      </main>
    </div>
  );
};

export default AdminPage;