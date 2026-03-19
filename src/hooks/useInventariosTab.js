// Archivo: src/hooks/useInventarios.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { inventarioService } from '../services/Inventario.service';
import { hasPermission } from '../utils/checkPermiso'; // 🛡️ Blindaje de seguridad

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

  // --- ESTADOS MOVIDOS DESDE EL JSX ---
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
      setError("Fallo al sincronizar con el catálogo.");
    } finally {
      setLoading(false);
    }
  }, [sucursalId, puedeVer]); // 🛡️ Añadida dependencia de seguridad

  const cargarMovimientos = useCallback(async () => {
    if (!sucursalId || !puedeVer) return; // 🛡️ Protección de llamada
    try {
      const data = await inventarioService.getMovimientos(sucursalId);
      setMovimientos(data || []);
    } catch (err) {
      console.error(err);
    }
  }, [sucursalId, puedeVer]);

  // --- FILTROS DE DATOS ---
  const insumosFiltrados = useMemo(() => {
    // 🛡️ Si no hay permiso, devolvemos lista vacía
    if (!puedeVer) return [];
    
    const term = searchTerm.toLowerCase().trim();
    if (!term) return insumos;
    return insumos.filter(i => 
      i.nombre.toLowerCase().includes(term) || 
      i.categoria?.toLowerCase().includes(term)
    );
  }, [insumos, searchTerm, puedeVer]);

  const contrasteDataFiltrado = useMemo(() => {
    // 🛡️ Si no hay permiso, devolvemos lista vacía
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
    // 🛡️ BLINDAJE: Registro de nuevos movimientos requiere permiso de creación
    if (!puedeCrear) return { success: false, error: "No tienes permiso para registrar nuevos movimientos de inventario." };
    if (!insumoSeleccionado) return { success: false, error: "Selecciona un insumo de la lista." };
    
    const stockAntes = Number(insumoSeleccionado.stock_fisico);
    const cantidadAfectada = Number(nuevoMov.cantidad);
    const factor = nuevoMov.tipo === 'ENTRADA' ? 1 : -1;
    const stockDespues = stockAntes + (cantidadAfectada * factor);

    if (stockDespues < 0) {
      return { success: false, error: `Stock insuficiente. Tienes ${stockAntes} ${insumoSeleccionado.unidad}.` };
    }

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
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const generarContraste = useCallback(async (fechaInicio, fechaFin) => {
    if (!sucursalId || !fechaInicio || !fechaFin) return;
    
    // 🛡️ BLINDAJE: Bloqueo de reporte por permisos
    if (!puedeVer) {
      setError("No tienes facultades para consultar reportes de auditoría.");
      return;
    }

    setLoading(true);
    setAuditados([]); 
    setFiltroAuditoria('todos');
    
    try {
      const { data, error: err } = await inventarioService.calcularContraste(sucursalId, fechaInicio, fechaFin);
      if (err) throw err;
      setContrasteData(data || []);
    } catch (err) {
      setError("No se pudo generar el reporte de auditoría.");
    } finally {
      setLoading(false);
    }
  }, [sucursalId, puedeVer]);

  const guardarConteoFisico = async (filaAuditoria, conteoFisico, usuarioId, fechaInicio, fechaFin) => {
    // 🛡️ BLINDAJE: Las auditorías son críticas (ajuste de stock), requieren permiso de edición
    if (!puedeEditar) return { success: false, error: "Acceso denegado: Se requiere permiso para auditar/editar inventario." };

    setLoading(true);
    try {
      const params = {
        sucursal_id: sucursalId,
        insumo_id: filaAuditoria.id,
        stock_esperado: filaAuditoria.stock_esperado, 
        conteo_fisico: conteoFisico,
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

      return { success: true };
    } catch (err) {
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