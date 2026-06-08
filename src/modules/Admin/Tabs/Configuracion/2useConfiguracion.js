// src/modules/Admin/Tabs/Configuracion/2useConfiguracion.js
import { useState, useCallback } from 'react';
import { ConfiguracionService } from './1Configuracion.Service';
import toast from 'react-hot-toast';

export const useConfiguracion = () => {
  const [loading, setLoading] = useState(false);

  // --- ESTADOS DE DATOS (LISTADOS) ---
  const [sucursales,    setSucursales]    = useState([]);
  const [proveedores,   setProveedores]   = useState([]);
  const [trabajadores,  setTrabajadores]  = useState([]);
  const [unidadesMedida, setUnidadesMedida] = useState([]);
  const [roles,         setRoles]         = useState([]);
  const [categorias,    setCategorias]    = useState([]);
  // CORRECCIÓN P1: Eliminado 'areasUso' — estado muerto que llamaba a
  // ConfiguracionService.getAreasUso() que no existe en el service.

  // Estado unificado para formularios (Selects en cascada o auxiliares)
  // CORRECCIÓN P1: Eliminado 'areas' del estado — siempre era undefined
  const [catalogosSelectores, setCatalogosSelectores] = useState({
    unidades:   [],
    sucursales: [],
    proveedores: [],
    roles:      [],
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
    return data || [];
  }, []);

  const cargarProveedores = useCallback(async () => {
    setLoading(true);
    const { data, error } = await ConfiguracionService.getProveedores();
    setLoading(false);
    if (error) return toast.error('Error al cargar proveedores');
    setProveedores(data || []);
  }, []);

  /**
   * CARGA DE TRABAJADORES:
   * Realiza el cruce de IDs de sucursales con nombres para la visualización en la tabla.
   */
  const cargarTrabajadores = useCallback(async (sucursalesVigentes = []) => {
    setLoading(true);
    const { data, error } = await ConfiguracionService.getTrabajadores();

    if (error) {
      setLoading(false);
      return toast.error('Error al cargar trabajadores');
    }

    const procesados = (data || []).map(t => {
      const ids = t.sucursales_ids || [];
      const nombresSucs = ids
        .map(id => sucursalesVigentes.find(s => s.id === id)?.nombre)
        .filter(Boolean);
      return {
        ...t,
        sucursales_nombres_lista: nombresSucs,
        rol_nombre: t.rol?.nombre || 'Sin Rol'
      };
    });

    setTrabajadores(procesados);
    setLoading(false);
  }, []);

  const cargarUnidadesMedida = useCallback(async () => {
    setLoading(true);
    const { data, error } = await ConfiguracionService.getUnidadesMedida();
    setLoading(false);
    if (error) return toast.error('Error al cargar unidades de medida');
    setUnidadesMedida(data || []);
  }, []);

  // CORRECCIÓN P1: Eliminado cargarAreasUso — llamaba a
  // ConfiguracionService.getAreasUso() que no existe en el service.

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

  /**
   * Sincroniza catálogos para selectores.
   */
  const cargarCatalogosParaFormularios = useCallback(async () => {
    const res = await ConfiguracionService.getCatalogosParaSelectores();

    if (res.error) {
      toast.error('Error al sincronizar catálogos auxiliares');
      return res;
    }

    // CORRECCIÓN P1: Eliminado 'areas' — nunca existió en el service
    setCatalogosSelectores({
      unidades:    res.unidades    || [],
      sucursales:  res.sucursales  || [],
      proveedores: res.proveedores || [],
      roles:       res.roles       || [],
      categorias:  res.categorias  || []
    });

    setRoles(res.roles         || []);
    setSucursales(res.sucursales || []);

    return res;
  }, []);

  /**
   * FUNCIÓN MAESTRA: Carga secuencial para evitar inconsistencias de datos.
   */
  const cargarDatosIniciales = useCallback(async () => {
    setLoading(true);
    const resCatalogos = await cargarCatalogosParaFormularios();
    await cargarTrabajadores(resCatalogos.sucursales || []);
    setLoading(false);
  }, [cargarTrabajadores, cargarCatalogosParaFormularios]);

  // ==========================================
  // MÉTODOS DE GUARDADO (CREATE / UPDATE)
  // ==========================================

  /**
   * Wrapper genérico para operaciones de escritura.
   */
  const guardarDatoGenerico = async (metodo, payload, callbackCarga) => {
    if (loading) return false;
    setLoading(true);
    const { error } = await metodo(payload);
    setLoading(false);

    if (error) {
      let mensajeAmigable = 'No se pudo guardar la información.';
      if (error.code === '23505') mensajeAmigable = 'Error: Registro duplicado.';
      if (error.code === '23503') mensajeAmigable = 'Error: Registro en uso por otra tabla.';
      if (error.code === '23502') mensajeAmigable = 'Error: Campos obligatorios vacíos.';
      if (error.code === '42703') mensajeAmigable = 'Error de estructura: Columna inexistente.';
      toast.error(`${mensajeAmigable}\nDetalle: ${error.message}`, { duration: 5000 });
      return false;
    }

    toast.success('¡Registro actualizado exitosamente!');
    if (callbackCarga) await callbackCarga();
    return true;
  };

  const guardarSucursal   = (data) => guardarDatoGenerico(ConfiguracionService.guardarSucursal,   data, cargarSucursales);
  const guardarProveedor  = (data) => guardarDatoGenerico(ConfiguracionService.guardarProveedor,  data, cargarProveedores);
  const guardarTrabajador = (data) => guardarDatoGenerico(ConfiguracionService.guardarTrabajador, data, cargarDatosIniciales);
  const guardarRol        = (data) => guardarDatoGenerico(ConfiguracionService.guardarRol,        data, cargarRoles);
  const guardarCategoria  = (data) => guardarDatoGenerico(ConfiguracionService.guardarCategoria,  data, cargarCategorias);

  // ==========================================
  // ESTATUS Y BORRADO LÓGICO
  // ==========================================

  const cambiarEstatus = async (tabla, id, estatusActual, callbackCarga) => {
    setLoading(true);
    const nuevoEstatus = (estatusActual === 'Activo' || estatusActual === 'activo') ? 'Inactivo' : 'Activo';
    const { error } = await ConfiguracionService.toggleEstatusGenerico(tabla, id, estatusActual);
    setLoading(false);

    if (error) {
      toast.error('Error al cambiar el estatus.');
      return false;
    }

    toast.success(`Estatus cambiado a: ${nuevoEstatus}`);
    if (callbackCarga) await callbackCarga();
    return true;
  };

  // ==========================================
  // IMPORTACIÓN MASIVA
  // ==========================================

  /**
   * Wrapper genérico para importaciones masivas.
   */
  const importarMasivoGenerico = async (metodo, datos, callbackCarga, nombreEntidad) => {
    if (!Array.isArray(datos) || datos.length === 0) {
      toast.error('Datos de importación inválidos.');
      return false;
    }
    setLoading(true);
    try {
      const { data, error } = await metodo(datos);
      if (error) throw error;
      toast.success(`Sincronización de ${nombreEntidad} completada.`);
      if (callbackCarga) await callbackCarga();
      return true;
    } catch (err) {
      toast.error(`Fallo en importación: ${err.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // CORRECCIÓN P1: Eliminados importarProveedores, importarSucursales
  // e importarCategorias — llamaban a métodos inexistentes en el service
  // (importarProveedoresMasivo, importarSucursalesMasivo, importarCategoriasMasivo).
  // Solo se mantiene importarProductos cuyo método SÍ existe en el service.
  const importarProductos = (datos) =>
    importarMasivoGenerico(
      ConfiguracionService.importarProductosMasivo,
      datos,
      null,
      'productos'
    );

  return {
    loading,
    sucursales,
    proveedores,
    trabajadores,
    unidadesMedida,
    roles,
    categorias,
    catalogosSelectores,
    cargarSucursales,
    cargarProveedores,
    cargarTrabajadores,
    cargarUnidadesMedida,
    cargarRoles,
    cargarCategorias,
    cargarCatalogosParaFormularios,
    cargarDatosIniciales,
    guardarSucursal,
    guardarProveedor,
    guardarTrabajador,
    guardarRol,
    guardarCategoria,
    cambiarEstatus,
    importarProductos
  };
};