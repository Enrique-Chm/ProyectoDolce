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

  // El rango de fechas por defecto son los últimos 30 días
  const [fechas, setFechas] = useState({
    inicio: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    fin: new Date().toISOString().split('T')[0]
  });

  // Sincronizamos con la base de datos según la sub-pestaña
  useEffect(() => {
    if (subTab === 'activos') {
      cargarOrdenesActivas();
    } else {
      cargarHistorialPorFechas(fechas.inicio, fechas.fin);
    }
  }, [subTab, cargarOrdenesActivas, cargarHistorialPorFechas, fechas.inicio, fechas.fin]);

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
    <div className={styles.fadeIN} style={{ paddingBottom: '100px' }}>
      {/* --- ENCABEZADO COMPACTADO --- */}
      <header style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className={styles.labelTop} style={{ display: 'block', marginBottom: '2px', fontSize: '0.65rem' }}>
            {esAdmin ? 'MONITOREO GLOBAL' : `PEDIDOS ${sesion?.sucursal_nombre || ''}`}
          </span>
          <h1 className={styles.title} style={{ fontSize: '2rem', lineHeight: '1' }}>
            {subTab === 'activos' ? 'Activos' : 'Historial'}
          </h1>
        </div>
        
        {/* Contador de impacto visual */}
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
            {ordenesAMostrar.length}
          </span>
          <span style={{ fontSize: '0.55rem', textTransform: 'uppercase', fontWeight: 'bold', opacity: 0.8 }}>
            Total
          </span>
        </div>
      </header>

      {/* --- SELECTOR DE SUB-PESTAÑA --- */}
      <nav style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <button 
          onClick={() => setSubTab('activos')} 
          className={`${styles.btnBase} ${subTab === 'activos' ? styles.btnPrimary : styles.btnSecondary}`}
          style={{ flex: 1, padding: '10px', fontSize: '0.85rem', height: '42px' }}
        >
          Activos ({ordenesActivas.length})
        </button>
        <button 
          onClick={() => setSubTab('historial')} 
          className={`${styles.btnBase} ${subTab === 'historial' ? styles.btnPrimary : styles.btnSecondary}`}
          style={{ flex: 1, padding: '10px', fontSize: '0.85rem', height: '42px' }}
        >
          Historial ({ordenesHistorial.length})
        </button>
      </nav>

      {/* --- FILTROS DE RANGO DE FECHAS COMPRIMIDO (Solo en Historial) --- */}
      {subTab === 'historial' && (
        <div style={{ 
          marginBottom: '16px', 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '8px', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '8px 12px', 
          backgroundColor: 'var(--color-surface-lowest)', 
          borderRadius: '12px', 
          border: '1px solid var(--border-ghost)' 
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label className={styles.labelTop} style={{ fontSize: '0.6rem', opacity: 0.8, margin: 0, flexShrink: 0 }}>DESDE</label>
              <input 
                type="date" 
                value={fechas.inicio} 
                onChange={(e) => setFechas({ ...fechas, inicio: e.target.value })} 
                className={styles.inputEditorial}
                style={{ width: 'auto', height: '32px', padding: '0 6px', fontSize: '0.8rem', borderRadius: '6px' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label className={styles.labelTop} style={{ fontSize: '0.6rem', opacity: 0.8, margin: 0, flexShrink: 0 }}>HASTA</label>
              <input 
                type="date" 
                value={fechas.fin} 
                onChange={(e) => setFechas({ ...fechas, fin: e.target.value })} 
                className={styles.inputEditorial}
                style={{ width: 'auto', height: '32px', padding: '0 6px', fontSize: '0.8rem', borderRadius: '6px' }}
              />
            </div>
          </div>
          <button 
            onClick={() => cargarHistorialPorFechas(fechas.inicio, fechas.fin)} 
            className={`${styles.btnBase} ${styles.btnPrimary}`} 
            style={{ height: '32px', padding: '0 12px', fontSize: '0.75rem', borderRadius: '6px', minWidth: 'unset' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>search</span>
            Filtrar
          </button>
        </div>
      )}

      {/* --- ESTADO DE CARGA --- */}
      {loading && ordenesAMostrar.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <div className={styles.labelTop} style={{ animation: 'pulse 1.5s infinite' }}>Sincronizando...</div>
        </div>
      )}

      {/* --- LISTADO DE TARJETAS --- */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '10px' 
      }}>
        {ordenesAMostrar.map((orden) => (
          <section 
            key={orden.id} 
            className={styles.card} 
            style={{ 
              borderLeft: orden.prioridad === 'Urgente' ? '5px solid #ba1a1a' : '5px solid var(--color-primary)',
              position: 'relative',
              overflow: 'hidden',
              padding: '12px 16px'
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
                style={{ fontSize: '0.65rem', padding: '2px 6px' }}
              >
                {orden.estatus}
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
            
            {/* ACCIONES */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => onVerLista(orden.id)}
                className={`${styles.btnBase} ${styles.btnPrimary}`} 
                style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>checklist</span>
                {subTab === 'activos' && permisosPedidos.editar ? 'SURTIR PEDIDO' : 'REVISAR'}
              </button>

              {/* Botón cancelar */}
              {subTab === 'activos' && (permisosPedidos.borrar || sesion?.id === orden.solicitante_id) && (
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
      {!loading && ordenesAMostrar.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--color-surface-lowest)', borderRadius: '24px', border: '2px dashed var(--border-ghost)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '3.5rem', color: 'var(--border-ghost)', marginBottom: '12px' }}>
            inventory_2
          </span>
          <h2 className={styles.subtitle} style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>
            {subTab === 'activos' ? 'Sin órdenes activas' : 'Sin órdenes en el historial'}
          </h2>
          <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', margin: 0 }}>
            {subTab === 'activos' 
              ? 'Todos los pedidos han sido surtidos o están en el historial.' 
              : 'No se encontraron registros en el rango de fechas seleccionado.'}
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
            width: '56px',
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