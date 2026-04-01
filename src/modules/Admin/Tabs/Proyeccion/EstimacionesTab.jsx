// Archivo: src/modules/Admin/Tabs/Proyeccion/EstimacionesTab.jsx
import React, { useState } from 'react';
import { useEstimacionesTab } from "./useEstimacionesTab"; 
import s from "../../../../assets/styles/EstilosGenerales.module.css";
import { EstrategiaView } from "./EstrategiaView";
import { MandadoView } from "./MandadoView";
import { HistorialConsumoView } from "./HistorialConsumoView";

export const EstimacionesTab = ({ sucursalId, usuarioId }) => {
  const [subTab, setSubTab] = useState('config');
  const estimates = useEstimacionesTab(sucursalId);

  if (estimates.loading && !estimates.sugerenciasFiltradas.length) {
    return <div className={s.tabContent}>Cargando inteligencia de compras...</div>;
  }

  return (
    <div className={s.tabWrapper}>
      <div className={s.pageHeader}>
        <h2 className={s.pageTitle}>Proyección de Compras Inteligente</h2>
      </div>

      <nav className={s.tabNav}>
        <button 
          className={`${s.tabButton} ${subTab === 'config' ? s.activeTabButton : ''}`} 
          onClick={() => setSubTab('config')}
        > ESTRATEGIA DE STOCK </button>
        
        <button 
          className={`${s.tabButton} ${subTab === 'compras' ? s.activeTabButton : ''}`} 
          onClick={() => setSubTab('compras')}
        > LISTA DE MANDADO </button>
        
        <button 
          className={`${s.tabButton} ${subTab === 'historial' ? s.activeTabButton : ''}`} 
          onClick={() => setSubTab('historial')}
        > FUENTE DE DATOS </button>
      </nav>

      {/* Renderizado Condicional de Sub-vistas */}
      {subTab === 'config' && <EstrategiaView estimates={estimates} s={s} />}
      {subTab === 'compras' && <MandadoView estimates={estimates} s={s} usuarioId={usuarioId} />}
      {subTab === 'historial' && (
        <HistorialConsumoView 
          historialConsumo={estimates.historialConsumo} 
          proyeccionProductos={estimates.proyeccionProductos} 
          loading={estimates.loading} 
        />
      )}
    </div>
  );
};

export default EstimacionesTab;