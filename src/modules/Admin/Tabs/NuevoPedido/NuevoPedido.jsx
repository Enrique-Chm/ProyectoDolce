// src/modules/Admin/Tabs/NuevoPedido/NuevoPedido.jsx
import React from 'react';
import styles from '../../../../assets/styles/EstilosGenerales.module.css';
import { useNuevoPedido } from './2useNuevoPedido';
import { AuthService } from '../../../Auth/Auth.service';

export default function NuevoPedido({ onVolver }) {
  const { 
    loading, 
    productosDisponibles, 
    header, setHeader,
    carrito, 
    seleccion, setSeleccion,
    totalEstimado, 
    agregarAlCarrito, eliminarDelCarrito, procesarOrden 
  } = useNuevoPedido(onVolver);

  // Recuperamos la sesión para mostrar la "firma" del pedido
  const sesion = AuthService.getSesion();

  // Manejador para cambios en campos restantes (Prioridad y Observaciones)
  const handleHeaderChange = (e) => {
    const { name, value } = e.target;
    setHeader(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className={styles.fadeIN}>
      {/* --- ENCABEZADO --- */}
      <header style={{ marginBottom: 'var(--space-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <span className={styles.labelTop} style={{ display: 'block', marginBottom: '4px' }}>OPERACIONES</span>
          <h1 className={styles.title} style={{ fontSize: '2.5rem', lineHeight: '1' }}>Nueva<br/>Requisición</h1>
        </div>
        <button onClick={onVolver} className={`${styles.btnBase} ${styles.btnSecondary}`}>
          <span className="material-symbols-outlined">arrow_back</span>
          Volver
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', paddingBottom: '40px' }}>
        
        {/* =========================================================
              PASO 1: DATOS AUTOMÁTICOS (INFO DE ENVÍO)
            ========================================================= */}
        <section className={styles.card} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 className={styles.labelTop} style={{ color: 'var(--color-primary)', borderBottom: '1px solid var(--border-ghost)', paddingBottom: '8px' }}>
            1. DATOS DE ORIGEN Y DESTINO
          </h3>
          
          {/* Ficha Informativa de Sesión (Reemplaza los Selectores) */}
          <div style={{ 
            backgroundColor: 'var(--color-surface-lowest)', 
            padding: '16px', 
            borderRadius: '12px', 
            border: '1px solid var(--border-ghost)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div>
              <label className={styles.labelTop} style={{ fontSize: '0.65rem', opacity: 0.7 }}>SOLICITANTE</label>
              <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1rem' }}>{sesion?.nombre}</p>
            </div>
            
            <div>
              <label className={styles.labelTop} style={{ fontSize: '0.65rem', opacity: 0.7 }}>SUCURSAL DE DESTINO</label>
              <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1rem' }}>{sesion?.sucursal_nombre}</p>
            </div>
          </div>

          <div>
            <label className={styles.labelTop}>PRIORIDAD DEL PEDIDO</label>
            <select 
              name="prioridad" 
              value={header.prioridad} 
              onChange={handleHeaderChange} 
              className={styles.selectEditorial}
            >
              <option value="Normal">Normal</option>
              <option value="Urgente">Urgente</option>
            </select>
          </div>
        </section>

        {/* =========================================================
              PASO 2: SELECCIÓN DE PRODUCTOS
            ========================================================= */}
        <section className={styles.card} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 className={styles.labelTop} style={{ color: 'var(--color-primary)', borderBottom: '1px solid var(--border-ghost)', paddingBottom: '8px' }}>
            2. AGREGAR AL CARRITO
          </h3>

          <div>
            <label className={styles.labelTop}>BUSCAR PRODUCTO</label>
            <select 
              value={seleccion.producto_id} 
              onChange={(e) => setSeleccion({ ...seleccion, producto_id: e.target.value })}
              className={styles.selectEditorial}
            >
              <option value="">-- Selecciona un insumo --</option>
              {productosDisponibles.map(prod => (
                <option key={prod.id} value={prod.id}>
                  {prod.nombre} {prod.marca ? `(${prod.marca})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={styles.labelTop}>CANTIDAD</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="number" step="0.1" value={seleccion.cantidad} 
                onChange={(e) => setSeleccion({ ...seleccion, cantidad: e.target.value })}
                className={styles.inputEditorial} style={{ flex: 1 }}
                placeholder="0.0"
              />
              <button 
                onClick={agregarAlCarrito} 
                className={`${styles.btnBase} ${styles.btnPrimary}`} 
                style={{ flex: 1, height: '48px' }}
              >
                Añadir
              </button>
            </div>
          </div>

          <div style={{ marginTop: '10px' }}>
            <label className={styles.labelTop}>NOTAS O COMENTARIOS</label>
            <textarea 
              name="observaciones" value={header.observaciones} onChange={handleHeaderChange}
              placeholder="Ej: Solo si hay existencias de la marca solicitada..."
              className={styles.inputEditorial} style={{ minHeight: '80px', resize: 'none' }}
            />
          </div>
        </section>

        {/* =========================================================
              PASO 3: RESUMEN Y ENVÍO
            ========================================================= */}
        <section className={styles.card} style={{ display: 'flex', flexDirection: 'column', borderTop: '4px solid var(--color-primary)' }}>
          <h3 className={styles.labelTop} style={{ marginBottom: '20px' }}>RESUMEN DE COMPRA</h3>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '350px' }}>
            {carrito.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.3 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '3rem' }}>shopping_basket</span>
                <p>No hay artículos</p>
              </div>
            ) : (
              carrito.map(item => (
                <div key={item.producto_id} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-ghost)' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 'bold', fontSize: '0.9rem', margin: 0 }}>{item.nombre}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                      {item.cantidad} {item.abreviatura_um} x ${item.costo_unitario}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>
                      ${(item.cantidad * item.costo_unitario).toFixed(2)}
                    </span>
                    <button 
                      onClick={() => eliminarDelCarrito(item.producto_id)} 
                      style={{ color: '#ba1a1a', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>close</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '2px dashed var(--border-ghost)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span className={styles.labelTop}>TOTAL ESTIMADO</span>
              <span className={styles.title} style={{ fontSize: '2.25rem' }}>${totalEstimado.toLocaleString('es-MX')}</span>
            </div>

            <button 
              onClick={procesarOrden} 
              disabled={loading || carrito.length === 0}
              className={`${styles.btnBase} ${styles.btnPrimary}`} 
              style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem' }}
            >
              <span className="material-symbols-outlined">{loading ? 'hourglass_empty' : 'send_and_archive'}</span>
              {loading ? 'ENVIANDO...' : 'ENVIAR REQUISICIÓN'}
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}