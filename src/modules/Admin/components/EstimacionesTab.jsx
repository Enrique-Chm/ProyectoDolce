import React, { useState, useMemo } from 'react';
import { useEstimacionesTab } from "../../../hooks/useEstimacionesTab"; 
import s from "../AdminPage.module.css"; 
import { formatCurrency } from "../../../utils/formatCurrency"; 

const EstimacionesTab = ({ sucursalId, usuarioId }) => {
  const { 
    sugerenciasFiltradas, proveedores, filtroProveedor, setFiltroProveedor, 
    presupuestoTotal, loading, recargarDatos, guardarPolitica,
    compradosIds, confirmarCompra
  } = useEstimacionesTab();

  const [subTab, setSubTab] = useState('config');
  const [editandoId, setEditandoId] = useState(null);
  const [tempPolitica, setTempPolitica] = useState({ cobertura: 7, seguridad: 2 });

  const listaParaComprar = useMemo(() => {
    return sugerenciasFiltradas.filter(item => 
      item.cajas_a_pedir > 0 && !compradosIds.includes(item.insumo_id)
    );
  }, [sugerenciasFiltradas, compradosIds]);

  const handleSavePolicy = async (id) => {
    const res = await guardarPolitica(id, tempPolitica.cobertura, tempPolitica.seguridad);
    if (res.success) setEditandoId(null);
  };

  if (loading && !sugerenciasFiltradas.length) return <div className={s.emptyStateBox}>📊 Cargando...</div>;

  return (
    <div className={s.container} style={{ display: 'block' }}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button className={subTab === 'config' ? s.navBtnActive : s.navBtn} onClick={() => setSubTab('config')}>⚙️ ESTRATEGIA</button>
        <button className={subTab === 'compras' ? s.navBtnActive : s.navBtn} onClick={() => setSubTab('compras')}>
          🛒 LISTA DE MANDADO {listaParaComprar.length > 0 && <span className={s.badge}>{listaParaComprar.length}</span>}
        </button>
      </div>

      <section className={s.headerTop} style={{ marginBottom: '25px' }}>
        <h2 className={s.mainTitle}>{subTab === 'config' ? 'Proyección' : 'Lista'} de <span className={s.accent}>Compras</span></h2>
        <div className={s.card} style={{ textAlign: 'right', borderLeft: '6px solid #16a34a' }}>
          <span className={s.label}>Presupuesto Pendiente</span>
          <div className={s.priceTag} style={{ fontSize: '2rem', color: '#16a34a' }}>{formatCurrency(presupuestoTotal)}</div>
        </div>
      </section>

      {subTab === 'config' && (
        <div className={s.card}><div className={s.tableWrapper}><table className={s.table}>
          <thead><tr><th>Insumo</th><th>Consumo/Día</th><th>🛒 Cobertura</th><th>Stock Hoy</th><th>Sugerencia</th><th>Costo</th><th></th></tr></thead>
          <tbody>{sugerenciasFiltradas.map((item) => (
            <tr key={item.insumo_id}>
              <td style={{ fontWeight: '700' }}>{item.insumo_nombre}</td>
              <td>{parseFloat(item.consumo_diario_real || 0).toFixed(2)}</td>
              <td>{editandoId === item.insumo_id ? (
                <input type="number" className={s.input} style={{width:'50px'}} value={tempPolitica.cobertura} onChange={e => setTempPolitica({...tempPolitica, cobertura: e.target.value})} />
              ) : <span>{item.dias_cobertura_objetivo} d</span>}</td>
              <td>{parseFloat(item.stock_fisico_hoy).toFixed(1)}</td>
              <td style={{color: item.cajas_a_pedir > 0 ? '#10b981' : 'inherit', fontWeight:'bold'}}>{item.cajas_a_pedir} Cajas</td>
              <td>{formatCurrency(item.presupuesto_estimado)}</td>
              <td><button className={s.btnEdit} onClick={() => { setEditandoId(item.insumo_id); setTempPolitica({cobertura: item.dias_cobertura_objetivo, seguridad: item.dias_stock_seguridad}) }}>⚙️</button></td>
            </tr>
          ))}</tbody>
        </table></div></div>
      )}

      {subTab === 'compras' && (
        <div style={{ display: 'grid', gap: '15px' }}>
          {listaParaComprar.map(ins => (
            <div key={ins.insumo_id} className={s.card} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><strong>{ins.insumo_nombre}</strong><p className={s.textMuted}>{ins.proveedor_nombre}</p></div>
              <button className={s.btnOrder} style={{ background: '#10b981' }} onClick={() => confirmarCompra(ins, usuarioId, sucursalId)}>✓ RECIBIR {ins.cajas_a_pedir} CAJAS</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EstimacionesTab;