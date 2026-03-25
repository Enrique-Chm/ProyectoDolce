// Archivo: src/modules/Admin/AdminPage.jsx
import React, { useState, useEffect, useMemo, Suspense } from "react";
import { Navigate } from "react-router-dom";
import s from "./AdminPage.module.css";
import { authService } from "../../services/Auth.service";
import { sucursalesService } from "../../services/Sucursales.service";
import { useSessionGuard } from "../../hooks/useSessionGuard";

// 🚀 LAZY LOADING: Componentes de las pestañas
const AnaliticaTab = React.lazy(() => import("./components/AnaliticaTab").then(module => ({ default: module.AnaliticaTab })));
const ConfigTab = React.lazy(() => import("./components/ConfigTab").then(module => ({ default: module.ConfigTab }))); 
const ProveedoresTab = React.lazy(() => import("./components/ProveedoresTab").then(module => ({ default: module.ProveedoresTab })));
const InsumosTab = React.lazy(() => import("./components/InsumosTab").then(module => ({ default: module.InsumosTab })));
const RecetasTab = React.lazy(() => import("./components/RecetasTab").then(module => ({ default: module.RecetasTab })));
const ProductosTab = React.lazy(() => import("./components/ProductosTab").then(module => ({ default: module.ProductosTab })));
const EmpleadosTab = React.lazy(() => import("./components/EmpleadosTab").then(module => ({ default: module.EmpleadosTab })));
const MeseroTab = React.lazy(() => import("./components/MeseroTab").then(module => ({ default: module.MeseroTab }))); 
const ImpresorasTab = React.lazy(() => import("./components/ImpresorasTab").then(module => ({ default: module.ImpresorasTab })));
const GastosTab = React.lazy(() => import("./components/GastosTab").then(module => ({ default: module.GastosTab })));

const CajeroTab = React.lazy(() => import('./components/CajeroTab'));
const InventariosTab = React.lazy(() => import("./components/InventariosTab")); 
const EstimacionesTab = React.lazy(() => import("./components/EstimacionesTab")); 

