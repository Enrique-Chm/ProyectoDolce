// src/modules/Admin/Tabs/Pedidos/ChecklistPedido.jsx
import React, { useEffect } from 'react';
import styles from '../../../../assets/styles/EstilosGenerales.module.css';
import { usePedidos } from './2usePedidos';
import { AuthService } from '../../../Auth/Auth.service';

export default function ChecklistPedido({ ordenId, onVolver }) {
  const { 
    loading, 
    detalleOrdenActual, 
    cargarDetalleDeOrden, 
    toggleEstatusItem, 
    cambiarEstatusOrden 
  } = usePedidos();

  const sesion = AuthService.getSesion();
  // Extraemos los permisos de la sesión para validar acciones
  const permisos = sesion?.permisos?.pedidos || {};

  useEffect(() => {
    if (ordenId) {
      cargarDetalleDeOrden(ordenId);
    }
  }, [ordenId, cargarDetalleDeOrden]);

  if (loading && !detalleOrdenActual) {
    return (
      <div style={{ textAlign: 'center', marginTop: '3rem' }}>
        <p className={styles.labelTop} style={{ animation: 'pulse 1.5s infinite' }}>
            Sincronizando lista con la nube...
        </p>
      </div>
    );
  }

  if (!detalleOrdenActual) return null;

  // LÓGICA DE ESTADO Y PERMISOS
  const esSoloLectura = ['Completado', 'Cancelado'].includes(detalleOrdenActual.estatus);
  
  /**
   * Un usuario puede editar el checklist si:
   * 1. La orden no está finalizada o cancelada.
   * 2. Su rol tiene permiso de 'editar' en el módulo de pedidos.
   */
  const puedeEditar = !esSoloLectura && permisos.editar;

  // Métricas de progreso
  const itemsComprados = detalleOrdenActual.detalles.filter(d => d.estatus === 'Comprado').length;
  const totalItems = detalleOrdenActual.detalles.length;
  const progreso = totalItems > 0 ? (itemsComprados / totalItems) * 100 : 0;

  const handleFinalizarCompra = async () => {
    if (itemsComprados < totalItems) {
      if (!window.confirm('Hay productos sin marcar. ¿Deseas finalizar el pedido y moverlo al historial?')) return;
    }
    const exito = await cambiarEstatusOrden(detalleOrdenActual.id, 'Completado');
    if (exito) onVolver();
  };

  return (
    <div className={styles.fadeIN}>
      {/* --- ENCABEZADO COMPACTO --- */}
      <header style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <span className={styles.labelTop} style={{ color: esSoloLectura ? 'var(--text-muted)' : 'var(--color-primary)', fontSize: '0.65rem' }}>
            {detalleOrdenActual.folio || 'REVISIÓN'} • {detalleOrdenActual.sucursal?.nombre}
          </span>
          <h1 className={styles.title} style={{ fontSize: '1.5rem', lineHeight: '1.1', margin: '2px 0' }}>
            {esSoloLectura ? 'Resumen' : 'Surtido'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0 }}>
              Proveedor: <b style={{ color: 'var(--text-main)' }}>{detalleOrdenActual.proveedor?.nombre || 'Pendiente'}</b>
          </p>
        </div>
        <button onClick={onVolver} className={styles.btnSecondary} style={{ padding: '6px', borderRadius: '8px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>close</span>
        </button>
      </header>

      {/* --- BARRA DE PROGRESO MINI --- */}
      <div style={{ marginBottom: '16px', backgroundColor: 'white', padding: '10px', borderRadius: '12px', border: '1px solid var(--border-ghost)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase' }}>
          <span style={{ color: progreso === 100 ? 'var(--color-primary)' : 'var(--text-light)' }}>
              {progreso === 100 ? 'COMPLETO' : 'PROGRESO SURTIDO'}
          </span>
          <span>{itemsComprados} / {totalItems}</span>
        </div>
        <div style={{ width: '100%', height: '4px', backgroundColor: '#f0f0f0', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ 
            width: `${progreso}%`, 
            height: '100%', 
            backgroundColor: esSoloLectura ? 'var(--text-muted)' : 'var(--color-primary)', 
            transition: 'width 0.5s ease' 
          }}></div>
        </div>
      </div>

      {/* --- LISTA DE PRODUCTOS COMPACTA --- */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: puedeEditar ? '110px' : '40px' }}>
        {detalleOrdenActual.detalles.map((item) => {
          const esComprado = item.estatus === 'Comprado';
          
          return (
            <div 
              key={item.id} 
              onClick={() => puedeEditar && toggleEstatusItem(item.id, item.estatus)}
              className={styles.card}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px', 
                cursor: puedeEditar ? 'pointer' : 'default',
                backgroundColor: esComprado ? 'var(--color-surface-lowest)' : 'white',
                borderColor: esComprado ? 'transparent' : 'var(--border-ghost)',
                opacity: esComprado ? 0.7 : 1,
                padding: '8px 12px', 
                borderRadius: '10px'
              }}
            >
              {/* Checkbox Mini */}
              <div style={{ 
                width: '20px', 
                height: '20px', 
                borderRadius: '6px', 
                border: esComprado ? 'none' : `1.5px solid var(--border-ghost)`,
                backgroundColor: esComprado ? (esSoloLectura ? 'var(--text-muted)' : 'var(--color-primary)') : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {esComprado && <span className="material-symbols-outlined" style={{ color: 'white', fontSize: '0.9rem' }}>done</span>}
              </div>

              {/* Info del Producto Slim */}
              <div style={{ flex: 1 }}>
                <h4 style={{ 
                  margin: 0, 
                  fontSize: '0.9rem', 
                  textDecoration: esComprado ? 'line-through' : 'none',
                  color: esComprado ? 'var(--text-muted)' : 'var(--text-main)',
                  fontWeight: esComprado ? '400' : '600',
                  lineHeight: '1.2'
                }}>
                  {item.producto?.nombre}
                </h4>
                <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {item.cantidad} {item.producto?.um?.abreviatura} 
                  {item.producto?.marca && ` • ${item.producto.marca}`}
                </p>
              </div>

              {/* Precio Mini */}
              <div style={{ textAlign: 'right' }}>
                <span style={{ 
                    display: 'block', 
                    fontSize: '0.8rem', 
                    fontWeight: 'bold', 
                    color: esComprado ? 'var(--text-light)' : 'var(--text-main)' 
                }}>
                  ${item.costo_unitario}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* --- PIE DE PÁGINA FLOTANTE --- */}
      {/* El botón de finalizar solo aparece si el usuario tiene permiso de edición */}
      {puedeEditar && (
        <footer style={{ 
          position: 'fixed', 
          bottom: '85px', 
          left: '12px', 
          right: '12px', 
          zIndex: 100,
          display: 'flex',
          justifyContent: 'center'
        }}>
          <button 
            onClick={handleFinalizarCompra}
            className={styles.btnPrimary} 
            style={{ 
              width: '100%', 
              maxWidth: '400px',
              padding: '1rem', 
              boxShadow: '0 8px 20px rgba(0,95,86,0.3)',
              borderRadius: '14px',
              fontSize: '0.9rem',
              fontWeight: 'bold'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>task_alt</span>
            FINALIZAR COMPRA
          </button>
        </footer>
      )}
    </div>
  );
}