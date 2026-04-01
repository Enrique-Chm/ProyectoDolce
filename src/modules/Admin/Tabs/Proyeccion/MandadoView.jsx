// Archivo: src/modules/Admin/Tabs/Proyeccion/MandadoView.jsx
import React, { useState, useMemo } from 'react';

export const MandadoView = ({ estimates, s, usuarioId }) => {
  const { sugerenciasFiltradas, compradosIds, confirmarCompra, puedeEditar } = estimates;
  const [filtro, setFiltro] = useState("");

  const lista = useMemo(() => sugerenciasFiltradas.filter(item => 
    item.cajas_a_pedir > 0 && 
    !compradosIds.includes(item.insumo_id) &&
    (!filtro || item.insumo_nombre.toLowerCase().includes(filtro.toLowerCase()))
  ), [sugerenciasFiltradas, compradosIds, filtro]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
      <div style={{ gridColumn: '1/-1' }}>
        <input type="text" className={s.inputField} placeholder="Filtrar mandado..." value={filtro} onChange={e => setFiltro(e.target.value)} />
      </div>
      {lista.map(ins => (
        <div key={ins.insumo_id} className={s.adminCard} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '15px' }}>
          <div>
            <strong style={{ fontSize: '1.1rem' }}>{ins.insumo_nombre}</strong>
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{ins.proveedor_nombre}</p>
          </div>
          {puedeEditar ? (
            <button className={`${s.btn} ${s.btnSuccess} ${s.btnFull}`} onClick={() => confirmarCompra(ins, usuarioId)}>
              ✓ RECIBIR {ins.cajas_a_pedir} CAJAS
            </button>
          ) : <div className={s.badgeWarning}>Solo Lectura</div>}
        </div>
      ))}
      {lista.length === 0 && <div className={s.emptyState} style={{ gridColumn: '1/-1' }}>No hay compras pendientes.</div>}
    </div>
  );
};