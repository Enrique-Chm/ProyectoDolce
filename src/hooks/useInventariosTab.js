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

  // 🛡️ DEFINICIÓN DE FACULTADES ESTANDARIZADAS (RBAC)
  const puedeVer = hasPermission('ver_inventario');
  const puedeCrear = hasPermission('crear_inventario');
  const puedeEditar = hasPermission('editar_inventario');
  const puedeBorrar = hasPermission('borrar_inventario');

  // --- ESTADOS DE UI ---
  const [searchTerm, setSearchTerm] = useState('');
  const [conteos, setConteos] = useState({}); // Memoria temporal de inputs de auditoría
  const [auditados, setAuditados] = useState([]); // IDs de filas procesadas en la sesión actual
  const [filtroAuditoria, setFiltroAuditoria] = useState('todos'); // Filtro visual de la tabla de contraste

  /**
   * Carga inicial de datos de inventario enriquecidos con stock en vivo.
   * Se sincroniza con el motor de contraste para mostrar stock_estimado.
   */
  const cargarDatos = useCallback(async () => {
    if (!sucursalId) return;
    
    // 🛡️ BLINDAJE: Verificación de lectura
    if (!puedeVer) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const hoy = new Date().toISOString().split('T')[0];
      
      /**
       * 💡 OPTIMIZACIÓN:
       * El service ya resuelve las relaciones fk_insumo_unidad y fk_insumo_categoria.
       */
      const [dataInsumos, dataMotivos, responseEnVivo] = await Promise.all([
        inventarioService.getInsumos(sucursalId),
        inventarioService.getMotivos(),
        inventarioService.calcularContraste(sucursalId, hoy, hoy)
      ]);

      if (responseEnVivo?.error) throw new Error(responseEnVivo.error);

      // Mapeo para inyectar el cálculo teórico de stock al catálogo base
      const insumosEnriquecidos = (dataInsumos || []).map(insumo => {
        const datosHoy = responseEnVivo?.data?.find(d => d.id === insumo.id);
        
        // 💡 CORRECCIÓN CRÍTICA: Ahora consumimos cantidad_actual entregado por el Service
        const stockRealFisico = insumo.cantidad_actual ?? 0;
        
        return {
          ...insumo,
          stock_fisico: parseFloat(stockRealFisico), 
          // El stock estimado considera ventas/compras del día hasta el momento
          stock_estimado: datosHoy ? parseFloat(datosHoy.stock_esperado) : parseFloat(stockRealFisico) 
        };
      });

      setInsumos(insumosEnriquecidos);
      setMotivosCatalogo(dataMotivos || []);
    } catch (err) {
      console.error("Error en cargarDatos de inventario:", err);
      const msg = "Error al sincronizar con el catálogo de inventarios.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [sucursalId, puedeVer]);

  /**
   * Carga el historial de movimientos (Kardex) de la sucursal actual
   */
  const cargarMovimientos = useCallback(async () => {
    if (!sucursalId || !puedeVer) return; 
    try {
      const data = await inventarioService.getMovimientos(sucursalId);
      setMovimientos(data || []);
    } catch (err) {
      console.error("Error al cargar historial de movimientos:", err);
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
        toast.error("Debes seleccionar un insumo de la lista.");
        return { success: false };
    }
    
    const stockAntes = Number(insumoSeleccionado.stock_fisico);
    const cantidadAfectada = Number(nuevoMov.cantidad);
    const factor = nuevoMov.tipo === 'ENTRADA' ? 1 : -1;
    const stockDespues = stockAntes + (cantidadAfectada * factor);

    // 🛡️ REGLA DE NEGOCIO: Evitar inventario negativo
    if (stockDespues < 0) {
      const msg = `Operación inválida: Stock insuficiente (${stockAntes} ${insumoSeleccionado.unidad} disponibles).`;
      toast.error(msg);
      return { success: false, error: msg };
    }

    const tId = toast.loading("Actualizando almacén...");
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

      // Recarga de datos para refrescar UI
      await Promise.all([cargarDatos(), cargarMovimientos()]);
      toast.success("Movimiento aplicado correctamente", { id: tId });
      return { success: true };
    } catch (err) {
      toast.error("Error: " + err.message, { id: tId });
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Genera el reporte de contraste para auditoría en un rango de fechas.
   */
  const generarContraste = useCallback(async (fechaInicio, fechaFin) => {
    if (!sucursalId || !fechaInicio || !fechaFin) return;
    
    if (!puedeVer) {
      toast.error("Acceso denegado a reportes de contraste.");
      return;
    }

    const tId = toast.loading("Generando contraste de inventarios...");
    setLoading(true);
    setAuditados([]); 
    setFiltroAuditoria('todos');
    
    try {
      const response = await inventarioService.calcularContraste(sucursalId, fechaInicio, fechaFin);
      if (response.error) throw new Error(response.error);
      
      setContrasteData(response.data || []);
      toast.success("Reporte generado", { id: tId });
    } catch (err) {
      console.error("Error al generar reporte de contraste:", err);
      toast.error("Error al procesar el reporte.", { id: tId });
      setError("Fallo en el cálculo de auditoría.");
    } finally {
      setLoading(false);
    }
  }, [sucursalId, puedeVer]);

  /**
   * Aplica un ajuste de auditoría tras un conteo físico manual (Un solo insumo).
   */
  const guardarConteoFisico = async (filaAuditoria, conteoFisico, usuarioId, fechaInicio, fechaFin) => {
    if (!puedeEditar) {
        toast.error("Acceso denegado: Se requiere facultad de edición.");
        return { success: false };
    }

    if (conteoFisico === '' || conteoFisico === null || isNaN(conteoFisico)) {
        toast.error("Ingresa un valor numérico para el conteo físico.");
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

      // Limpieza de input tras éxito
      setConteos(prev => ({ ...prev, [filaAuditoria.id]: '' }));
      
      // Registro de fila procesada para feedback visual
      if (!auditados.includes(filaAuditoria.id)) {
        setAuditados(prev => [...prev, filaAuditoria.id]);
      }

      // Sincronización total tras el ajuste
      await Promise.all([
        cargarDatos(),
        cargarMovimientos(),
        generarContraste(fechaInicio, fechaFin)
      ]);

      toast.success("Ajuste de auditoría aplicado", { id: tId });
      return { success: true };
    } catch (err) {
      console.error("Error al procesar auditoría física:", err);
      toast.error("Error: " + err.message, { id: tId });
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * 💡 NUEVO: Ejecuta el cierre masivo de múltiples insumos contados
   */
  const guardarAuditoriaMasiva = async (usuarioId, fechaInicio, fechaFin) => {
    if (!puedeEditar) {
        toast.error("Acceso denegado: Se requiere facultad de edición.");
        return { success: false };
    }

    // 1. Extraemos solo los insumos que el usuario realmente contó (que no estén vacíos)
    // y que no hayan sido auditados ya.
    const insumosAProcesar = contrasteData.filter(row => {
      const valor = conteos[row.id];
      return valor !== undefined && valor !== '' && !auditados.includes(row.id);
    });

    if (insumosAProcesar.length === 0) {
      toast.error("No hay conteos nuevos para procesar.");
      return { success: false };
    }

    if (!window.confirm(`¿Estás seguro de procesar el cierre de ${insumosAProcesar.length} insumos al mismo tiempo?`)) {
      return { success: false };
    }

    const tId = toast.loading(`Procesando cierre masivo (${insumosAProcesar.length} insumos)...`);
    setLoading(true);

    try {
      // Preparamos el array de datos
      const ajustes = insumosAProcesar.map(row => ({
        id: row.id,
        stock_esperado: parseFloat(row.stock_esperado),
        conteo_fisico: Number(conteos[row.id])
      }));

      const { success, error: err } = await inventarioService.aplicarAuditoriaMasiva(ajustes, usuarioId, sucursalId);
      
      if (!success) throw new Error(err);

      // Limpiamos los inputs y marcamos como auditados
      const nuevosAuditados = [...auditados];
      const nuevosConteos = { ...conteos };
      
      insumosAProcesar.forEach(row => {
        nuevosConteos[row.id] = '';
        if (!nuevosAuditados.includes(row.id)) nuevosAuditados.push(row.id);
      });

      setConteos(nuevosConteos);
      setAuditados(nuevosAuditados);

      // Recargamos toda la info de golpe
      await Promise.all([
        cargarDatos(),
        cargarMovimientos(),
        generarContraste(fechaInicio, fechaFin)
      ]);

      toast.success("¡Cierre de inventario exitoso!", { id: tId });
      return { success: true };
    } catch (err) {
      toast.error("Error: " + err.message, { id: tId });
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const actualizarConteo = (id, valor) => setConteos(prev => ({ ...prev, [id]: valor }));

  // --- EFECTOS DE VIDA DEL HOOK ---
  useEffect(() => {
    if (sucursalId) {
      cargarDatos();
      cargarMovimientos();
    }
  }, [sucursalId, cargarDatos, cargarMovimientos]);

  return {
    // Datos y resultados blindados
    insumos: puedeVer ? insumos : [], 
    insumosFiltrados, 
    movimientos: puedeVer ? movimientos : [],
    motivosCatalogo: puedeVer ? motivosCatalogo : [],
    contrasteData: puedeVer ? contrasteData : [],
    contrasteDataFiltrado,
    
    // Estados de UI
    searchTerm, setSearchTerm,
    conteos, actualizarConteo,
    auditados,
    filtroAuditoria, setFiltroAuditoria,
    loading,
    error,
    
    // Acciones de negocio
    procesarNuevoMovimiento,
    generarContraste,
    guardarConteoFisico,
    guardarAuditoriaMasiva, // 👈 Se exporta la nueva acción

    // 🛡️ Facultades de seguridad
    puedeVer,
    puedeCrear,
    puedeEditar,
    puedeBorrar
  };
};