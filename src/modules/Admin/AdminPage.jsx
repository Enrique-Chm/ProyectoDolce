// Archivo: src/modules/Admin/AdminPage.jsx
import React, { useState, useEffect, useMemo, Suspense } from "react";
import { Navigate } from "react-router-dom"; // 👈 IMPORTANTE: Agregamos Navigate
import s from "./AdminPage.module.css";
import { authService } from "../../services/Auth.service";
import { sucursalesService } from "../../services/Sucursales.service";
import { useSessionGuard } from "../../hooks/useSessionGuard";

// 🚀 LAZY LOADING: Componentes de las pestañas (Carga bajo demanda)
// Para los que tienen export nombrado (export const ...)
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

// Para los que tienen export por defecto (export default ...)
const CajeroTab = React.lazy(() => import('./components/CajeroTab'));
const InventariosTab = React.lazy(() => import("./components/InventariosTab")); 
const EstimacionesTab = React.lazy(() => import("./components/EstimacionesTab")); 

const AdminPage = () => {
  useSessionGuard();

  const [userSession, setUserSession] = useState(authService.getCurrentSession());
  
  // 🛡️ Identificación de Rol
  const isAdmin = userSession?.user?.rol === 'Administrador' || userSession?.user?.rol_id === 1;

  // 🛡️ Configuración de Pestañas
  const tabsConfig = useMemo(() => [
    { id: 'analitica', label: 'Dashboard Analítica', permiso: 'ver_analitica' }, 
    { id: 'mesero', label: 'Mesero', permiso: 'ver_comandas' },
    { id: 'cajero', label: 'Caja', permiso: 'ver_ventas' },
    { id: 'insumos', label: 'Catálogo Insumos', permiso: 'ver_insumos' },
    { id: 'kardex', label: 'Auditoría Inventarios', permiso: 'ver_inventario' },
    { id: 'estimaciones', label: 'Proyección Compras', permiso: 'ver_inventario' },
    { id: 'gastos', label: 'Gastos Operativos', permiso: 'ver_gastos' }, 
    { id: 'recetas', label: 'Recetas', permiso: 'ver_recetas' }, 
    /**
     * 🛡️ TRUCO DE VISIBILIDAD:
     * El mesero tendrá 'ver_productos' para poder tomar pedidos, pero el Tab de 
     * gestión de productos ahora exige 'crear_productos'. Así el mesero NO lo ve en el menú.
     */
    { id: 'productos', label: 'Productos', permiso: 'crear_productos' }, 
    { id: 'proveedores', label: 'Proveedores', permiso: 'ver_proveedores' },
    { id: 'empleados', label: 'Empleados', permiso: 'ver_usuarios' }, 
    { id: 'impresoras', label: 'Impresoras', permiso: 'ver_configuracion' },
    { id: 'config', label: 'Configuración', permiso: 'ver_configuracion' }
  ], []);

  // Filtro de pestañas inteligente
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

  // 🛑 CAMBIO CLAVE: Expulsamos al usuario a la ruta oficial de Login
  if (!userSession) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className={s.adminContainer}>
      
      {/* BARRA LATERAL */}
      <aside className={s.sidebar}>
        <div className={s.sidebarHeader}>
          <h2>CloudKitchen</h2>
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
                <label className={s.label} style={{ marginBottom: 0 }}>SUCURSAL:</label>
                <select 
                  className={s.inputField}
                  style={{ width: 'auto', padding: '6px 12px', height: '38px' }}
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
            <div className={s.label}>
              {userSession.user.nombre} 
              <small className={s.label}>
                {!isAdmin ? `Sucursal: ${userSession.user.sucursal_id}` : 'Administrador Global'}
              </small>
            </div>
            <button onClick={handleLogout} className={`${s.btn} ${s.btnOutlineDanger} ${s.btnSmall}`}>
              SALIR ✕
            </button>
          </div>
        </header>

        {/* CONTENIDO DINÁMICO */}
        <section className={s.tabContent}>
          <Suspense fallback={
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', color: 'gray', fontWeight: 'bold' }}>
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
  );
};

export default AdminPage;