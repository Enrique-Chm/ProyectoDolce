// Archivo: src/modules/Admin/Tabs/Proyeccion/MandadoView.jsx
import React, { useState, useMemo } from 'react';

export const MandadoView = ({ estimates, s, usuarioId }) => {
  const { sugerenciasFiltradas, compradosIds, confirmarCompra, puedeEditar } = estimates;
  const [filtro, setFiltro] = useState("");

  // --- FILTRADO DE LA LISTA DE MANDADO ---
  const lista = useMemo(() => sugerenciasFiltradas.filter(item => {
    // 1. Debe necesitar compras y no estar ya comprado
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
          <span className={s.textSubDetail}>Insumos que alcanzaron su punto de reorden.</span>
        </div>
        <div className={s.badge} style={{ fontSize: '12px', padding: '6px 12px' }}>
          🛒 {lista.length} Pendientes
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
              <h3 style={{ margin: '0 0 5px 0', color: 'var(--color-text-main)' }}>¡Todo al día!</h3>
              <p style={{ margin: 0 }}>No hay compras pendientes para la búsqueda actual.</p>
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
                borderTop: '4px solid var(--color-primary)' // Acento visual
              }}
            >
              {/* Cabecera de la Tarjeta (Insumo, Modelo y Proveedor) */}
              <div>
                <div className={s.productTitle} style={{ fontSize: '1.1rem', marginBottom: '4px' }}>
                  {ins.insumo_nombre} {ins.modelo ? <span style={{ color: 'var(--color-primary)' }}>- {ins.modelo}</span> : ''}
                </div>
                <div className={s.textMuted} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  🏢 {ins.proveedor_nombre || 'Sin proveedor asignado'}
                </div>
              </div>

              {/* Cuerpo de la Tarjeta (Datos de la compra) */}
              <div style={{ backgroundColor: 'var(--color-bg-app)', padding: '12px', borderRadius: '8px' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className={s.productTitle} style={{ margin: 0 }}>Se necesitan comprar:</span>
                  <span className={s.productTitle}>
                     {ins.cajas_a_pedir} Unidades
                  </span>
                </div>
              </div>

              {/* Acción (Botón de Compra) */}
              <div style={{ marginTop: '5px' }}>
                {puedeEditar ? (
                  <button 
                    className={`${s.btn} ${s.btnSuccess} ${s.btnFull}`} 
                    onClick={() => confirmarCompra(ins, usuarioId)}
                    style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '14px' }}
                  >
                    <span>✅</span> RECIBIR {ins.cajas_a_pedir} CAJAS
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