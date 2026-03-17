// Archivo: src/hooks/useEmpleados.js
import { useState, useEffect, useCallback } from 'react';
import { empleadosService } from '../services/Empleados.service';
import { sucursalesService } from '../services/Sucursales.service';
import { hasPermission } from '../utils/checkPermiso'; // 🛡️ Blindaje de seguridad

export const useEmpleados = () => {
  const [loading, setLoading] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permisos, setPermisos] = useState([]);
  const [sucursales, setSucursales] = useState([]);

  // 🛡️ DEFINICIÓN DE FACULTADES (RBAC)
  const puedeVerUsuarios = hasPermission('ver_usuarios');
  const puedeEditarUsuarios = hasPermission('editar_usuarios');
  const puedeVerConfig = hasPermission('ver_configuracion');
  const puedeEditarConfig = hasPermission('editar_configuracion');
  const puedeVerSucursales = hasPermission('ver_sucursales');
  const puedeEditarSucursales = hasPermission('editar_sucursales');

  // --- ESTADO USUARIOS ---
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '', rol_id: '', username: '', password_hash: '', pin_seguridad: '', status: 'activo', sucursal_id: ''
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
    if (!puedeVerUsuarios && !puedeVerConfig && !puedeVerSucursales) return;

    setLoading(true);
    try {
      const [u, r, p, s] = await Promise.all([
        puedeVerUsuarios ? empleadosService.getUsuarios() : [],
        puedeVerConfig ? empleadosService.getRoles() : [],
        puedeVerConfig ? empleadosService.getPermisos() : [],
        puedeVerSucursales ? sucursalesService.getAll() : { data: [] }
      ]);
      
      setUsuarios(u);
      setRoles(r);
      setPermisos(p);
      setSucursales(s.data || []);
    } catch (e) { 
      console.error("Error en carga de datos de empleados:", e); 
    } finally { 
      setLoading(false); 
    }
  }, [puedeVerUsuarios, puedeVerConfig, puedeVerSucursales]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const handleSaveUsuario = async (e) => {
    e.preventDefault();
    if (!puedeEditarUsuarios) return alert("No tienes permiso para gestionar usuarios.");

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
    if (!puedeVerConfig) return;
    setRolSeleccionado(id);
    const activos = await empleadosService.getIdsPermisosPorRol(id);
    setPermisosActivos(activos);
  };

  // 🛠️ MEJORA 1: Ahora solo cambia el estado local (No toca la base de datos)
  const togglePermiso = (permisoId) => {
    if (!permisoId) return;
    if (!puedeEditarConfig) return alert("Acceso denegado: No puedes alterar la matriz de permisos.");

    const nuevaLista = permisosActivos.includes(permisoId) 
      ? permisosActivos.filter(id => id !== permisoId) 
      : [...permisosActivos, permisoId];
      
    setPermisosActivos(nuevaLista);
  };

  // 🛠️ MEJORA 2: Nueva función exclusiva para el botón "Guardar Cambios"
  const guardarMatrizPermisos = async () => {
    if (!rolSeleccionado) return alert("Selecciona un rol primero.");
    if (!puedeEditarConfig) return alert("Acceso denegado: No puedes modificar la matriz.");

    setLoading(true);
    try {
      // Envía la lista final a Supabase en una sola transacción
      const res = await empleadosService.actualizarPermisosRol(rolSeleccionado, permisosActivos);
      if (res.success) {
        alert("✅ Matriz de permisos actualizada correctamente.");
      } else {
        alert("Error al guardar: " + res.error);
      }
    } catch (error) {
      console.error(error);
      alert("Error crítico al guardar la matriz.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRol = async (e) => {
    e.preventDefault();
    if (!puedeEditarConfig) return alert("No tienes permiso para modificar roles.");

    await empleadosService.saveRol(rolFormData, editRolId);
    setRolFormData({ nombre_rol: '', descripcion: '' }); setEditRolId(null); setMostrarFormRol(false);
    cargarDatos();
  };

  const handleSaveSucursal = async (e) => {
    e.preventDefault();
    if (!puedeEditarSucursales) return alert("No tienes permiso para gestionar sucursales.");

    await sucursalesService.save(sucursalFormData, editSucursalId);
    setEditSucursalId(null); setSucursalFormData({ nombre: '', direccion: '' });
    cargarDatos();
  };

  return {
    loading, 
    usuarios: puedeVerUsuarios ? usuarios : [], 
    roles: puedeVerConfig ? roles : [], 
    permisos: puedeVerConfig ? permisos : [], 
    sucursales: puedeVerSucursales ? sucursales : [],
    
    rolSeleccionado, permisosActivos, seleccionarRol, togglePermiso,
    guardarMatrizPermisos, // 🛠️ Exportamos la nueva función
    
    formData, setFormData, editId, setEditId, handleSaveUsuario, resetUserForm,
    rolFormData, setRolFormData, mostrarFormRol, setMostrarFormRol, editRolId, setEditRolId, handleSaveRol,
    sucursalFormData, setSucursalFormData, editSucursalId, setEditSucursalId, handleSaveSucursal,
    
    puedeVerUsuarios, puedeEditarUsuarios, puedeVerConfig, puedeEditarConfig, puedeVerSucursales, puedeEditarSucursales,
    recargar: cargarDatos
  };
};