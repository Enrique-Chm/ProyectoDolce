// Archivo: src/hooks/useProveedoresTab.js
import { useState, useEffect, useCallback } from 'react';
import { proveedoresService } from '../services/Proveedores.service';
import { hasPermission } from '../utils/checkPermiso';
import toast from 'react-hot-toast'; // 👈 Importamos el "Asistente" para notificaciones

export const useProveedoresTab = () => {
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
      const data = await proveedoresService.getAll();
      setProveedores(data);
    } catch (error) {
      console.error("Error al cargar proveedores:", error);
      toast.error("Error al sincronizar el directorio de proveedores."); // 👈 Aviso silencioso de error
    } finally {
      setLoading(false);
    }
  }, [puedeVer]);

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
    e.preventDefault();
    // 🛡️ Validación dinámica de ejecución
    const tienePermiso = editId ? puedeEditar : puedeCrear;
    if (!tienePermiso) {
      return toast.error("Acceso denegado para gestionar proveedores."); // 👈 Toast rojo
    }

    setLoading(true);
    // 👈 Mostramos el Toast de "Cargando"
    const guardandoToast = toast.loading(editId ? "Actualizando datos..." : "Registrando proveedor...");

    try {
      const { error } = await proveedoresService.save(formData, editId);
      if (error) throw error;
      
      // 👈 Si todo sale bien, transformamos el Toast a éxito
      toast.success(editId ? "Proveedor actualizado con éxito" : "Proveedor registrado con éxito", { id: guardandoToast });
      
      resetForm();
      await fetchData();
    } catch (error) {
      // 👈 Si falla, transformamos el Toast a error
      toast.error("Error al procesar la solicitud: " + error.message, { id: guardandoToast });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, nombre) => {
    // 🛡️ Validación de borrado
    if (!puedeBorrar) {
      return toast.error("Acceso denegado: No tienes permiso para borrar proveedores.");
    }

    // 🚀 La confirmación (window.confirm) ya se hace visualmente en ProveedoresTab.jsx con SweetAlert2.
    // Aquí recibimos la orden directa y la ejecutamos mostrando el estado.
    const borrandoToast = toast.loading(`Eliminando al proveedor "${nombre}"...`);

    try {
      const { error } = await proveedoresService.delete(id);
      if (error) throw error;
      
      toast.success(`Proveedor "${nombre}" eliminado correctamente`, { id: borrandoToast });
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