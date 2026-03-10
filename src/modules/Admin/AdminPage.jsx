import React, { useState, useEffect } from "react";
import s from "./AdminPage.module.css";

// --- IMPORTACIÓN DE SERVICIOS (Rutas validadas según tu VS Code) ---
import { authService } from "../../services/Auth.service";
import { sucursalesService } from "../../services/Sucursales.service";

// --- IMPORTACIÓN DE PANTALLA DE ACCESO ---
import { Login } from "./Login";

// --- IMPORTACIÓN DE COMPONENTES OPERATIVOS (Sub-carpeta ./components) ---
import { ConfigTab } from "./components/ConfigTab"; 
import { ProveedoresTab } from "./components/ProveedoresTab";
import { InsumosTab } from "./components/InsumosTab";
import { RecetasTab } from "./components/RecetasTab";
import { ProductosTab } from "./components/ProductosTab";
import { EmpleadosTab } from "./components/EmpleadosTab";
import { MeseroTab } from "./components/MeseroTab"; 
import { CajeroTab } from "./components/CajeroTab";
import { ImpresorasTab } from "./components/ImpresorasTab";

const AdminPage = () => {
  const [userSession, setUserSession] = useState(authService.getCurrentSession());
  const [activeTab, setActiveTab] = useState('mesero'); 
  
  // --- LÓGICA MULTI-SUCURSAL ---
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

  // --- CONFIGURACIÓN DE PESTAÑAS ---
  const getTabsConfig = () => [
    { id: 'mesero', label: 'Mesero (Ventas)', permiso: 'ver_ventas' },
    { id: 'cajero', label: 'Caja (Cobros)', permiso: 'ver_ventas' },
    { id: 'insumos', label: 'Insumos', permiso: 'ver_insumos' },
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
    
    // Casos especiales para Configuración e Impresoras
    if (tab.id === 'config' || tab.id === 'impresoras') {
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
    <div className={s.pageWrapper}>
      <header className={s.mainHeader}>
        <div className={s.headerTop}>
          <h1 className={s.mainTitle}>
            CloudKitchen <span className={s.accent}>Admin</span>
          </h1>

          <div className={s.sessionInfo}>
            {isAdmin && (
              <div className={s.branchSelectorContainer}>
                <label className={s.branchLabel}>Gestionando Sucursal:</label>
                <select 
                  className={s.branchSelect} 
                  value={filterSucursal}
                  onChange={(e) => setFilterSucursal(parseInt(e.target.value))}
                >
                  {listaSucursales.map(suc => (
                    <option key={suc.id} value={suc.id}>
                      {suc.es_matriz ? '📍' : '🏢'} {suc.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                <span className={s.userText}>
                  Sesión: <strong>{userSession.user.nombre}</strong> 
                  {!isAdmin && ` (ID: ${userSession.user.sucursal_id})`}
                </span>
                <button onClick={handleLogout} className={s.logoutBtn}>
                  CERRAR SESIÓN ✕
                </button>
            </div>
          </div>
        </div>
        
        {/* NAVEGACIÓN PRINCIPAL */}
        <nav className={s.tabNav}>
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${s.navBtn} ${activeTab === tab.id ? s.navBtnActive : ''}`}
            >
              {tab.label.toUpperCase()}
            </button>
          ))}
        </nav>
      </header>

      <main className={s.contentArea}>
        {/* OPERATIVA: VENTAS Y COBROS */}
        {activeTab === 'mesero' && (
            <MeseroTab sucursalId={filterSucursal} usuarioId={userSession.user.id} />
        )}

        {activeTab === 'cajero' && (
            <CajeroTab sucursalId={filterSucursal} usuarioId={userSession.user.id} />
        )}

        {/* LOGÍSTICA E INVENTARIOS */}
        {activeTab === 'insumos' && <InsumosTab sucursalId={filterSucursal} />}
        {activeTab === 'recetas' && <RecetasTab sucursalId={filterSucursal} />}
        {activeTab === 'productos' && <ProductosTab sucursalId={filterSucursal} />}
        {activeTab === 'proveedores' && <ProveedoresTab sucursalId={filterSucursal} />}
        
        {/* ADMINISTRACIÓN Y CONFIGURACIÓN */}
        {activeTab === 'empleados' && <EmpleadosTab />}
        
        {activeTab === 'impresoras' && (
            <ImpresorasTab sucursalId={filterSucursal} />
        )}

        {activeTab === 'config' && <ConfigTab />}
      </main>
    </div>
  );
};

export default AdminPage;