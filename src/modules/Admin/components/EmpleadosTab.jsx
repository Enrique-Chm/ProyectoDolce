import React, { useState } from 'react';
import { useEmpleados } from '../../../hooks/useEmpleados';
import { MATRIZ_MODULOS } from '../../../utils/checkPermiso';
import s from '../AdminPage.module.css';

export const EmpleadosTab = () => {
  const [subTab, setSubTab] = useState('usuarios');
  const emp = useEmpleados();

  const getPermisoId = (clave) => emp.permisos.find(p => p.clave_permiso === clave)?.id;

  return (
    <div className={s.pageWrapper} style={{ padding: '1rem' }}>
      <nav className={s.subNav}>
        <button className={subTab === 'usuarios' ? s.subBtnActive : s.subBtn} onClick={() => setSubTab('usuarios')}>EQUIPO</button>
        <button className={subTab === 'permisos' ? s.subBtnActive : s.subBtn} onClick={() => setSubTab('permisos')}>PERMISOS</button>
        <button className={subTab === 'sucursales' ? s.subBtnActive : s.subBtn} onClick={() => setSubTab('sucursales')}>SUCURSALES</button>
      </nav>

      {/* --- SUBTAB: EQUIPO (TODOS LOS CAMPOS RESTAURADOS) --- */}
      {subTab === 'usuarios' && (
        <div className={s.container}>
          <aside className={s.card}>
            <div className={s.cardHeader}><h3 className={s.cardTitle}>{emp.editId ? '📝 Editar Perfil' : '👤 Nuevo Integrante'}</h3></div>
            <form className={s.cardBody} onSubmit={emp.handleSaveUsuario}>
              <div className={s.formGroup}>
                <label className={s.label}>Nombre Completo</label>
                <input className={s.input} value={emp.formData.nombre} onChange={e => emp.setFormData({...emp.formData, nombre: e.target.value})} required />
              </div>
              <div className={s.formGroup}>
                <label className={s.label}>Sucursal Asignada</label>
                <select className={s.input} value={emp.formData.sucursal_id} onChange={e => emp.setFormData({...emp.formData, sucursal_id: e.target.value})} required>
                  <option value="">Seleccionar sucursal...</option>
                  {emp.sucursales.map(suc => <option key={suc.id} value={suc.id}>{suc.nombre}</option>)}
                </select>
              </div>
              <div className={s.grid2}>
                <div className={s.formGroup}>
                  <label className={s.label}>Nombre de Usuario</label>
                  <input className={s.input} value={emp.formData.username} onChange={e => emp.setFormData({...emp.formData, username: e.target.value})} required />
                </div>
                <div className={s.formGroup}>
                  <label className={s.label}>Rol</label>
                  <select className={s.input} value={emp.formData.rol_id} onChange={e => emp.setFormData({...emp.formData, rol_id: e.target.value})} required>
                    <option value="">Elegir...</option>
                    {emp.roles.map(r => <option key={r.id} value={r.id}>{r.nombre_rol}</option>)}
                  </select>
                </div>
              </div>
              <div className={s.grid2}>
                <div className={s.formGroup}>
                  <label className={s.label}>Password</label>
                  <input type="password" className={s.input} value={emp.formData.password_hash} onChange={e => emp.setFormData({...emp.formData, password_hash: e.target.value})} required={!emp.editId} />
                </div>
                <div className={s.formGroup}>
                  <label className={s.label}>PIN (4 dígitos)</label>
                  <input type="number" className={s.input} value={emp.formData.pin_seguridad} onChange={e => emp.setFormData({...emp.formData, pin_seguridad: e.target.value})} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className={s.btnPrimary}>{emp.editId ? 'Actualizar' : 'Registrar'}</button>
                {emp.editId && <button type="button" className={s.btnEdit} onClick={emp.resetUserForm}>Cancelar</button>}
              </div>
            </form>
          </aside>
          <div className={s.tableWrapper}>
            <table className={s.table}>
              <thead><tr><th>Empleado / Sucursal</th><th>Rol</th><th>Acciones</th></tr></thead>
              <tbody>{emp.usuarios.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ fontWeight: '800' }}>{u.nombre}</div>
                    <small style={{ color: '#005696', fontWeight: 'bold' }}>{emp.sucursales.find(s => s.id === u.sucursal_id)?.nombre || 'Sin Sucursal'}</small>
                  </td>
                  <td><span className={s.sectionBadge}>{u.roles?.nombre_rol}</span></td>
                  <td><button className={s.btnEdit} onClick={() => { emp.setEditId(u.id); emp.setFormData(u); }}>EDITAR</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- SUBTAB: PERMISOS (MATRIZ DINÁMICA) --- */}
      {subTab === 'permisos' && (
        <div className={s.container} style={{ gridTemplateColumns: '320px 1fr' }}>
          <aside className={s.card}>
            <div className={s.cardHeader} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <h3 className={s.cardTitle}>Roles</h3>
              <button className={s.btnEdit} onClick={() => emp.setMostrarFormRol(!emp.mostrarFormRol)}>+</button>
            </div>
            <div className={s.cardBody}>
              {emp.mostrarFormRol && (
                <form onSubmit={emp.handleSaveRol} style={{ padding: '10px', background: '#f8fafc', borderRadius: '8px', marginBottom: '10px' }}>
                  <input className={s.input} placeholder="Nombre Rol" onChange={e => emp.setRolFormData({ nombre_rol: e.target.value })} required />
                  <button type="submit" className={s.btnPrimary} style={{ width: '100%', marginTop: '5px' }}>GUARDAR</button>
                </form>
              )}
              {emp.roles.map(r => (
                <div key={r.id} className={`${s.roleSelectorItem} ${emp.rolSeleccionado === r.id ? s.roleSelectorActive : ''}`} onClick={() => emp.seleccionarRol(r.id)}>
                  {r.nombre_rol.toUpperCase()}
                </div>
              ))}
            </div>
          </aside>
          <div className={s.card}>
            <div className={s.cardHeader}><h3 className={s.cardTitle}>Matriz de Facultades</h3></div>
            <div className={s.cardBody}>
              {!emp.rolSeleccionado ? <p style={{ textAlign: 'center', padding: '40px' }}>Selecciona un rol...</p> : (
                <div className={s.tableWrapper}>
                  <table className={s.table}>
                    <thead><tr><th>Módulo</th><th>Ver</th><th>Editar</th><th>Borrar</th></tr></thead>
                    <tbody>{MATRIZ_MODULOS.map(m => (
                      <tr key={m.slug}>
                        <td style={{ fontWeight: '700' }}>{m.label}</td>
                        <td><input type="checkbox" checked={emp.permisosActivos.includes(getPermisoId(`ver_${m.slug}`))} onChange={() => emp.togglePermiso(getPermisoId(`ver_${m.slug}`))} /></td>
                        <td>{m.acciones.includes('editar') ? <input type="checkbox" checked={emp.permisosActivos.includes(getPermisoId(`editar_${m.slug}`))} onChange={() => emp.togglePermiso(getPermisoId(`editar_${m.slug}`))} /> : "-"}</td>
                        <td>{m.acciones.includes('borrar') ? <input type="checkbox" checked={emp.permisosActivos.includes(getPermisoId('borrar_registros'))} onChange={() => emp.togglePermiso(getPermisoId('borrar_registros'))} /> : "-"}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- SUBTAB: SUCURSALES --- */}
      {subTab === 'sucursales' && (
        <div className={s.container}>
          <aside className={s.card}>
            <div className={s.cardHeader}><h3 className={s.cardTitle}>{emp.editSucursalId ? 'Editar' : 'Nueva'} Sucursal</h3></div>
            <form className={s.cardBody} onSubmit={emp.handleSaveSucursal}>
              <div className={s.formGroup}><label className={s.label}>Nombre</label><input className={s.input} value={emp.sucursalFormData.nombre} onChange={e => emp.setSucursalFormData({ ...emp.sucursalFormData, nombre: e.target.value })} required /></div>
              <div className={s.formGroup}><label className={s.label}>Dirección</label><input className={s.input} value={emp.sucursalFormData.direccion} onChange={e => emp.setSucursalFormData({ ...emp.sucursalFormData, direccion: e.target.value })} /></div>
              <button type="submit" className={s.btnPrimary} style={{ width: '100%' }}>Guardar Sucursal</button>
            </form>
          </aside>
          <div className={s.tableWrapper}>
            <table className={s.table}>
              <thead><tr><th>Nombre</th><th>Dirección</th><th>Acciones</th></tr></thead>
              <tbody>{emp.sucursales.map(suc => (
                <tr key={suc.id}><td><strong>{suc.nombre}</strong></td><td>{suc.direccion}</td><td><button className={s.btnEdit} onClick={() => { emp.setEditSucursalId(suc.id); emp.setSucursalFormData(suc) }}>EDITAR</button></td></tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};