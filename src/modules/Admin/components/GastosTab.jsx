// Archivo: src/modules/Admin/components/GastosTab.jsx
import React, { useState } from 'react';
import { useGastos } from '../../../hooks/useGastos';
import s from '../AdminPage.module.css';

export const GastosTab = () => {
  const g = useGastos();
  const [subTab, setSubTab] = useState('gastos');

  // 🛡️ Si no tiene permiso ni de ver, mostramos un mensaje de bloqueo limpio
  if (!g.puedeVerGastos) {
    return (
      <div className={s.adminCard} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
        <h3>Acceso Restringido</h3>
        <p>No tienes los permisos necesarios para ver el módulo financiero.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className={s.pageHeader}>
        <h2 className={s.pageTitle}>Finanzas: Gastos Operativos (OPEX)</h2>
      </div>

      {/* Navegación de Sub-pestañas */}
      <nav style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--color-border)', paddingBottom: '15px' }}>
        <button 
          className={`${s.navItem} ${subTab === 'gastos' ? s.activeNavItem : ''}`} 
          style={{ width: 'auto', padding: '8px 20px', whiteSpace: 'nowrap' }}
          onClick={() => setSubTab('gastos')}
        >
          REGISTRO DE GASTOS
        </button>
        <button 
          className={`${s.navItem} ${subTab === 'categorias' ? s.activeNavItem : ''}`} 
          style={{ width: 'auto', padding: '8px 20px', whiteSpace: 'nowrap' }}
          onClick={() => setSubTab('categorias')}
        >
          CATEGORÍAS
        </button>
      </nav>

      {/* --- SUBTAB: GASTOS --- */}
      {subTab === 'gastos' && (
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          
          {/* 📝 Formulario: Solo visible si tiene permiso de crear o editar */}
          {(g.puedeCrearGastos || g.puedeEditarGastos) && (
            <aside className={s.adminCard} style={{ padding: '20px', width: '100%', maxWidth: '350px', boxSizing: 'border-box' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '20px', color: 'var(--color-primary)' }}>
                {g.editGastoId ? '📝 Editar Gasto' : '💸 Registrar Salida'}
              </h3>
              
              <form onSubmit={g.handleSaveGasto} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>FECHA</label>
                    <input 
                      type="date" 
                      style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)', boxSizing: 'border-box' }} 
                      value={g.gastoFormData.fecha} 
                      onChange={e => g.setGastoFormData({...g.gastoFormData, fecha: e.target.value})} 
                      required 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>MONTO ($)</label>
                    <input 
                      type="number" step="0.01" 
                      style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)', boxSizing: 'border-box' }} 
                      value={g.gastoFormData.monto} 
                      onChange={e => g.setGastoFormData({...g.gastoFormData, monto: e.target.value})} 
                      required 
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>SUCURSAL</label>
                  <select 
                    style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)', boxSizing: 'border-box' }} 
                    value={g.gastoFormData.sucursal_id} 
                    onChange={e => g.setGastoFormData({...g.gastoFormData, sucursal_id: e.target.value})} 
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {g.sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>CATEGORÍA</label>
                  <select 
                    style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)', boxSizing: 'border-box' }} 
                    value={g.gastoFormData.categoria_id} 
                    onChange={e => g.setGastoFormData({...g.gastoFormData, categoria_id: e.target.value})} 
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {g.categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>CONCEPTO / DESCRIPCIÓN</label>
                  <input 
                    style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)', boxSizing: 'border-box' }} 
                    value={g.gastoFormData.descripcion} 
                    onChange={e => g.setGastoFormData({...g.gastoFormData, descripcion: e.target.value})} 
                    placeholder="Ej. Pago de luz CFE" 
                    required 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>MÉTODO DE PAGO</label>
                    <select 
                      style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)', boxSizing: 'border-box' }} 
                      value={g.gastoFormData.metodo_pago} 
                      onChange={e => g.setGastoFormData({...g.gastoFormData, metodo_pago: e.target.value})}
                    >
                      <option value="Efectivo">Efectivo</option>
                      <option value="Transferencia">Transferencia</option>
                      <option value="Tarjeta">Tarjeta</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>FOLIO / REF.</label>
                    <input 
                      style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)', boxSizing: 'border-box' }} 
                      value={g.gastoFormData.referencia_comprobante} 
                      onChange={e => g.setGastoFormData({...g.gastoFormData, referencia_comprobante: e.target.value})} 
                      placeholder="Opcional" 
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button type="submit" className={s.btnLogout} style={{ backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', flex: 1, padding: '12px' }}>
                    {g.editGastoId ? 'ACTUALIZAR' : 'GUARDAR GASTO'}
                  </button>
                  {g.editGastoId && (
                    <button type="button" className={s.btnLogout} onClick={g.resetGastoForm} style={{ padding: '12px' }}>CANCELAR</button>
                  )}
                </div>
              </form>
            </aside>
          )}

          {/* 📊 Tabla de Gastos */}
          <div className={s.adminCard} style={{ padding: '0', overflowX: 'auto', flex: 1, minWidth: '500px' }}>
            {g.loading ? (
              <p style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Cargando información...</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: 'var(--color-bg-muted)', borderBottom: '1px solid var(--color-border)' }}>
                  <tr>
                    <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)' }}>FECHA</th>
                    <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)' }}>CONCEPTO</th>
                    <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)' }}>CATEGORÍA</th>
                    <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)' }}>MONTO</th>
                    <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'right' }}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {g.gastos.length === 0 ? (
                    <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No hay gastos registrados.</td></tr>
                  ) : g.gastos.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--color-bg-muted)' }}>
                      <td style={{ padding: '15px', fontSize: '13px' }}>{item.fecha}</td>
                      <td style={{ padding: '15px' }}>
                        <div style={{ fontWeight: '800', color: 'var(--color-text-main)', fontSize: '14px' }}>{item.descripcion}</div>
                        <small style={{ color: 'var(--color-text-muted)' }}>
                          {item.cat_sucursales?.nombre} • {item.metodo_pago} {item.referencia_comprobante ? `(#${item.referencia_comprobante})` : ''}
                        </small>
                      </td>
                      <td style={{ padding: '15px' }}>
                        <span style={{ padding: '4px 8px', backgroundColor: 'var(--color-bg-app)', color: 'var(--color-primary)', borderRadius: '4px', fontSize: '11px', fontWeight: '800' }}>
                          {item.categorias_gastos?.nombre || 'Sin categoría'}
                        </span>
                      </td>
                      <td style={{ padding: '15px', fontWeight: '800', color: 'var(--color-danger)' }}>
                        ${parseFloat(item.monto).toFixed(2)}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'right' }}>
                        {g.puedeEditarGastos && (
                          <button className={s.btnLogout} style={{ marginRight: '8px', padding: '6px 12px' }} onClick={() => { g.setEditGastoId(item.id); g.setGastoFormData(item); }}>
                            EDITAR
                          </button>
                        )}
                        {g.puedeBorrarGastos && (
                          <button className={s.btnLogout} style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)', padding: '6px 12px' }} onClick={() => g.handleDeleteGasto(item.id)}>
                            BORRAR
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* --- SUBTAB: CATEGORÍAS --- */}
      {subTab === 'categorias' && (
         <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          
          {/* Formulario de Categorías */}
          {g.puedeEditarGastos && (
            <aside className={s.adminCard} style={{ padding: '20px', width: '100%', maxWidth: '300px', boxSizing: 'border-box' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '20px', color: 'var(--color-primary)' }}>
                {g.editCatId ? '📝 Editar Categoría' : '🏷️ Nueva Categoría'}
              </h3>
              <form onSubmit={g.handleSaveCategoria} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>NOMBRE</label>
                  <input 
                    style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)', boxSizing: 'border-box' }} 
                    placeholder="Ej. Nómina" 
                    value={g.catFormData.nombre} 
                    onChange={e => g.setCatFormData({...g.catFormData, nombre: e.target.value})} 
                    required 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>DESCRIPCIÓN</label>
                  <input 
                    style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)', boxSizing: 'border-box' }} 
                    placeholder="Opcional" 
                    value={g.catFormData.descripcion} 
                    onChange={e => g.setCatFormData({...g.catFormData, descripcion: e.target.value})} 
                  />
                </div>
                <button type="submit" className={s.btnLogout} style={{ backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', padding: '12px' }}>
                  {g.editCatId ? 'ACTUALIZAR' : 'GUARDAR CATEGORÍA'}
                </button>
              </form>
            </aside>
          )}
          
          {/* Tabla de Categorías */}
          <div className={s.adminCard} style={{ padding: '0', overflowX: 'auto', flex: 1, minWidth: '400px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
               <thead style={{ backgroundColor: 'var(--color-bg-muted)', borderBottom: '1px solid var(--color-border)' }}>
                 <tr>
                   <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)' }}>NOMBRE DE CATEGORÍA</th>
                   <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)' }}>DESCRIPCIÓN</th>
                   <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'right' }}>ACCIONES</th>
                 </tr>
               </thead>
               <tbody>
                 {g.categorias.length === 0 ? (
                    <tr><td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No hay categorías registradas.</td></tr>
                 ) : g.categorias.map(c => (
                   <tr key={c.id} style={{ borderBottom: '1px solid var(--color-bg-muted)' }}>
                     <td style={{ padding: '15px', fontWeight: '800', color: 'var(--color-text-main)' }}>{c.nombre}</td>
                     <td style={{ padding: '15px', fontSize: '13px', color: 'var(--color-text-muted)' }}>{c.descripcion || '-'}</td>
                     <td style={{ padding: '15px', textAlign: 'right' }}>
                       {g.puedeEditarGastos && (
                         <button className={s.btnLogout} style={{ marginRight: '8px', padding: '6px 12px' }} onClick={() => { g.setEditCatId(c.id); g.setCatFormData(c); }}>
                           EDITAR
                         </button>
                       )}
                       {g.puedeBorrarGastos && (
                         <button className={s.btnLogout} style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)', padding: '6px 12px' }} onClick={() => g.handleDeleteCategoria(c.id)}>
                           BORRAR
                         </button>
                       )}
                     </td>
                   </tr>
                 ))}
               </tbody>
            </table>
          </div>
         </div>
      )}
    </div>
  );
};