const AdminPage = () => {
  useSessionGuard();

  const [userSession, setUserSession] = useState(authService.getCurrentSession());
  const isAdmin = userSession?.user?.rol === 'Administrador' || userSession?.user?.rol_id === 1;

  const tabsConfig = useMemo(() => [
    { id: 'analitica', label: 'Dashboard', permiso: 'ver_analitica' }, 
    { id: 'kardex', label: 'Inventarios', permiso: 'ver_inventario' },
    { id: 'estimaciones', label: 'Proyección Compras', permiso: 'ver_inventario' },
    { id: 'gastos', label: 'Gastos Operativos', permiso: 'ver_gastos' }, 
    { id: 'mesero', label: 'Mesero', permiso: 'ver_comandas' },
    { id: 'cajero', label: 'Caja', permiso: 'ver_ventas' },
    { id: 'insumos', label: 'Insumos', permiso: 'ver_insumos' },
    { id: 'recetas', label: 'Recetas', permiso: 'ver_recetas' }, 
    { id: 'productos', label: 'Menú ', permiso: 'crear_productos' }, 
    { id: 'proveedores', label: 'Proveedores', permiso: 'ver_proveedores' },
    { id: 'empleados', label: 'Empleados', permiso: 'ver_usuarios' }, 
    { id: 'impresoras', label: 'Impresoras', permiso: 'ver_configuracion' },
    { id: 'config', label: 'Configuración', permiso: 'ver_configuracion' }
  ], []);

  const visibleTabs = useMemo(() => {
    if (!userSession) return [];
    if (isAdmin) return tabsConfig;
    return tabsConfig.filter(tab => userSession.permisos.includes(tab.permiso));
  }, [userSession, isAdmin, tabsConfig]);

  const [activeTab, setActiveTab] = useState('');

  useEffect(() => {
    if (visibleTabs.length > 0 && !activeTab) {
      setActiveTab(visibleTabs[0].id);
    }
  }, [visibleTabs, activeTab]);
  
  const [filterSucursal, setFilterSucursal] = useState(userSession?.user?.sucursal_id || 1);
  const [listaSucursales, setListaSucursales] = useState([]);

  useEffect(() => {
    if (userSession) { 
      cargarSucursales(); 
    }
  }, [userSession]);

  const cargarSucursales = async () => {
    if (isAdmin || userSession?.permisos?.includes('ver_sucursales')) {
      const { data } = await sucursalesService.getAll();
      setListaSucursales(data || []);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setUserSession(null);
  };

  if (!userSession) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className={s.adminLayout}>
      
      {/* 🔝 TOPBAR UNIFICADO - Se apoya en la clase nativa .topBar que maneja el flex-wrap */}
      <header className={s.topBar}>
        
        {/* Bloque Izquierdo: Logo y Selector de Sucursal */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <h2 className={s.logoTitle} style={{ margin: 0, fontSize: '1.3rem', letterSpacing: '-0.5px' }}>CloudKitchen</h2>
          
          <div className={s.userInfo}>
            {isAdmin && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label className={s.label} style={{ marginBottom: 0 }}>SUCURSAL:</label>
                <select 
                  className={s.inputField}
                  style={{ width: 'auto', padding: '6px 12px', height: '36px', fontSize: '13px' }}
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
        </div>

        {/* Bloque Derecho: Info del Usuario y Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div className={s.label} style={{ textAlign: 'right', marginBottom: 0 }}>
            <span style={{ fontWeight: 'bold', color: 'var(--color-text-main)', fontSize: '12px' }}>
              {userSession.user.nombre.toUpperCase()}
            </span>
            <br />
            {/* Ocultamos el rol en móviles muy pequeños para no romper la barra */}
            <span style={{ color: 'gray', fontSize: '10px' }} className={s.hideOnMobile}>
              {!isAdmin ? `Sucursal ID: ${userSession.user.sucursal_id}` : 'Administrador Global'}
            </span>
          </div>
          <button onClick={handleLogout} className={`${s.btn} ${s.btnOutlineDanger}`} style={{ padding: '6px 12px', fontSize: '11px' }}>
            SALIR ✕
          </button>
        </div>
      </header>

      {/* 🧭 CUERPO PRINCIPAL */}
      <div className={s.adminContainer}>
        <aside className={s.sidebar}>
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

        <main className={s.mainContent}>
          <section className={s.tabContent}>
            <Suspense fallback={
              <div style={{ display: 'flex', justifyContent: 'center', padding: '80px', color: 'gray', fontWeight: 'bold' }}>
                <div className={s.spinner}></div>
                Cargando módulo...
              </div>
            }>
                {activeTab === 'analitica' && <AnaliticaTab sucursalId={filterSucursal} />}
                {activeTab === 'mesero' && <MeseroTab sucursalId={filterSucursal} usuarioId={userSession.user.id} />}
                {activeTab === 'cajero' && <CajeroTab sucursalId={filterSucursal} usuarioId={userSession.user.id} />}
                {activeTab === 'insumos' && <InsumosTab sucursalId={filterSucursal} />}
                {activeTab === 'kardex' && <InventariosTab sucursalId={filterSucursal} usuarioId={userSession.user.id} />}
                {activeTab === 'estimaciones' && <EstimacionesTab sucursalId={filterSucursal} />}
                {activeTab === 'gastos' && <GastosTab />}
                {activeTab === 'recetas' && <RecetasTab sucursalId={filterSucursal} />}
                {activeTab === 'productos' && <ProductosTab sucursalId={filterSucursal} />}
                {activeTab === 'proveedores' && <ProveedoresTab sucursalId={filterSucursal} />}
                {activeTab === 'empleados' && <EmpleadosTab />}
                {activeTab === 'impresoras' && <ImpresorasTab sucursalId={filterSucursal} />}
                {activeTab === 'config' && <ConfigTab />}
            </Suspense>
          </section>
        </main>
      </div>
    </div>
  );
};

export default AdminPage;