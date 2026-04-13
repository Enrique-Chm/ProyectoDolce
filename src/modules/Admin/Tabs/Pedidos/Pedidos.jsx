// src/modules/Admin/Tabs/Pedidos/Pedidos.jsx
import React, { useEffect } from 'react';
import styles from '../../../../assets/styles/EstilosGenerales.module.css';
import { usePedidos } from './2usePedidos';
import { AuthService } from '../../../Auth/Auth.service'; // Importamos para lógica de roles

export default function Pedidos({ onNuevoPedido, onVerLista }) {
  const { 
    loading, 
    ordenesActivas, 
    cargarOrdenesActivas, 
    cancelarPedido 
  } = usePedidos();

  const sesion = AuthService.getSesion();

  // Sincronizamos con la base de datos al entrar
  useEffect(() => {
    cargarOrdenesActivas();
  }, [cargarOrdenesActivas]);

  // Formateador de moneda MXN
  const formatearDinero = (monto) => {
    return new Intl.NumberFormat('es-MX', { 
      style: 'currency', 
      currency: 'MXN' 
    }).format(monto || 0);
  };

  return (
    <div className={styles.fadeIN} style={{ paddingBottom: '100px' }}>
      {/* --- ENCABEZADO --- */}
      <header style={{ marginBottom: 'var(--space-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className={styles.labelTop} style={{ display: 'block', marginBottom: '4px' }}>
            {sesion?.rol === 'Gerente' ? 'MONITOREO GLOBAL' : `PEDIDOS ${sesion?.sucursal_nombre}`}
          </span>
          <h1 className={styles.title} style={{ fontSize: '2.5rem', lineHeight: '1' }}>Activos</h1>
        </div>
        
        {/* Contador de impacto visual */}
        <div style={{ 
          backgroundColor: 'var(--color-primary)', 
          color: 'white',
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,95,86,0.3)'
        }}>
          <span style={{ fontSize: '1.5rem', fontWeight: '800', lineHeight: '1' }}>
            {ordenesActivas.length}
          </span>
          <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', fontWeight: 'bold', opacity: 0.8 }}>
            Total
          </span>
        </div>
      </header>

      {/* --- ESTADO DE CARGA --- */}
      {loading && ordenesActivas.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <div className={styles.labelTop} style={{ animation: 'pulse 1.5s infinite' }}>Sincronizando...</div>
        </div>
      )}

      {/* --- LISTADO DE TARJETAS --- */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {ordenesActivas.map((orden) => (
          <section 
            key={orden.id} 
            className={styles.card} 
            style={{ 
              borderLeft: orden.prioridad === 'Urgente' ? '6px solid #ba1a1a' : '6px solid var(--color-primary)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ flex: 1 }}>
                <span className={styles.labelTop} style={{ fontSize: '0.7rem', color: orden.prioridad === 'Urgente' ? '#ba1a1a' : 'var(--text-muted)' }}>
                  {orden.folio} • {orden.sucursal?.nombre || 'General'}
                </span>
                <h2 className={styles.subtitle} style={{ fontSize: '1.3rem', margin: '4px 0' }}>
                  {orden.proveedor?.nombre || 'Proveedor Pendiente'}
                </h2>
              </div>
              
              <span className={`${styles.badge} ${orden.prioridad === 'Urgente' ? styles.badgeUrgent : styles.badgePending}`}>
                {orden.estatus === 'Pendiente' ? orden.prioridad : orden.estatus}
              </span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-light)', margin: 0 }}>Total Estimado</p>
                <p style={{ color: 'var(--text-main)', fontWeight: 'bold', fontSize: '1.1rem', margin: 0 }}>
                    {formatearDinero(orden.total_estimado)}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-light)', margin: 0 }}>Solicitado por</p>
                <p style={{ fontSize: '0.85rem', fontWeight: 'bold', margin: 0 }}>
                    {orden.solicitante?.nombre_completo || 'Admin'}
                </p>
              </div>
            </div>
            
            {/* ACCIONES */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => onVerLista(orden.id)}
                className={`${styles.btnBase} ${styles.btnPrimary}`} 
                style={{ flex: 1, padding: '12px' }}
              >
                <span className="material-symbols-outlined">checklist</span>
                REVISAR MATERIAL
              </button>

              {/* El botón de cancelar solo es visible para el Gerente o si es el dueño del pedido */}
              {(sesion?.rol === 'Gerente' || sesion?.id === orden.solicitante_id) && (
                <button 
                    onClick={() => cancelarPedido(orden.id)}
                    className={`${styles.btnBase} ${styles.btnSecondary}`}
                    style={{ width: '50px', padding: '0', display: 'flex', justifyContent: 'center', color: '#ba1a1a' }}
                >
                    <span className="material-symbols-outlined">delete_sweep</span>
                </button>
              )}
            </div>
          </section>
        ))}
      </div>

      {/* --- ESTADO VACÍO --- */}
      {!loading && ordenesActivas.length === 0 && (
        <div style={{ textAlign: 'center', padding: '5rem 1rem', background: 'var(--color-surface-lowest)', borderRadius: '24px', border: '2px dashed var(--border-ghost)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '4rem', color: 'var(--border-ghost)', marginBottom: '16px' }}>
            inventory_2
          </span>
          <h2 className={styles.subtitle} style={{ color: 'var(--text-muted)' }}>Sin órdenes activas</h2>
          <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
            Todos los pedidos han sido surtidos o están en el historial.
          </p>
        </div>
      )}

      {/* --- BOTÓN FLOTANTE: NUEVA ORDEN --- */}
      <button 
        onClick={onNuevoPedido}
        style={{ 
          position: 'fixed',
          bottom: '100px',
          right: '24px',
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          backgroundColor: 'var(--text-main)',
          color: 'white',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          zIndex: 100,
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '2rem' }}>add_shopping_cart</span>
      </button>
    </div>
  );
}