// Archivo: src/modules/Admin/Tabs/Proyeccion/useEstimacionesTab.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { estimacionesService } from './Estimaciones.service';
import { hasPermission } from '../../../../utils/checkPermiso'; 

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
  
  // Estado para controlar los días históricos (Kardex/Movimientos)
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
   * 🚀 LÓGICA DE DÍA PROYECTADO
   * Calcula qué día de la semana es "mañana" para la interfaz.
   */
  const diaProyectado = useMemo(() => {
    const nombresDias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const mañanaIndex = (new Date().getDay() + 1) % 7;
    return nombresDias[mañanaIndex];
  }, []);

  const cargarDatos = useCallback(async () => {
    // 🛡️ BLINDAJE
    if ((!puedeVerInventario && !puedeVerProveedores) || !sucursalId) return;

    setLoading(true);

    try {
      /**
       * 🛡️ Solicitamos todos los datos necesarios en paralelo.
       * Se envían los parámetros de proyección para que el SQL haga el cálculo pesado.
       */
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
      console.error("Error al cargar datos de estimaciones:", error);
    } finally {
      setLoading(false);
    }
  }, [puedeVerInventario, puedeVerProveedores, sucursalId, diasHistoricos, diasCompra, porcentajeColchon]);

  /**
   * Filtrado por proveedor sobre los datos de demanda.
   */
  const sugerenciasFiltradas = useMemo(() => {
    if (!puedeVerInventario) return [];
    
    const base = Array.isArray(sugerencias) ? sugerencias : [];
    return base.filter(item => 
      filtroProveedor === 'todos' || item.proveedor_nombre === filtroProveedor
    );
  }, [sugerencias, filtroProveedor, puedeVerInventario]);

  /**
   * Calcula el presupuesto total basándose en los insumos necesarios.
   * Excluye los que ya fueron marcados como "comprados" en la sesión actual.
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

  const guardarPolitica = async (id, politicaData) => {
    if (!puedeEditarInventario) return { success: false, error: "No tienes permisos." };
    
    const res = await estimacionesService.actualizarPoliticaCompra(id, politicaData);
    if (res.success) await cargarDatos();
    return res;
  };

  /**
   * 🚀 ACCIÓN: Guarda estimación manual de ventas.
   */
  const guardarEstimacionManual = async (productoId, dow, cantidad) => {
    if (!puedeEditarInventario) return { success: false, error: "No tienes permisos." };

    const res = await estimacionesService.guardarEstimacionManual(sucursalId, productoId, dow, cantidad);
    if (res.success) await cargarDatos();
    return res;
  };

  /**
   * 🚀 ACCIÓN: Registra la compra y actualiza stock.
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
      setCompradosIds(prev => [...(Array.isArray(prev) ? prev : []), insumo.insumo_id]);
      await cargarDatos();
    }
    return res;
  };

  // Disparo automático de carga al cambiar sucursal o parámetros de demanda
  useEffect(() => { 
    cargarDatos(); 
  }, [cargarDatos]); 

  return {
    // Datos
    sugerenciasFiltradas, 
    proveedores: puedeVerProveedores ? proveedores : [],
    historialConsumo,
    proyeccionProductos, 
    pronosticoSemanal,
    estimacionesManuales, 
    presupuestoTotal,
    
    // Estados y setters
    filtroProveedor, 
    setFiltroProveedor,
    loading, 
    compradosIds,
    
    // Controladores Proyección
    diasCompra,
    setDiasCompra,
    porcentajeColchon,
    setPorcentajeColchon,

    // Configuración
    diasHistoricos, 
    setDiasHistoricos, 
    diaProyectado, 
    
    // Acciones
    recargarDatos: cargarDatos, 
    guardarPolitica,
    guardarEstimacionManual, 
    confirmarCompra,

    // Banderas
    puedeVerInventario,
    puedeVerProveedores,
    puedeEditarInventario
  };
};