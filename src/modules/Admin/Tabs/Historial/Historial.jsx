// src/modules/Admin/Tabs/Historial/Historial.jsx
import React, { useState } from 'react';
import styles from '../../../../assets/styles/EstilosGenerales.module.css';
import { useHistorial } from './2useHistorial';
import { useAuth } from '../../../Auth/useAuth';

// Token semántico
const COLOR_DANGER = 'var(--color-danger, #ba1a1a)';

export default function Historial({ onVerDetalle }) {
  const {
    loading,
    ordenesHistorial,
    totalHistorial,       // PAGINACIÓN: total en BD
    hayMasHistorial,      // PAGINACIÓN: flag para botón "Cargar más"
    cargarHistorialPorFechas,
    cargarMasHistorial,   // PAGINACIÓN: función para siguiente bloque
    buscarFolio
  } = useHistorial();

  const [busqueda, setBusqueda] = useState('');
  const [haFiltrado, setHaFiltrado] = useState(false);

  // Rango de fechas inicial: últimos 30 días
  const [fechas, setFechas] = useState({
    inicio: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    fin: new Date().toISOString().split('T')[0]
  });

  const { usuario } = useAuth();
  const esAdmin = usuario?.permisos?.configuracion?.leer || false;

  // Manejador del botón Filtrar
  const manejarBusquedaHistorial = () => {
    setBusqueda(''); // Limpiamos búsqueda local al filtrar nuevas fechas
    cargarHistorialPorFechas(fechas.inicio, fechas.fin);
    setHaFiltrado(true);
  };

  // Manejador del buscador
  const handleSearch = (e) => {
    const valor = e.target.value;
    setBusqueda(valor);
    buscarFolio(valor);
  };

  // Formateador de fechas localizado
  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return 'N/A';
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className={styles.fadeIN} style={{ width: '100%', maxWidth: '100%', paddingBottom: '100px' }}>

      {/* --- ENCABEZADO --- */}
      <header style={{ marginBottom: 'var(--space-md)' }}>
        <span className={styles.labelTop} style={{ display: 'block', marginBottom: '2px', fontSize: '0.65rem' }}>
          {esAdmin ? 'AUDITORÍA GLOBAL' : `REGISTROS ${usuario?.sucursal_nombre || ''}`}
        </span>
        <h1 className={styles.title} style={{ fontSize: '2rem', lineHeight: '1.1', marginBottom: 'var(--space-md)' }}>
          Órdenes<br />Finalizadas
        </h1>

                {/* --- FILTROS DE RANGO DE FECHAS (DISEÑO SEGMENTADO) --- */}
        <div style={{
          marginBottom: '12px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--color-surface-lowest)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-ghost)',
          boxShadow: 'var(--shadow-card)',
          padding: '12px 8px' // Padding lateral mínimo
        }}>
          {/* Fila segmentada de fechas */}
          <div style={{ display: 'flex', width: '100%', marginBottom: '10px' }}>
            
            {/* Bloque DESDE */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label className={styles.labelTop} style={{ fontSize: '0.55rem', textAlign: 'center', opacity: 0.7 }}>DESDE</label>
              <input
                type="date"
                value={fechas.inicio}
                onChange={(e) => setFechas({ ...fechas, inicio: e.target.value })}
                className={styles.inputEditorial}
                style={{ 
                  height: '42px', 
                  fontSize: '13px', 
                  padding: '0 2px',
                  textAlign: 'center',
                  borderRight: 'none', // Quitamos el borde derecho para unirlo al siguiente
                  borderRadius: '10px 0 0 10px', // Redondeado solo a la izquierda
                  backgroundColor: 'transparent'
                }}
              />
            </div>

            {/* Divisor visual central muy fino */}
            <div style={{ width: '1px', backgroundColor: 'var(--border-ghost)', marginTop: '22px', height: '24px', alignSelf: 'center' }} />

            {/* Bloque HASTA */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label className={styles.labelTop} style={{ fontSize: '0.55rem', textAlign: 'center', opacity: 0.7 }}>HASTA</label>
              <input
                type="date"
                value={fechas.fin}
                onChange={(e) => setFechas({ ...fechas, fin: e.target.value })}
                className={styles.inputEditorial}
                style={{ 
                  height: '42px', 
                  fontSize: '13px', 
                  padding: '0 2px',
                  textAlign: 'center',
                  borderLeft: 'none', // Quitamos el borde izquierdo
                  borderRadius: '0 10px 10px 0', // Redondeado solo a la derecha
                  backgroundColor: 'transparent'
                }}
              />
            </div>
          </div>

          {/* Botón de Filtrar */}
          <button
            onClick={manejarBusquedaHistorial}
            disabled={loading}
            className={`${styles.btnBase} ${styles.btnPrimary}`}
            style={{
              height: '42px',
              fontSize: '0.85rem',
              borderRadius: '10px',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>search</span>
            FILTRAR REGISTROS
          </button>
        </div>
        {/* BUSCADOR + CONTEO */}
        {haFiltrado && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginTop: '10px' }}>
            {/* Conteo de resultados */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Mostrando <b style={{ color: 'var(--text-main)' }}>{ordenesHistorial.length}</b> de <b style={{ color: 'var(--color-primary)' }}>{totalHistorial}</b> registros
              </span>
            </div>

            {/* Buscador local */}
            <div style={{ position: 'relative' }}>
              <span
                className="material-symbols-outlined"
                style={{
                  position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', fontSize: '1.2rem'
                }}
              >
                search
              </span>
              <input
                type="text"
                placeholder="Buscar por folio, proveedor o sucursal..."
                value={busqueda}
                onChange={handleSearch}
                className={styles.inputEditorial}
                style={{ paddingLeft: '40px', height: '38px', fontSize: '0.9rem', borderRadius: 'var(--radius-lg)' }}
              />
            </div>
          </div>
        )}
      </header>

      {/* --- ESTADO DE CARGA INICIAL --- */}
      {loading && ordenesHistorial.length === 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--space-lg) 0' }}>
          <div className={styles.labelTop} style={{ animation: 'pulse 1.5s infinite' }}>Sincronizando...</div>
        </div>
      )}

      {/* --- LISTADO DE FILAS --- */}
      {haFiltrado && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', width: '100%' }}>
          {ordenesHistorial.map((orden) => (
            <div
              key={orden.id}
              className={styles.card}
              onClick={() => onVerDetalle(orden.id)}
              style={{
                cursor: 'pointer',
                borderLeft: orden.estatus === 'Completado'
                  ? '4px solid var(--color-primary)'
                  : `4px solid ${COLOR_DANGER}`,
                borderTop: 'none',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: 'var(--space-sm) 12px',
                borderRadius: 'var(--radius-xl)',
                backgroundColor: 'var(--color-surface-lowest)',
                boxShadow: 'var(--shadow-card)',
                transition: 'all 0.15s ease',
                minHeight: '64px',
                gap: '6px'
              }}
            >
              {/* Fila Superior: Folio y Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span className={styles.labelTop} style={{
                  fontSize: '0.625rem', color: 'var(--text-muted)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 'bold'
                }}>
                  {orden.folio || 'S/F'}
                </span>

                <span style={{
                  fontSize: '0.55rem', fontWeight: '800', padding: '2px 6px',
                  borderRadius: 'var(--radius-sm)', textTransform: 'uppercase',
                  backgroundColor: orden.estatus === 'Completado' ? 'var(--color-primary-fixed)' : '#ffebee',
                  color: orden.estatus === 'Completado' ? 'var(--color-on-primary-fixed)' : '#b96464',
                  border: `1px solid ${orden.estatus === 'Completado' ? 'var(--color-primary)' : '#ffcdd2'}`
                }}>
                  {orden.estatus}
                </span>
              </div>

              {/* Fila Inferior: Información */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', gap: '12px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>

                  <span style={{
                    fontSize: '0.65rem', color: 'var(--text-light)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.1'
                  }}>
                    {orden.sucursal?.nombre || 'General'}
                  </span>

                  <h2 className={styles.subtitle} style={{
                    fontSize: '0.875rem', margin: '1px 0', fontWeight: 'bold', color: 'var(--text-main)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.2'
                  }}>
                    {orden.proveedor?.nombre || 'Proveedor Desconocido'}
                  </h2>

                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <span style={{ color: 'var(--text-light)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      👤 {orden.solicitante?.nombre_completo || 'Sistema'}
                    </span>
                    <span>•</span>
                    <span style={{ color: 'var(--text-light)' }}>
                      {formatearFecha(orden.created_at)}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); onVerDetalle(orden.id); }}
                    className={`${styles.btnBase} ${styles.btnPrimary}`}
                    style={{
                      padding: '0', width: '34px', height: '34px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-primary)'
                    }}
                    title="Ver Detalle"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1.05rem', color: 'var(--color-surface-lowest)' }}>visibility</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* ── PAGINACIÓN: Botón "Cargar más" ── */}
      {haFiltrado && hayMasHistorial && !loading && (
        <button
          onClick={cargarMasHistorial}
          className={`${styles.btnBase} ${styles.btnOutlined}`}
          style={{
            width: '100%',
            marginTop: 'var(--space-md)',
            height: '42px',
            fontSize: '0.8rem',
            borderColor: 'var(--color-primary)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-sm)'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>expand_more</span>
          Cargar más ({ordenesHistorial.length} de {totalHistorial})
        </button>
      )}

      {/* Indicador de carga al cargar más */}
      {loading && ordenesHistorial.length > 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--space-md) 0' }}>
          <div className={styles.labelTop} style={{ animation: 'pulse 1.5s infinite', textAlign: 'center' }}>
            Cargando más registros...
          </div>
        </div>
      )}

      {/* --- ESTADO VACÍO: Antes de filtrar --- */}
      {!haFiltrado && !loading && (
        <div style={{ textAlign: 'center', padding: '3.5rem var(--space-md)', background: 'var(--color-surface-lowest)', borderRadius: 'var(--radius-xl)', border: '2px dashed var(--border-ghost)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--color-primary)', opacity: 0.65, marginBottom: 'var(--space-sm)' }}>
            date_range
          </span>
          <h2 className={styles.subtitle} style={{ color: 'var(--text-main)', fontSize: '1.1rem', marginBottom: '4px' }}>
            Archivo Histórico
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0, maxWidth: '280px', marginInline: 'auto', lineHeight: '1.4' }}>
            Selecciona un rango de fechas arriba y haz clic en <b>Filtrar</b> para visualizar las órdenes finalizadas.
          </p>
        </div>
      )}

      {/* --- ESTADO VACÍO: Filtrado sin resultados --- */}
      {haFiltrado && ordenesHistorial.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '3.5rem var(--space-md)', background: 'var(--color-surface-lowest)', borderRadius: 'var(--radius-xl)', border: '2px dashed var(--border-ghost)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--border-ghost)', marginBottom: 'var(--space-sm)' }}>
            folder_open
          </span>
          <h2 className={styles.subtitle} style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Sin coincidencias</h2>
          <p style={{ color: 'var(--text-light)', fontSize: '0.8rem', margin: 0 }}>
            No se encontraron registros en el rango de fechas seleccionado.
          </p>
        </div>
      )}
    </div>
  );
}