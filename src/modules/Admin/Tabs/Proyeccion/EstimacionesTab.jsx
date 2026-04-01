// Archivo: src/modules/Admin/Tabs/Proyeccion/EstimacionesTab.jsx
import React, { useState } from 'react';
import { useEstimacionesTab } from "./useEstimacionesTab"; 
import s from "../../../../assets/styles/EstilosGenerales.module.css";
import { EstrategiaView } from "./EstrategiaView";
import { MandadoView } from "./MandadoView";
import { HistorialConsumoView } from "./HistorialConsumoView";

export const EstimacionesTab = ({ sucursalId, usuarioId }) => {
  const [activeSubTab, setActiveSubTab] = useState('config');
  const estimates = useEstimacionesTab(sucursalId);

  // --- RENDERIZADO: ESTADO DE CARGA INICIAL ---
  if (estimates.loading && (!estimates.sugerenciasFiltradas || estimates.sugerenciasFiltradas.length === 0)) {
    return (
      <div className={s.tabWrapper}>
        <header className={s.pageHeader}>
          <h2 className={s.pageTitle}>Proyección de Compras Inteligente</h2>
          <span className={s.syncBadge}>CARGANDO...</span>
        </header>
        <div className={s.emptyState}>
          Analizando demanda y calculando inteligencia de compras...
        </div>
      </div>
    );
  }

  // --- RENDERIZADO: CONTENIDO DE LA PESTAÑA ACTIVA ---
  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case 'config':
        return <EstrategiaView estimates={estimates} s={s} />;
      case 'compras':
        return <MandadoView estimates={estimates} s={s} usuarioId={usuarioId} />;
      case 'historial':
        return (
          <HistorialConsumoView 
            historialConsumo={estimates.historialConsumo} 
            proyeccionProductos={estimates.proyeccionProductos} 
            loading={estimates.loading} 
          />
        );
      default:
        return null;
    }
  };

  // --- RENDER PRINCIPAL ---
  return (
    <div className={s.tabWrapper}>
      
      {/* Cabecera Principal */}
      <header className={s.pageHeader}>
        <h2 className={s.pageTitle}>Proyección de Compras Inteligente</h2>
        {estimates.loading && <span className={s.syncBadge}>ACTUALIZANDO...</span>}
      </header>

      {/* Navegación de Sub-pestañas */}
      <nav className={s.tabNav}>
        <button 
          className={`${s.tabButton} ${activeSubTab === 'config' ? s.activeTabButton : ''}`} 
          onClick={() => setActiveSubTab('config')}
        >
          ESTRATEGIA DE STOCK
        </button>
        <button 
          className={`${s.tabButton} ${activeSubTab === 'compras' ? s.activeTabButton : ''}`} 
          onClick={() => setActiveSubTab('compras')}
        >
          LISTA DE MANDADO
        </button>
        <button 
          className={`${s.tabButton} ${activeSubTab === 'historial' ? s.activeTabButton : ''}`} 
          onClick={() => setActiveSubTab('historial')}
        >
          FUENTE DE DATOS
        </button>
      </nav>

      {/* Contenedor del Módulo Activo */}
      <div className={s.fullLayout}>
        {renderSubTabContent()}
      </div>

    </div>
  );
};

export default EstimacionesTab;