// Archivo: src/modules/Admin/Tabs/Proyeccion/EstimacionesTab.jsx
import React, { useState } from 'react';
import { useEstimacionesTab } from "./useEstimacionesTab"; 
import s from "../../../../assets/styles/EstilosGenerales.module.css";
import { EstrategiaView } from "./EstrategiaView";
import { MandadoView } from "./MandadoView";
import { HistorialConsumoView } from "./HistorialConsumoView";

/**
 * Componente principal para el módulo de Proyecciones.
 * Gestiona el flujo de Abastecimiento Inteligente (JIT) y Planeación de Ventas.
 */
export const EstimacionesTab = ({ sucursalId, usuarioId }) => {
  const [activeSubTab, setActiveSubTab] = useState('config'); // config | compras | historial
  const estimates = useEstimacionesTab(sucursalId);

  // --- RENDERIZADO: ESTADO DE CARGA ---
  // Ajuste: Solo bloqueamos la pantalla completa si es la PRIMERA carga y no hay datos.
  // Si ya hay datos, dejamos que cargue en segundo plano con el badge de la cabecera.
  if (estimates.loading && estimates.pronosticoSemanal.length === 0) {
    return (
      <div className={s.tabWrapper}>
        <header className={s.pageHeader}>
          <h2 className={s.pageTitle}>Abastecimiento Inteligente</h2>
          <span className={s.syncBadge}>CALCULANDO DEMANDA...</span>
        </header>
        <div className={s.emptyState} style={{ padding: '100px 20px' }}>
          <div className={s.spinner} style={{ margin: '0 auto 20px' }}></div>
          <p>Realizando explosión de recetas y analizando proyecciones de venta...</p>
        </div>
      </div>
    );
  }

  // --- RENDERIZADO: CONTENIDO DINÁMICO ---
  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case 'config':
        // Vista de Estrategia JIT: Configuración de stock de seguridad y cobertura
        return <EstrategiaView estimates={estimates} s={s} />;
      
      case 'compras':
        // Lista de Mandado: Sugerencias de compra basadas en faltantes reales
        return <MandadoView estimates={estimates} s={s} usuarioId={usuarioId} />;
      
      case 'historial':
        // Planeación de Ventas: Comparativa IA vs Ajustes Manuales
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

  return (
    <div className={s.tabWrapper} style={{ animation: 'fadeIn 0.3s ease' }}>
      
      {/* 🚀 CABECERA PRINCIPAL */}
      <header className={s.pageHeader}>
        <div>
          <h2 className={s.pageTitle}>Proyección de Compras (JIT)</h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            {activeSubTab === 'historial' 
              ? "Ajusta la expectativa de ventas para sincronizar la cocina y compras."
              : "Análisis de stock basado en demanda proyectada por día."}
          </p>
        </div>
        {estimates.loading && <span className={s.syncBadge}>ACTUALIZANDO...</span>}
      </header>

      {/* 🧭 NAVEGACIÓN DE SUB-PESTAÑAS */}
      <nav className={s.tabNav} style={{ marginBottom: '25px' }}>
        <button 
          className={`${s.tabButton} ${activeSubTab === 'config' ? s.activeTabButton : ''}`} 
          onClick={() => setActiveSubTab('config')}
        >
          ⚙️ ESTRATEGIA DE ABASTO
        </button>
        <button 
          className={`${s.tabButton} ${activeSubTab === 'compras' ? s.activeTabButton : ''}`} 
          onClick={() => setActiveSubTab('compras')}
        >
          🛒 LISTA DE MANDADO
        </button>
        <button 
          className={`${s.tabButton} ${activeSubTab === 'historial' ? s.activeTabButton : ''}`} 
          onClick={() => setActiveSubTab('historial')}
        >
          📈 PLANEACIÓN DE VENTAS
        </button>
      </nav>

      {/* 🧩 CONTENEDOR DEL MÓDULO ACTIVO */}
      <div className={s.fullLayout}>
        {renderSubTabContent()}
      </div>

    </div>
  );
};

export default EstimacionesTab;