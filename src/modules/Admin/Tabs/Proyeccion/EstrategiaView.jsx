// Archivo: src/modules/Admin/Tabs/Proyeccion/EstrategiaView.jsx
import React, { useState } from 'react';
import { formatCurrency } from "../../../../utils/formatCurrency";

export const EstrategiaView = ({ estimates, s }) => {
  const { 
    sugerenciasFiltradas, 
    proveedores, 
    proyeccionProductos, 
    presupuestoTotal, 
    guardarPolitica, 
    puedeEditar, 
    setFiltroProveedor 
  } = estimates;

  // --- ESTADOS LOCALES ---
  const [viewMode, setViewMode] = useState('insumo');
  const [filtroBuscar, setFiltroBuscar] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  
  const [tempPolitica, setTempPolitica] = useState({ 
    metodo: 'dinamico', 
    cobertura: 7, 
    seguridad: 2, 
    minimo: 0, 
    maximo: 0 
  });

  // --- LÓGICA DE ACCIONES (EDICIÓN Y GUARDADO) ---
  const iniciarEdicion = (item) => {
    setEditandoId(item.insumo_id);
    setTempPolitica({
      metodo: item.metodo_compra,
      cobertura: item.dias_cobertura_objetivo,
      seguridad: item.dias_stock_seguridad,
      minimo: item.stock_minimo,
      maximo: item.stock_maximo
    });
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
  };

  const handleSave = async (id) => {
    const res = await guardarPolitica(id, tempPolitica);
    if (res.success) {
      setEditandoId(null);
    }
  };

  // --- FILTRADO DE DATOS ---
  const dataFiltrada = (viewMode === 'insumo' ? sugerenciasFiltradas : proyeccionProductos).filter(i => {
    const termino = filtroBuscar.toLowerCase();
    const nombre = (i.insumo_nombre || i.nombre || "").toLowerCase();
    return !filtroBuscar || nombre.includes(termino);
  });

  // --- RENDERIZADO DE TABLAS ---
  const renderCabecera = () => {
    if (viewMode === 'insumo') {
      return (
        <tr>
          <th className={s.th}>INSUMO</th>
          <th className={s.th}>CONS. PROMEDIO</th>
          <th className={s.th}>POLÍTICA / ESTRATEGIA</th>
          <th className={s.th}>STOCK ACTUAL</th>
          <th className={s.th}>SUGERIDO</th>
          <th className={s.th} style={{ width: '100px', textAlign: 'center' }}>ACCIÓN</th>
        </tr>
      );
    }
    return (
      <tr>
        <th className={s.th}>PLATILLO</th>
        <th className={s.th}>VENTA PROMEDIO (7D)</th>
        <th className={s.th}>PREDICCIÓN PRÓX. DÍA</th>
      </tr>
    );
  };

  const renderFilasInsumos = () => {
    return dataFiltrada.map((item) => {
      const isEditing = editandoId === item.insumo_id;

      return (
        <tr key={item.insumo_id}>
          {/* Columna Insumo */}
          <td className={s.td}>
            <div style={{ fontWeight: '700' }}>{item.insumo_nombre}</div>
            <div style={{ fontSize: '11px', color: '#666' }}>{item.nombre_empresa}</div>
          </td>

          {/* Columna Consumo */}
          <td className={s.td}>
            {item.consumo_diario_real} <small>{item.unidad_medida}</small>
          </td>

          {/* Columna Política (Con Inputs en Modo Edición) */}
          <td className={s.td}>
            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <select 
                  className={s.inputField} 
                  style={{ padding: '4px', fontSize: '12px' }}
                  value={tempPolitica.metodo} 
                  onChange={e => setTempPolitica({...tempPolitica, metodo: e.target.value})}
                >
                  <option value="dinamico">Inteligente (Días)</option>
                  <option value="estatico">Manual (Cantidades)</option>
                </select>
                
                {tempPolitica.metodo === 'dinamico' ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="number" title="Días Cobertura" placeholder="Cobertura" className={s.inputField} style={{ width: '60px', padding: '4px' }} value={tempPolitica.cobertura} onChange={e => setTempPolitica({...tempPolitica, cobertura: e.target.value})} />
                    <input type="number" title="Días Seguridad" placeholder="Seguridad" className={s.inputField} style={{ width: '60px', padding: '4px' }} value={tempPolitica.seguridad} onChange={e => setTempPolitica({...tempPolitica, seguridad: e.target.value})} />
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="number" title="Mínimo" placeholder="Mínimo" className={s.inputField} style={{ width: '60px', padding: '4px' }} value={tempPolitica.minimo} onChange={e => setTempPolitica({...tempPolitica, minimo: e.target.value})} />
                    <input type="number" title="Máximo" placeholder="Máximo" className={s.inputField} style={{ width: '60px', padding: '4px' }} value={tempPolitica.maximo} onChange={e => setTempPolitica({...tempPolitica, maximo: e.target.value})} />
                  </div>
                )}
              </div>
            ) : (
              <div>
                <span className={s.badge} style={{ marginBottom: '6px', display: 'inline-block' }}>
                  {item.metodo_compra === 'estatico' ? 'MANUAL' : 'AUTOMÁTICO'}
                </span>
                <div style={{ fontSize: '12px', color: '#555' }}>
                  {item.metodo_compra === 'estatico' 
                    ? `Mín: ${item.stock_minimo} | Máx: ${item.stock_maximo}`
                    : `Cob: ${item.dias_cobertura_objetivo}d | Seg: ${item.dias_stock_seguridad}d`
                  }
                </div>
              </div>
            )}
          </td>

          {/* Columna Stock Actual */}
          <td className={s.td}>
            <span style={{ color: item.stock_fisico_hoy <= 0 ? 'var(--color-danger, red)' : 'inherit', fontWeight: item.stock_fisico_hoy <= 0 ? '700' : 'normal' }}>
              {parseFloat(item.stock_fisico_hoy).toFixed(1)}
            </span>
            <small> {item.unidad_medida}</small>
          </td>

          {/* Columna Sugerido */}
          <td className={s.td}>
            <div style={{ fontWeight: '700', color: item.cajas_a_pedir > 0 ? 'var(--color-success)' : '#999' }}>
              {item.cajas_a_pedir} <small>cajas</small>
            </div>
            <div style={{ fontSize: '11px', color: '#666' }}>
              ({item.cantidad_sugerida} {item.unidad_medida})
            </div>
          </td>

          {/* COLUMNA ACCIÓN (Corregida y Mejorada con Cancelar) */}
          <td className={s.td} style={{ textAlign: 'center' }}>
            {puedeEditar && (
              isEditing ? (
                <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                  <button 
                    title="Guardar Cambios"
                    className={`${s.btn} ${s.btnSuccess} ${s.btnSmall}`} 
                    onClick={() => handleSave(item.insumo_id)}
                  >
                    💾
                  </button>
                  <button 
                    title="Cancelar"
                    className={`${s.btn} ${s.btnDanger} ${s.btnSmall}`} 
                    onClick={cancelarEdicion}
                  >
                    ❌
                  </button>
                </div>
              ) : (
                <button 
                  title="Editar Estrategia"
                  className={`${s.btn} ${s.btnEditar} ${s.btnSmall}`} 
                  onClick={() => iniciarEdicion(item)}
                >
                  📝
                </button>
              )
            )}
          </td>
        </tr>
      );
    });
  };

  const renderFilasProductos = () => {
    return dataFiltrada.map((item, i) => (
      <tr key={i}>
        <td className={s.td} style={{ fontWeight: '700' }}>{item.nombre}</td>
        <td className={s.td}>{item.promedio_diario} unidades</td>
        <td className={s.td}>
          <span className={s.badgeSuccess}>{item.prediccion_manana} pedidos</span>
        </td>
      </tr>
    ));
  };

  // --- RENDER PRINCIPAL ---
  return (
    <>
      {/* Cabecera y Resumen Financiero */}
      <section className={s.pageHeader} style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Análisis de Demanda y Estrategia</h2>
        <div className={s.adminCard} style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#555' }}>INVERSIÓN ESTIMADA:</span>
          <span style={{ color: 'var(--color-primary)', fontSize: '1.1rem', fontWeight: '800' }}>
            {formatCurrency(presupuestoTotal)}
          </span>
        </div>
      </section>

      {/* Selector de Pestañas Internas */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button 
          className={`${s.btn} ${viewMode === 'insumo' ? s.btnPrimary : s.btnDark}`} 
          onClick={() => { setViewMode('insumo'); setFiltroBuscar(""); setEditandoId(null); }} 
          style={{ flex: 1, padding: '12px' }}
        >
          📦 ESTRATEGIA DE INSUMOS
        </button>
        <button 
          className={`${s.btn} ${viewMode === 'producto' ? s.btnPrimary : s.btnDark}`} 
          onClick={() => { setViewMode('producto'); setFiltroBuscar(""); setEditandoId(null); }} 
          style={{ flex: 1, padding: '12px' }}
        >
          🍔 DEMANDA DE PLATILLOS
        </button>
      </div>

      {/* Contenedor Principal (Tabla y Filtros) */}
      <div className={`${s.adminCard} ${s.tableContainer}`}>
        
        {/* Barra de Herramientas / Filtros */}
        <div style={{ padding: "16px", display: "flex", gap: "12px", borderBottom: '1px solid #eee' }}>
          <input 
            type="text" 
            className={s.inputField} 
            placeholder={`Buscar ${viewMode === 'insumo' ? 'insumo' : 'platillo'} por nombre...`}
            value={filtroBuscar} 
            onChange={(e) => setFiltroBuscar(e.target.value)} 
            style={{ flex: 2 }} 
          />
          {viewMode === 'insumo' && (
            <select 
              className={s.inputField} 
              onChange={(e) => setFiltroProveedor(e.target.value)} 
              style={{ flex: 1 }}
            >
              <option value="todos">Todos los proveedores</option>
              {proveedores.map(p => (
                <option key={p.id} value={p.nombre_empresa}>{p.nombre_empresa}</option>
              ))}
            </select>
          )}
        </div>

        {/* Tabla de Datos */}
        <table className={s.table}>
          <thead className={s.thead}>
            {renderCabecera()}
          </thead>
          <tbody>
            {dataFiltrada.length > 0 ? (
              viewMode === 'insumo' ? renderFilasInsumos() : renderFilasProductos()
            ) : (
              <tr>
                <td colSpan={viewMode === 'insumo' ? "6" : "3"} className={s.td} style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                  No se encontraron resultados para la búsqueda actual.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};