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
  const [categorias, setCategorias] = useState([]);

  // Estado unificado para formularios (Selects)
  const [catalogosSelectores, setCatalogosSelectores] = useState({
    unidades: [],
    areas: [],
    sucursales: [],
    proveedores: [],
    roles: [],
    categorias: []
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

  // Carga paralela para selectores
  const cargarCatalogosParaFormularios = useCallback(async () => {
    setLoading(true);
    const res = await ConfiguracionService.getCatalogosParaSelectores();
    setLoading(false);
    if (res.error) toast.error('Error al sincronizar catálogos auxiliares');
    
    setCatalogosSelectores({
      unidades: res.unidades || [],
      areas: res.areas || [],
      sucursales: res.sucursales || [],
      proveedores: res.proveedores || [],
      roles: res.roles || [],
      categorias: res.categorias || []
    });
  }, []);

  // ==========================================
  // MÉTODOS DE GUARDADO (CREATE / UPDATE)
  // ==========================================

  const guardarDatoGenerico = async (metodo, payload, callbackCarga) => {
    if (loading) return false;

    setLoading(true);
    const { error } = await metodo(payload);
    setLoading(false);

    if (error) {
      let mensajeAmigable = 'No se pudo guardar la información.';
      
      // Mapeo de códigos de error de Postgres (Supabase)
      if (error.code === '23505') mensajeAmigable = 'Error: Ya existe un registro con ese nombre o identificador único.';
      if (error.code === '23503') mensajeAmigable = 'Error: No se puede eliminar o modificar porque este registro está siendo usado en otra tabla.';
      if (error.code === '23502') mensajeAmigable = 'Error: Faltan campos obligatorios para completar el registro.';
      
      toast.error(`${mensajeAmigable}\nDetalle: ${error.message}`, { duration: 5000 });
      return false;
    }

    toast.success('¡Registro actualizado exitosamente!');
    if (callbackCarga) await callbackCarga(); 
    return true;
  };

  // Alias para componentes
  const guardarSucursal = (data) => guardarDatoGenerico(ConfiguracionService.guardarSucursal, data, cargarSucursales);
  const guardarProveedor = (data) => guardarDatoGenerico(ConfiguracionService.guardarProveedor, data, cargarProveedores);
  const guardarTrabajador = (data) => guardarDatoGenerico(ConfiguracionService.guardarTrabajador, data, cargarTrabajadores);
  const guardarRol = (data) => guardarDatoGenerico(ConfiguracionService.guardarRol, data, cargarRoles);
  const guardarCategoria = (data) => guardarDatoGenerico(ConfiguracionService.guardarCategoria, data, cargarCategorias);

  // ==========================================
  // ESTATUS Y BORRADO LÓGICO
  // ==========================================

  const cambiarEstatus = async (tabla, id, estatusActual, callbackCarga) => {
    setLoading(true);
    // Normalizamos el estatus a minúsculas para coincidir con el trigger SQL
    const nuevoEstatus = (estatusActual === 'activo') ? 'inactivo' : 'activo';
    
    const { error } = await ConfiguracionService.toggleEstatusGenerico(tabla, id, estatusActual);
    setLoading(false);

    if (error) {
      toast.error('Error al cambiar el estatus en el servidor.');
      return false;
    }
    
    toast.success(`Estatus cambiado a: ${nuevoEstatus}`);
    if (callbackCarga) await callbackCarga();
    return true;
  };

  // ==========================================
  // IMPORTACIÓN MASIVA (EXCEL)
  // ==========================================

  const importarMasivoGenerico = async (metodo, datos, callbackCarga, nombreEntidad) => {
    if (!Array.isArray(datos) || datos.length === 0) {
      toast.error('El archivo no contiene datos válidos.');
      return false;
    }

    setLoading(true);
    try {
      const { data, error } = await metodo(datos);
      if (error) throw error;

      toast.success(`¡Sincronización exitosa! Se procesaron ${data?.length || 0} ${nombreEntidad}.`);
      if (callbackCarga) await callbackCarga();
      return true;
    } catch (err) {
      console.error(`Error importando ${nombreEntidad}:`, err);
      toast.error(`Error en la importación: ${err.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const importarProveedores = (datos) => importarMasivoGenerico(ConfiguracionService.importarProveedoresMasivo, datos, cargarProveedores, 'proveedores');
  const importarSucursales = (datos) => importarMasivoGenerico(ConfiguracionService.importarSucursalesMasivo, datos, cargarSucursales, 'sucursales');
  const importarCategorias = (datos) => importarMasivoGenerico(ConfiguracionService.importarCategoriasMasivo, datos, cargarCategorias, 'categorías');
  const importarProductos = (datos) => importarMasivoGenerico(ConfiguracionService.importarProductosMasivo, datos, null, 'productos');

  return {
    loading,
    sucursales,
    proveedores,
    trabajadores,
    unidadesMedida,
    areasUso,
    roles, 
    categorias,
    catalogosSelectores,

    cargarSucursales,
    cargarProveedores,
    cargarTrabajadores,
    cargarUnidadesMedida,
    cargarAreasUso,
    cargarRoles, 
    cargarCategorias,
    cargarCatalogosParaFormularios,

    guardarSucursal,
    guardarProveedor,
    guardarTrabajador,
    guardarRol, 
    guardarCategoria,
    cambiarEstatus,

    importarProveedores,
    importarSucursales,
    importarCategorias,
    importarProductos
  };
};