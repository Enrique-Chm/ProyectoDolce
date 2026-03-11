import { useState, useEffect, useCallback } from 'react';
import { empleadosService } from '../services/Empleados.service';
import { sucursalesService } from '../services/Sucursales.service';

export const useEmpleados = () => {
  const [loading, setLoading] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permisos, setPermisos] = useState([]);
  const [sucursales, setSucursales] = useState([]);

  // --- ESTADO USUARIOS (TODOS LOS CAMPOS RESTAURADOS) ---
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    rol_id: '',
    username: '',
    password_hash: '',
    pin_seguridad: '',
    status: 'activo',
    sucursal_id: ''
  });

  // --- ESTADO PERMISOS Y ROLES ---
  const [rolSeleccionado, setRolSeleccionado] = useState(null);
  const [permisosActivos, setPermisosActivos] = useState([]);
  const [mostrarFormRol, setMostrarFormRol] = useState(false);
  const [rolFormData, setRolFormData] = useState({ nombre_rol: '', descripcion: '' });
  const [editRolId, setEditRolId] = useState(null);

  // --- ESTADO SUCURSALES ---
  const [editSucursalId, setEditSucursalId] = useState(null);
  const [sucursalFormData, setSucursalFormData] = useState({ nombre: '', direccion: '' });

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const [u, r, p, s] = await Promise.all([
        empleadosService.getUsuarios(),
        empleadosService.getRoles(),
        empleadosService.getPermisos(),
        sucursalesService.getAll()
      ]);
      setUsuarios(u);
      setRoles(r);
      setPermisos(p);
      setSucursales(s.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const handleSaveUsuario = async (e) => {
    e.preventDefault();
    const payload = { 
      ...formData, 
      rol_id: parseInt(formData.rol_id),
      sucursal_id: formData.sucursal_id ? parseInt(formData.sucursal_id) : null 
    };
    await empleadosService.saveUsuario(payload, editId);
    resetUserForm();
    cargarDatos();
  };

  const resetUserForm = () => {
    setEditId(null);
    setFormData({ nombre: '', rol_id: '', username: '', password_hash: '', pin_seguridad: '', status: 'activo', sucursal_id: '' });
  };

  const seleccionarRol = async (id) => {
    setRolSeleccionado(id);
    const activos = await empleadosService.getIdsPermisosPorRol(id);
    setPermisosActivos(activos);
  };

  const togglePermiso = async (permisoId) => {
    if (!permisoId) return;
    const nuevaLista = permisosActivos.includes(permisoId) ? permisosActivos.filter(id => id !== permisoId) : [...permisosActivos, permisoId];
    setPermisosActivos(nuevaLista);
    await empleadosService.actualizarPermisosRol(rolSeleccionado, nuevaLista);
  };

  const handleSaveRol = async (e) => {
    e.preventDefault();
    await empleadosService.saveRol(rolFormData, editRolId);
    setRolFormData({ nombre_rol: '', descripcion: '' }); setEditRolId(null); setMostrarFormRol(false);
    cargarDatos();
  };

  const handleSaveSucursal = async (e) => {
    e.preventDefault();
    await sucursalesService.save(sucursalFormData, editSucursalId);
    setEditSucursalId(null); setSucursalFormData({ nombre: '', direccion: '' });
    cargarDatos();
  };

  return {
    loading, usuarios, roles, permisos, sucursales,
    rolSeleccionado, permisosActivos, seleccionarRol, togglePermiso,
    formData, setFormData, editId, setEditId, handleSaveUsuario, resetUserForm,
    rolFormData, setRolFormData, mostrarFormRol, setMostrarFormRol, editRolId, setEditRolId, handleSaveRol,
    sucursalFormData, setSucursalFormData, editSucursalId, setEditSucursalId, handleSaveSucursal,
    recargar: cargarDatos
  };
};