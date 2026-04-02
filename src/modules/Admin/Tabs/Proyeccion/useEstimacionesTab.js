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
  const [estimacionesManuales, setEstimacionesManuales] = useState([]); // 🚀 Valores definidos por el usuario
  const [loading, setLoading] = useState(false);
  const [filtroProveedor, setFiltroProveedor] = useState('todos');
  const [compradosIds, setCompradosIds] = useState([]);
  
  // Estado para controlar los días históricos (Kardex/Movimientos)
  const [diasHistoricos, setDiasHistoricos] = useState(15); 

  // 🛡️ DEFINICIÓN DE FACULTADES (RBAC)
  const puedeVerInventario = hasPermission('ver_inventario');
  const puedeVerProveedores = hasPermission('ver_proveedores');
  const puedeEditarInventario = hasPermission('editar_inventario');

  /**
   * 🚀 LÓGICA DE DÍA PROYECTADO
   * Calculamos qué día de la semana es "mañana" para mostrarlo en la interfaz.
   */
  const diaProyectado = useMemo(() => {
    const nombresDias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const mañanaIndex = (new Date().getDay() + 1) % 7;
    return nombresDias[mañanaIndex];
  }, []);

  const cargarDatos = useCallback(async () => {
    // 🛡️ BLINDAJE: Si no tiene permisos mínimos de lectura o no hay sucursal, evitamos la carga
    if ((!puedeVerInventario && !puedeVerProveedores) || !sucursalId) return;

    setLoading(true);

    /**
     * 🛡️ Solicitamos todos los datos necesarios en paralelo.
     * El servicio ahora gestiona la lógica JIT y el reset de manuales.
     */
    const [resS, resP, resH, resPP, resPS, resEM] = await Promise.all([
      puedeVerInventario ? estimacionesService.getSugerenciasCompra(sucursalId) : { success: true, data: [] },
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
    
    setLoading(false);
  }, [puedeVerInventario, puedeVerProveedores, sucursalId, diasHistoricos]);

  /**
   * Filtrado por proveedor sobre los datos de demanda.
   */
  const sugerenciasFiltradas = useMemo(() => {
    if (!puedeVerInventario) return [];
    
    return sugerencias.filter(item => 
      filtroProveedor === 'todos' || item.proveedor_nombre === filtroProveedor
    );
  }, [sugerencias, filtroProveedor, puedeVerInventario]);

  /**
   * Calcula el presupuesto total basándose en los insumos necesarios para mañana.
   */
  const presupuestoTotal = useMemo(() => {
    if (!puedeVerInventario) return 0;

    return sugerenciasFiltradas
      .filter(item => !compradosIds.includes(item.insumo_id))
      .reduce((total, item) => {
        const monto = parseFloat(item.presupuesto_estimado) || 0;
        return total + monto;
      }, 0);
  }, [sugerenciasFiltradas, compradosIds, puedeVerInventario]);

  const guardarPolitica = async (id, politicaData) => {
    if (!puedeEditarInventario) {
      return { success: false, error: "No tienes facultades para modificar políticas de compra." };
    }
    
    const res = await estimacionesService.actualizarPoliticaCompra(id, politicaData);
    if (res.success) await cargarDatos();
    return res;
  };

  /**
   * 🚀 ACCIÓN: Permite guardar, actualizar o resetear (si cantidad es "") lo que el usuario espera vender.
   * Al terminar, recarga los datos para refrescar la matriz y el motor de compras.
   */
  const guardarEstimacionManual = async (productoId, dow, cantidad) => {
    if (!puedeEditarInventario) {
      return { success: false, error: "No tienes permisos para definir estimaciones manuales." };
    }

    const res = await estimacionesService.guardarEstimacionManual(sucursalId, productoId, dow, cantidad);
    if (res.success) await cargarDatos();
    return res;
  };

  const confirmarCompra = async (insumo, usuarioId) => {
    if (!puedeEditarInventario) {
      return { success: false, error: "Acceso denegado: No puedes registrar compras." };
    }

    const res = await estimacionesService.registrarCompraRealizada(
      insumo.insumo_id, 
      insumo.cajas_a_pedir, 
      insumo.presupuesto_estimado || 0, 
      usuarioId, 
      sucursalId
    );
    
    if (res.success) {
      setCompradosIds(prev => [...prev, insumo.insumo_id]);
      await cargarDatos();
    }
    return res;
  };

  useEffect(() => { 
    cargarDatos(); 
  }, [cargarDatos]); 

  return {
    // 🛡️ Datos
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
    
    // Configuración de análisis
    diasHistoricos, 
    setDiasHistoricos, 
    diaProyectado, 
    
    // Acciones
    recargarDatos: cargarDatos, 
    guardarPolitica,
    guardarEstimacionManual, 
    confirmarCompra,

    // 🛡️ Banderas de seguridad
    puedeVerInventario,
    puedeVerProveedores,
    puedeEditarInventario
  };
};