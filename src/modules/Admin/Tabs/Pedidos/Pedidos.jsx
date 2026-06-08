// src/modules/Admin/Tabs/Pedidos/Pedidos.jsx
import React, { useState, useEffect } from 'react';
import styles from '../../../../assets/styles/EstilosGenerales.module.css';
import { usePedidos } from './2usePedidos';
import { useAuth } from '../../../Auth/useAuth'; // CORRECCIÓN P1: reemplaza AuthService

// Token semántico — no existe aún en variables.css, fallback incluido
const COLOR_DANGER = 'var(--color-danger, #ba1a1a)';

export default function Pedidos({ onNuevoPedido, onVerLista }) {
  const {
    loading,
    ordenesActivas,
    cargarOrdenesActivas,
    cancelarPedido
  } = usePedidos();

  // CORRECCIÓN P1: Consumimos el Context centralizado
  const { usuario } = useAuth();

  // Extraemos permisos específicos para este módulo
  const permisosPedidos = usuario?.permisos?.pedidos || {};
  const esAdmin         = usuario?.permisos?.configuracion?.leer || false;

  /**
   * CORRECCIÓN P1: Estado para confirmación de cancelación.
   * Reemplaza window.confirm — cuando el usuario pulsa cancelar,
   * guardamos el ID de la orden pendiente y mostramos una UI inline.
   * Solo cuando confirma se ejecuta cancelarPedido().
   */
  const [ordenPendienteCancelar, setOrdenPendienteCancelar] = useState(null);

  // Sincronizamos automáticamente las órdenes activas al montar el componente
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

  /**
   * FUNCIÓN AUXILIAR: Extrae los nombres de la coautoría guardados en las notas.
   * Si no se encuentra la etiqueta estructurada, retorna el nombre del solicitante original.
   */
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

        {/* Contador de impacto visual mini */}
        <div style={{
          backgroundColor: 'var(--color-primary)',
          color: 'var(--color-surface-lowest)',   // CORRECCIÓN: era 'white'
          width: '44px',
          height: '44px',
          borderRadius: 'var(--radius-xl)',        // CORRECCIÓN: era '12px'
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-card)'          // CORRECCIÓN: era rgba(0,95,86,0.2) — color teal incorrecto
        }}>
          <span style={{ fontSize: '1.1rem', fontWeight: '800', lineHeight: '1' }}>
            {ordenesActivas.length}
          </span>
          <span style={{ fontSize: '0.525rem', textTransform: 'uppercase', fontWeight: 'bold', opacity: 0.85 }}>
            Total
          </span>
        </div>
      </header>

      {/* --- ESTADO DE CARGA --- */}
      {loading && ordenesActivas.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}> {/* CORRECCIÓN: typo texttextAling */}
          <div className={styles.labelTop} style={{ animation: 'pulse 1.5s infinite', textAlign: 'center' }}>
            Sincronizando...
          </div>
        </div>
      )}

      {/* --- LISTADO DE FILAS COMPACTAS PARA MÓVIL --- */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', width: '100%' }}>
        {ordenesActivas.map((orden) => {
          const esUrgente           = orden.prioridad === 'Urgente';
          const pendienteCancelar   = ordenPendienteCancelar === orden.id;

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
                borderRadius: 'var(--radius-xl)',            // CORRECCIÓN: era '10px'
                backgroundColor: 'var(--color-surface-lowest)', // CORRECCIÓN: era 'white'
                boxShadow: 'var(--shadow-card)',               // CORRECCIÓN: era rgba inline
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
                    borderRadius: 'var(--radius-sm)',  // CORRECCIÓN: era '4px'
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

                  {/* Solicitantes Unificados */}
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <span
                      style={{ color: 'var(--text-light)', overflow: 'hidden', textOverflow: 'ellipsis' }}
                      title={obtenerTextoSolicitantes(orden)}
                    >
                      Por: {obtenerTextoSolicitantes(orden)}
                    </span>
                  </div>
                </div>

                {/* Botones de acción mini */}
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
                        borderRadius: 'var(--radius-lg)',     // CORRECCIÓN: era '8px'
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

              {/* ── CONFIRMACIÓN INLINE — reemplaza window.confirm ── */}
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

      {/* --- ESTADO VACÍO (Para Activos) --- */}
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
            borderRadius: 'var(--radius-xl)',              // CORRECCIÓN: era '16px'
            backgroundColor: 'var(--text-main)',
            color: 'var(--color-surface-lowest)',          // CORRECCIÓN: era 'white'
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