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
      {/* --- ENCABEZADO COMPACTADO --- */}
      <header style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className={styles.labelTop} style={{ display: 'block', marginBottom: '2px', fontSize: '0.65rem' }}>
            {esAdmin ? 'MONITOREO GLOBAL' : `PEDIDOS ${sesion?.sucursal_nombre || ''}`}
          </span>
          <h1 className={styles.title} style={{ fontSize: '2rem', lineHeight: '1' }}>Activos</h1>
        </div>
        
        {/* Contador de impacto visual (más pequeño) */}
        <div style={{ 
          backgroundColor: 'var(--color-primary)', 
          color: 'white',
          width: '48px',
          height: '48px',
          borderRadius: '14px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 10px rgba(0,95,86,0.25)'
        }}>
          <span style={{ fontSize: '1.2rem', fontWeight: '800', lineHeight: '1' }}>
            {ordenesActivas.length}
          </span>
          <span style={{ fontSize: '0.55rem', textTransform: 'uppercase', fontWeight: 'bold', opacity: 0.8 }}>
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

      {/* --- LISTADO DE TARJETAS (Grid adaptativo y gap reducido) --- */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '10px' 
      }}>
        {ordenesActivas.map((orden) => (
          <section 
            key={orden.id} 
            className={styles.card} 
            style={{ 
              borderLeft: orden.prioridad === 'Urgente' ? '5px solid #ba1a1a' : '5px solid var(--color-primary)',
              position: 'relative',
              overflow: 'hidden',
              padding: '12px 16px' // Forzamos un padding más compacto
            }}
          >
            {/* Fila 1: Folio y Estatus */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
              <div style={{ flex: 1 }}>
                <span className={styles.labelTop} style={{ fontSize: '0.65rem', color: orden.prioridad === 'Urgente' ? '#ba1a1a' : 'var(--text-muted)' }}>
                  {orden.folio} • {orden.sucursal?.nombre || 'General'}
                </span>
                <h2 className={styles.subtitle} style={{ fontSize: '1.15rem', margin: '2px 0 0 0', lineHeight: '1.2' }}>
                  {orden.proveedor?.nombre || 'Proveedor Pendiente'}
                </h2>
              </div>
              
              <span 
                className={`${styles.badge} ${orden.prioridad === 'Urgente' ? styles.badgeUrgent : styles.badgePending}`}
                style={{ fontSize: '0.65rem', padding: '2px 6px' }} // Badge más pequeño
              >
                {orden.estatus === 'Pendiente' ? orden.prioridad : orden.estatus}
              </span>
            </div>
            
            {/* Fila 2: Totales y Solicitante */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-light)', margin: 0 }}>Total Estimado</p>
                <p style={{ color: 'var(--text-main)', fontWeight: 'bold', fontSize: '1rem', margin: 0 }}>
                    {formatearDinero(orden.total_estimado)}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-light)', margin: 0 }}>Solicitado por</p>
                <p style={{ fontSize: '0.8rem', fontWeight: 'bold', margin: 0 }}>
                    {orden.solicitante?.nombre_completo || 'Admin'}
                </p>
              </div>
            </div>
            
            {/* ACCIONES (Botones más compactos) */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => onVerLista(orden.id)}
                className={`${styles.btnBase} ${styles.btnPrimary}`} 
                style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>checklist</span>
                {permisosPedidos.editar ? 'SURTIR PEDIDO' : 'REVISAR'}
              </button>

              {/* Botón cancelar */}
              {(permisosPedidos.borrar || sesion?.id === orden.solicitante_id) && (
                <button 
                    onClick={() => cancelarPedido(orden.id)}
                    className={`${styles.btnBase} ${styles.btnSecondary}`}
                    style={{ width: '40px', padding: '0', display: 'flex', justifyContent: 'center', color: '#ba1a1a' }}
                    title="Cancelar pedido"
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>delete_sweep</span>
                </button>
              )}
            </div>
          </section>
        ))}
      </div>

      {/* --- ESTADO VACÍO --- */}
      {!loading && ordenesActivas.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--color-surface-lowest)', borderRadius: '24px', border: '2px dashed var(--border-ghost)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '3.5rem', color: 'var(--border-ghost)', marginBottom: '12px' }}>
            inventory_2
          </span>
          <h2 className={styles.subtitle} style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>Sin órdenes activas</h2>
          <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', margin: 0 }}>
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
            bottom: '90px', // Ligeramente más abajo
            right: '20px',
            width: '56px', // Ligeramente más pequeño
            height: '56px',
            borderRadius: '18px',
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
          <span className="material-symbols-outlined" style={{ fontSize: '1.8rem' }}>add_shopping_cart</span>
        </button>
      )}
    </div>
  );
}