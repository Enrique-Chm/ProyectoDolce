// Archivo: src/hooks/useInventarios.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { inventarioService } from '../services/inventario.service';
import { hasPermission } from '../utils/checkPermiso'; // 🛡️ Blindaje de seguridad
import toast from 'react-hot-toast'; // 🍞 Feedback visual

export const useInventarios = (sucursalId) => {
  const [insumos, setInsumos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [motivosCatalogo, setMotivosCatalogo] = useState([]);
  const [contrasteData, setContrasteData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🛡️ DEFINICIÓN DE FACULTADES ESTANDARIZADAS
  const puedeVer = hasPermission('ver_inventario');
  const puedeCrear = hasPermission('crear_inventario');
  const puedeEditar = hasPermission('editar_inventario');
  const puedeBorrar = hasPermission('borrar_inventario');

  // --- ESTADOS DE UI ---
  const [searchTerm, setSearchTerm] = useState('');
  const [conteos, setConteos] = useState({}); // Lo que se escribe en los inputs
  const [auditados, setAuditados] = useState([]); // Memoria de filas auditadas
  const [filtroAuditoria, setFiltroAuditoria] = useState('todos'); // Filtro de tabla

  /**
   * Carga inicial de datos de inventario enriquecidos con stock en vivo
   */
  const cargarDatos = useCallback(async () => {
    if (!sucursalId) return;
    
    // 🛡️ BLINDAJE: Si no tiene permiso de lectura, cancelamos la carga
    if (!puedeVer) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const hoy = new Date().toISOString().split('T')[0];
      
      // Lanzamos peticiones en paralelo para optimizar velocidad
      // El service ya está corregido para manejar joins cat_categoria_insumos y cat_unidades_medida
      const [dataInsumos, dataMotivos, responseEnVivo] = await Promise.all([
        inventarioService.getInsumos(sucursalId),
        inventarioService.getMotivos(),
        inventarioService.calcularContraste(sucursalId, hoy, hoy)
      ]);

      // Verificamos si hubo error en el objeto de respuesta del motor de contraste
      if (responseEnVivo.error) throw new Error(responseEnVivo.error);

      const insumosEnriquecidos = (dataInsumos || []).map(insumo => {
        // Buscamos el stock esperado calculado por el motor de contraste para hoy
        // Se busca por ID para mayor precisión
        const datosHoy = responseEnVivo.data?.find(d => d.id === insumo.id);
        
        return {
          ...insumo,
          stock_fisico: insumo.caja_master, 
          // Si no hay datos de hoy (compras/ventas), el stock estimado es igual al actual de DB
          stock_estimado: datosHoy ? parseFloat(datosHoy.stock_esperado) : parseFloat(insumo.caja_master) 
        };
      });

      setInsumos(insumosEnriquecidos);
      setMotivosCatalogo(dataMotivos || []);
    } catch (err) {
      console.error("Error en cargarDatos:", err);
      const msg = "Fallo al sincronizar con el catálogo de inventarios.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [sucursalId, puedeVer]);

  const cargarMovimientos = useCallback(async () => {
    if (!sucursalId || !puedeVer) return; 
    try {
      const data = await inventarioService.getMovimientos(sucursalId);
      setMovimientos(data || []);
    } catch (err) {
      console.error("Error al cargar movimientos:", err);
    }
  }, [sucursalId, puedeVer]);

  // --- FILTROS DE DATOS CON MEMOIZACIÓN ---
  const insumosFiltrados = useMemo(() => {
    if (!puedeVer) return [];
    
    const term = searchTerm.toLowerCase().trim();
    if (!term) return insumos;
    return insumos.filter(i => 
      (i.nombre?.toLowerCase() || '').includes(term) || 
      (i.categoria?.toLowerCase() || '').includes(term)
    );
  }, [insumos, searchTerm, puedeVer]);

  const contrasteDataFiltrado = useMemo(() => {
    if (!puedeVer) return [];

    return contrasteData.filter(row => {
      if (filtroAuditoria === 'todos') return true;
      if (filtroAuditoria === 'auditados') return auditados.includes(row.id);
      if (filtroAuditoria === 'pendientes') return !auditados.includes(row.id);
      return true;
    });
  }, [contrasteData, filtroAuditoria, auditados, puedeVer]);

  // --- LÓGICA DE NEGOCIO: REGISTRO MANUAL DE KARDEX ---
  const procesarNuevoMovimiento = async (nuevoMov, insumoSeleccionado, usuarioId) => {
    if (!puedeCrear) {
        toast.error("Acceso denegado: No tienes permiso para registrar movimientos.");
        return { success: false };
    }
    if (!insumoSeleccionado) {
        toast.error("Selecciona un insumo de la lista.");
        return { success: false };
    }
    
    const stockAntes = Number(insumoSeleccionado.stock_fisico);
    const cantidadAfectada = Number(nuevoMov.cantidad);
    const factor = nuevoMov.tipo === 'ENTRADA' ? 1 : -1;
    const stockDespues = stockAntes + (cantidadAfectada * factor);

    // Validación de seguridad para evitar stocks negativos
    if (stockDespues < 0) {
      const msg = `Stock insuficiente. Tienes ${stockAntes} ${insumoSeleccionado.unidad}.`;
      toast.error(msg);
      return { success: false, error: msg };
    }

    const tId = toast.loading("Procesando movimiento de almacén...");
    setLoading(true);
    try {
      const { success, error: err } = await inventarioService.crearMovimiento({
        insumo_id: insumoSeleccionado.id,
        tipo: nuevoMov.tipo,
        cantidad_afectada: cantidadAfectada,
        stock_antes: stockAntes,
        stock_despues: stockDespues,
        motivo: nuevoMov.motivo,
        usuario_id: usuarioId,
        sucursal_id: sucursalId,
        created_at: new Date().toISOString()
      });

      if (!success) throw new Error(err);

      await Promise.all([cargarDatos(), cargarMovimientos()]);
      toast.success("Movimiento registrado correctamente", { id: tId });
      return { success: true };
    } catch (err) {
      toast.error("Error: " + err.message, { id: tId });
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Genera el reporte de contraste para un rango de fechas
   */
  const generarContraste = useCallback(async (fechaInicio, fechaFin) => {
    if (!sucursalId || !fechaInicio || !fechaFin) return;
    
    if (!puedeVer) {
      toast.error("Acceso denegado a reportes de auditoría.");
      return;
    }

    const tId = toast.loading("Calculando inventario estimado vs real...");
    setLoading(true);
    setAuditados([]); 
    setFiltroAuditoria('todos');
    
    try {
      const response = await inventarioService.calcularContraste(sucursalId, fechaInicio, fechaFin);
      if (response.error) throw new Error(response.error);
      
      setContrasteData(response.data || []);
      toast.success("Reporte de contraste generado", { id: tId });
    } catch (err) {
      console.error("Error al generar contraste:", err);
      toast.error("No se pudo generar el reporte.", { id: tId });
      setError("No se pudo generar el reporte de auditoría.");
    } finally {
      setLoading(false);
    }
  }, [sucursalId, puedeVer]);

  /**
   * Aplica un ajuste de auditoría (ajuste de stock físico real)
   */
  const guardarConteoFisico = async (filaAuditoria, conteoFisico, usuarioId, fechaInicio, fechaFin) => {
    if (!puedeEditar) {
        toast.error("Acceso denegado: Se requiere permiso para auditar.");
        return { success: false };
    }

    // El 0 es un valor válido para conteo, por eso validamos contra vacío/NaN
    if (conteoFisico === '' || conteoFisico === null || isNaN(conteoFisico)) {
        toast.error("Ingresa un conteo físico válido.");
        return { success: false };
    }

    const tId = toast.loading(`Auditando ${filaAuditoria.insumo}...`);
    setLoading(true);
    try {
      const params = {
        sucursal_id: sucursalId,
        insumo_id: filaAuditoria.id,
        stock_esperado: parseFloat(filaAuditoria.stock_esperado), 
        conteo_fisico: Number(conteoFisico),
        usuario_id: usuarioId
      };

      const { success, error: err } = await inventarioService.aplicarAuditoriaInsumo(params);
      if (!success) throw new Error(err);

      // Limpiamos el input local de ese insumo
      setConteos(prev => ({ ...prev, [filaAuditoria.id]: '' }));
      
      // Marcamos como auditado en la vista actual (para pintar la fila)
      if (!auditados.includes(filaAuditoria.id)) {
        setAuditados(prev => [...prev, filaAuditoria.id]);
      }

      // Refrescamos toda la data para asegurar consistencia tras el ajuste
      await Promise.all([
        cargarDatos(),
        cargarMovimientos(),
        generarContraste(fechaInicio, fechaFin)
      ]);

      toast.success("Ajuste de inventario aplicado", { id: tId });
      return { success: true };
    } catch (err) {
      console.error("Error al guardar conteo:", err);
      toast.error("Error al auditar: " + err.message, { id: tId });
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const actualizarConteo = (id, valor) => setConteos(prev => ({ ...prev, [id]: valor }));

  // Efecto de carga inicial al montar el componente o cambiar sucursal
  useEffect(() => {
    if (sucursalId) {
      cargarDatos();
      cargarMovimientos();
    }
  }, [sucursalId, cargarDatos, cargarMovimientos]);

  return {
    // Datos blindados de salida
    insumos: puedeVer ? insumos : [],               
    insumosFiltrados,     
    movimientos: puedeVer ? movimientos : [],
    motivosCatalogo: puedeVer ? motivosCatalogo : [],
    contrasteData: puedeVer ? contrasteData : [],
    contrasteDataFiltrado,
    
    // Estados de UI y control
    searchTerm, setSearchTerm,
    conteos, actualizarConteo,
    auditados,
    filtroAuditoria, setFiltroAuditoria,
    loading,
    error,
    
    // Acciones blindadas
    procesarNuevoMovimiento,
    generarContraste,
    guardarConteoFisico,

    // 🛡️ Flags de seguridad para el JSX
    puedeVer,
    puedeCrear,
    puedeEditar,
    puedeBorrar
  };
};