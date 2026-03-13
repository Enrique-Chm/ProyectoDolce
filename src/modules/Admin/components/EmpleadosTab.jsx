// Archivo: src/modules/Admin/components/EmpleadosTab.jsx
import React, { useState } from 'react';
import { useEmpleados } from '../../../hooks/useEmpleados';
import { MATRIZ_MODULOS } from '../../../utils/checkPermiso';
import s from '../AdminPage.module.css';

export const EmpleadosTab = () => {
  const [subTab, setSubTab] = useState('usuarios');
  const emp = useEmpleados();

  const getPermisoId = (clave) => emp.permisos.find(p => p.clave_permiso === clave)?.id;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-text-main)', margin: '0' }}>
        Gestión de Capital Humano
      </h2>

      {/* Navegación de Sub-pestañas Homologada */}
      <nav style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--color-border)', paddingBottom: '15px' }}>
        <button 
          className={`${s.navItem} ${subTab === 'usuarios' ? s.activeNavItem : ''}`} 
          style={{ width: 'auto', padding: '8px 20px' }}
          onClick={() => setSubTab('usuarios')}
        >
          EQUIPO
        </button>
        <button 
          className={`${s.navItem} ${subTab === 'permisos' ? s.activeNavItem : ''}`} 
          style={{ width: 'auto', padding: '8px 20px' }}
          onClick={() => setSubTab('permisos')}
        >
          PERMISOS Y ROLES
        </button>
        <button 
          className={`${s.navItem} ${subTab === 'sucursales' ? s.activeNavItem : ''}`} 
          style={{ width: 'auto', padding: '8px 20px' }}
          onClick={() => setSubTab('sucursales')}
        >
          SUCURSALES
        </button>
      </nav>

      {/* --- SUBTAB: EQUIPO (VISTA ESTÁNDAR 2 COLUMNAS) --- */}
      {subTab === 'usuarios' && (
        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '25px', alignItems: 'start' }}>
          <aside className={s.adminCard} style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '20px', color: 'var(--color-primary)' }}>
              {emp.editId ? '📝 Editar Perfil' : '👤 Nuevo Integrante'}
            </h3>
            <form onSubmit={emp.handleSaveUsuario} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>NOMBRE COMPLETO</label>
                <input 
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)' }}
                  value={emp.formData.nombre} 
                  onChange={e => emp.setFormData({...emp.formData, nombre: e.target.value})} 
                  required 
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>SUCURSAL ASIGNADA</label>
                <select 
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)', backgroundColor: 'white' }}
                  value={emp.formData.sucursal_id} 
                  onChange={e => emp.setFormData({...emp.formData, sucursal_id: e.target.value})} 
                  required
                >
                  <option value="">Seleccionar sucursal...</option>
                  {emp.sucursales.map(suc => <option key={suc.id} value={suc.id}>{suc.nombre}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>USUARIO</label>
                  <input 
                    style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)' }}
                    value={emp.formData.username} 
                    onChange={e => emp.setFormData({...emp.formData, username: e.target.value})} 
                    required 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>ROL</label>
                  <select 
                    style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)', backgroundColor: 'white' }}
                    value={emp.formData.rol_id} 
                    onChange={e => emp.setFormData({...emp.formData, rol_id: e.target.value})} 
                    required
                  >
                    <option value="">Elegir...</option>
                    {emp.roles.map(r => <option key={r.id} value={r.id}>{r.nombre_rol}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>PASSWORD</label>
                  <input 
                    type="password" 
                    style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)' }}
                    value={emp.formData.password_hash} 
                    onChange={e => emp.setFormData({...emp.formData, password_hash: e.target.value})} 
                    required={!emp.editId} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>PIN (4 DÍGITOS)</label>
                  <input 
                    type="number" 
                    style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)' }}
                    value={emp.formData.pin_seguridad} 
                    onChange={e => emp.setFormData({...emp.formData, pin_seguridad: e.target.value})} 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" className={s.btnLogout} style={{ backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', flex: 1 }}>
                  {emp.editId ? 'ACTUALIZAR' : 'REGISTRAR'}
                </button>
                {emp.editId && <button type="button" className={s.btnLogout} onClick={emp.resetUserForm}>CANCELAR</button>}
              </div>
            </form>
          </aside>

          <div className={s.adminCard} style={{ padding: '0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ backgroundColor: 'var(--color-bg-muted)', borderBottom: '1px solid var(--color-border)' }}>
                <tr>
                  <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)' }}>EMPLEADO / SUCURSAL</th>
                  <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)' }}>ROL</th>
                  <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'right' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {emp.usuarios.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--color-bg-muted)' }}>
                    <td style={{ padding: '15px' }}>
                      <div style={{ fontWeight: '800', color: 'var(--color-text-main)' }}>{u.nombre}</div>
                      <small style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>
                        {emp.sucursales.find(s => s.id === u.sucursal_id)?.nombre || 'Sin Sucursal'}
                      </small>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <span style={{ fontSize: '10px', fontWeight: '800', padding: '4px 8px', borderRadius: '4px', backgroundColor: 'var(--color-bg-app)', color: 'var(--color-primary)' }}>
                        {u.roles?.nombre_rol?.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '15px', textAlign: 'right' }}>
                      <button className={s.btnLogout} onClick={() => { emp.setEditId(u.id); emp.setFormData(u); }}>EDITAR</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- SUBTAB: PERMISOS (MATRIZ DE ROLES) --- */}
      {subTab === 'permisos' && (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '25px', alignItems: 'start' }}>
          <aside className={s.adminCard} style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--color-primary)', margin: 0 }}>Roles</h3>
              <button className={s.btnLogout} style={{ padding: '4px 10px' }} onClick={() => emp.setMostrarFormRol(!emp.mostrarFormRol)}>+</button>
            </div>
            
            {emp.mostrarFormRol && (
              <form onSubmit={emp.handleSaveRol} style={{ padding: '15px', background: 'var(--color-bg-app)', borderRadius: 'var(--radius-ui)', marginBottom: '15px' }}>
                <input 
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)', marginBottom: '10px' }}
                  placeholder="Nombre Rol" 
                  onChange={e => emp.setRolFormData({ nombre_rol: e.target.value })} 
                  required 
                />
                <button type="submit" className={s.btnLogout} style={{ width: '100%', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none' }}>GUARDAR ROL</button>
              </form>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {emp.roles.map(r => (
                <div 
                  key={r.id} 
                  style={{ 
                    padding: '12px 15px', 
                    borderRadius: 'var(--radius-ui)', 
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s',
                    backgroundColor: emp.rolSeleccionado === r.id ? 'var(--color-primary)' : 'transparent',
                    color: emp.rolSeleccionado === r.id ? 'white' : 'var(--color-text-muted)'
                  }} 
                  onClick={() => emp.seleccionarRol(r.id)}
                >
                  {r.nombre_rol.toUpperCase()}
                </div>
              ))}
            </div>
          </aside>

          <div className={s.adminCard} style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>Matriz de Facultades</h3>
            </div>
            {!emp.rolSeleccionado ? (
              <p style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-muted)' }}>Selecciona un rol de la izquierda para configurar sus accesos...</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: 'var(--color-bg-muted)', borderBottom: '1px solid var(--color-border)' }}>
                  <tr>
                    <th style={{ padding: '15px', fontSize: '12px' }}>MÓDULO DEL SISTEMA</th>
                    <th style={{ padding: '15px', fontSize: '12px', textAlign: 'center' }}>VER</th>
                    <th style={{ padding: '15px', fontSize: '12px', textAlign: 'center' }}>EDITAR</th>
                    <th style={{ padding: '15px', fontSize: '12px', textAlign: 'center' }}>BORRAR</th>
                  </tr>
                </thead>
                <tbody>
                  {MATRIZ_MODULOS.map(m => (
                    <tr key={m.slug} style={{ borderBottom: '1px solid var(--color-bg-muted)' }}>
                      <td style={{ padding: '15px', fontWeight: '700' }}>{m.label}</td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        <input type="checkbox" checked={emp.permisosActivos.includes(getPermisoId(`ver_${m.slug}`))} onChange={() => emp.togglePermiso(getPermisoId(`ver_${m.slug}`))} />
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        {m.acciones.includes('editar') ? <input type="checkbox" checked={emp.permisosActivos.includes(getPermisoId(`editar_${m.slug}`))} onChange={() => emp.togglePermiso(getPermisoId(`editar_${m.slug}`))} /> : "-"}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        {m.acciones.includes('borrar') ? <input type="checkbox" checked={emp.permisosActivos.includes(getPermisoId('borrar_registros'))} onChange={() => emp.togglePermiso(getPermisoId('borrar_registros'))} /> : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* --- SUBTAB: SUCURSALES (VISTA ESTÁNDAR) --- */}
      {subTab === 'sucursales' && (
        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '25px', alignItems: 'start' }}>
          <aside className={s.adminCard} style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '20px', color: 'var(--color-primary)' }}>
              {emp.editSucursalId ? '📝 Editar Sucursal' : '🏢 Nueva Sucursal'}
            </h3>
            <form onSubmit={emp.handleSaveSucursal} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>NOMBRE</label>
                <input style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)' }} value={emp.sucursalFormData.nombre} onChange={e => emp.setSucursalFormData({ ...emp.sucursalFormData, nombre: e.target.value })} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>DIRECCIÓN</label>
                <input style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)' }} value={emp.sucursalFormData.direccion} onChange={e => emp.setSucursalFormData({ ...emp.sucursalFormData, direccion: e.target.value })} />
              </div>
              <button type="submit" className={s.btnLogout} style={{ backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', width: '100%', marginTop: '10px' }}>GUARDAR SUCURSAL</button>
            </form>
          </aside>
          
          <div className={s.adminCard} style={{ padding: '0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ backgroundColor: 'var(--color-bg-muted)', borderBottom: '1px solid var(--color-border)' }}>
                <tr>
                  <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)' }}>NOMBRE</th>
                  <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)' }}>DIRECCIÓN</th>
                  <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'right' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {emp.sucursales.map(suc => (
                  <tr key={suc.id} style={{ borderBottom: '1px solid var(--color-bg-muted)' }}>
                    <td style={{ padding: '15px' }}><strong>{suc.nombre}</strong></td>
                    <td style={{ padding: '15px' }}>{suc.direccion || 'N/A'}</td>
                    <td style={{ padding: '15px', textAlign: 'right' }}>
                      <button className={s.btnLogout} onClick={() => { emp.setEditSucursalId(suc.id); emp.setSucursalFormData(suc) }}>EDITAR</button>
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