// Archivo: src/modules/Admin/Tabs/Proyeccion/MandadoView.jsx
import React, { useState, useMemo } from 'react';

export const MandadoView = ({ estimates, s, usuarioId }) => {
  const { sugerenciasFiltradas, compradosIds, confirmarCompra, puedeEditarInventario } = estimates;
  const [filtro, setFiltro] = useState("");

  // --- FILTRADO DE LA LISTA DE MANDADO ---
  const lista = useMemo(() => sugerenciasFiltradas.filter(item => {
    // 1. Debe necesitar compras y no estar ya comprado
    // Con el nuevo motor JIT, cajas_a_pedir es > 0 solo si el stock no cubre la demanda de mañana
    if (item.cajas_a_pedir <= 0 || compradosIds.includes(item.insumo_id)) return false;
    
    // 2. Filtro por texto (Nombre o Modelo)
    if (filtro) {
      const termino = filtro.toLowerCase();
      const nombre = (item.insumo_nombre || "").toLowerCase();
      const modelo = (item.modelo || "").toLowerCase();
      return nombre.includes(termino) || modelo.includes(termino);
    }
    
    return true;
  }), [sugerenciasFiltradas, compradosIds, filtro]);

  // --- RENDER PRINCIPAL ---
  return (
    <>
      {/* Encabezado de la Vista */}
      <section className={s.pageHeader} style={{ marginBottom: '20px' }}>
        <div>
          <h2 className={s.pageTitle} style={{ fontSize: '1.2rem' }}>Lista de Mandado</h2>
          <span className={s.textSubDetail}>Insumos necesarios para cubrir la venta proyectada de mañana.</span>
        </div>
        <div className={s.badge} style={{ fontSize: '12px', padding: '6px 12px', backgroundColor: 'var(--color-primary)', color: 'white' }}>
          🛒 {lista.length} Pendientes para Mañana
        </div>
      </section>

      {/* Buscador */}
      <div className={s.adminCard} style={{ marginBottom: '20px', padding: '15px' }}>
        <input 
          type="text" 
          className={s.inputField} 
          placeholder="Buscar insumo o modelo en la lista de mandado..." 
          value={filtro} 
          onChange={e => setFiltro(e.target.value)} 
        />
      </div>

      {/* Grid de Tarjetas de Compra */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {lista.length === 0 ? (
          <div style={{ gridColumn: '1/-1' }} className={s.adminCard}>
            <div className={s.emptyState}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🎉</div>
              <h3 style={{ margin: '0 0 5px 0', color: 'var(--color-text-main)' }}>¡Abastecimiento Completo!</h3>
              <p style={{ margin: 0 }}>Tu stock actual cubre perfectamente la demanda proyectada para mañana.</p>
            </div>
          </div>
        ) : (
          lista.map(ins => (
            <div 
              key={ins.insumo_id} 
              className={s.adminCard} 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between', 
                gap: '15px',
                padding: '20px',
                margin: 0,
                borderTop: '4px solid var(--color-primary)' 
              }}
            >
              {/* Cabecera de la Tarjeta (Insumo, Modelo y Proveedor) */}
              <div>
                <div className={s.productTitle} style={{ fontSize: '1.1rem', marginBottom: '4px' }}>
                  {ins.insumo_nombre} {ins.modelo ? <span style={{ color: 'var(--color-primary)' }}>- {ins.modelo}</span> : ''}
                </div>
                <div className={s.textMuted} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
                   {ins.proveedor_nombre || 'Sin proveedor asignado'}
                </div>
              </div>

              {/* Cuerpo de la Tarjeta (Datos de la demanda vs stock) */}
              <div style={{ backgroundColor: 'var(--color-bg-app)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span className={s.textMuted} style={{ fontSize: '12px' }}>Faltante neto:</span>
                  <span style={{ fontWeight: '700', fontSize: '13px' }}>
                    {ins.cantidad_sugerida} {ins.unidad_medida}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #eee', paddingTop: '5px' }}>
                  <span className={s.productTitle} style={{ margin: 0, fontSize: '14px' }}>Comprar:</span>
                  <span className={s.productTitle} style={{ color: 'var(--color-primary)', fontSize: '14px' }}>
                     {ins.cajas_a_pedir} {ins.cajas_a_pedir === 1 ? 'Unidad/Caja' : 'Unidades/Cajas'}
                  </span>
                </div>
              </div>

              {/* Acción (Botón de Compra) */}
              <div style={{ marginTop: '5px' }}>
                {puedeEditarInventario ? (
                  <button 
                    className={`${s.btn} ${s.btnSuccess} ${s.btnFull}`} 
                    onClick={() => confirmarCompra(ins, usuarioId)}
                    style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '14px', fontWeight: '700' }}
                  >
                    <span></span> Confirmar Recepción
                  </button>
                ) : (
                  <div 
                    className={s.badgeDanger} 
                    style={{ display: 'block', textAlign: 'center', padding: '10px', width: '100%', boxSizing: 'border-box' }}
                  >
                    Solo Lectura - Sin Permisos
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
};