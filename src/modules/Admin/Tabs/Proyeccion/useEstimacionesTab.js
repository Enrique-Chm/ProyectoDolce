// Archivo: src/modules/Admin/Tabs/Proyeccion/useEstimacionesTab.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { estimacionesService } from './Estimaciones.service';
import { hasPermission } from '../../../../utils/checkPermiso'; 

/**
 * Hook Maestro para la pestaña de Proyecciones y Estimaciones.
 * Coordina la inteligencia de demanda (IA) con los ajustes manuales del usuario.
 */
export const useEstimacionesTab = (sucursalId) => { 
  const [sugerencias, setSugerencias] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [historialConsumo, setHistorialConsumo] = useState([]); 
  const [proyeccionProductos, setProyeccionProductos] = useState([]); 
  const [pronosticoSemanal, setPronosticoSemanal] = useState([]); 
  const [estimacionesManuales, setEstimacionesManuales] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [filtroProveedor, setFiltroProveedor] = useState('todos');
  const [compradosIds, setCompradosIds] = useState([]);
  
  // Estado para controlar el rango del Kardex/Movimientos
  const [diasHistoricos, setDiasHistoricos] = useState(15); 

  // 🚀 CONTROLADORES DE DEMANDA DINÁMICA
  // Al cambiar estos valores, el useEffect disparará cargarDatos() automáticamente
  const [diasCompra, setDiasCompra] = useState(1); 
  const [porcentajeColchon, setPorcentajeColchon] = useState(0); 

  // 🛡️ DEFINICIÓN DE FACULTADES (RBAC)
  const puedeVerInventario = hasPermission('ver_inventario');
  const puedeVerProveedores = hasPermission('ver_proveedores');
  const puedeEditarInventario = hasPermission('editar_inventario');

  /**
   * 📅 LÓGICA DE DÍA PROYECTADO
   * Determina el nombre del día de mañana para resaltar en las tablas.
   */
  const diaProyectado = useMemo(() => {
    const nombresDias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const mañanaIndex = (new Date().getDay() + 1) % 7;
    return nombresDias[mañanaIndex];
  }, []);

  /**
   * 🔄 CARGA MULTI-FUENTE EN PARALELO
   * Obtiene datos de IA, ajustes manuales, proveedores y movimientos.
   */
  const cargarDatos = useCallback(async () => {
    if ((!puedeVerInventario && !puedeVerProveedores) || !sucursalId) return;

    setLoading(true);
    try {
      // Ejecutamos todas las peticiones al mismo tiempo para optimizar velocidad
      const [resS, resP, resH, resPP, resPS, resEM] = await Promise.all([
        puedeVerInventario ? estimacionesService.getSugerenciasCompra(sucursalId, diasCompra, porcentajeColchon) : { success: true, data: [] },
        puedeVerProveedores ? estimacionesService.getProveedoresActivos() : { success: true, data: [] },
        puedeVerInventario ? estimacionesService.getHistorialConsumo(sucursalId, diasHistoricos) : { success: true, data: [] },
        puedeVerInventario ? estimacionesService.getProyeccionProductos(sucursalId) : { success: true, data: [] },
        puedeVerInventario ? estimacionesService.getPronosticoSemanal(sucursalId) : { success: true, data: [] },
        puedeVerInventario ? estimacionesService.getEstimacionesManuales(sucursalId) : { success: true, data: [] }
      ]);

      if (resS.success) setSugerencias(resS.data || []);
      if (resP.success) setProveedores(resP.data || []);
      if (resH.success) setHistorialConsumo(resH.data || []);
      if (resPP.success) setProyeccionProductos(resPP.data || []); 
      if (resPS.success) setPronosticoSemanal(resPS.data || []);
      if (resEM.success) setEstimacionesManuales(resEM.data || []); 
      
    } catch (error) {
      console.error("Error crítico al cargar useEstimacionesTab:", error);
    } finally {
      setLoading(false);
    }
  }, [puedeVerInventario, puedeVerProveedores, sucursalId, diasHistoricos, diasCompra, porcentajeColchon]);

  /**
   * 🔍 FILTRADO DE COMPRAS
   */
  const sugerenciasFiltradas = useMemo(() => {
    if (!puedeVerInventario) return [];
    const base = Array.isArray(sugerencias) ? sugerencias : [];
    return base.filter(item => 
      filtroProveedor === 'todos' || item.proveedor_nombre === filtroProveedor
    );
  }, [sugerencias, filtroProveedor, puedeVerInventario]);

  /**
   * 💰 CÁLCULO DE PRESUPUESTO EN VIVO
   */
  const presupuestoTotal = useMemo(() => {
    if (!puedeVerInventario) return 0;
    const baseFiltrada = Array.isArray(sugerenciasFiltradas) ? sugerenciasFiltradas : [];
    const baseComprados = Array.isArray(compradosIds) ? compradosIds : [];

    return baseFiltrada
      .filter(item => !baseComprados.includes(item.insumo_id))
      .reduce((total, item) => {
        const monto = parseFloat(item.presupuesto_estimado) || 0;
        return total + monto;
      }, 0);
  }, [sugerenciasFiltradas, compradosIds, puedeVerInventario]);

  /**
   * 📝 ACCIÓN: Actualizar parámetros de stock (Min/Max/Seguridad)
   */
  const guardarPolitica = async (id, politicaData) => {
    if (!puedeEditarInventario) return { success: false, error: "No tienes permisos." };
    
    const res = await estimacionesService.actualizarPoliticaCompra(id, politicaData);
    if (res.success) await cargarDatos();
    return res;
  };

  /**
   * ✏️ ACCIÓN: Guardar ajuste manual de ventas por día (DOW)
   */
  const guardarEstimacionManual = async (productoId, dow, cantidad) => {
    if (!puedeEditarInventario) return { success: false, error: "No tienes permisos." };

    const res = await estimacionesService.guardarEstimacionManual(sucursalId, productoId, dow, cantidad);
    if (res.success) {
      // Recargamos datos para que el cambio manual se refleje en compras y IA
      await cargarDatos();
    }
    return res;
  };

  /**
   * 🛒 ACCIÓN: Confirmar compra realizada y afectar inventario
   */
  const confirmarCompra = async (insumo, usuarioId) => {
    if (!puedeEditarInventario) return { success: false, error: "No tienes permisos." };

    const res = await estimacionesService.registrarCompraRealizada(
      insumo.insumo_id, 
      insumo.cajas_a_pedir, 
      insumo.presupuesto_estimado || 0, 
      usuarioId, 
      sucursalId
    );
    
    if (res.success) {
      // Marcamos como comprado localmente para el presupuesto y refrescamos
      setCompradosIds(prev => [...(Array.isArray(prev) ? prev : []), insumo.insumo_id]);
      await cargarDatos();
    }
    return res;
  };

  // Efecto principal: Recarga automática al cambiar filtros de demanda o sucursal
  useEffect(() => { 
    cargarDatos(); 
  }, [cargarDatos]); 

  return {
    // --- ESTADO DE DATOS ---
    sugerenciasFiltradas, 
    proveedores: puedeVerProveedores ? proveedores : [],
    historialConsumo,
    proyeccionProductos, 
    pronosticoSemanal,
    estimacionesManuales, 
    presupuestoTotal,
    
    // --- ESTADOS DE UI ---
    filtroProveedor, 
    setFiltroProveedor,
    loading, 
    compradosIds,
    
    // --- PARÁMETROS DE DEMANDA ---
    diasCompra,
    setDiasCompra,
    porcentajeColchon,
    setPorcentajeColchon,

    // --- CONFIGURACIÓN ---
    diasHistoricos, 
    setDiasHistoricos, 
    diaProyectado, 
    
    // --- MÉTODOS DE ACCIÓN ---
    recargarDatos: cargarDatos, 
    guardarPolitica,
    guardarEstimacionManual, 
    confirmarCompra,

    // --- PERMISOS ---
    puedeVerInventario,
    puedeVerProveedores,
    puedeEditarInventario
  };
};