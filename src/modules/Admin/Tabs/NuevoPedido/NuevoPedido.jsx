// src/modules/Admin/Tabs/NuevoPedido/NuevoPedido.jsx
import React, { useState, useMemo } from 'react';
import styles from '../../../../assets/styles/EstilosGenerales.module.css';
import { useNuevoPedido } from './2useNuevoPedido';
import toast from 'react-hot-toast';

export default function NuevoPedido({ onVolver }) {
  const {
    loading,
    productosDisponibles,
    header,
    setHeader,
    carrito,
    agregarAlCarrito,
    eliminarDelCarrito,
    procesarOrden
  } = useNuevoPedido(onVolver);

  const [paso, setPaso] = useState(1); 
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [catActiva, setCatActiva] = useState('Todas');
  const [cantidadesLocales, setCantidadesLocales] = useState({});
  const [revisadosLocales, setRevisadosLocales] = useState([]);

  // Memorizamos las categorías basadas en los productos que sí están disponibles hoy
  const categorias = useMemo(() => {
    const sets = new Set(productosDisponibles.map(p => p.categoria_nombre));
    return ['Todas', ...Array.from(sets).sort()];
  }, [productosDisponibles]);

  // Filtramos la lista para mostrar solo lo que falta por revisar/agregar
  const productosPendientes = useMemo(() => {
    return productosDisponibles.filter(p => {
      const yaEnCarrito = carrito.some(item => item.producto_id === p.id);
      const yaRevisado = revisadosLocales.includes(p.id);
      if (yaEnCarrito || yaRevisado) return false;
      const cumpleCat = catActiva === 'Todas' || p.categoria_nombre === catActiva;
      const cumpleBusqueda = p.nombre.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
                             (p.marca || '').toLowerCase().includes(filtroBusqueda.toLowerCase());
      return cumpleCat && cumpleBusqueda;
    });
  }, [productosDisponibles, carrito, revisadosLocales, catActiva, filtroBusqueda]);

  /**
   * Maneja la acción de agregar al carrito o marcar como revisado.
   */
  const handleAdd = (prod) => {
    const valorRaw = cantidadesLocales[prod.id];
    const cant = Number(valorRaw);
    
    if (valorRaw !== undefined && valorRaw !== '' && cant > 0) {
      agregarAlCarrito(prod, cant);
    } else {
      // Si el input está vacío o es 0, se marca como revisado (no se ocupa)
      setRevisadosLocales(prev => [...prev, prod.id]);
      toast.success(`${prod.nombre} revisado`, { 
        icon: '👁️', 
        style: { fontSize: '0.8rem', borderRadius: '10px', background: '#333', color: '#fff' } 
      });
    }
    // Limpiamos el input local
    setCantidadesLocales(prev => ({ ...prev, [prod.id]: '' }));
  };

  return (
    <div className={styles.fadeIN} style={{ 
      width: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100dvh', 
      backgroundColor: 'var(--color-background)',
      overflow: 'hidden'
    }}>
      
      {/* --- ENCABEZADO --- */}
      <header style={{ 
        paddingTop: '16px', 
        paddingRight: '16px', 
        paddingLeft: '16px',
        paddingBottom: 0,
        marginBottom: 'var(--space-md)', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-end', 
        flexShrink: 0 
      }}>
        <div>
          <span className={styles.labelTop} style={{ display: 'block', marginBottom: '2px' }}>OPERACIONES DE COCINA</span>
          <h1 className={styles.title} style={{ fontSize: '2rem', lineHeight: '1', marginTop: 0, marginBottom: 0 }}>
            {paso === 1 ? 'Surtir\nInsumos' : 'Revisar\nPedido'}
          </h1>
        </div>
        <button 
          onClick={paso === 2 ? () => setPaso(1) : onVolver} 
          className={`${styles.btnBase} ${styles.btnSecondary}`}
          style={{ height: '38px', paddingTop: 0, paddingBottom: 0, paddingLeft: '12px', paddingRight: '12px', fontSize: '0.8rem' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>
            {paso === 2 ? 'close' : 'arrow_back'}
          </span>
          {paso === 2 ? 'Cancelar' : 'Volver'}
        </button>
      </header>

      {paso === 1 ? (
        /* --- PASO 1: LEVANTAMIENTO DE INVENTARIO --- */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingLeft: '16px', paddingRight: '16px', overflow: 'hidden' }}>
          
          <button 
            onClick={() => setPaso(2)} 
            disabled={carrito.length === 0}
            className={`${styles.btnBase} ${styles.btnPrimary}`} 
            style={{ width: '100%', marginBottom: '16px', height: '48px', fontSize: '0.875rem', flexShrink: 0 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>fact_check</span>
            FINALIZAR REVISIÓN ({carrito.length})
          </button>

          {/* Filtros y Buscador */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px', flexShrink: 0 }}>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>search</span>
              <input 
                type="text" placeholder="Buscar insumo..." className={styles.inputEditorial}
                style={{ width: '100%', paddingLeft: '40px', height: '45px' }}
                value={filtroBusqueda} onChange={(e) => setFiltroBusqueda(e.target.value)}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
              {categorias.map(cat => (
                <button 
                  key={cat} onClick={() => setCatActiva(cat)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px', fontSize: '0.7rem', whiteSpace: 'nowrap', fontWeight: 'bold',
                    border: catActiva === cat ? 'none' : '1px solid var(--border-ghost)',
                    backgroundColor: catActiva === cat ? 'var(--color-primary)' : 'white',
                    color: catActiva === cat ? 'white' : 'var(--text-main)',
                  }}
                >
                  {cat.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Listado de Productos Pendientes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto', paddingBottom: '120px' }}>
            {productosPendientes.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: '3rem', paddingBottom: '3rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--color-primary)', opacity: 0.2 }}>task_alt</span>
                <p style={{ marginTop: '10px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Lista revisada por completo.</p>
                {revisadosLocales.length > 0 && (
                  <button onClick={() => setRevisadosLocales([])} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.75rem', textDecoration: 'underline' }}>Resetear lista</button>
                )}
              </div>
            ) : (
              productosPendientes.map((prod) => {
                const qtyInput = cantidadesLocales[prod.id] || '';
                const totalVolumen = (Number(qtyInput) || 0) * (prod.contenido || 1);
                
                return (
                  <div 
                    key={prod.id} 
                    className={styles.card} 
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'row',
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      borderLeft: '4px solid var(--color-primary)', 
                      padding: '10px 14px',
                      borderRadius: '10px', 
                      backgroundColor: 'white',
                      minHeight: '70px',
                      gap: '12px'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                      <h4 style={{ fontSize: '0.9rem', margin: 0, fontWeight: 'bold', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {prod.nombre}
                      </h4>
                      <p style={{ marginTop: '2px', marginBottom: 0, fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', gap: '4px', fontWeight: 'bold' }}>
                        <span style={{ color: 'var(--color-primary)' }}>{prod.presentacion || 'PIEZA'}</span>
                        <span>•</span>
                        <span>{prod.contenido} {prod.um_abreviatura}</span>
                        {prod.marca && <span>• {prod.marca}</span>}
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <input 
                          type="number" 
                          placeholder="0" 
                          className={styles.inputEditorial} 
                          style={{ 
                            width: '52px', 
                            height: '36px', 
                            textAlign: 'center', 
                            padding: 0,
                            fontSize: '0.95rem',
                            fontWeight: 'bold',
                            border: '1px solid var(--border-ghost)'
                          }} 
                          value={qtyInput} 
                          onChange={(e) => setCantidadesLocales(prev => ({ ...prev, [prod.id]: e.target.value }))} 
                        />
                        <button 
                          onClick={() => handleAdd(prod)} 
                          className={styles.btnPrimary} 
                          style={{ 
                            width: '36px', 
                            height: '36px', 
                            borderRadius: '8px', 
                            padding: 0,
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            backgroundColor: Number(qtyInput) > 0 ? 'var(--color-primary)' : 'var(--color-surface-high)',
                            color: Number(qtyInput) > 0 ? 'white' : 'var(--text-main)',
                            border: 'none'
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>
                            {Number(qtyInput) > 0 ? 'add' : 'done'}
                          </span>
                        </button>
                      </div>

                      {Number(qtyInput) > 0 && prod.contenido > 1 && (
                        <span style={{ 
                          fontSize: '0.6rem', color: 'var(--color-primary)', fontWeight: 'bold', 
                          background: 'var(--color-surface-low)', padding: '2px 6px', borderRadius: '4px' 
                        }}>
                          {totalVolumen} {prod.um_abreviatura} TOTAL
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* --- PASO 2: REVISIÓN DE CARRITO Y ENVÍO --- */
        <div style={{ padding: '0 16px 40px 16px', flex: 1, overflowY: 'auto' }}>
          <section className={styles.card} style={{ animation: 'slideUp 0.3s ease', display: 'flex', flexDirection: 'column', gap: '20px', padding: '16px' }}>
            <div>
              <label className={styles.labelTop}>RESUMEN DEL PEDIDO</label>
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {carrito.map(item => (
                  <div key={item.producto_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-surface-lowest)', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-ghost)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.nombre}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {item.cantidad} {item.presentacion} <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>({item.cantidad * item.contenido} {item.abreviatura_um})</span>
                      </span>
                    </div>
                    <button onClick={() => eliminarDelCarrito(item.producto_id)} style={{ background: 'none', border: 'none', color: '#ba1a1a', padding: '4px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>delete_sweep</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className={styles.labelTop}>NOTAS O INSTRUCCIONES</label>
              <textarea 
                name="observaciones" value={header.observaciones} 
                onChange={(e) => setHeader({...header, observaciones: e.target.value})} 
                className={styles.inputEditorial} 
                style={{ height: '80px', resize: 'none', paddingTop: '10px', fontSize: '0.85rem' }} 
                placeholder="Ej: Pedir todo para mañana antes de las 10 AM..." 
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', paddingTop: '16px', borderTop: '2px dashed var(--border-ghost)' }}>
              <button 
                onClick={procesarOrden} 
                disabled={loading || carrito.length === 0} 
                className={`${styles.btnBase} ${styles.btnPrimary}`} 
                style={{ padding: '0 20px', height: '48px', borderRadius: '14px' }}
              >
                <span className="material-symbols-outlined">send</span>
                {loading ? 'ENVIANDO...' : 'ENVIAR'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}