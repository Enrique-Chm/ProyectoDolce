import { useState, useEffect, useCallback, useMemo } from 'react';
import { inventarioService } from '../services/Inventario.service';

export const useInventarios = (sucursalId) => {
  const [insumos, setInsumos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [motivosCatalogo, setMotivosCatalogo] = useState([]);
  const [contrasteData, setContrasteData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- ESTADOS MOVIDOS DESDE EL JSX ---
  const [searchTerm, setSearchTerm] = useState('');
  const [conteos, setConteos] = useState({}); // Lo que se escribe en los inputs
  const [auditados, setAuditados] = useState([]); // Memoria de filas verdes
  const [filtroAuditoria, setFiltroAuditoria] = useState('todos'); // Combobox

  const cargarDatos = useCallback(async () => {
    if (!sucursalId) return;
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
  }, [sucursalId]);

  const cargarMovimientos = useCallback(async () => {
    if (!sucursalId) return;
    try {
      const data = await inventarioService.getMovimientos(sucursalId);
      setMovimientos(data || []);
    } catch (err) {
      console.error(err);
    }
  }, [sucursalId]);

  // --- FILTROS DE DATOS ---
  const insumosFiltrados = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return insumos;
    return insumos.filter(i => 
      i.nombre.toLowerCase().includes(term) || 
      i.categoria?.toLowerCase().includes(term)
    );
  }, [insumos, searchTerm]);

  // LA LÓGICA DE FILTRADO AHORA VIVE AQUÍ
  const contrasteDataFiltrado = useMemo(() => {
    return contrasteData.filter(row => {
      if (filtroAuditoria === 'todos') return true;
      if (filtroAuditoria === 'auditados') return auditados.includes(row.id);
      if (filtroAuditoria === 'pendientes') return !auditados.includes(row.id);
      return true;
    });
  }, [contrasteData, filtroAuditoria, auditados]);

  // --- LÓGICA DE NEGOCIO: REGISTRO MANUAL ---
  const procesarNuevoMovimiento = async (nuevoMov, insumoSeleccionado, usuarioId) => {
    if (!insumoSeleccionado) return { success: false, error: "Selecciona un insumo de la lista." };
    
    // La matemática se hace aquí, no en el JSX
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
    setLoading(true);
    // Al generar un nuevo balance, limpiamos la memoria de auditoría
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
  }, [sucursalId]);

  const guardarConteoFisico = async (filaAuditoria, conteoFisico, usuarioId, fechaInicio, fechaFin) => {
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

      // Si tiene éxito, actualizamos los estados de la memoria aquí en el Hook
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

  // Funciones auxiliares para manejar los inputs
  const actualizarConteo = (id, valor) => setConteos(prev => ({ ...prev, [id]: valor }));

  useEffect(() => {
    if (sucursalId) {
      cargarDatos();
      cargarMovimientos();
    }
  }, [sucursalId, cargarDatos, cargarMovimientos]);

  return {
    insumos,              
    insumosFiltrados,     
    searchTerm, setSearchTerm,
    movimientos,
    motivosCatalogo,
    contrasteData,
    contrasteDataFiltrado, // Exponemos la lista ya filtrada
    conteos, actualizarConteo, // Exponemos el estado de los inputs
    auditados,
    filtroAuditoria, setFiltroAuditoria,
    loading,
    error,
    procesarNuevoMovimiento, // La nueva función unificada
    generarContraste,
    guardarConteoFisico
  };
};