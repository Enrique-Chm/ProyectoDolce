import React, { useState, useEffect } from 'react';
import { empleadosService } from '../../../services/Empleados.service';
import { sucursalesService } from '../../../services/Sucursales.service'; // Servicio de sucursales
import s from '../AdminPage.module.css';
import { hasPermission } from '../../../utils/checkPermiso';

export const EmpleadosTab = () => {
  const [subTab, setSubTab] = useState('usuarios'); // usuarios | permisos | sucursales
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permisos, setPermisos] = useState([]);
  const [sucursales, setSucursales] = useState([]); // Nuevo estado
  const [rolSeleccionado, setRolSeleccionado] = useState(null);
  const [permisosActivos, setPermisosActivos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);

  // Estados para Formulario de Sucursal
  const [sNombre, setSNombre] = useState('');
  const [sDireccion, setSDireccion] = useState('');
  const [sEditId, setSEditId] = useState(null);

  const [formData, setFormData] = useState({
    nombre: '', rol_id: '', username: '', password_hash: '', pin_seguridad: '', status: 'activo', sucursal_id: ''
  });

  const puedeEditar = hasPermission('ver_empleados');
  const puedeBorrar = hasPermission('borrar_registros');

  const matrizConfig = [
    { label: 'Unidades', ver: 'ver_unidades', editar: null, borrar: 'borrar_registros' },
    { label: 'Categorías', ver: 'ver_categorias', editar: null, borrar: 'borrar_registros' },
    { label: 'Sucursales', ver: 'ver_sucursales', editar: null, borrar: 'borrar_registros' },
    { label: 'Proveedores', ver: 'ver_proveedores', editar: null, borrar: 'borrar_registros' },
    { label: 'Insumos', ver: 'ver_insumos', editar: 'editar_insumos', borrar: 'borrar_registros' },
    { label: 'Recetas', ver: 'ver_recetas', editar: 'editar_recetas', borrar: 'borrar_registros' },
    { label: 'Productos', ver: 'ver_productos', editar: 'editar_productos', borrar: 'borrar_registros' },
    { label: 'Empleados', ver: 'ver_empleados', editar: null, borrar: 'borrar_registros' },
  ];

  useEffect(() => { cargarDatos(); }, [subTab]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [u, r, p, sRes] = await Promise.all([
        empleadosService.getUsuarios(),
        empleadosService.getRoles(),
        empleadosService.getPermisos(),
        sucursalesService.getAll()
      ]);
      setUsuarios(u);
      setRoles(r);
      setPermisos(p);
      setSucursales(sRes.data || []);
    } catch (error) { 
      console.error("Error al cargar datos:", error); 
    } finally { 
      setLoading(false); 
    }
  };

  const getPermisoId = (clave) => permisos.find(p => p.clave_permiso === clave)?.id;

  // Lógica de Usuarios
  const handleSubmitUsuario = async (e) => {
    e.preventDefault();
    if (!puedeEditar) return;
    try {
      const payload = {
        ...formData, 
        rol_id: parseInt(formData.rol_id),
        sucursal_id: formData.sucursal_id ? parseInt(formData.sucursal_id) : null
      };
      await empleadosService.saveUsuario(payload, editId);
      resetForm();
      cargarDatos();
    } catch (error) { alert("Error al guardar usuario"); }
  };

  // Lógica de Sucursales (Nueva)
  const handleSubmitSucursal = async (e) => {
    e.preventDefault();
    if (!puedeEditar) return;
    const { error } = await sucursalesService.save({ nombre: sNombre, direccion: sDireccion }, sEditId);
    if (!error) {
      setSEditId(null); setSNombre(''); setSDireccion('');
      cargarDatos();
    }
  };

  const seleccionarRol = async (id) => {
    setRolSeleccionado(id);
    const activos = await empleadosService.getIdsPermisosPorRol(id);
    setPermisosActivos(activos);
  };

  const togglePermiso = async (permisoId) => {
    if (!permisoId || !puedeEditar) return;
    const nuevaLista = permisosActivos.includes(permisoId)
      ? permisosActivos.filter(id => id !== permisoId)
      : [...permisosActivos, permisoId];
    setPermisosActivos(nuevaLista);
    await empleadosService.actualizarPermisosRol(rolSeleccionado, nuevaLista);
  };

  const resetForm = () => {
    setEditId(null);
    setFormData({ nombre: '', rol_id: '', username: '', password_hash: '', pin_seguridad: '', status: 'activo', sucursal_id: '' });
  };

  return (
    <div className={s.pageWrapper} style={{ padding: '1rem' }}>
      <h2 className={s.sectionTitle}>Panel de Control de Personal</h2>

      <nav className={s.subNav}>
        <button className={`${s.subBtn} ${subTab === 'usuarios' ? s.subBtnActive : ''}`} onClick={() => setSubTab('usuarios')}>EQUIPO</button>
        <button className={`${s.subBtn} ${subTab === 'permisos' ? s.subBtnActive : ''}`} onClick={() => setSubTab('permisos')}>PERMISOS</button>
        <button className={`${s.subBtn} ${subTab === 'sucursales' ? s.subBtnActive : ''}`} onClick={() => setSubTab('sucursales')}>SUCURSALES</button>
      </nav>

      {/* VISTA: USUARIOS */}
      {subTab === 'usuarios' && (
        <div className={s.container}>
          <aside className={s.card}>
            <div className={s.cardHeader}><h3 className={s.cardTitle}>{editId ? 'Editar Perfil' : 'Nuevo Integrante'}</h3></div>
            <form className={s.cardBody} onSubmit={handleSubmitUsuario}>
              <div className={s.formGroup}>
                <label className={s.label}>Nombre Completo</label>
                <input className={s.input} value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} required readOnly={!puedeEditar} />
              </div>
              <div className={s.formGroup}>
                <label className={s.label}>Asignar Sucursal</label>
                <select className={s.input} value={formData.sucursal_id} onChange={e => setFormData({...formData, sucursal_id: e.target.value})} required disabled={!puedeEditar}>
                  <option value="">Elegir sucursal...</option>
                  {sucursales.map(suc => <option key={suc.id} value={suc.id}>{suc.nombre}</option>)}
                </select>
              </div>
              <div className={s.grid2}>
                <div className={s.formGroup}>
                  <label className={s.label}>Usuario</label>
                  <input className={s.input} value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required readOnly={!puedeEditar} />
                </div>
                <div className={s.formGroup}>
                  <label className={s.label}>Rol</label>
                  <select className={s.input} value={formData.rol_id} onChange={e => setFormData({...formData, rol_id: e.target.value})} required disabled={!puedeEditar}>
                    <option value="">Rol...</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.nombre_rol}</option>)}
                  </select>
                </div>
              </div>
              <div className={s.grid2}>
                <div className={s.formGroup}><label className={s.label}>Password</label>
                  <input type="password" className={s.input} value={formData.password_hash} onChange={e => setFormData({...formData, password_hash: e.target.value})} required={!editId} readOnly={!puedeEditar} />
                </div>
                <div className={s.formGroup}><label className={s.label}>PIN</label>
                  <input type="number" className={s.input} value={formData.pin_seguridad} onChange={e => setFormData({...formData, pin_seguridad: e.target.value})} readOnly={!puedeEditar} />
                </div>
              </div>
              {puedeEditar && <button type="submit" className={s.btnPrimary}>{editId ? 'Actualizar' : 'Registrar'}</button>}
            </form>
          </aside>
          <div className={s.tableWrapper}>
            <table className={s.table}>
              <thead><tr><th>Empleado / Sucursal</th><th>Rol</th><th>Acciones</th></tr></thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{fontWeight: '800'}}>{u.nombre}</div>
                      <small style={{color: '#005696', fontWeight: 'bold'}}>{sucursales.find(s => s.id === u.sucursal_id)?.nombre || 'Sin Sucursal'}</small>
                    </td>
                    <td><span className={s.sectionBadge}>{u.roles?.nombre_rol}</span></td>
                    <td style={{textAlign:'right'}}>
                      <button className={s.btnEdit} onClick={() => { setEditId(u.id); setFormData(u); }}>EDITAR</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VISTA: SUCURSALES (NUEVA) */}
      {subTab === 'sucursales' && (
        <div className={s.container}>
          <aside className={s.card}>
            <div className={s.cardHeader}><h3 className={s.cardTitle}>{sEditId ? 'Editar' : 'Nueva'} Sucursal</h3></div>
            <form className={s.cardBody} onSubmit={handleSubmitSucursal}>
              <div className={s.formGroup}>
                <label className={s.label}>Nombre</label>
                <input className={s.input} value={sNombre} onChange={e => setSNombre(e.target.value)} required />
              </div>
              <div className={s.formGroup}>
                <label className={s.label}>Dirección</label>
                <input className={s.input} value={sDireccion} onChange={e => setSDireccion(e.target.value)} />
              </div>
              <button type="submit" className={s.btnPrimary}>Guardar Sucursal</button>
            </form>
          </aside>
          <div className={s.tableWrapper}>
            <table className={s.table}>
              <thead><tr><th>Nombre</th><th>Ubicación</th><th style={{textAlign:'right'}}>Acciones</th></tr></thead>
              <tbody>
                {sucursales.map(suc => (
                  <tr key={suc.id}>
                    <td><strong>{suc.nombre}</strong></td>
                    <td>{suc.direccion}</td>
                    <td style={{textAlign:'right'}}>
                      <button className={s.btnEdit} onClick={() => {setSEditId(suc.id); setSNombre(suc.nombre); setSDireccion(suc.direccion);}}>EDITAR</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VISTA: PERMISOS (Mantenemos tu lógica igual) */}
      {subTab === 'permisos' && (
        <div className={s.container} style={{ gridTemplateColumns: '320px 1fr' }}>
          <aside className={s.card}>
            <div className={s.cardHeader}><h3 className={s.cardTitle}>1. Seleccionar Rol</h3></div>
            <div className={s.cardBody} style={{ padding: '15px' }}>
              {roles.map(r => (
                <div key={r.id} className={`${s.roleSelectorItem} ${rolSeleccionado === r.id ? s.roleSelectorActive : ''}`} onClick={() => seleccionarRol(r.id)}>
                  <div style={{fontWeight: '900', fontSize: '14px'}}>{r.nombre_rol.toUpperCase()}</div>
                </div>
              ))}
            </div>
          </aside>
          <div className={s.card}>
            <div className={s.cardHeader}><h3 className={s.cardTitle}>2. Matriz de Facultades Operativas</h3></div>
            <div className={s.cardBody} style={{ padding: '0' }}>
              {!rolSeleccionado ? (
                <div style={{textAlign: 'center', padding: '4rem', color: '#94a3b8'}}>Selecciona un rol...</div>
              ) : (
                <div className={s.permTableContainer}>
                  <table className={s.permTable}>
                    <thead><tr><th>Módulo</th><th>Ver</th><th>Editar</th><th>Borrar</th></tr></thead>
                    <tbody>
                      {matrizConfig.map((row) => (
                        <tr key={row.label}>
                          <td>{row.label}</td>
                          <td><input type="checkbox" checked={permisosActivos.includes(getPermisoId(row.ver))} onChange={() => togglePermiso(getPermisoId(row.ver))} /></td>
                          <td>{row.editar && <input type="checkbox" checked={permisosActivos.includes(getPermisoId(row.editar))} onChange={() => togglePermiso(getPermisoId(row.editar))} />}</td>
                          <td><input type="checkbox" checked={permisosActivos.includes(getPermisoId(row.borrar))} onChange={() => togglePermiso(getPermisoId(row.borrar))} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};