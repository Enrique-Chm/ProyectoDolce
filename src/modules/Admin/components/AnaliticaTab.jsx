// Archivo: src/modules/Admin/components/AnaliticaTab.jsx
import React from 'react';
import s from '../AdminPage.module.css';
import { useAnalitica } from '../../../hooks/useAnalitica';
import { formatCurrency } from '../../../utils/formatCurrency';

export const AnaliticaTab = ({ sucursalId }) => {
  // Extraemos solo lo necesario del hook simplificado
  const { 
    fechaInicio, setFechaInicio,
    fechaFin, setFechaFin,
    loading,
    dataVentas
  } = useAnalitica(sucursalId);

  // Pantalla de carga mientras se consultan las fechas
  if (loading) {
    return (
      <div className={s.tabContent} style={{ textAlign: 'center', padding: '100px' }}>
        <p style={{ fontWeight: '800', color: 'var(--color-primary)', fontSize: '1.2rem' }}>
          📊 ANALIZANDO VENTAS...
        </p>
      </div>
    );
  }

  // Extracción segura de datos para evitar errores si vienen vacíos
  const stats = dataVentas?.stats || {};
  const ranking = dataVentas?.ranking || [];
  const staff = dataVentas?.desempeñoStaff || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', animation: 'fadeIn 0.3s ease-out' }}>
      
      {/* ENCABEZADO Y FILTROS DE FECHA */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '15px',
        borderBottom: '2px solid var(--color-bg-muted)',
        paddingBottom: '20px'
      }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '900', margin: 0, color: 'var(--color-text-main)' }}>
            Ventas y Rentabilidad
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '5px 0 0 0' }}>
            Análisis de ingresos y utilidad real por periodo
          </p>
        </div>

        {/* SELECTOR DE FECHAS */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px', 
          background: 'var(--color-bg-muted)', 
          padding: '8px 15px', 
          borderRadius: 'var(--radius-ui)',
          border: '1px solid var(--color-border)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '9px', fontWeight: '800', color: 'var(--color-text-muted)' }}>DESDE</label>
            <input 
              type="date" 
              value={fechaInicio} 
              onChange={(e) => setFechaInicio(e.target.value)} 
              style={{ border: 'none', background: 'transparent', fontWeight: '700', cursor: 'pointer', color: 'var(--color-text-main)' }} 
            />
          </div>
          <div style={{ width: '1px', height: '25px', background: 'var(--color-border)', margin: '0 5px' }}></div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '9px', fontWeight: '800', color: 'var(--color-text-muted)' }}>HASTA</label>
            <input 
              type="date" 
              value={fechaFin} 
              onChange={(e) => setFechaFin(e.target.value)} 
              style={{ border: 'none', background: 'transparent', fontWeight: '700', cursor: 'pointer', color: 'var(--color-text-main)' }} 
            />
          </div>
        </div>
      </header>

      {/* BLOQUE 1: KPIs FINANCIEROS (TARJETAS) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <MetricCard 
          label="VENTA BRUTA (CON IVA)" 
          value={formatCurrency(stats.bruto || 0)} 
          subtext={`Tickets totales: ${stats.tickets || 0}`}
          color="var(--color-text-main)" 
        />
        <MetricCard 
          label="INGRESO NETO" 
          value={formatCurrency(stats.neto || 0)} 
          subtext="Libre de impuestos"
          color="#3b82f6" 
        />
        <MetricCard 
          label="UTILIDAD NETA" 
          value={formatCurrency(stats.utilidad || 0)} 
          subtext={`Margen Real: ${(stats.margenReal || 0).toFixed(1)}%`}
          color="var(--color-success)" 
          isHighlight 
        />
        <MetricCard 
          label="TICKET PROMEDIO" 
          value={formatCurrency(stats.ticketPromedio || 0)} 
          subtext="Gasto promedio por orden"
          color="var(--color-warning)" 
        />
      </div>

      {/* BLOQUE 2: RANKINGS Y DESEMPEÑO */}
      <div className="admin-split-layout-sidebar" style={{ alignItems: 'start' }}>
        
        {/* TOP 5 PRODUCTOS */}
        <div className={s.adminCard} style={{ padding: '25px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '20px' }}>🏆 Top 5 Productos</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {ranking.map((p, i) => (
              <div key={i} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '12px 15px', 
                background: 'var(--color-bg-app)', 
                borderRadius: 'var(--radius-ui)',
                borderLeft: i === 0 ? '4px solid var(--color-primary)' : '1px solid var(--color-border)'
              }}>
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
              <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '20px 0' }}>
                No hay ventas registradas en este periodo.
              </p>
            )}
          </div>
        </div>

        {/* VENTAS POR STAFF */}
        <div className={s.adminCard} style={{ padding: '25px', background: 'var(--color-bg-app)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '20px' }}>👥 Ventas por Staff</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {staff.map((st, i) => (
              <div key={i} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '10px 0', 
                borderBottom: '1px dashed var(--color-border)' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '28px', height: '28px', background: 'var(--color-text-main)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800' }}>
                    {st.nombre.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '700' }}>{st.nombre}</span>
                </div>
                <strong style={{ fontSize: '14px' }}>{formatCurrency(st.total)}</strong>
              </div>
            ))}
            {staff.length === 0 && (
              <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '20px 0' }}>
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
  <div className={s.adminCard} style={{ 
    padding: '22px', 
    borderTop: `5px solid ${color}`,
    background: isHighlight ? 'var(--color-bg-app)' : 'white'
  }}>
    <span style={{ fontSize: '10px', fontWeight: '900', color: 'var(--color-text-muted)', letterSpacing: '0.5px' }}>{label}</span>
    <div style={{ fontSize: '1.8rem', fontWeight: '900', marginTop: '8px', letterSpacing: '-1px' }}>{value}</div>
    {subtext && <p style={{ fontSize: '10px', color: 'var(--color-text-muted)', margin: '4px 0 0 0', fontWeight: '600' }}>{subtext}</p>}
  </div>
);

export default AnaliticaTab;