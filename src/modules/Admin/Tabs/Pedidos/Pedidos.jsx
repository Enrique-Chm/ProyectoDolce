// src/modules/Admin/Tabs/Pedidos/Pedidos.jsx
import React, { useEffect } from 'react';
import styles from '../../../../assets/styles/EstilosGenerales.module.css';
import { usePedidos } from './2usePedidos';
import { AuthService } from '../../../Auth/Auth.service';

export default function Pedidos({ onNuevoPedido, onVerLista }) {
  const { 
    loading, 
    ordenesActivas, 
    cargarOrdenesActivas, 
    cancelarPedido 
  } = usePedidos();

  const sesion = AuthService.getSesion();
  
  // Extraemos permisos específicos para este módulo
  const permisosPedidos = sesion?.permisos?.pedidos || {};
  const esAdmin = sesion?.permisos?.configuracion?.leer || false;

  // Sincronizamos automáticamente las órdenes activas al montar el componente
  useEffect(() => {
    cargarOrdenesActivas();
  }, [cargarOrdenesActivas]);

  return (
    <div className={styles.fadeIN} style={{ width: '100%', maxWidth: '100%', paddingBottom: '100px' }}>
      {/* --- ENCABEZADO --- */}
      <header style={{ marginBottom: 'var(--space-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className={styles.labelTop} style={{ display: 'block', marginBottom: '2px', fontSize: '0.65rem' }}>
            {esAdmin ? 'MONITOREO GLOBAL' : `PEDIDOS ${sesion?.sucursal_nombre || ''}`}
          </span>
          <h1 className={styles.title} style={{ fontSize: '2rem', lineHeight: '1' }}>
            Activos
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
            {ordenesActivas.length}
          </span>
          <span style={{ fontSize: '0.525rem', textTransform: 'uppercase', fontWeight: 'bold', opacity: 0.85 }}>
            Total
          </span>
        </div>
      </header>

      {/* --- ESTADO DE CARGA --- */}
      {loading && ordenesActivas.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <div className={styles.labelTop} style={{ animation: 'pulse 1.5s infinite' }}>Sincronizando...</div>
        </div>
      )}

      {/* --- LISTADO DE FILAS COMPACTAS PARA MÓVIL --- */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '8px',
        width: '100%'
      }}>
        {ordenesActivas.map((orden) => {
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

                  {/* Solicitante */}
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <span style={{ color: 'var(--text-light)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Por: {orden.solicitante?.nombre_completo || 'Admin'}
                    </span>
                  </div>
                </div>
                
                {/* Botones de acción mini */}
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  {/* Botón cancelar si cumple permisos y es el creador */}
                  {permisosPedidos.borrar && sesion?.id === orden.solicitante_id && (
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

      {/* --- ESTADO VACÍO (Para Activos) --- */}
      {ordenesActivas.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: 'var(--color-surface-lowest)', borderRadius: '24px', border: '2px dashed var(--border-ghost)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--border-ghost)', marginBottom: '8px' }}>
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