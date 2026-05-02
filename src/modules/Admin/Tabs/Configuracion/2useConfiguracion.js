// src/modules/Admin/Tabs/Configuracion/2useConfiguracion.js
import { useState, useCallback } from 'react';
import { ConfiguracionService } from './1Configuracion.Service';
import toast from 'react-hot-toast';

export const useConfiguracion = () => {
  const [loading, setLoading] = useState(false);
  
  // --- ESTADOS DE DATOS ---
  const [sucursales, setSucursales] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);
  const [unidadesMedida, setUnidadesMedida] = useState([]);
  const [areasUso, setAreasUso] = useState([]);
  const [roles, setRoles] = useState([]); 
  const [categorias, setCategorias] = useState([]); // Agregado para el manejo de categorías

  // Estado para selectores en formularios (unificado para Productos/Trabajadores)
  const [catalogosSelectores, setCatalogosSelectores] = useState({
    unidades: [],
    areas: [],
    sucursales: [],
    proveedores: [],
    roles: [],
    categorias: [] // Agregado para el manejo de categorías
  });

  // ==========================================
  // MÉTODOS DE CARGA (READ)
  // ==========================================

  const cargarSucursales = useCallback(async () => {
    setLoading(true);
    const { data, error } = await ConfiguracionService.getSucursales();
    setLoading(false);
    if (error) return toast.error('Error al cargar sucursales');
    setSucursales(data || []);
  }, []);

  const cargarProveedores = useCallback(async () => {
    setLoading(true);
    const { data, error } = await ConfiguracionService.getProveedores();
    setLoading(false);
    if (error) return toast.error('Error al cargar proveedores');
    setProveedores(data || []);
  }, []);

  const cargarTrabajadores = useCallback(async () => {
    setLoading(true);
    const { data, error } = await ConfiguracionService.getTrabajadores();
    setLoading(false);
    if (error) return toast.error('Error al cargar trabajadores');
    setTrabajadores(data || []);
  }, []);

  const cargarUnidadesMedida = useCallback(async () => {
    setLoading(true);
    const { data, error } = await ConfiguracionService.getUnidadesMedida();
    setLoading(false);
    if (error) return toast.error('Error al cargar unidades de medida');
    setUnidadesMedida(data || []);
  }, []);

  const cargarAreasUso = useCallback(async () => {
    setLoading(true);
    const { data, error } = await ConfiguracionService.getAreasUso();
    setLoading(false);
    if (error) return toast.error('Error al cargar áreas de uso');
    setAreasUso(data || []);
  }, []);

  const cargarRoles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await ConfiguracionService.getRoles();
    setLoading(false);
    if (error) return toast.error('Error al cargar roles');
    setRoles(data || []);
  }, []);

  const cargarCategorias = useCallback(async () => {
    setLoading(true);
    const { data, error } = await ConfiguracionService.getCategorias();
    setLoading(false);
    if (error) return toast.error('Error al cargar categorías');
    setCategorias(data || []);
  }, []);

  // Carga masiva para dropdowns (optimiza peticiones en formularios)
  const cargarCatalogosParaFormularios = useCallback(async () => {
    setLoading(true);
    const res = await ConfiguracionService.getCatalogosParaSelectores();
    setLoading(false);
    if (res.error) toast.error('Error al sincronizar catálogos auxiliares');
    setCatalogosSelectores({
      unidades: res.unidades,
      areas: res.areas,
      sucursales: res.sucursales,
      proveedores: res.proveedores,
      roles: res.roles,
      categorias: res.categorias // Asignamos las categorías obtenidas del servicio
    });
  }, []);

  // ==========================================
  // MÉTODOS DE GUARDADO (CREATE / UPDATE)
  // ==========================================

  /**
   * Procesa el guardado de cualquier catálogo
   */
  const guardarDatoGenerico = async (metodo, payload, callbackCarga) => {
    if (loading) return false;

    setLoading(true);
    const { error } = await metodo(payload);
    setLoading(false);

    if (error) {
      let mensajeAmigable = 'No se pudo guardar la información.';
      
      // Manejo de errores específicos de PostgreSQL / Supabase
      if (error.code === '23505') mensajeAmigable = 'Error: Ya existe un registro con esos datos (duplicado).';
      if (error.code === '23503') mensajeAmigable = 'Error: Referencia inválida (el rol o sucursal no existe).';
      if (error.code === '23502') mensajeAmigable = 'Error: Faltan campos obligatorios.';
      if (error.code === '42703') mensajeAmigable = `Error Técnico: Columna no encontrada.`;
      
      toast.error(`${mensajeAmigable}\nDetalle: ${error.message}`, {
        duration: 6000,
        style: { borderLeft: '5px solid #ba1a1a' }
      });
      
      console.error("Error completo de guardado:", error);
      return false;
    }

    toast.success('¡Registro guardado exitosamente!');
    if (callbackCarga) await callbackCarga(); 
    return true;
  };

  // Alias para uso simplificado en los componentes .jsx
  const guardarSucursal = (data) => 
    guardarDatoGenerico(ConfiguracionService.guardarSucursal, data, cargarSucursales);
    
  const guardarProveedor = (data) => 
    guardarDatoGenerico(ConfiguracionService.guardarProveedor, data, cargarProveedores);
    
  const guardarTrabajador = (data) => 
    guardarDatoGenerico(ConfiguracionService.guardarTrabajador, data, cargarTrabajadores);

  const guardarRol = (data) => 
    guardarDatoGenerico(ConfiguracionService.guardarRol, data, cargarRoles);

  const guardarCategoria = (data) => 
    guardarDatoGenerico(ConfiguracionService.guardarCategoria, data, cargarCategorias);

  // ==========================================
  // MÉTODOS DE ESTATUS (TOGGLE ACTIVO/INACTIVO)
  // ==========================================

  const cambiarEstatus = async (tabla, id, estatusActual, callbackCarga) => {
    setLoading(true);
    const { error } = await ConfiguracionService.toggleEstatusGenerico(tabla, id, estatusActual);
    setLoading(false);

    if (error) {
      toast.error('No se pudo actualizar el estatus');
      console.error(`Error en toggleEstatus (${tabla}):`, error);
      return false;
    }
    
    toast.success('Estatus actualizado correctamente');
    if (callbackCarga) await callbackCarga();
    return true;
  };

  return {
    // Estados expuestos
    loading,
    sucursales,
    proveedores,
    trabajadores,
    unidadesMedida,
    areasUso,
    roles, 
    categorias, // Expuesto para componentes consumidores
    catalogosSelectores,

    // Métodos de carga expuestos
    cargarSucursales,
    cargarProveedores,
    cargarTrabajadores,
    cargarUnidadesMedida,
    cargarAreasUso,
    cargarRoles, 
    cargarCategorias, // Expuesto para cargar categorías individuales
    cargarCatalogosParaFormularios,

    // Métodos de acción expuestos
    guardarSucursal,
    guardarProveedor,
    guardarTrabajador,
    guardarRol, 
    guardarCategoria, // Expuesto para guardar categorías individuales
    cambiarEstatus
  };
};