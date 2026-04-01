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
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
      
      {/* Buscador de Lista de Mandado */}
      <div style={{ gridColumn: '1/-1' }}>
        <input 
          type="text" 
          className={s.inputField} 
          placeholder="Filtrar por nombre del insumo..." 
          value={filtro} 
          onChange={e => setFiltro(e.target.value)} 
        />
      </div>

      {/* Renderizado de Tarjetas o Estado Vacío */}
      {lista.length === 0 ? (
        <div style={{ gridColumn: '1/-1' }}>
          <div className={s.emptyState}>
            No hay compras pendientes para la búsqueda actual.
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
              margin: 0 // Asegura que la grilla controle el espaciado
            }}
          >
            {/* Información del Insumo */}
            <div>
              <div className={s.productTitle}>
                {ins.insumo_nombre}
              </div>
              <div className={s.textMuted}>
                {ins.proveedor_nombre || 'Sin proveedor asignado'}
              </div>
            </div>

            {/* Acción */}
            <div>
              {puedeEditar ? (
                <button 
                  className={`${s.btn} ${s.btnSuccess} ${s.btnFull}`} 
                  onClick={() => confirmarCompra(ins, usuarioId)}
                >
                  RECIBIR {ins.cajas_a_pedir} CAJAS
                </button>
              ) : (
                <div 
                  className={s.badgeWarning} 
                  style={{ display: 'block', textAlign: 'center', padding: '8px' }}
                >
                  Solo Lectura
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};