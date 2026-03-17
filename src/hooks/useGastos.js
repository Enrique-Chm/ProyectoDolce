// Archivo: src/hooks/useGastos.js
import { useState, useEffect, useCallback } from 'react';
import { gastosService } from '../services/Gastos.service';
import { sucursalesService } from '../services/Sucursales.service';
import { hasPermission } from '../utils/checkPermiso'; // 🛡️ Blindaje de seguridad

export const useGastos = () => {
  // --- ESTADOS GLOBALES ---
  const [loading, setLoading] = useState(false);
  const [gastos, setGastos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [sucursales, setSucursales] = useState([]);

  // 🛡️ DEFINICIÓN DE FACULTADES (RBAC)
  const puedeVerGastos = hasPermission('ver_gastos');
  const puedeCrearGastos = hasPermission('crear_gastos');
  const puedeEditarGastos = hasPermission('editar_gastos');
  const puedeBorrarGastos = hasPermission('borrar_gastos');

  // --- ESTADO DEL FORMULARIO DE GASTOS ---
  const [editGastoId, setEditGastoId] = useState(null);
  const [gastoFormData, setGastoFormData] = useState({
    sucursal_id: '',
    categoria_id: '',
    monto: '',
    fecha: new Date().toISOString().split('T')[0], // Fecha de hoy por defecto
    descripcion: '',
    metodo_pago: 'Efectivo',
    referencia_comprobante: ''
  });

  // --- ESTADO DEL FORMULARIO DE CATEGORÍAS ---
  const [editCatId, setEditCatId] = useState(null);
  const [catFormData, setCatFormData] = useState({
    nombre: '',
    descripcion: ''
  });

  // --- FUNCIÓN DE CARGA DE DATOS ---
  const cargarDatos = useCallback(async () => {
    // 🛡️ Si no tiene permiso de lectura, bloqueamos la consulta a la base de datos
    if (!puedeVerGastos) return;

    setLoading(true);
    try {
      // 🚀 Promise.all para cargar todo al mismo tiempo y no hacer esperar al usuario
      const [g, c, s] = await Promise.all([
        gastosService.getGastos(),
        gastosService.getCategorias(),
        sucursalesService.getAll() // Requerido para el selector de sucursales
      ]);
      
      setGastos(g);
      setCategorias(c);
      setSucursales(s.data || []);
    } catch (e) {
      console.error("Error al cargar el módulo de finanzas:", e);
    } finally {
      setLoading(false);
    }
  }, [puedeVerGastos]);

  // Cargar al montar el componente
  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);


  // --- HANDLERS PARA GASTOS ---
  const handleSaveGasto = async (e) => {
    e.preventDefault();
    
    // 🛡️ Bloqueo de acción según sea creación o edición
    const permisoRequerido = editGastoId ? puedeEditarGastos : puedeCrearGastos;
    if (!permisoRequerido) {
      return alert(`No tienes permiso para ${editGastoId ? 'editar' : 'registrar'} gastos.`);
    }

    // Validación de campos obligatorios
    if (!gastoFormData.sucursal_id || !gastoFormData.categoria_id) {
      return alert("Por favor selecciona una sucursal y una categoría.");
    }

    setLoading(true);
    try {
      // Convertimos los IDs a números por seguridad y compatibilidad con la DB
      const payload = {
        ...gastoFormData,
        sucursal_id: parseInt(gastoFormData.sucursal_id),
        categoria_id: parseInt(gastoFormData.categoria_id),
        monto: parseFloat(gastoFormData.monto)
      };

      await gastosService.saveGasto(payload, editGastoId);
      resetGastoForm();
      cargarDatos();
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGasto = async (id) => {
    // 🛡️ Bloqueo de acción
    if (!puedeBorrarGastos) {
      return alert("Acceso denegado: No tienes facultad para borrar registros financieros.");
    }

    if (!window.confirm("⚠️ ¿Estás seguro de eliminar este gasto? Esta acción afectará los reportes financieros.")) return;
    
    setLoading(true);
    try {
      await gastosService.deleteGasto(id);
      cargarDatos();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetGastoForm = () => {
    setEditGastoId(null);
    setGastoFormData({
      sucursal_id: '',
      categoria_id: '',
      monto: '',
      fecha: new Date().toISOString().split('T')[0],
      descripcion: '',
      metodo_pago: 'Efectivo',
      referencia_comprobante: ''
    });
  };


  // --- HANDLERS PARA CATEGORÍAS ---
  const handleSaveCategoria = async (e) => {
    e.preventDefault();
    
    // 🛡️ Bloqueo de acción
    if (!puedeEditarGastos) {
      return alert("No tienes permiso para modificar las categorías de gastos.");
    }

    setLoading(true);
    try {
      await gastosService.saveCategoria(catFormData, editCatId);
      setEditCatId(null);
      setCatFormData({ nombre: '', descripcion: '' });
      cargarDatos();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategoria = async (id) => {
    // 🛡️ Bloqueo de acción
    if (!puedeBorrarGastos) {
      return alert("Acceso denegado: No puedes borrar catálogos.");
    }

    if (!window.confirm("¿Eliminar categoría? Asegúrate de que no haya gastos vinculados a ella.")) return;
    
    setLoading(true);
    try {
      await gastosService.deleteCategoria(id);
      cargarDatos();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    // Estados globales
    loading,
    gastos: puedeVerGastos ? gastos : [],
    categorias: puedeVerGastos ? categorias : [],
    sucursales: puedeVerGastos ? sucursales : [],
    
    // Formularios y funciones de Gastos
    gastoFormData, setGastoFormData, 
    editGastoId, setEditGastoId, 
    handleSaveGasto, handleDeleteGasto, resetGastoForm,
    
    // Formularios y funciones de Categorías
    catFormData, setCatFormData, 
    editCatId, setEditCatId, 
    handleSaveCategoria, handleDeleteCategoria,
    
    // 🛡️ Banderas de seguridad para la UI
    puedeVerGastos, puedeCrearGastos, puedeEditarGastos, puedeBorrarGastos,
    
    // Utilidad
    recargar: cargarDatos
  };
};