// Archivo: src/hooks/useEmpleados.js
import { useState, useEffect, useCallback } from 'react';
import { empleadosService } from '../services/empleados.service'; 
import { sucursalesService } from '../services/Sucursales.service'; 
import { hasPermission } from '../utils/checkPermiso'; // 🛡️ Blindaje de seguridad
import toast from 'react-hot-toast'; // 🍞 Feedback visual

export const useEmpleados = () => {
  const [loading, setLoading] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permisos, setPermisos] = useState([]);
  const [sucursales, setSucursales] = useState([]);

  // 🛡️ DEFINICIÓN DE FACULTADES (RBAC) - ESTÁNDAR COMPLETO
  const puedeVerUsuarios = hasPermission('ver_usuarios');
  const puedeCrearUsuarios = hasPermission('crear_usuarios'); 
  const puedeEditarUsuarios = hasPermission('editar_usuarios');
  const puedeBorrarUsuarios = hasPermission('borrar_usuarios'); 
  
  const puedeVerConfig = hasPermission('ver_configuracion');
  const puedeCrearConfig = hasPermission('crear_configuracion'); 
  const puedeEditarConfig = hasPermission('editar_configuracion');
  const puedeBorrarConfig = hasPermission('borrar_configuracion'); 
  
  const puedeVerSucursales = hasPermission('ver_sucursales');
  const puedeCrearSucursales = hasPermission('crear_sucursales'); 
  const puedeEditarSucursales = hasPermission('editar_sucursales');
  const puedeBorrarSucursales = hasPermission('borrar_sucursales'); 

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

  /**
   * Carga masiva de datos respetando las facultades del usuario actual
   */
  const cargarDatos = useCallback(async () => {
    // Si no tiene ningún permiso de lectura, no intentamos cargar nada
    if (!puedeVerUsuarios && !puedeVerConfig && !puedeVerSucursales) return;

    setLoading(true);
    try {
      /**
       * El empleadosService ya está corregido para manejar la base de datos limpia
       * (sin ambigüedades en roles ni cat_sucursales).
       */
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
      toast.error("Error al sincronizar datos del personal.");
    } finally { 
      setLoading(false); 
    }
  }, [puedeVerUsuarios, puedeVerConfig, puedeVerSucursales]);

  useEffect(() => { 
    cargarDatos(); 
  }, [cargarDatos]);

  // --- MÉTODOS DE USUARIOS ---
  const handleSaveUsuario = async (e) => {
    e.preventDefault();
    const tienePermiso = editId ? puedeEditarUsuarios : puedeCrearUsuarios;
    if (!tienePermiso) return toast.error("No tienes permiso para gestionar usuarios.");

    const idToast = toast.loading(editId ? "Actualizando usuario..." : "Registrando usuario...");
    try {
        const payload = { 
          ...formData, 
          rol_id: parseInt(formData.rol_id),
          // Manejo de nulos para sucursal
          sucursal_id: formData.sucursal_id ? parseInt(formData.sucursal_id) : null 
        };

        // El service se encarga de limpiar el payload de objetos anidados antes de guardar
        await empleadosService.saveUsuario(payload, editId);
        
        resetUserForm();
        await cargarDatos();
        toast.success(editId ? "Usuario actualizado" : "Usuario registrado", { id: idToast });
    } catch (error) {
        console.error(error);
        toast.error("Error al procesar usuario: " + error.message, { id: idToast });
    }
  };

  const handleDeleteUsuario = async (id, nombre) => {
    if (!puedeBorrarUsuarios) return toast.error("Acceso denegado para eliminar usuarios.");
    
    if (window.confirm(`¿Estás seguro de eliminar al empleado "${nombre}"?`)) {
      const idToast = toast.loading("Eliminando empleado...");
      try {
        await empleadosService.deleteUsuario(id);
        await cargarDatos();
        toast.success("Empleado eliminado correctamente", { id: idToast });
      } catch (error) {
        toast.error("Error: " + error.message, { id: idToast });
      }
    }
  };

  const resetUserForm = () => {
    setEditId(null);
    setFormData({ nombre: '', rol_id: '', username: '', password_hash: '', pin_seguridad: '', status: 'activo', sucursal_id: '' });
  };

  // --- MÉTODOS DE MATRIZ DE PERMISOS ---
  const seleccionarRol = async (id) => {
    if (!puedeVerConfig) return;
    setRolSeleccionado(id);
    try {
      const activos = await empleadosService.getIdsPermisosPorRol(id);
      setPermisosActivos(activos);
    } catch (error) {
      toast.error("No se pudieron cargar los permisos del rol.");
    }
  };

  const togglePermiso = (permisoId) => {
    if (!permisoId) return;
    if (!puedeEditarConfig) return toast.error("Acceso denegado: No tienes facultades para alterar la matriz.");

    const nuevaLista = permisosActivos.includes(permisoId) 
      ? permisosActivos.filter(id => id !== permisoId) 
      : [...permisosActivos, permisoId];
      
    setPermisosActivos(nuevaLista);
  };

  const guardarMatrizPermisos = async () => {
    if (!rolSeleccionado) return toast.error("Selecciona un rol primero.");
    if (!puedeEditarConfig) return toast.error("Acceso denegado.");

    setLoading(true);
    const idToast = toast.loading("Guardando configuración de permisos...");
    try {
      const res = await empleadosService.actualizarPermisosRol(rolSeleccionado, permisosActivos);
      if (res.success) {
        toast.success("Matriz de permisos actualizada correctamente.", { id: idToast });
      } else {
        toast.error("Error al guardar: " + res.error, { id: idToast });
      }
    } catch (error) {
      console.error(error);
      toast.error("Error crítico al guardar la matriz.", { id: idToast });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRol = async (e) => {
    e.preventDefault();
    const tienePermiso = editRolId ? puedeEditarConfig : puedeCrearConfig;
    if (!tienePermiso) return toast.error("Sin permisos para modificar roles.");

    const idToast = toast.loading("Procesando rol...");
    try {
        await empleadosService.saveRol(rolFormData, editRolId);
        setRolFormData({ nombre_rol: '', descripcion: '' }); 
        setEditRolId(null); 
        setMostrarFormRol(false);
        await cargarDatos();
        toast.success(editRolId ? "Rol actualizado" : "Rol creado con éxito", { id: idToast });
    } catch (error) {
        toast.error("Error al guardar rol", { id: idToast });
    }
  };

  // --- MÉTODOS DE SUCURSALES ---
  const handleSaveSucursal = async (e) => {
    e.preventDefault();
    const tienePermiso = editSucursalId ? puedeEditarSucursales : puedeCrearSucursales;
    if (!tienePermiso) return toast.error("Sin permisos para gestionar sucursales.");

    const idToast = toast.loading("Guardando sucursal...");
    try {
        // 💡 Manejo de errores actualizado para el nuevo Service
        const res = await sucursalesService.save(sucursalFormData, editSucursalId);
        if (res.error) throw res.error;

        setEditSucursalId(null); 
        setSucursalFormData({ nombre: '', direccion: '' });
        await cargarDatos();
        toast.success("Sucursal guardada correctamente", { id: idToast });
    } catch (error) {
        toast.error("Error al guardar sucursal: " + error.message, { id: idToast });
    }
  };

  const handleDeleteSucursal = async (id, nombre) => {
    if (!puedeBorrarSucursales) return toast.error("Acceso denegado.");
    
    if (window.confirm(`¿Estás seguro de eliminar la sucursal "${nombre}"?`)) {
      const idToast = toast.loading("Eliminando sucursal...");
      try {
        const res = await sucursalesService.delete(id);
        if (res.error) throw res.error; 
        await cargarDatos();
        toast.success("Sucursal eliminada", { id: idToast });
      } catch (error) {
        toast.error("Error al eliminar: " + error.message, { id: idToast });
      }
    }
  };

  return {
    loading, 
    usuarios: puedeVerUsuarios ? usuarios : [], 
    roles: puedeVerConfig ? roles : [], 
    permisos: puedeVerConfig ? permisos : [], 
    sucursales: puedeVerSucursales ? sucursales : [],
    
    rolSeleccionado, 
    permisosActivos, 
    seleccionarRol, 
    togglePermiso,
    guardarMatrizPermisos, 
    
    formData, 
    setFormData, 
    editId, 
    setEditId, 
    handleSaveUsuario, 
    handleDeleteUsuario, 
    resetUserForm,

    rolFormData, 
    setRolFormData, 
    mostrarFormRol, 
    setMostrarFormRol, 
    editRolId, 
    setEditRolId, 
    handleSaveRol,

    sucursalFormData, 
    setSucursalFormData, 
    editSucursalId, 
    setEditSucursalId, 
    handleSaveSucursal, 
    handleDeleteSucursal,
    
    // 🛡️ Exportamos todas las facultades para control de UI
    puedeVerUsuarios, puedeCrearUsuarios, puedeEditarUsuarios, puedeBorrarUsuarios,
    puedeVerConfig, puedeCrearConfig, puedeEditarConfig, puedeBorrarConfig,
    puedeVerSucursales, puedeCrearSucursales, puedeEditarSucursales, puedeBorrarSucursales,
    
    recargar: cargarDatos
  };
};