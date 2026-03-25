// Archivo: src/hooks/useProveedoresTab.js
import { useState, useEffect, useCallback } from 'react';
import { proveedoresService } from '../services/Proveedores.service';
import { hasPermission } from '../utils/checkPermiso';
import toast from 'react-hot-toast'; 

export const useProveedoresTab = () => { // 👈 Eliminado sucursalId ya que los proveedores son globales
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  
  /**
   * 🛡️ SEGURIDAD INTERNA (RBAC) ESTANDARIZADA
   */
  const puedeVer = hasPermission('ver_proveedores');
  const puedeCrear = hasPermission('crear_proveedores');
  const puedeEditar = hasPermission('editar_proveedores'); 
  const puedeBorrar = hasPermission('borrar_proveedores');

  const [formData, setFormData] = useState({
    nombre_empresa: '',
    contacto_nombre: '',
    telefono: '',
    correo: '',
    dias_credito: 0
  });

  const fetchData = useCallback(async () => {
    // 🛡️ Blindaje de lectura
    if (!puedeVer) return;

    try {
      setLoading(true);
      // 👈 Llamada al servicio sin parámetros de sucursal
      const data = await proveedoresService.getAll(); 
      setProveedores(data);
    } catch (error) {
      console.error("Error al cargar proveedores:", error);
      toast.error("Error al sincronizar el directorio de proveedores.");
    } finally {
      setLoading(false);
    }
  }, [puedeVer]); // 👈 Dependencia limpia

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setEditId(null);
    setFormData({
      nombre_empresa: '',
      contacto_nombre: '',
      telefono: '',
      correo: '',
      dias_credito: 0
    });
  };

  const prepararEdicion = (p) => {
    setEditId(p.id);
    setFormData({
      nombre_empresa: p.nombre_empresa || '',
      contacto_nombre: p.contacto_nombre || '',
      telefono: p.telefono || '',
      correo: p.correo || '',
      dias_credito: p.dias_credito || 0
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    const tienePermiso = editId ? puedeEditar : puedeCrear;
    if (!tienePermiso) {
      return toast.error("Acceso denegado para gestionar proveedores.");
    }

    setLoading(true);
    const guardandoToast = toast.loading(editId ? "Actualizando datos..." : "Registrando proveedor...");

    try {
      // 💡 Payload limpio: sin sucursal_id para evitar errores de columna inexistente
      const payload = { ...formData };

      const { error } = await proveedoresService.save(payload, editId);
      if (error) throw error;
      
      toast.success(editId ? "Proveedor actualizado" : "Proveedor registrado", { id: guardandoToast });
      
      resetForm();
      await fetchData();
    } catch (error) {
      toast.error("Error al procesar: " + error.message, { id: guardandoToast });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, nombre) => {
    if (!puedeBorrar) {
      return toast.error("Acceso denegado: No tienes permiso para borrar proveedores.");
    }

    const borrandoToast = toast.loading(`Eliminando al proveedor "${nombre}"...`);

    try {
      const { error } = await proveedoresService.delete(id);
      if (error) throw error;
      
      toast.success(`Proveedor "${nombre}" eliminado`, { id: borrandoToast });
      await fetchData();
    } catch (error) {
      toast.error("Error al eliminar: " + error.message, { id: borrandoToast });
    }
  };

  return {
    proveedores, loading, editId, formData, setFormData,
    puedeVer, puedeCrear, puedeEditar, puedeBorrar,
    resetForm, prepararEdicion, handleSubmit, handleDelete
  };
};