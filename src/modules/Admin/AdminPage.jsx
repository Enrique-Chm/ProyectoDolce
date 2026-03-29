// Archivo: src/modules/Admin/AdminPage.jsx
import React, { useState, useEffect, useMemo, Suspense } from "react";
import { Navigate } from "react-router-dom";
import s from "../../assets/styles/EstilosGenerales.module.css";
import { authService } from "../../services/Auth.service";
import { sucursalesService } from "../../services/Sucursales.service";
import { useSessionGuard } from "../../hooks/useSessionGuard";

// 🚀 LAZY LOADING: Componentes de las pestañas
const AnaliticaTab = React.lazy(() => import("./Tabs/AnaliticaTab/AnaliticaTab").then(module => ({ default: module.AnaliticaTab })));
const ConfigTab = React.lazy(() => import("./Tabs/ConfigTab/ConfigTab").then(module => ({ default: module.ConfigTab }))); 
const ProveedoresTab = React.lazy(() => import("./Tabs/ProveedoresTab").then(module => ({ default: module.ProveedoresTab })));
const InsumosTab = React.lazy(() => import("./Tabs/InsumosTab").then(module => ({ default: module.InsumosTab })));
const RecetasTab = React.lazy(() => import("./Tabs/RecetasTab").then(module => ({ default: module.RecetasTab })));
const MenuTab = React.lazy(() => import("./Tabs/MenuTab").then(module => ({ default: module.MenuTab })));
const EmpleadosTab = React.lazy(() => import("./Tabs/EmpleadosTab").then(module => ({ default: module.EmpleadosTab })));
const MeseroTab = React.lazy(() => import("./Tabs/MeseroTab/MeseroTab").then(module => ({ default: module.MeseroTab }))); 
const ImpresorasTab = React.lazy(() => import("./Tabs/ImpresorasTab").then(module => ({ default: module.ImpresorasTab })));
const GastosTab = React.lazy(() => import("./Tabs/GastosTab").then(module => ({ default: module.GastosTab })));

const CajeroTab = React.lazy(() => import('./Tabs/CajeroTab/CajeroTab'));
const InventariosTab = React.lazy(() => import("./Tabs/InventariosTab")); 
const EstimacionesTab = React.lazy(() => import("./Tabs/EstimacionesTab")); 

const AdminPage = () => {
  useSessionGuard();

  const [userSession, setUserSession] = useState(authService.getCurrentSession());
  const isAdmin = userSession?.user?.rol === 'Administrador' || userSession?.user?.rol_id === 1;

  // 💡 ESTADO PARA MOSTRAR/OCULTAR LA BARRA LATERAL
  const [showSidebar, setShowSidebar] = useState(true);

  const tabsConfig = useMemo(() => [
    { id: 'analitica', label: 'Dashboard', permiso: 'ver_analitica' }, 
    { id: 'estimaciones', label: 'Proyección Compras', permiso: 'ver_inventario' },
    { id: 'gastos', label: 'Gastos Operativos', permiso: 'ver_gastos' }, 
    { id: 'mesero', label: 'Mesero', permiso: 'ver_comandas' },
    { id: 'cajero', label: 'Caja', permiso: 'ver_ventas' },
    { id: 'kardex', label: 'Inventarios', permiso: 'ver_inventario' },
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
      
      {/* 🔝 TOPBAR UNIFICADO */}
      <header className={s.topBar}>
        
        {/* Bloque Izquierdo: Botón Menú, Logo y Selector de Sucursal */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          
          {/* 💡 BOTÓN PARA OCULTAR/MOSTRAR MENÚ LATERAL */}
          <button 
            onClick={() => setShowSidebar(!showSidebar)}
            className={s.btn}
            style={{ 
              background: 'transparent', 
              color: 'var(--color-primary)', 
              border: '1px solid var(--color-border)',
              padding: '6px 12px',
              fontSize: '18px'
            }}
            title={showSidebar ? "Ocultar menú" : "Mostrar menú"}
          >
            ☰
          </button>

          <h2 className={s.logoTitle} style={{ margin: 0, fontSize: '1.4rem', letterSpacing: '-0.5px' }}>
            Ki<span style={{ color: 'var(--color-primary)' }}>Kitchen</span>
          </h2>
          
          {isAdmin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className={s.label} style={{ margin: 0, fontSize: '11px' }}>
                SUCURSAL:
              </span>
              <select 
              className={"s.priceValue"}style={{  
                  border: 'none', 
                  background: 'transparent', 
                  color: 'var(--color-primary)', 
                  fontSize: '13px',
                  fontWeight: '700',
                  outline: 'none', 
                  cursor: 'pointer',
                  minWidth: '50px',
                  padding: 0,
                  appearance: 'auto'
                }}
                value={filterSucursal} 
                onChange={(e) => setFilterSucursal(parseInt(e.target.value))}
              >
                {listaSucursales.map(suc => (
                  <option 
                    key={suc.id} 
                    value={suc.id}
                    style={{ color: 'var(--color-text-main)', background: 'white' }}
                  >
                    {suc.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}
          
        </div>

        {/* Bloque Derecho: Info del Usuario y Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div className={s.label} style={{ textAlign: 'right', marginBottom: 0 }}>
            <span style={{ fontWeight: 'bold', color: 'var(--color-text-main)', fontSize: '12px' }}>
              {userSession.user.nombre.toUpperCase()}
            </span>
            <br />
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
        
        {/* 💡 SIDEBAR CONDICIONADO A showSidebar */}
        {showSidebar && (
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
        )}

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
                {activeTab === 'productos' && <MenuTab sucursalId={filterSucursal} />}
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