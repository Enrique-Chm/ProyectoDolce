// src/modules/Admin/Tabs/NuevoPedido/NuevoPedido.jsx
import React, { useState, useEffect, useMemo } from 'react';
import styles from '../../../../assets/styles/EstilosGenerales.module.css';
import { useNuevoPedido } from './2useNuevoPedido';
import { AuthService } from '../../../Auth/Auth.service';
import toast from 'react-hot-toast';

export default function NuevoPedido({ onVolver }) {
  const { 
    loading, 
    productosDisponibles, 
    header, setHeader,
    carrito, 
    seleccion, setSeleccion,
    agregarAlCarrito, eliminarDelCarrito, procesarOrden 
  } = useNuevoPedido(onVolver);

  const sesion = AuthService.getSesion();

  // --- NUEVOS ESTADOS DE CONTROL DE FLUJO ---
  const [pasoActual, setPasoActual] = useState(1); // 1: Surtir Insumos, 2: Validar y Enviar
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [cantidadesLocales, setCantidadesLocales] = useState({});
  const [dispararAgregar, setDispararAgregar] = useState(false);

  // Manejador para cambios en campos de cabecera
  const handleHeaderChange = (e) => {
    const { name, value } = e.target;
    setHeader(prev => ({ ...prev, [name]: value }));
  };

  // Extraer categorías de forma dinámica
  const categorias = useMemo(() => {
    const distinct = new Set();
    productosDisponibles.forEach(p => {
      const catNombre = p.categoria?.nombre || p.categoria || 'General';
      distinct.add(catNombre);
    });
    return ['Todos', ...Array.from(distinct)];
  }, [productosDisponibles]);

  // Filtrar productos por Categoría y Buscador
  const productosFiltrados = useMemo(() => {
    return productosDisponibles.filter(prod => {
      const catNombre = prod.categoria?.nombre || prod.categoria || 'General';
      const matchCat = (categoriaActiva === 'Todos' || catNombre === categoriaActiva);

      const search = filtroBusqueda.toLowerCase().trim();
      const matchText = !search || 
        prod.nombre?.toLowerCase().includes(search) ||
        prod.marca?.toLowerCase().includes(search);

      return matchCat && matchText;
    });
  }, [productosDisponibles, categoriaActiva, filtroBusqueda]);

  // Sincronizar el hook de agregar al carrito cuando cambie la selección
  useEffect(() => {
    if (dispararAgregar && seleccion.producto_id && seleccion.cantidad) {
      agregarAlCarrito();
      setDispararAgregar(false);
    }
  }, [dispararAgregar, seleccion, agregarAlCarrito]);

  // Manejador para agregar un insumo al carrito de forma rápida
  const handleAgregarRapido = (id, nombre) => {
    const cant = cantidadesLocales[id];
    if (!cant || isNaN(cant) || Number(cant) <= 0) {
      return toast.error(`Ingresa una cantidad válida para ${nombre}`);
    }

    setSeleccion({ producto_id: id, cantidad: Number(cant) });
    setDispararAgregar(true);
    
    // Limpiamos el input después de agregar exitosamente
    setCantidadesLocales(prev => ({ ...prev, [id]: '' }));
    toast.success(`Se agregaron ${cant} empaques de ${nombre}`);
  };

  // Manejador de teclas para facilitar la carga con "Enter"
  const handleKeyDown = (e, id, nombre) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAgregarRapido(id, nombre);
    }
  };

  return (
    <div className={styles.fadeIN} style={{ width: '100%', maxWidth: '100%', padding: '0 4px' }}>
      {/* --- ENCABEZADO --- */}
      <header style={{ marginBottom: 'var(--space-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
        <div>
          <span className={styles.labelTop} style={{ display: 'block', marginBottom: '4px' }}>OPERACIONES DE COCINA</span>
          <h1 className={styles.title} style={{ fontSize: '2.25rem', lineHeight: '1' }}>
            {pasoActual === 1 ? 'Nueva\nRequisición' : 'Validar\nInsumos'}
          </h1>
        </div>
        <button 
          onClick={pasoActual === 1 ? onVolver : () => setPasoActual(1)} 
          className={`${styles.btnBase} ${styles.btnSecondary}`}
          style={{ height: '40px', padding: '0 14px', gap: '6px' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>arrow_back</span>
          {pasoActual === 1 ? 'Volver' : 'Atrás'}
        </button>
      </header>

      {pasoActual === 1 ? (
        /* ====================================================================
           PASO 1: SURTIR INSUMOS (ALTA DENSIDAD PARA CHEF)
           ==================================================================== */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* PANEL DE CONFIGURACIÓN RÁPIDA */}
          <section className={styles.card} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', padding: '16px' }}>
            <div>
              <label className={styles.labelTop} style={{ opacity: 0.7 }}>SUCURSAL / DESTINO</label>
              <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-main)' }}>
                {sesion?.sucursal_nombre || 'Sucursal Principal'}
              </p>
            </div>

            <div>
              <label className={styles.labelTop}>PRIORIDAD DEL PEDIDO</label>
              <select 
                name="prioridad" 
                value={header.prioridad} 
                onChange={handleHeaderChange} 
                className={styles.selectEditorial}
                style={{ width: '100%', height: '42px' }}
              >
                <option value="Normal">Normal</option>
                <option value="Urgente">Urgente</option>
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label className={styles.labelTop}>OBSERVACIONES O NOTAS ADICIONALES</label>
              <input 
                type="text"
                name="observaciones" 
                value={header.observaciones} 
                onChange={handleHeaderChange}
                placeholder="Ej: Surtir solo si hay existencia de la marca seleccionada..."
                className={styles.inputEditorial}
                style={{ width: '100%', height: '42px' }}
              />
            </div>
          </section>

          {/* FILTRADO Y BUSCADOR */}
          <section className={styles.card} style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px' }}>
            
            {/* Buscador de insumos */}
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
                placeholder="Escribe el nombre o marca del insumo..."
                value={filtroBusqueda}
                onChange={(e) => setFiltroBusqueda(e.target.value)}
                className={styles.inputEditorial}
                style={{ width: '100%', paddingLeft: '38px', height: '44px', fontSize: '0.95rem' }}
              />
            </div>

            {/* Barra de pestañas de categorías */}
            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              overflowX: 'auto', 
              paddingBottom: '4px',
              whiteSpace: 'nowrap'
            }}>
              {categorias.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoriaActiva(cat)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '0.825rem',
                    fontWeight: 'bold',
                    border: '1px solid var(--border-ghost)',
                    backgroundColor: categoriaActiva === cat ? 'var(--color-primary)' : 'white',
                    color: categoriaActiva === cat ? 'white' : 'var(--text-main)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {cat.toUpperCase()}
                </button>
              ))}
            </div>
          </section>

          {/* LISTA COMPACTA DE ARTÍCULOS */}
          <section style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', 
            gap: '12px',
            minHeight: '200px'
          }}>
            {productosFiltrados.length === 0 ? (
              <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
                No se encontraron artículos en esta sección.
              </p>
            ) : (
              productosFiltrados.map(prod => {
                const enCarrito = carrito.find(item => item.producto_id === prod.id);

                return (
                  <div 
                    key={prod.id} 
                    className={styles.card}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      gap: '8px',
                      backgroundColor: 'white',
                      borderLeft: enCarrito ? '4px solid var(--color-primary)' : '1px solid var(--border-ghost)',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
                      borderRadius: '10px'
                    }}
                  >
                    {/* Información Básica del Insumo */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <h4 style={{ margin: 0, fontSize: '0.925rem', fontWeight: 'bold', color: 'var(--text-main)', lineHeight: '1.2' }}>
                        {prod.nombre}
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                        {prod.marca ? `${prod.marca} • ` : ''}{prod.presentacion || 'Empaque unitario'} 
                        {prod.contenido ? ` (${prod.contenido} ${prod.um?.abreviatura || 'pz'})` : ''}
                      </p>
                    </div>

                    {/* Acciones de Entrada (Cantidad) */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', borderTop: '1px solid var(--color-surface-low)', paddingTop: '8px', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input 
                          type="number"
                          step="0.1"
                          placeholder={enCarrito ? `${enCarrito.cantidad}` : '0.0'}
                          value={cantidadesLocales[prod.id] || ''}
                          onChange={(e) => setCantidadesLocales(prev => ({ ...prev, [prod.id]: e.target.value }))}
                          onKeyDown={(e) => handleKeyDown(e, prod.id, prod.nombre)}
                          className={styles.inputEditorial}
                          style={{ 
                            width: '68px', 
                            height: '36px', 
                            padding: '0 6px', 
                            fontSize: '0.925rem', 
                            textAlign: 'center',
                            borderColor: enCarrito ? 'var(--color-primary)' : 'var(--border-ghost)'
                          }}
                        />
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>
                          {prod.um?.abreviatura || 'pz'}
                        </span>
                      </div>

                      <button 
                        onClick={() => handleAgregarRapido(prod.id, prod.nombre)}
                        className={`${styles.btnBase} ${styles.btnPrimary}`}
                        style={{ height: '36px', padding: '0 12px', fontSize: '0.825rem', borderRadius: '8px' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>
                          {enCarrito ? 'edit' : 'add'}
                        </span>
                        {enCarrito ? 'Editar' : 'Pedir'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </section>

          {/* BOTÓN FLOTANTE O FOOTER PARA AVANZAR AL RESUMEN */}
          <div style={{ 
            position: 'sticky', 
            bottom: '16px', 
            width: '100%', 
            zIndex: 100, 
            display: 'flex', 
            justifyContent: 'center' 
          }}>
            <button
              onClick={() => setPasoActual(2)}
              disabled={carrito.length === 0}
              className={`${styles.btnBase} ${styles.btnPrimary}`}
              style={{ 
                width: '100%', 
                maxWidth: '480px', 
                padding: '12px 20px', 
                fontSize: '1.05rem', 
                borderRadius: '24px', 
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span className="material-symbols-outlined">shopping_cart_checkout</span>
              VALIDAR PEDIDO ({carrito.length} {carrito.length === 1 ? 'artículo' : 'artículos'})
            </button>
          </div>

        </div>
      ) : (
        /* ====================================================================
           PASO 2: VALIDACIÓN FINAL ANTES DEL ENVÍO
           ==================================================================== */
        <section className={styles.card} style={{ display: 'flex', flexDirection: 'column', borderTop: '4px solid var(--color-primary)', width: '100%', padding: '20px', gap: '20px' }}>
          
          <div style={{ borderBottom: '1px solid var(--border-ghost)', paddingBottom: '12px' }}>
            <h3 className={styles.labelTop} style={{ marginBottom: '4px', color: 'var(--color-primary)' }}>RESUMEN DE REQUISICIÓN</h3>
            <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              Revisa que las cantidades de insumos solicitadas sean correctas.
            </p>
          </div>

          {/* Listado en el Paso 2 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '420px', minHeight: '180px' }}>
            {carrito.map(item => {
              return (
                <div 
                  key={item.producto_id} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '12px 14px', 
                    borderBottom: '1px solid var(--border-ghost)', 
                    backgroundColor: 'var(--color-surface-lowest)', 
                    borderRadius: '8px' 
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 'bold', fontSize: '0.975rem', margin: '0 0 2px 0', color: 'var(--text-main)' }}>
                      {item.nombre}
                    </p>
                    <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', margin: 0 }}>
                      Empaque de Compra: <b style={{ color: 'var(--text-main)' }}>{item.cantidad} {item.empaque || item.abreviatura_um || 'pz'}</b>
                      {item.contenido && ` (Equivale a: ${(item.cantidad * item.contenido).toFixed(1)} ${item.abreviatura_um || 'pz'})`}
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button 
                      onClick={() => eliminarDelCarrito(item.producto_id)} 
                      style={{ color: '#ba1a1a', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
                      title="Quitar insumo del carrito"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1.4rem' }}>delete_forever</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Acciones de envío */}
          <div style={{ marginTop: '12px', paddingTop: '16px', borderTop: '2px dashed var(--border-ghost)', width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setPasoActual(1)} 
                disabled={loading}
                className={`${styles.btnBase} ${styles.btnSecondary}`} 
                style={{ flex: 1, padding: '12px', fontSize: '0.95rem', justifyContent: 'center' }}
              >
                <span className="material-symbols-outlined">edit_note</span>
                CORREGIR INSUMOS
              </button>

              <button 
                onClick={procesarOrden} 
                disabled={loading || carrito.length === 0}
                className={`${styles.btnBase} ${styles.btnPrimary}`} 
                style={{ flex: 1, padding: '12px', fontSize: '1rem', justifyContent: 'center' }}
              >
                <span className="material-symbols-outlined">{loading ? 'hourglass_empty' : 'send_and_archive'}</span>
                {loading ? 'ENVIANDO...' : 'CONFIRMAR Y ENVIAR'}
              </button>
            </div>
          </div>

        </section>
      )}
    </div>
  );
}