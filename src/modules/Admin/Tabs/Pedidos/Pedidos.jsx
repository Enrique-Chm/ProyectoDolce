// src/modules/Admin/Tabs/Pedidos/Pedidos.jsx
import React, { useState, useEffect } from 'react';
import styles from '../../../../assets/styles/EstilosGenerales.module.css';
import { usePedidos } from './2usePedidos';
import { AuthService } from '../../../Auth/Auth.service';

export default function Pedidos({ onNuevoPedido, onVerLista }) {
  const { 
    loading, 
    ordenesActivas, 
    ordenesHistorial,
    cargarOrdenesActivas, 
    cargarHistorialPorFechas,
    cancelarPedido 
  } = usePedidos();

  const sesion = AuthService.getSesion();
  
  // Extraemos permisos específicos para este módulo
  const permisosPedidos = sesion?.permisos?.pedidos || {};
  const esAdmin = sesion?.permisos?.configuracion?.leer || false;

  // --- ESTADOS DE NAVEGACIÓN LOCAL Y FILTROS ---
  const [subTab, setSubTab] = useState('activos'); // 'activos' | 'historial'
  const [haFiltrado, setHaFiltrado] = useState(false); // Controla si ya se hizo clic en Buscar

  // El rango de fechas por defecto son los últimos 30 días
  const [fechas, setFechas] = useState({
    inicio: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    fin: new Date().toISOString().split('T')[0]
  });

  // Solo sincronizamos automáticamente las órdenes activas.
  // El historial ya no se carga al cambiar de pestaña.
  useEffect(() => {
    if (subTab === 'activos') {
      cargarOrdenesActivas();
    }
  }, [subTab, cargarOrdenesActivas]);

  // Manejador del botón Filtrar
  const manejarBusquedaHistorial = () => {
    cargarHistorialPorFechas(fechas.inicio, fechas.fin);
    setHaFiltrado(true);
  };

  // Formateador de moneda MXN
  const formatearDinero = (monto) => {
    return new Intl.NumberFormat('es-MX', { 
      style: 'currency', 
      currency: 'MXN' 
    }).format(monto || 0);
  };

  // Determinar qué lista de órdenes se mostrará en pantalla
  const ordenesAMostrar = subTab === 'activos' ? ordenesActivas : ordenesHistorial;

  return (
    <div className={styles.fadeIN} style={{ width: '100%', maxWidth: '100%', paddingBottom: '100px' }}>
      {/* --- ENCABEZADO COMPACTADO --- */}
      <header style={{ marginBottom: 'var(--space-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className={styles.labelTop} style={{ display: 'block', marginBottom: '2px', fontSize: '0.65rem' }}>
            {esAdmin ? 'MONITOREO GLOBAL' : `PEDIDOS ${sesion?.sucursal_nombre || ''}`}
          </span>
          <h1 className={styles.title} style={{ fontSize: '2rem', lineHeight: '1' }}>
            {subTab === 'activos' ? 'Activos' : 'Historial'}
          </h1>
        </div>
        
        {/* Contador de impacto visual mini */}
        <div style={{ 
          backgroundColor: 'var(--color-primary)', 
          color: 'white',
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 10px rgba(0,95,86,0.2)'
        }}>
          <span style={{ fontSize: '1.1rem', fontWeight: '800', lineHeight: '1' }}>
            {ordenesAMostrar.length}
          </span>
          <span style={{ fontSize: '0.525rem', textTransform: 'uppercase', fontWeight: 'bold', opacity: 0.85 }}>
            Total
          </span>
        </div>
      </header>

      {/* --- SELECTOR DE SUB-PESTAÑA --- */}
      <nav style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <button 
          onClick={() => { setSubTab('activos'); setHaFiltrado(false); }} 
          className={`${styles.btnBase} ${subTab === 'activos' ? styles.btnPrimary : styles.btnSecondary}`}
          style={{ flex: 1, padding: '0 10px', fontSize: '0.85rem', height: '40px' }}
        >
          Activos ({ordenesActivas.length})
        </button>
        <button 
          onClick={() => setSubTab('historial')} 
          className={`${styles.btnBase} ${subTab === 'historial' ? styles.btnPrimary : styles.btnSecondary}`}
          style={{ flex: 1, padding: '0 10px', fontSize: '0.85rem', height: '40px' }}
        >
          Historial ({ordenesHistorial.length})
        </button>
      </nav>

      {/* --- FILTROS DE RANGO DE FECHAS OPTIMIZADO PARA MÓVIL (Solo en Historial) --- */}
      {subTab === 'historial' && (
        <div style={{ 
          marginBottom: '16px', 
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
      )}

      {/* --- ESTADO DE CARGA --- */}
      {loading && ordenesAMostrar.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <div className={styles.labelTop} style={{ animation: 'pulse 1.5s infinite' }}>Sincronizando...</div>
        </div>
      )}

      {/* --- LISTADO DE FILAS COMPACTAS PARA MÓVIL --- */}
      {!(subTab === 'historial' && !haFiltrado) && (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '8px',
          width: '100%'
        }}>
          {ordenesAMostrar.map((orden) => {
            const esUrgente = orden.prioridad === 'Urgente';
            return (
              <section 
                key={orden.id} 
                className={styles.card} 
                style={{ 
                  borderLeft: esUrgente ? '4px solid #ba1a1a' : '4px solid var(--color-primary)',
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
                {/* Fila 1: Folio y Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span className={styles.labelTop} style={{ 
                    fontSize: '0.625rem', 
                    color: esUrgente ? '#ba1a1a' : 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontWeight: 'bold'
                  }}>
                    {orden.folio}
                  </span>
                  
                  <span 
                    className={`${styles.badge} ${esUrgente ? styles.badgeUrgent : styles.badgePending}`}
                    style={{ 
                      fontSize: '0.55rem', 
                      padding: '2px 6px', 
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {orden.estatus}
                  </span>
                </div>

                {/* Fila Inferior: Información y Acciones */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', gap: '12px' }}>
                  <div onClick={() => onVerLista(orden.id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0, cursor: 'pointer' }}>
                    
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
                      {orden.proveedor?.nombre || 'Proveedor Pendiente'}
                    </h2>

                    {/* Precio y Solicitante */}
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>
                        {formatearDinero(orden.total_estimado)}
                      </span>
                      <span>•</span>
                      <span style={{ color: 'var(--text-light)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        👤 {orden.solicitante?.nombre_completo || 'Admin'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Botones de acción mini */}
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button 
                      onClick={() => onVerLista(orden.id)}
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
                      title={subTab === 'activos' && permisosPedidos.editar ? 'Surtir Pedido' : 'Revisar'}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1.05rem', color: 'white' }}>
                        {subTab === 'activos' && permisosPedidos.editar ? 'inventory' : 'visibility'}
                      </span>
                    </button>

                    {/* Botón cancelar si está activo y cumple con la Opción 2 */}
                    {subTab === 'activos' && permisosPedidos.borrar && sesion?.id === orden.solicitante_id && (
                      <button 
                        onClick={() => cancelarPedido(orden.id)}
                        className={`${styles.btnBase} ${styles.btnSecondary}`}
                        style={{ 
                          padding: '0', 
                          width: '34px', 
                          height: '34px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          borderRadius: '8px',
                          color: '#ba1a1a',
                          backgroundColor: 'var(--color-surface-low)'
                        }}
                        title="Cancelar pedido"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>delete_sweep</span>
                      </button>
                    )}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* --- ESTADO VACÍO (Historial antes de filtrar) --- */}
      {subTab === 'historial' && !haFiltrado && !loading && (
        <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: 'var(--color-surface-lowest)', borderRadius: '24px', border: '2px dashed var(--border-ghost)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--color-primary)', opacity: 0.65, marginBottom: '8px' }}>
            date_range
          </span>
          <h2 className={styles.subtitle} style={{ color: 'var(--text-main)', fontSize: '1.1rem', marginBottom: '4px' }}>
            Búsqueda de historial
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0, maxWidth: '280px', marginInline: 'auto', lineHeight: '1.4' }}>
            Selecciona un rango de fechas en la parte superior y haz clic en <b>Filtrar Registros</b> para visualizar la información.
          </p>
        </div>
      )}

      {/* --- ESTADO VACÍO (Si ya se filtró y no hay nada) --- */}
      {subTab === 'historial' && haFiltrado && ordenesAMostrar.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: 'var(--color-surface-lowest)', borderRadius: '24px', border: '2px dashed var(--border-ghost)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--border-ghost)', marginBottom: '8px' }}>
            inventory_2
          </span>
          <h2 className={styles.subtitle} style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
            Sin órdenes en el historial
          </h2>
          <p style={{ color: 'var(--text-light)', fontSize: '0.8rem', margin: 0 }}>
            No se encontraron registros en el rango de fechas seleccionado.
          </p>
        </div>
      )}

      {/* --- ESTADO VACÍO (Para Activos) --- */}
      {subTab === 'activos' && ordenesAMostrar.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: 'var(--color-surface-lowest)', borderRadius: '24px', border: '2px dashed var(--border-ghost)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--border-ghost)', marginBottom: '8px' }}>
            inventory_2
          </span>
          <h2 className={styles.subtitle} style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
            Sin órdenes activas
          </h2>
          <p style={{ color: 'var(--text-light)', fontSize: '0.8rem', margin: 0 }}>
            Todos los pedidos han sido surtidos o están en el historial.
          </p>
        </div>
      )}

      {/* --- BOTÓN FLOTANTE: NUEVA ORDEN --- */}
      {permisosPedidos.crear && (
        <button 
          onClick={onNuevoPedido}
          style={{ 
            position: 'fixed',
            bottom: '90px',
            right: '20px',
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            backgroundColor: 'var(--text-main)',
            color: 'white',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
            zIndex: 100,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.6rem' }}>add_shopping_cart</span>
        </button>
      )}
    </div>
  );
}