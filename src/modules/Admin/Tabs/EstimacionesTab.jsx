// Archivo: src/modules/Admin/Tabs/EstimacionesTab.jsx
import React, { useState, useMemo } from 'react';
import { useEstimacionesTab } from "../../../hooks/useEstimacionesTab"; 
import s from "../../../assets/styles/EstilosGenerales.module.css";
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

  // Estado para el filtro de búsqueda por texto
  const [filtroBuscar, setFiltroBuscar] = useState("");

  const listaParaComprar = useMemo(() => {
    return sugerenciasFiltradas.filter(item => {
      const matchTexto = !filtroBuscar || item.insumo_nombre?.toLowerCase().includes(filtroBuscar.toLowerCase());
      return item.cajas_a_pedir > 0 && !compradosIds.includes(item.insumo_id) && matchTexto;
    });
  }, [sugerenciasFiltradas, compradosIds, filtroBuscar]);

  const handleSavePolicy = async (id) => {
    // Bloqueo de seguridad en función
    if (!puedeEditar) return;
    const res = await guardarPolitica(id, tempPolitica.cobertura, tempPolitica.seguridad);
    if (res.success) setEditandoId(null);
  };

  // Filtrado local para la tabla
  const proyeccionesMostradas = sugerenciasFiltradas.filter((item) => {
    if (!filtroBuscar) return true;
    return item.insumo_nombre?.toLowerCase().includes(filtroBuscar.toLowerCase());
  });

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
            <span className={s.badgeDanger} style={{ borderRadius: '50%', padding: '4px 8px' }}>
              {listaParaComprar.length}
            </span>
          )}
        </button>
      </nav>

      {/* HEADER CON PRESUPUESTO: Ajustado para que se apile en móviles/tablets (Responsivo) */}
      <section style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 className={s.pageTitle} style={{ margin: 0, fontSize: '1.2rem' }}>
          {subTab === 'config' ? 'Proyección de Inventario' : 'Órdenes Sugeridas'}
        </h2>
        
        {/* Contenedor del Presupuesto (Mantiene su diseño pero se acomoda solo) */}
        <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-ui)', padding: '5px 15px', boxShadow: 'var(--shadow-sm)' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginRight: '10px' }}>
            Inversión Estimada
          </span>
          <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--color-primary)' }}>
            {formatCurrency(presupuestoTotal)}
          </div>
        </div>
      </section>

      {/* --- VISTA 1: ESTRATEGIA (TABLA RESPONSIVA) --- */}
      {subTab === 'config' && (
        <div className={`${s.adminCard} ${s.tableContainer}`}>
          
          {/* Controles de Filtro para la Tabla */}
          <div style={{ padding: "15px", borderBottom: "1px solid var(--color-border)", display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <input
              type="text"
              className={s.inputField}
              placeholder="Buscar por nombre de insumo..."
              value={filtroBuscar}
              onChange={(e) => setFiltroBuscar(e.target.value)}
              style={{ flex: "1 1 200px" }}
            />
            <select
              className={s.inputField}
              value={filtroProveedor || ""}
              onChange={(e) => setFiltroProveedor(e.target.value)}
              style={{ flex: "1 1 200px" }}
            >
              <option value="">Todos los proveedores</option>
              {proveedores?.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre_empresa}</option>
              ))}
            </select>
          </div>

          {/* Se elimina minWidth en la tabla para que .tableContainer maneje el scroll lateral */}
          <table className={s.table}>
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
              {proyeccionesMostradas.length === 0 ? (
                 <tr>
                   <td colSpan="7" className={s.emptyState} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>
                     {sugerenciasFiltradas.length === 0 
                       ? "No hay proyecciones generadas." 
                       : "No se encontraron resultados para su búsqueda."}
                   </td>
                 </tr>
              ) : (
                proyeccionesMostradas.map((item) => (
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
                          className={s.inputField} // Homologado con clases del sistema
                          style={{ maxWidth: '80px', margin: '0 auto', display: 'block',textAlign: 'center', padding: '6px' }}
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
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                           <button 
                             className={`${s.btn} ${s.btnOutlineEditar} ${s.btnEditar}`} 
                             onClick={() => { 
                               setEditandoId(item.insumo_id); 
                               setTempPolitica({cobertura: item.dias_cobertura_objetivo, seguridad: item.dias_stock_seguridad}) 
                             }}
                           >
                             📝
                           </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* --- VISTA 2: LISTA DE MANDADO (Cuadrícula CSS Grid Responsiva) --- */}
      {subTab === 'compras' && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '20px' 
        }}>
          {/* Se añade el input de búsqueda arriba del grid de compras también */}
          <div style={{ gridColumn: '1/-1', padding: "0 0 10px 0" }}>
            <input
              type="text"
              className={s.inputField}
              placeholder="Filtrar lista de mandado..."
              value={filtroBuscar}
              onChange={(e) => setFiltroBuscar(e.target.value)}
            />
          </div>

          {listaParaComprar.map(ins => (
            <div key={ins.insumo_id} className={s.adminCard} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '15px' }}>
              <div>
                <strong style={{ fontSize: '1.1rem', color: 'var(--color-text-main)', display: 'block', marginBottom: '5px' }}>{ins.insumo_nombre}</strong>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0 }}>
                  <span style={{ fontWeight: 'bold' }}>PROVEEDOR:</span> {ins.proveedor_nombre}
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
                <div style={{ fontSize: '11px', color: 'var(--color-warning)', fontWeight: 'bold', textAlign: 'center', padding: '10px', background: 'var(--color-bg-muted)', borderRadius: '6px' }}>
                  Solo lectura (Requiere permiso de gestión)
                </div>
              )}
            </div>
          ))}
          {listaParaComprar.length === 0 && (
            <div className={s.emptyState} style={{ gridColumn: '1/-1' }}>
              {filtroBuscar 
                ? "No se encontraron insumos para comprar con esa búsqueda."
                : "No hay compras sugeridas para los niveles actuales de stock."}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EstimacionesTab;