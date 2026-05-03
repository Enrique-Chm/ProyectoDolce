// src/modules/Admin/Tabs/Historial/Historial.jsx
import React, { useEffect, useState } from 'react';
import styles from '../../../../assets/styles/EstilosGenerales.module.css';
import { useHistorial } from './2useHistorial';
import { AuthService } from '../../../Auth/Auth.service';

export default function Historial({ onVerDetalle }) {
  const { 
    loading, 
    ordenesHistorial, 
    cargarHistorialPorFechas, 
    buscarFolio 
  } = useHistorial();

  const [busqueda, setBusqueda] = useState('');
  const [haFiltrado, setHaFiltrado] = useState(false); // Controla si ya se hizo clic en Buscar

  // Rango de fechas inicial: últimos 30 días
  const [fechas, setFechas] = useState({
    inicio: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    fin: new Date().toISOString().split('T')[0]
  });
  
  // Obtenemos la sesión para validar permisos
  const sesion = AuthService.getSesion();
  const esAdmin = sesion?.permisos?.configuracion?.leer || false;

  // Manejador del botón Filtrar
  const manejarBusquedaHistorial = () => {
    cargarHistorialPorFechas(fechas.inicio, fechas.fin);
    setHaFiltrado(true);
  };

  // Manejador del buscador con actualización de estado y llamada al hook
  const handleSearch = (e) => {
    const valor = e.target.value;
    setBusqueda(valor);
    buscarFolio(valor);
  };

  // Formateador de fechas localizado para el listado
  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return 'N/A';
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Formateador de moneda MXN
  const formatearDinero = (monto) => {
    return new Intl.NumberFormat('es-MX', { 
      style: 'currency', 
      currency: 'MXN' 
    }).format(monto || 0);
  };

  return (
    <div className={styles.fadeIN} style={{ width: '100%', maxWidth: '100%', paddingBottom: '100px' }}>
      {/* --- ENCABEZADO --- */}
      <header style={{ marginBottom: 'var(--space-md)' }}>
        <span className={styles.labelTop} style={{ display: 'block', marginBottom: '2px', fontSize: '0.65rem' }}>
          {esAdmin ? 'AUDITORÍA GLOBAL' : `REGISTROS ${sesion?.sucursal_nombre || ''}`}
        </span>
        <h1 className={styles.title} style={{ fontSize: '2rem', lineHeight: '1.1', marginBottom: 'var(--space-md)' }}>
          Órdenes<br />Finalizadas
        </h1>

        {/* --- FILTROS DE RANGO DE FECHAS OPTIMIZADO PARA MÓVIL --- */}
        <div style={{ 
          marginBottom: '12px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '10px', 
          padding: '12px', 
          backgroundColor: 'var(--color-surface-lowest)', 
          borderRadius: '12px', 
          border: '1px solid var(--border-ghost)' 
        }}>
          {/* Inputs de fechas en 2 columnas iguales */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label className={styles.labelTop} style={{ fontSize: '0.65rem', opacity: 0.8, margin: 0 }}>
                DESDE
              </label>
              <input 
                type="date" 
                value={fechas.inicio} 
                onChange={(e) => setFechas({ ...fechas, inicio: e.target.value })} 
                className={styles.inputEditorial}
                style={{ width: '100%', height: '36px', padding: '0 8px', fontSize: '0.85rem', borderRadius: '8px' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label className={styles.labelTop} style={{ fontSize: '0.65rem', opacity: 0.8, margin: 0 }}>
                HASTA
              </label>
              <input 
                type="date" 
                value={fechas.fin} 
                onChange={(e) => setFechas({ ...fechas, fin: e.target.value })} 
                className={styles.inputEditorial}
                style={{ width: '100%', height: '36px', padding: '0 8px', fontSize: '0.85rem', borderRadius: '8px' }}
              />
            </div>
          </div>

          {/* Botón Filtrar abajo a lo ancho */}
          <button 
            onClick={manejarBusquedaHistorial} 
            className={`${styles.btnBase} ${styles.btnPrimary}`} 
            style={{ 
              height: '36px', 
              padding: '0', 
              fontSize: '0.85rem', 
              borderRadius: '8px', 
              width: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '6px' 
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>search</span>
            Filtrar Registros
          </button>
        </div>

        {/* BUSCADOR EDITORIAL */}
        {haFiltrado && (
          <div style={{ position: 'relative', marginTop: '10px' }}>
            <span 
              className="material-symbols-outlined" 
              style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                fontSize: '1.2rem'
              }}
            >
              search
            </span>
            <input 
              type="text"
              placeholder="Buscar por folio..."
              value={busqueda}
              onChange={handleSearch}
              className={styles.inputEditorial}
              style={{ paddingLeft: '40px', height: '38px', fontSize: '0.9rem', borderRadius: '8px' }}
            />
          </div>
        )}
      </header>

      {/* --- ESTADO DE CARGA --- */}
      {loading && ordenesHistorial.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <div className={styles.labelTop} style={{ animation: 'pulse 1.5s infinite' }}>Sincronizando...</div>
        </div>
      )}

      {/* --- LISTADO DE FILAS COMPACTAS PARA MÓVIL --- */}
      {haFiltrado && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
          {ordenesHistorial.map((orden) => (
            <div 
              key={orden.id} 
              className={styles.card}
              onClick={() => onVerDetalle(orden.id)}
              style={{ 
                cursor: 'pointer',
                borderLeft: orden.estatus === 'Completado' 
                  ? '4px solid var(--color-primary)' 
                  : '4px solid #ba1a1a',
                borderTop: 'none',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '10px',
                backgroundColor: 'white',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                transition: 'all 0.15s ease',
                minHeight: '64px',
                gap: '6px'
              }}
            >
              {/* --- FILA SUPERIOR: FOLIO Y STATUS HASTA LA DERECHA --- */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span className={styles.labelTop} style={{ 
                  fontSize: '0.625rem', 
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontWeight: 'bold'
                }}>
                  {orden.folio || 'S/F'}
                </span>
                
                <span style={{
                  fontSize: '0.55rem',
                  fontWeight: '800',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  textTransform: 'uppercase',
                  backgroundColor: orden.estatus === 'Completado' ? 'var(--color-primary-container)' : '#ffebee',
                  color: orden.estatus === 'Completado' ? 'var(--color-on-primary-container)' : '#ba1a1a',
                  border: `1px solid ${orden.estatus === 'Completado' ? 'var(--color-primary)' : '#ffcdd2'}`
                }}>
                  {orden.estatus}
                </span>
              </div>

              {/* --- FILA INFERIOR: INFORMACIÓN Y ACCIONES --- */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', gap: '12px' }}>
                {/* Bloque Izquierdo: Sucursal, Proveedor, Total y Solicitante */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                  
                  {/* Sucursal */}
                  <span style={{ 
                    fontSize: '0.65rem', 
                    color: 'var(--text-light)', 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    lineHeight: '1.1'
                  }}>
                  {orden.sucursal?.nombre || 'General'}
                  </span>

                  {/* Nombre del Proveedor */}
                  <h2 className={styles.subtitle} style={{ 
                    fontSize: '0.875rem', 
                    margin: '1px 0', 
                    fontWeight: 'bold', 
                    color: 'var(--text-main)', 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    lineHeight: '1.2'
                  }}>
                    {orden.proveedor?.nombre || 'Proveedor Desconocido'}
                  </h2>

                  {/* Precio, Solicitante y Fecha */}
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>
                      {formatearDinero(orden.total_estimado)}
                    </span>
                    <span>•</span>
                    <span style={{ color: 'var(--text-light)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      👤 {orden.solicitante?.nombre_completo || 'Sistema'}
                    </span>
                    <span>•</span>
                    <span style={{ color: 'var(--text-light)' }}>
                      {formatearFecha(orden.created_at)}
                    </span>
                  </div>
                </div>
                
                {/* Bloque Derecho: Botón de Acción Mini */}
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onVerDetalle(orden.id); }}
                    className={`${styles.btnBase} ${styles.btnPrimary}`} 
                    style={{ 
                      padding: '0', 
                      width: '34px', 
                      height: '34px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      borderRadius: '8px',
                      backgroundColor: 'var(--color-primary)'
                    }} 
                    title="Ver Detalle"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1.05rem', color: 'white' }}>visibility</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* --- ESTADO VACÍO (Antes de filtrar) --- */}
      {!haFiltrado && !loading && (
        <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: 'var(--color-surface-lowest)', borderRadius: '24px', border: '2px dashed var(--border-ghost)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--color-primary)', opacity: 0.65, marginBottom: '8px' }}>
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

      {/* --- ESTADO VACÍO (Si ya se filtró y no hay nada) --- */}
      {haFiltrado && ordenesHistorial.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: 'var(--color-surface-lowest)', borderRadius: '24px', border: '2px dashed var(--border-ghost)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--border-ghost)', marginBottom: '8px' }}>
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