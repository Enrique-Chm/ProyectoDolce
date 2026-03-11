import React, { useState, useEffect } from "react";
import s from "./AdminPage.module.css";
import { authService } from "../../services/Auth.service";
import { sucursalesService } from "../../services/Sucursales.service";
import { useSessionGuard } from "../../hooks/useSessionGuard";

import { Login } from "./Login";
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
  // Vigilancia de sesión activa
  useSessionGuard();

  const [userSession, setUserSession] = useState(authService.getCurrentSession());
  const [activeTab, setActiveTab] = useState('mesero'); 
  const [filterSucursal, setFilterSucursal] = useState(userSession?.user?.sucursal_id || 1);
  const [listaSucursales, setListaSucursales] = useState([]);

  const isAdmin = userSession?.user?.roles?.nombre_rol === 'Administrador';

  useEffect(() => {
    if (userSession) { cargarSucursales(); }
  }, [userSession]);

  const cargarSucursales = async () => {
    const { data } = await sucursalesService.getAll();
    setListaSucursales(data || []);
  };

  const getTabsConfig = () => [
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
          <h1 className={s.mainTitle}>CloudKitchen <span className={s.accent}>Admin</span></h1>

          <div className={s.sessionInfo}>
            {isAdmin && (
              <div className={s.branchSelectorContainer}>
                <label className={s.branchLabel}>Gestionando Sucursal:</label>
                <select className={s.branchSelect} value={filterSucursal} onChange={(e) => setFilterSucursal(parseInt(e.target.value))}>
                  {listaSucursales.map(suc => (
                    <option key={suc.id} value={suc.id}>{suc.es_matriz ? '📍' : '🏢'} {suc.nombre}</option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                <span className={s.userText}>
                  Sesión: <strong>{userSession.user.nombre}</strong> 
                  {!isAdmin && ` (Sucursal: ${userSession.user.sucursal_id})`}
                </span>
                <button onClick={handleLogout} className={s.logoutBtn}>CERRAR SESIÓN ✕</button>
            </div>
          </div>
        </div>
        
        <nav className={s.tabNav}>
          {visibleTabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`${s.navBtn} ${activeTab === tab.id ? s.navBtnActive : ''}`}>
              {tab.label.toUpperCase()}
            </button>
          ))}
        </nav>
      </header>

      <main className={s.contentArea}>
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
      </main>
    </div>
  );
};

export default AdminPage;