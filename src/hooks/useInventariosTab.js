// Archivo: src/hooks/useInventarios.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { inventarioService } from '../services/Inventario.service';
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
  const [auditados, setAuditados] = useState([]); // Memoria de filas verdes
  const [filtroAuditoria, setFiltroAuditoria] = useState('todos'); // Combobox

  const cargarDatos = useCallback(async () => {
    if (!sucursalId) return;
    
    // 🛡️ BLINDAJE: Si no tiene permiso de lectura, cancelamos la carga
    if (!puedeVer) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const hoy = new Date().toISOString().split('T')[0];
      const [dataInsumos, dataMotivos, dataEnVivo] = await Promise.all([
        inventarioService.getInsumos(sucursalId),
        inventarioService.getMotivos(),
        inventarioService.calcularContraste(sucursalId, hoy, hoy)
      ]);

      const insumosEnriquecidos = (dataInsumos || []).map(insumo => {
        const datosHoy = dataEnVivo?.data?.find(d => d.id === insumo.id);
        return {
          ...insumo,
          stock_fisico: insumo.caja_master, 
          stock_estimado: datosHoy ? datosHoy.stock_esperado : insumo.caja_master 
        };
      });

      setInsumos(insumosEnriquecidos);
      setMotivosCatalogo(dataMotivos || []);
    } catch (err) {
      const msg = "Fallo al sincronizar con el catálogo.";
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
      console.error(err);
    }
  }, [sucursalId, puedeVer]);

  // --- FILTROS DE DATOS ---
  const insumosFiltrados = useMemo(() => {
    if (!puedeVer) return [];
    
    const term = searchTerm.toLowerCase().trim();
    if (!term) return insumos;
    return insumos.filter(i => 
      i.nombre.toLowerCase().includes(term) || 
      i.categoria?.toLowerCase().includes(term)
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

  // --- LÓGICA DE NEGOCIO: REGISTRO MANUAL ---
  const procesarNuevoMovimiento = async (nuevoMov, insumoSeleccionado, usuarioId) => {
    // 🛡️ BLINDAJE
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

  const generarContraste = useCallback(async (fechaInicio, fechaFin) => {
    if (!sucursalId || !fechaInicio || !fechaFin) return;
    
    // 🛡️ BLINDAJE
    if (!puedeVer) {
      toast.error("Acceso denegado a reportes de auditoría.");
      return;
    }

    const tId = toast.loading("Calculando inventario estimado vs real...");
    setLoading(true);
    setAuditados([]); 
    setFiltroAuditoria('todos');
    
    try {
      const { data, error: err } = await inventarioService.calcularContraste(sucursalId, fechaInicio, fechaFin);
      if (err) throw err;
      setContrasteData(data || []);
      toast.success("Reporte de contraste generado", { id: tId });
    } catch (err) {
      toast.error("No se pudo generar el reporte.", { id: tId });
      setError("No se pudo generar el reporte de auditoría.");
    } finally {
      setLoading(false);
    }
  }, [sucursalId, puedeVer]);

  const guardarConteoFisico = async (filaAuditoria, conteoFisico, usuarioId, fechaInicio, fechaFin) => {
    // 🛡️ BLINDAJE
    if (!puedeEditar) {
        toast.error("Acceso denegado: Se requiere permiso para auditar.");
        return { success: false };
    }

    if (!conteoFisico && conteoFisico !== 0) {
        toast.error("Ingresa un conteo físico válido.");
        return { success: false };
    }

    const tId = toast.loading(`Auditando ${filaAuditoria.nombre}...`);
    setLoading(true);
    try {
      const params = {
        sucursal_id: sucursalId,
        insumo_id: filaAuditoria.id,
        stock_esperado: filaAuditoria.stock_esperado, 
        conteo_fisico: Number(conteoFisico),
        usuario_id: usuarioId
      };

      const { success, error: err } = await inventarioService.aplicarAuditoriaInsumo(params);
      if (!success) throw new Error(err);

      setConteos(prev => ({ ...prev, [filaAuditoria.id]: '' }));
      if (!auditados.includes(filaAuditoria.id)) {
        setAuditados(prev => [...prev, filaAuditoria.id]);
      }

      await Promise.all([
        cargarDatos(),
        cargarMovimientos(),
        generarContraste(fechaInicio, fechaFin)
      ]);

      toast.success("Ajuste de inventario aplicado", { id: tId });
      return { success: true };
    } catch (err) {
      toast.error("Error al auditar: " + err.message, { id: tId });
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const actualizarConteo = (id, valor) => setConteos(prev => ({ ...prev, [id]: valor }));

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