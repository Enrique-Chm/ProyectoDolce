// Archivo: src/modules/Admin/components/EstimacionesTab.jsx
import React, { useState, useMemo } from 'react';
import { useEstimacionesTab } from "../../../hooks/useEstimacionesTab"; 
import s from "../AdminPage.module.css"; 
import { formatCurrency } from "../../../utils/formatCurrency"; 
import { hasPermission } from '../../../utils/checkPermiso'; // Importamos seguridad

const EstimacionesTab = ({ sucursalId, usuarioId }) => {
  const { 
    sugerenciasFiltradas, proveedores, filtroProveedor, setFiltroProveedor, 
    presupuestoTotal, loading, recargarDatos, guardarPolitica,
    compradosIds, confirmarCompra
  } = useEstimacionesTab();

  /**
   * 🛡️ SEGURIDAD INTERNA (RBAC)
   */
  const puedeEditar = hasPermission('editar_estimaciones');

  const [subTab, setSubTab] = useState('config');
  const [editandoId, setEditandoId] = useState(null);
  const [tempPolitica, setTempPolitica] = useState({ cobertura: 7, seguridad: 2 });

  const listaParaComprar = useMemo(() => {
    return sugerenciasFiltradas.filter(item => 
      item.cajas_a_pedir > 0 && !compradosIds.includes(item.insumo_id)
    );
  }, [sugerenciasFiltradas, compradosIds]);

  const handleSavePolicy = async (id) => {
    // Bloqueo de seguridad en función
    if (!puedeEditar) return;
    const res = await guardarPolitica(id, tempPolitica.cobertura, tempPolitica.seguridad);
    if (res.success) setEditandoId(null);
  };

  if (loading && !sugerenciasFiltradas.length) return <div className={s.tabContent}> Cargando proyecciones...</div>;

  return (
    <div className={s.tabWrapper}>
      <div className={s.pageHeader}>
        <h2 className={s.pageTitle}>Proyeccion Compras</h2>
      </div>
      {/* NAVEGACIÓN DE SUB-TABS: Soporte para scroll horizontal en tablets */}
      <nav className={s.tabNav}>
        <button 
          className={`${s.tabButton} ${subTab === 'config' ? s.activeTabButton : ''}`} 
          onClick={() => setSubTab('config')}
        >
           ESTRATEGIA DE STOCK
        </button>
        <button 
          className={`${s.tabButton} ${subTab === 'compras' ? s.activeTabButton : ''}`} 
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          onClick={() => setSubTab('compras')}
        >
           LISTA DE MANDADO 
          {listaParaComprar.length > 0 && (
            <span className={s.badgeCount}>
              {listaParaComprar.length}
            </span>
          )}
        </button>
      </nav>

      {/* HEADER CON PRESUPUESTO: Ajustado para que se apile en móviles/tablets */}
      <section className={s.headerSection}>
        <h2 className={s.pageTitle} style={{ margin: 0 }}>
          {subTab === 'config' ? 'Proyección de Inventario' : 'Órdenes Sugeridas'}
        </h2>
        
        <div className={`${s.btn} ${s.btnSec} ${s.btnSmall}`}>
          <span className={`${s.btn} ${s.btnSec} ${s.btnSmall}`}>
            Inversión Estimada
          </span>
          <div className={`${s.btn} ${s.btnSec} ${s.btnSmall}`}>
            {formatCurrency(presupuestoTotal)}
          </div>
        </div>
      </section>

      {/* --- VISTA 1: ESTRATEGIA (TABLA RESPONSIVA) --- */}
      {subTab === 'config' && (
        <div className={`${s.adminCard} ${s.tableContainer}`}>
          <table className={s.table} style={{ minWidth: '900px' }}>
            <thead className={s.thead}>
              <tr>
                <th className={s.th}>INSUMO</th>
                <th className={s.th}style={{ textAlign: 'center' }}>CONSUMO/DÍA</th>
                <th className={s.th}style={{ textAlign: 'center' }}>COBERTURA</th>
                <th className={s.th}style={{ textAlign: 'center' }}>STOCK HOY</th>
                <th className={s.th}style={{ textAlign: 'center' }}>SUGERENCIA</th>
                <th className={s.th}style={{ textAlign: 'center' }}>COSTO</th>
                <th className={s.th} style={{ textAlign: 'center' }}>AJUSTE</th>
              </tr>
            </thead>
            <tbody>
              {sugerenciasFiltradas.map((item) => (
                <tr key={item.insumo_id}>
                  <td className={s.td} style={{ fontWeight: '700', color: 'var(--color-text-main)' }}>
                    {item.insumo_nombre}
                  </td>
                  <td className={s.td}style={{ textAlign: 'center' }}>
                    {parseFloat(item.consumo_diario_real || 0).toFixed(2)}
                  </td>
                  <td className={s.td}style={{ textAlign: 'center' }}>
                    {editandoId === item.insumo_id && puedeEditar ? (
                      <input 
                        type="number" 
                        className={s.tableInputCenter}
                        style={{ maxWidth: '80px', margin: '0 auto', display: 'block',textAlign: 'center' }}
                        value={tempPolitica.cobertura} 
                        onChange={e => setTempPolitica({...tempPolitica, cobertura: e.target.value})} 
                        onBlur={() => handleSavePolicy(item.insumo_id)}
                        autoFocus
                      />
                    ) : (
                      <span style={{ color: 'var(--color-primary)', fontWeight: '600' }}>
                        {item.dias_cobertura_objetivo} días
                      </span>
                    )}
                  </td>
                  <td className={s.td}style={{ textAlign: 'center' }}>
                    {parseFloat(item.stock_fisico_hoy).toFixed(1)}
                  </td>
                  <td className={s.td}style={{ textAlign: 'center' }}>
                    <span style={{ 
                      color: item.cajas_a_pedir > 0 ? 'var(--color-success)' : 'var(--color-text-muted)', 
                      fontWeight: '600' 
                    }}>
                      {item.cajas_a_pedir} Cajas
                    </span>
                  </td>
                  <td className={s.td} style={{ fontWeight: '600',textAlign: 'center' }}>
                    {formatCurrency(item.presupuesto_estimado)}
                  </td>
                  <td className={s.td} style={{ textAlign: 'right' }}>
                    {/* El botón de editar solo se muestra si tiene permisos */}
                    {puedeEditar && (
                      <button 
                        className={`${s.btn} ${s.btnOutlineEditar} ${s.btnEditar}`} 
                        onClick={() => { 
                          setEditandoId(item.insumo_id); 
                          setTempPolitica({cobertura: item.dias_cobertura_objetivo, seguridad: item.dias_stock_seguridad}) 
                        }}
                      >
                        📝
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- VISTA 2: LISTA DE MANDADO --- */}
      {subTab === 'compras' && (
        <div className={s.cardsGrid}>
          {listaParaComprar.map(ins => (
            <div key={ins.insumo_id} className={`${s.adminCard} ${s.cardFlex}`}>
              <div>
                <strong className={s.cardFlexTitle}>{ins.insumo_nombre}</strong>
                <p className={s.cardFlexSubtitle}>
                  PROVEEDOR: {ins.proveedor_nombre}
                </p>
              </div>
              
              {/* Solo mostramos el botón de compra si tiene permiso de edición/compra */}
              {puedeEditar ? (
                <button 
                  className={`${s.btn} ${s.btnSuccess} ${s.btnFull}`} 
                  onClick={() => confirmarCompra(ins, usuarioId, sucursalId)}
                >
                  ✓ RECIBIR {ins.cajas_a_pedir} CAJAS
                </button>
              ) : (
                <div className={s.readOnlyNotice}>
                  Solo lectura (Requiere permiso de gestión)
                </div>
              )}
            </div>
          ))}
          {listaParaComprar.length === 0 && (
            <div className={s.emptyState} style={{ gridColumn: '1/-1' }}>
              No hay compras sugeridas para los niveles actuales de stock.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EstimacionesTab;