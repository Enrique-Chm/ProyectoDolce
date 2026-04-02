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

  // --- RENDERIZADO: ESTADO DE CARGA INICIAL (Motor de Demanda JIT) ---
  if (estimates.loading && (!estimates.sugerenciasFiltradas || estimates.sugerenciasFiltradas.length === 0)) {
    return (
      <div className={s.tabWrapper}>
        <header className={s.pageHeader}>
          <h2 className={s.pageTitle}>Abastecimiento por Demanda Proyectada</h2>
          <span className={s.syncBadge}>CALCULANDO...</span>
        </header>
        <div className={s.emptyState}>
          Realizando explosión de recetas y analizando demanda proyectada para mañana...
        </div>
      </div>
    );
  }

  // --- RENDERIZADO: CONTENIDO DE LA PESTAÑA ACTIVA ---
  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case 'config':
        // Vista de Estrategia JIT: Insumo vs Requerimiento de Receta
        return <EstrategiaView estimates={estimates} s={s} />;
      case 'compras':
        // Lista de Mandado: Generada a partir de Faltantes de Demanda
        return <MandadoView estimates={estimates} s={s} usuarioId={usuarioId} />;
      case 'historial':
        // Centro de Planeación de Ventas: Gestión de Pronósticos y Reset a Smart Estimate
        return (
          <HistorialConsumoView 
            proyeccionProductos={estimates.proyeccionProductos} 
            pronosticoSemanal={estimates.pronosticoSemanal}
            estimacionesManuales={estimates.estimacionesManuales} 
            guardarEstimacionManual={estimates.guardarEstimacionManual} 
            loading={estimates.loading} 
            diaProyectado={estimates.diaProyectado} 
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
        <h2 className={s.pageTitle}>Proyección de Compras Inteligente (JIT)</h2>
        {estimates.loading && <span className={s.syncBadge}>ACTUALIZANDO DEMANDA...</span>}
      </header>

      {/* Navegación de Sub-pestañas: Control de Abastecimiento Just-in-Time */}
      <nav className={s.tabNav}>
        <button 
          className={`${s.tabButton} ${activeSubTab === 'config' ? s.activeTabButton : ''}`} 
          onClick={() => setActiveSubTab('config')}
        >
          ESTRATEGIA DE ABASTO
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
          PLANEACIÓN DE VENTAS
        </button>
      </nav>

      {/* Contenedor del Módulo Activo: Inyecta la lógica de Demanda Proyectada vs Stock Físico */}
      <div className={s.fullLayout}>
        {renderSubTabContent()}
      </div>

    </div>
  );
};

export default EstimacionesTab;