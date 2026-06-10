// src/modules/Admin/Tabs/Pedidos/Pedidos.jsx
import React, { useState, useEffect } from 'react';
import styles from '../../../../assets/styles/EstilosGenerales.module.css';
import { usePedidos } from './2usePedidos';
import { useAuth } from '../../../Auth/useAuth';

// Token semántico
const COLOR_DANGER = 'var(--color-danger, #ba1a1a)';

export default function Pedidos({ onNuevoPedido, onVerLista }) {
  const {
    loading,
    ordenesActivas,
    totalActivas,      // PAGINACIÓN: total en BD
    hayMasActivas,     // PAGINACIÓN: flag para botón "Cargar más"
    cargarOrdenesActivas,
    cargarMasActivas,  // PAGINACIÓN: función para siguiente bloque
    cancelarPedido
  } = usePedidos();

  const { usuario } = useAuth();

  const permisosPedidos = usuario?.permisos?.pedidos || {};
  const esAdmin         = usuario?.permisos?.configuracion?.leer || false;

  const [ordenPendienteCancelar, setOrdenPendienteCancelar] = useState(null);

  useEffect(() => {
    cargarOrdenesActivas();
  }, [cargarOrdenesActivas]);

  const handleSolicitarCancelacion = (ordenId) => {
    setOrdenPendienteCancelar(ordenId);
  };

  const handleConfirmarCancelacion = async () => {
    if (!ordenPendienteCancelar) return;
    await cancelarPedido(ordenPendienteCancelar);
    setOrdenPendienteCancelar(null);
  };

  const handleDescartarCancelacion = () => {
    setOrdenPendienteCancelar(null);
  };

  const obtenerTextoSolicitantes = (orden) => {
    if (orden.notas && orden.notas.includes('[Solicitantes]:')) {
      const match = orden.notas.match(/\[Solicitantes\]:\s*([^\n]+)/);
      if (match && match[1].trim() !== '') {
        return match[1].trim();
      }
    }
    return orden.solicitante?.nombre_completo || 'Admin';
  };

  return (
    <div className={styles.fadeIN} style={{ width: '100%', maxWidth: '100%', paddingBottom: '100px' }}>

      {/* --- ENCABEZADO --- */}
      <header style={{ marginBottom: 'var(--space-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className={styles.labelTop} style={{ display: 'block', marginBottom: '2px', fontSize: '0.65rem' }}>
            {esAdmin ? 'MONITOREO GLOBAL' : `PEDIDOS ${usuario?.sucursal_nombre || ''}`}
          </span>
          <h1 className={styles.title} style={{ fontSize: '2rem', lineHeight: '1' }}>
            Activos
          </h1>
        </div>

        {/* Contador — ahora muestra total real de BD */}
        <div style={{
          backgroundColor: 'var(--color-primary)',
          color: 'var(--color-surface-lowest)',
          width: '44px',
          height: '44px',
          borderRadius: 'var(--radius-xl)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-card)'
        }}>
          <span style={{ fontSize: '1.1rem', fontWeight: '800', lineHeight: '1' }}>
            {totalActivas}
          </span>
          <span style={{ fontSize: '0.525rem', textTransform: 'uppercase', fontWeight: 'bold', opacity: 0.85 }}>
            Total
          </span>
        </div>
      </header>

      {/* --- ESTADO DE CARGA INICIAL --- */}
      {loading && ordenesActivas.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <div className={styles.labelTop} style={{ animation: 'pulse 1.5s infinite', textAlign: 'center' }}>
            Sincronizando...
          </div>
        </div>
      )}

      {/* --- LISTADO DE FILAS COMPACTAS --- */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', width: '100%' }}>
        {ordenesActivas.map((orden) => {
          const esUrgente         = orden.prioridad === 'Urgente';
          const pendienteCancelar = ordenPendienteCancelar === orden.id;

          return (
            <section
              key={orden.id}
              className={styles.card}
              style={{
                borderLeft: esUrgente
                  ? `4px solid ${COLOR_DANGER}`
                  : '4px solid var(--color-primary)',
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
              {/* Fila 1: Folio y Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span className={styles.labelTop} style={{
                  fontSize: '0.625rem',
                  color: esUrgente ? COLOR_DANGER : 'var(--text-muted)',
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
                    borderRadius: 'var(--radius-sm)',
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
                <div
                  onClick={() => onVerLista(orden.id)}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0, cursor: 'pointer' }}
                >
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

                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <span
                      style={{ color: 'var(--text-light)', overflow: 'hidden', textOverflow: 'ellipsis' }}
                      title={obtenerTextoSolicitantes(orden)}
                    >
                      Por: {obtenerTextoSolicitantes(orden)}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  {permisosPedidos.borrar && (usuario?.id === orden.solicitante_id || esAdmin) && (
                    <button
                      onClick={() => handleSolicitarCancelacion(orden.id)}
                      className={`${styles.btnBase} ${styles.btnSecondary}`}
                      style={{
                        padding: '0',
                        width: '34px',
                        height: '34px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 'var(--radius-lg)',
                        color: COLOR_DANGER,
                        backgroundColor: 'var(--color-surface-low)'
                      }}
                      title="Cancelar pedido"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>delete_sweep</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Confirmación inline */}
              {pendienteCancelar && (
                <div style={{
                  marginTop: 'var(--space-sm)',
                  paddingTop: 'var(--space-sm)',
                  borderTop: `1px dashed ${COLOR_DANGER}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '8px',
                  animation: 'slideUp 0.2s ease'
                }}>
                  <span style={{ fontSize: '0.7rem', color: COLOR_DANGER, fontWeight: 'bold' }}>
                    ¿Cancelar este pedido?
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={handleDescartarCancelacion}
                      className={`${styles.btnBase} ${styles.btnSecondary}`}
                      style={{ height: '28px', padding: '0 10px', fontSize: '0.65rem', borderRadius: 'var(--radius-lg)' }}
                    >
                      No
                    </button>
                    <button
                      onClick={handleConfirmarCancelacion}
                      className={`${styles.btnBase} ${styles.btnDanger}`}
                      style={{ height: '28px', padding: '0 10px', fontSize: '0.65rem', borderRadius: 'var(--radius-lg)' }}
                    >
                      Sí, cancelar
                    </button>
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* ── PAGINACIÓN: Botón "Cargar más" ── */}
      {hayMasActivas && !loading && (
        <button
          onClick={cargarMasActivas}
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
          Cargar más ({ordenesActivas.length} de {totalActivas})
        </button>
      )}

      {/* Indicador de carga al cargar más */}
      {loading && ordenesActivas.length > 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--space-md) 0' }}>
          <div className={styles.labelTop} style={{ animation: 'pulse 1.5s infinite', textAlign: 'center' }}>
            Cargando más pedidos...
          </div>
        </div>
      )}

      {/* --- ESTADO VACÍO --- */}
      {ordenesActivas.length === 0 && !loading && (
        <div style={{
          textAlign: 'center',
          padding: '3.5rem var(--space-md)',
          background: 'var(--color-surface-lowest)',
          borderRadius: 'var(--radius-xl)',
          border: '2px dashed var(--border-ghost)'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--border-ghost)', marginBottom: 'var(--space-sm)' }}>
            inventory_2
          </span>
          <h2 className={styles.subtitle} style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
            Sin órdenes activas
          </h2>
          <p style={{ color: 'var(--text-light)', fontSize: '0.8rem', margin: 0 }}>
            Todos los pedidos han sido surtidos o cancelados.
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
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'var(--text-main)',
            color: 'var(--color-surface-lowest)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-dropdown, 0 6px 20px rgba(0,0,0,0.2))',
            zIndex: 100,
            cursor: 'pointer'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.6rem' }}>add_shopping_cart</span>
        </button>
      )}
    </div>
  );
}