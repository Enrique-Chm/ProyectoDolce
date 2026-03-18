// Archivo: src/modules/Admin/components/AnaliticaTab.jsx
import React from 'react';
import s from '../AdminPage.module.css';
import { useAnalitica } from '../../../hooks/useAnalitica';
import { formatCurrency } from '../../../utils/formatCurrency';
import { hasPermission } from '../../../utils/checkPermiso'; // 🛡️ Importamos seguridad

export const AnaliticaTab = ({ sucursalId }) => {
  // 🛡️ SEGURIDAD INTERNA (RBAC)
  const puedeVerAnalitica = hasPermission('ver_ventas');

  // Extraemos los datos del hook (que ya incluye gastos y utilidad real)
  const { 
    fechaInicio, setFechaInicio,
    fechaFin, setFechaFin,
    loading,
    dataVentas
  } = useAnalitica(sucursalId);

  // 1. Bloqueo de seguridad
  if (!puedeVerAnalitica) {
    return (
      <div className={`${s.tabContent} ${s.messageState}`}>
        <p className={s.messageStateDanger}>
          🚫 ACCESO RESTRINGIDO
        </p>
        <p style={{ color: 'var(--color-text-muted)' }}>
          No tienes los privilegios necesarios para ver los reportes financieros.
        </p>
      </div>
    );
  }

  // Pantalla de carga
  if (loading) {
    return (
      <div className={`${s.tabContent} ${s.messageState}`}>
        <p className={s.messageStatePrimary}>
           CALCULANDO ESTADO DE RESULTADOS...
        </p>
      </div>
    );
  }

  // Extracción segura de datos
  const stats = dataVentas?.stats || {};
  const ranking = dataVentas?.ranking || [];
  const staff = dataVentas?.desempeñoStaff || [];

  return (
    <div className={s.analyticsWrapper}>
      
      {/* ENCABEZADO Y FILTROS DE FECHA */}
      <header className={s.analyticsHeader}>
        <div>
          <h2 className={s.analyticsTitle}>
            Ventas y Rentabilidad
          </h2>
          <p className={s.analyticsSubtitle}>
            Estado de Resultados Real (P&L) consolidado
          </p>
        </div>

        {/* SELECTOR DE FECHAS */}
        <div className={s.dateFilters}>
          <div className={s.dateCol}>
            <label className={s.dateLabel}>DESDE</label>
            <input 
              type="date" 
              className={s.dateInput}
              value={fechaInicio} 
              onChange={(e) => setFechaInicio(e.target.value)} 
            />
          </div>
          <div className={s.dateDivider}></div>
          <div className={s.dateCol}>
            <label className={s.dateLabel}>HASTA</label>
            <input 
              type="date" 
              className={s.dateInput}
              value={fechaFin} 
              onChange={(e) => setFechaFin(e.target.value)} 
            />
          </div>
        </div>
      </header>

      {/* BLOQUE 1: KPIs FINANCIEROS (TARJETAS ACTUALIZADAS) */}
      <div className={s.metricsGrid}>
        <MetricCard 
          label="1. VENTAS BRUTAS" 
          value={formatCurrency(stats.bruto || 0)} 
          subtext={`Tickets: ${stats.tickets || 0}`}
          color="var(--color-text-main)" 
        />
        <MetricCard 
          label="2. INGRESO NETO" 
          value={formatCurrency(stats.neto || 0)} 
          subtext="Venta libre de IVA"
          color="#3b82f6" 
        />
        <MetricCard 
          label="3. UTILIDAD BRUTA" 
          value={formatCurrency(stats.utilidadBruta || 0)} 
          subtext="Ingreso - Insumos"
          color="#8b5cf6" 
        />
        <MetricCard 
          label="4. GASTOS (OPEX)" 
          value={formatCurrency(stats.gastosOperativos || 0)} 
          subtext="Rentas, Nóminas, etc."
          color="#ef4444" 
        />
        <MetricCard 
          label="5. UTILIDAD REAL" 
          value={formatCurrency(stats.utilidadReal || 0)} 
          subtext={`Margen Final: ${(stats.margenReal || 0).toFixed(1)}%`}
          color="var(--color-success)" 
          isHighlight 
        />
      </div>

      {/* BLOQUE 2: RANKINGS Y DESEMPEÑO */}
      <div className={s.cardsGrid} style={{ alignItems: 'start' }}>
        
        {/* TOP 5 PRODUCTOS */}
        <div className={s.adminCard} style={{ padding: '25px' }}>
          <h3 className={s.cardTitle}>🏆 Top 5 Productos</h3>
          <div className={s.listContainer}>
            {ranking.map((p, i) => (
              <div 
                key={i} 
                className={`${s.rankingItem} ${i === 0 ? s.rankingItemFirst : ''}`}
              >
                <span style={{ fontWeight: '700', fontSize: '13px' }}>
                  <span style={{ opacity: 0.5, marginRight: '10px' }}>{i + 1}.</span>
                  {p.nombre}
                </span>
                <strong style={{ color: 'var(--color-primary)', fontSize: '14px' }}>
                  {p.cantidad} <small style={{ fontSize: '10px' }}>uds</small>
                </strong>
              </div>
            ))}
            {ranking.length === 0 && (
              <p className={s.emptyState} style={{ padding: '20px 0' }}>
                No hay ventas registradas.
              </p>
            )}
          </div>
        </div>

        {/* VENTAS POR STAFF */}
        <div className={s.adminCard} style={{ padding: '25px', background: 'var(--color-bg-app)' }}>
          <h3 className={s.cardTitle}>👥 Desempeño Staff</h3>
          <div className={s.listContainer} style={{ gap: '8px' }}>
            {staff.map((st, i) => (
              <div key={i} className={s.staffItem}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className={s.staffAvatar}>
                    {st.nombre.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '700' }}>{st.nombre}</span>
                </div>
                <strong style={{ fontSize: '14px' }}>{formatCurrency(st.total)}</strong>
              </div>
            ))}
            {staff.length === 0 && (
              <p className={s.emptyState} style={{ padding: '20px 0' }}>
                Sin registros de staff.
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

/**
 * COMPONENTE INTERNO: TARJETA DE MÉTRICA
 */
const MetricCard = ({ label, value, subtext, color, isHighlight = false }) => (
  <div 
    className={`${s.adminCard} ${s.metricCard} ${isHighlight ? s.metricCardHighlight : ''}`} 
    style={{ borderTop: `5px solid ${color}` }}
  >
    <span className={s.metricLabel}>{label}</span>
    <div className={s.metricValue} style={{ color: isHighlight ? 'var(--color-success)' : 'inherit' }}>
      {value}
    </div>
    {subtext && <p className={s.metricSubtext}>{subtext}</p>}
  </div>
);

export default AnaliticaTab;