// src/modules/Admin/Tabs/NuevoPedido/NuevoPedido.jsx
import React, { useState, useEffect, useMemo } from 'react';
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

  // Estados locales para controlar el buscador searchable de productos
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [dropdownAbierto, setDropdownAbierto] = useState(false);

  // Manejador para cambios en campos restantes (Prioridad y Observaciones)
  const handleHeaderChange = (e) => {
    const { name, value } = e.target;
    setHeader(prev => ({ ...prev, [name]: value }));
  };

  // Buscamos el producto seleccionado actualmente para los cálculos visuales
  const productoSeleccionado = productosDisponibles.find(p => p.id === seleccion.producto_id);

  // Sincronizamos el buscador de texto cuando la selección cambia o se vacía
  useEffect(() => {
    if (!seleccion.producto_id) {
      setFiltroBusqueda('');
    } else if (productoSeleccionado) {
      setFiltroBusqueda(`${productoSeleccionado.nombre} ${productoSeleccionado.marca ? `(${productoSeleccionado.marca})` : ''} — ${productoSeleccionado.proveedor?.nombre || 'S/P'}`);
    }
  }, [seleccion.producto_id, productoSeleccionado]);

  // Filtramos la lista de productos disponibles en base al texto digitado
  const productosFiltradosPorBusqueda = useMemo(() => {
    if (!filtroBusqueda || (productoSeleccionado && filtroBusqueda === `${productoSeleccionado.nombre} ${productoSeleccionado.marca ? `(${productoSeleccionado.marca})` : ''} — ${productoSeleccionado.proveedor?.nombre || 'S/P'}`)) {
      return productosDisponibles;
    }
    const search = filtroBusqueda.toLowerCase().trim();
    return productosDisponibles.filter(prod => {
      const matchNombre = prod.nombre?.toLowerCase().includes(search);
      const matchMarca = prod.marca?.toLowerCase().includes(search);
      const matchProveedor = prod.proveedor?.nombre?.toLowerCase().includes(search);
      return matchNombre || matchMarca || matchProveedor;
    });
  }, [productosDisponibles, filtroBusqueda, productoSeleccionado]);

  return (
    <div className={styles.fadeIN} style={{ width: '100%', maxWidth: '100%', padding: '0 8px' }}>
      {/* --- ENCABEZADO --- */}
      <header style={{ marginBottom: 'var(--space-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
        <div>
          <span className={styles.labelTop} style={{ display: 'block', marginBottom: '4px' }}>OPERACIONES</span>
          <h1 className={styles.title} style={{ fontSize: '2.5rem', lineHeight: '1' }}>Nueva<br/>Requisición</h1>
        </div>
        <button onClick={onVolver} className={`${styles.btnBase} ${styles.btnSecondary}`}>
          <span className="material-symbols-outlined">arrow_back</span>
          Volver
        </button>
      </header>

      {/* --- GRID ADAPTADO A PANTALLA COMPLETA --- */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', 
        gap: '20px', 
        paddingBottom: '40px',
        width: '100%'
      }}>
        
        {/* =========================================================
              PASO 1: DATOS AUTOMÁTICOS (INFO DE ENVÍO)
            ========================================================= */}
        <section className={styles.card} style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
          <h3 className={styles.labelTop} style={{ color: 'var(--color-primary)', borderBottom: '1px solid var(--border-ghost)', paddingBottom: '8px' }}>
            1. DATOS DE ORIGEN Y DESTINO
          </h3>
          
          {/* Ficha Informativa de Sesión */}
          <div style={{ 
            backgroundColor: 'var(--color-surface-lowest)', 
            padding: '16px', 
            borderRadius: '12px', 
            border: '1px solid var(--border-ghost)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
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
              style={{ width: '100%' }}
            >
              <option value="Normal">Normal</option>
              <option value="Urgente">Urgente</option>
            </select>
          </div>
        </section>

        {/* =========================================================
              PASO 2: SELECCIÓN DE PRODUCTOS (SEARCHABLE)
            ========================================================= */}
        <section className={styles.card} style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
          <h3 className={styles.labelTop} style={{ color: 'var(--color-primary)', borderBottom: '1px solid var(--border-ghost)', paddingBottom: '8px' }}>
            2. AGREGAR AL CARRITO
          </h3>

          <div style={{ position: 'relative' }}>
            <label className={styles.labelTop}>BUSCAR PRODUCTO</label>
            <div style={{ position: 'relative', width: '100%' }}>
              <span className="material-symbols-outlined" style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                pointerEvents: 'none',
                fontSize: '1.2rem'
              }}>
                search
              </span>
              <input 
                type="text"
                placeholder="Escribe el nombre, marca o proveedor..."
                value={filtroBusqueda}
                onChange={(e) => {
                  setFiltroBusqueda(e.target.value);
                  setDropdownAbierto(true);
                  if (e.target.value === '') {
                    setSeleccion({ ...seleccion, producto_id: '' });
                  }
                }}
                onFocus={() => setDropdownAbierto(true)}
                onBlur={() => setTimeout(() => setDropdownAbierto(false), 200)}
                className={styles.inputEditorial}
                style={{ width: '100%', paddingLeft: '40px', fontSize: '0.95rem' }}
              />
              {/* Dropdown flotante searchable */}
              {dropdownAbierto && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 1000,
                  backgroundColor: 'white',
                  border: '1px solid var(--border-ghost)',
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  maxHeight: '220px',
                  overflowY: 'auto',
                  marginTop: '4px'
                }}>
                  {productosFiltradosPorBusqueda.length === 0 ? (
                    <div style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No se encontraron insumos</div>
                  ) : (
                    productosFiltradosPorBusqueda.map(prod => (
                      <div
                        key={prod.id}
                        onClick={() => {
                          setSeleccion({ ...seleccion, producto_id: prod.id });
                          setFiltroBusqueda(`${prod.nombre} ${prod.marca ? `(${prod.marca})` : ''} — ${prod.proveedor?.nombre || 'S/P'}`);
                          setDropdownAbierto(false);
                        }}
                        style={{
                          padding: '10px 14px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          borderBottom: '1px solid var(--border-ghost)',
                          backgroundColor: seleccion.producto_id === prod.id ? 'var(--color-surface-lowest)' : 'transparent',
                          transition: 'background-color 0.15s ease'
                        }}
                      >
                        <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>
                          {prod.nombre} {prod.marca ? `(${prod.marca})` : ''}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Proveedor: {prod.proveedor?.nombre || 'S/P'}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className={styles.labelTop}>EMPAQUES A COMPRAR</label>
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

          {/* VISUALIZADOR DE ESTIMACIÓN PARA EL CHEF */}
          {productoSeleccionado && (
            <div style={{ 
              backgroundColor: 'var(--color-surface-lowest)', 
              padding: '12px', 
              borderRadius: '12px', 
              border: '1px solid var(--border-ghost)',
              fontSize: '0.825rem',
              color: 'var(--text-main)',
              marginTop: '4px',
              animation: 'slideUp 0.2s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: 'var(--color-primary)' }}>info</span>
                <span style={{ fontWeight: 'bold' }}>Detalle de Surtido</span>
              </div>
              <p style={{ margin: '0 0 4px 0', color: 'var(--text-muted)' }}>
                Presentación Comercial: <b style={{ color: 'var(--text-main)' }}>{productoSeleccionado.presentacion || 'Unitaria / No especificada'}</b>
              </p>
              {productoSeleccionado.contenido && (
                <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                  Total que recibirás: <b style={{ color: 'var(--color-primary)' }}>{(Number(seleccion.cantidad || 0) * Number(productoSeleccionado.contenido)).toFixed(1)} {productoSeleccionado.um?.abreviatura || 'pz'}</b>
                </p>
              )}
            </div>
          )}

          <div style={{ marginTop: '10px' }}>
            <label className={styles.labelTop}>NOTAS O COMENTARIOS</label>
            <textarea 
              name="observaciones" value={header.observaciones} onChange={handleHeaderChange}
              placeholder="Ej: Solo si hay existencias de la marca solicitada..."
              className={styles.inputEditorial} style={{ minHeight: '80px', resize: 'none', width: '100%' }}
            />
          </div>
        </section>

        {/* =========================================================
              PASO 3: RESUMEN Y ENVÍO
            ========================================================= */}
        <section className={styles.card} style={{ display: 'flex', flexDirection: 'column', borderTop: '4px solid var(--color-primary)', width: '100%' }}>
          <h3 className={styles.labelTop} style={{ marginBottom: '20px' }}>RESUMEN DE COMPRA</h3>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '350px' }}>
            {carrito.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.3 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '3rem' }}>shopping_basket</span>
                <p>No hay artículos</p>
              </div>
            ) : (
              carrito.map(item => {
                const prov = productosDisponibles.find(p => p.id === item.producto_id)?.proveedor?.nombre || 'S/P';
                
                return (
                  <div key={item.producto_id} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-ghost)', width: '100%' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 'bold', fontSize: '0.9rem', margin: 0 }}>{item.nombre}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0' }}>
                        {item.cantidad} {item.empaque || item.abreviatura_um}
                        {item.contenido && ` (Total: ${(item.cantidad * item.contenido).toFixed(1)} ${item.abreviatura_um})`}
                        {` x $${item.costo_unitario}`}
                      </p>
                      <span style={{ fontSize: '0.65rem', backgroundColor: 'var(--color-surface-lowest)', padding: '2px 6px', borderRadius: '4px', color: 'var(--color-primary)', fontWeight: 'bold', border: '1px solid var(--border-ghost)' }}>
                        PROVEEDOR: {prov}
                      </span>
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
                );
              })
            )}
          </div>

          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '2px dashed var(--border-ghost)', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span className={styles.labelTop}>TOTAL ESTIMADO</span>
              <span className={styles.title} style={{ fontSize: '2.25rem' }}>${totalEstimado.toLocaleString('es-MX')}</span>
            </div>

            <button 
              onClick={procesarOrden} 
              disabled={loading || carrito.length === 0}
              className={`${styles.btnBase} ${styles.btnPrimary}`} 
              style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}
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