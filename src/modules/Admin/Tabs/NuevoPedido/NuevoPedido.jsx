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
    totalEstimado,
    agregarAlCarrito,
    eliminarDelCarrito,
    procesarOrden
  } = useNuevoPedido(onVolver);

  const [paso, setPaso] = useState(1); 
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [catActiva, setCatActiva] = useState('Todas');
  const [cantidadesLocales, setCantidadesLocales] = useState({});
  const [revisadosLocales, setRevisadosLocales] = useState([]);

  const categorias = useMemo(() => {
    const sets = new Set(productosDisponibles.map(p => p.categoria_nombre));
    return ['Todas', ...Array.from(sets).sort()];
  }, [productosDisponibles]);

  const productosPendientes = useMemo(() => {
    return productosDisponibles.filter(p => {
      const yaEnCarrito = carrito.some(item => item.producto_id === p.id);
      const yaRevisado = revisadosLocales.includes(p.id);
      if (yaEnCarrito || yaRevisado) return false;
      const cumpleCat = catActiva === 'Todas' || p.categoria_nombre === catActiva;
      const cumpleBusqueda = p.nombre.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
                             p.marca?.toLowerCase().includes(filtroBusqueda.toLowerCase());
      return cumpleCat && cumpleBusqueda;
    });
  }, [productosDisponibles, carrito, revisadosLocales, catActiva, filtroBusqueda]);

  const handleAdd = (prod) => {
    const valorRaw = cantidadesLocales[prod.id];
    const cant = Number(valorRaw);
    if (valorRaw !== undefined && valorRaw !== '' && cant > 0) {
      agregarAlCarrito(prod, cant);
    } else {
      setRevisadosLocales(prev => [...prev, prod.id]);
      toast.success(`${prod.nombre} revisado`, { icon: '👁️', style: { fontSize: '0.8rem' } });
    }
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
        paddingTop: '16px', paddingRight: '16px', paddingBottom: '0', paddingLeft: '16px',
        marginBottom: 'var(--space-md)', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-end', 
        flexShrink: 0 
      }}>
        <div>
          <span className={styles.labelTop} style={{ display: 'block', marginBottom: '2px' }}>OPERACIONES DE COCINA</span>
          <h1 className={styles.title} style={{ fontSize: '2rem', lineHeight: '1', margin: 0 }}>
            {paso === 1 ? 'Surtir\nInsumos' : 'Revisar\nPedido'}
          </h1>
        </div>
        <button 
          onClick={paso === 2 ? () => setPaso(1) : onVolver} 
          className={`${styles.btnBase} ${styles.btnSecondary}`}
          style={{ height: '38px', paddingRight: '12px', paddingLeft: '12px', fontSize: '0.8rem' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>arrow_back</span>
        </button>
      </header>

      {paso === 1 ? (
        /* VISTA 1: LISTADO (CHECKLIST) */
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          paddingTop: '0', paddingRight: '16px', paddingBottom: '0', paddingLeft: '16px', 
          overflow: 'hidden' 
        }}>
          <button 
            onClick={() => setPaso(2)} 
            disabled={carrito.length === 0}
            className={`${styles.btnBase} ${styles.btnPrimary}`} 
            style={{ width: '100%', marginBottom: '16px', height: '44px', fontSize: '0.875rem', flexShrink: 0 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>fact_check</span>
            FINALIZAR REVISIÓN ({carrito.length})
          </button>

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
                    paddingTop: '6px', paddingRight: '14px', paddingBottom: '6px', paddingLeft: '14px',
                    borderRadius: '20px', fontSize: '0.75rem', whiteSpace: 'nowrap', fontWeight: 'bold',
                    border: catActiva === cat ? 'none' : '1px solid var(--border-ghost)',
                    backgroundColor: catActiva === cat ? 'var(--color-primary)' : 'white',
                    color: catActiva === cat ? 'white' : 'var(--text-main)',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* LISTA DE INSUMOS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto', paddingBottom: '140px' }}>
            {productosPendientes.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: '3rem', paddingBottom: '3rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--color-primary)', opacity: 0.3 }}>checklist_rtl</span>
                <p style={{ marginTop: '10px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Todos los artículos revisados.</p>
                {revisadosLocales.length > 0 && (
                  <button onClick={() => setRevisadosLocales([])} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.75rem', textDecoration: 'underline' }}>Reiniciar lista</button>
                )}
              </div>
            ) : (
              productosPendientes.map((prod) => {
                const qtyInput = cantidadesLocales[prod.id] || '';
                const totalVolumen = (Number(qtyInput) || 0) * (prod.contenido || 1);
                return (
                  <div key={prod.id} className={styles.card} style={{ borderLeft: '4px solid var(--color-primary)', paddingTop: '12px', paddingRight: '14px', paddingBottom: '12px', paddingLeft: '14px', borderRadius: '10px', backgroundColor: 'white', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ fontSize: '0.9rem', margin: 0, fontWeight: 'bold', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prod.nombre}</h4>
                      <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--color-primary)', fontWeight: '800', textTransform: 'uppercase' }}>
                      {prod.presentacion || 'Pieza'} <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>de {prod.contenido} {prod.um_abreviatura}</span>
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <input type="number" placeholder="0" className={styles.inputEditorial} style={{ width: '55px', height: '36px', textAlign: 'center', padding: 0 }} value={qtyInput} onChange={(e) => setCantidadesLocales(prev => ({ ...prev, [prod.id]: e.target.value }))} />
                        <button onClick={() => handleAdd(prod)} className={styles.btnPrimary} style={{ width: '36px', height: '36px', borderRadius: '8px', padding: 0 }}><span className="material-symbols-outlined">{Number(qtyInput) > 0 ? 'add' : 'done'}</span></button>
                      </div>
                      {Number(qtyInput) > 0 && prod.contenido > 1 && (
                        <span style={{ fontSize: '0.65rem', color: 'var(--color-tertiary)', fontWeight: 'bold', background: 'var(--color-surface-low)', paddingTop: '2px', paddingRight: '6px', paddingBottom: '2px', paddingLeft: '6px', borderRadius: '4px' }}>
                          Recibirás: {totalVolumen} {prod.um_abreviatura}
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
        /* VISTA 2: FORMULARIO (REVISIÓN Y ENVÍO) */
        <div style={{ paddingTop: '0', paddingRight: '16px', paddingBottom: '40px', paddingLeft: '16px', flex: 1, overflowY: 'auto' }}>
          <section className={styles.card} style={{ animation: 'slideUp 0.3s ease', display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '16px', paddingRight: '16px', paddingBottom: '16px', paddingLeft: '16px' }}>
            <div style={{ borderBottom: '1px solid var(--border-ghost)', paddingBottom: '10px' }}>
              <label className={styles.labelTop}>RESUMEN DE CARGA</label>
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {carrito.map(item => (
                  <div key={item.producto_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-surface-lowest)', paddingTop: '10px', paddingRight: '10px', paddingBottom: '10px', paddingLeft: '10px', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{item.nombre}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.cantidad} {item.presentacion} = {item.cantidad * item.contenido} {item.abreviatura_um}</span>
                    </div>
                    <button onClick={() => eliminarDelCarrito(item.producto_id)} style={{ background: 'none', border: 'none', color: '#ba1a1a', padding: 0 }}><span className="material-symbols-outlined">delete</span></button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className={styles.labelTop}>NOTAS O INSTRUCCIONES</label>
              <textarea name="observaciones" value={header.observaciones} onChange={(e) => setHeader({...header, observaciones: e.target.value})} className={styles.inputEditorial} style={{ height: '100px', resize: 'none', paddingTop: '10px' }} placeholder="Instrucciones para la compra..." />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', paddingBottom: '10px', borderTop: '2px dashed var(--border-ghost)' }}>
              <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>COSTO ESTIMADO</span>
              <span style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--color-primary)' }}>${totalEstimado.toFixed(2)}</span>
            </div>
            <button onClick={procesarOrden} disabled={loading} className={`${styles.btnBase} ${styles.btnPrimary}`} style={{ width: '100%', paddingTop: '1.2rem', paddingBottom: '1.2rem', borderRadius: '16px' }}>
              <span className="material-symbols-outlined">send</span>
              {loading ? 'ENVIANDO...' : 'ENVIAR REQUISICIÓN FINAL'}
            </button>
          </section>
        </div>
      )}
    </div>
  );
}