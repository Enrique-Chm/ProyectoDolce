// Archivo: src/modules/Admin/Tabs/Proyeccion/useEstimacionesTab.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { estimacionesService } from './Estimaciones.service';
import { hasPermission } from '../../../../utils/checkPermiso'; // 🛡️ Blindaje de seguridad

export const useEstimacionesTab = (sucursalId) => { 
  const [sugerencias, setSugerencias] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [historialConsumo, setHistorialConsumo] = useState([]); 
  const [proyeccionProductos, setProyeccionProductos] = useState([]); // 👈 NUEVO: Estado para platillos/sandwiches
  const [loading, setLoading] = useState(false);
  const [filtroProveedor, setFiltroProveedor] = useState('todos');
  const [compradosIds, setCompradosIds] = useState([]);

  // 🛡️ DEFINICIÓN DE FACULTADES (RBAC)
  const puedeVerInventario = hasPermission('ver_inventario');
  const puedeVerProveedores = hasPermission('ver_proveedores');
  const puedeEditarInventario = hasPermission('editar_inventario');

  const cargarDatos = useCallback(async () => {
    // 🛡️ BLINDAJE: Si no tiene permisos mínimos de lectura o no hay sucursal, evitamos la carga
    if ((!puedeVerInventario && !puedeVerProveedores) || !sucursalId) return;

    setLoading(true);

    // 🛡️ Solicitamos todos los datos necesarios en paralelo para optimizar velocidad
    const [resS, resP, resH, resPP] = await Promise.all([
      puedeVerInventario ? estimacionesService.getSugerenciasCompra(sucursalId) : { success: true, data: [] },
      puedeVerProveedores ? estimacionesService.getProveedoresActivos() : { success: true, data: [] },
      puedeVerInventario ? estimacionesService.getHistorialConsumo(sucursalId) : { success: true, data: [] },
      puedeVerInventario ? estimacionesService.getProyeccionProductos(sucursalId) : { success: true, data: [] } // 👈 Nueva carga de platillos
    ]);

    if (resS.success) setSugerencias(resS.data || []);
    if (resP.success) setProveedores(resP.data || []);
    if (resH.success) setHistorialConsumo(resH.data || []);
    if (resPP.success) setProyeccionProductos(resPP.data || []); // 👈 Guardamos la proyección de platillos
    
    setLoading(false);
  }, [puedeVerInventario, puedeVerProveedores, sucursalId]); 

  const sugerenciasFiltradas = useMemo(() => {
    if (!puedeVerInventario) return [];
    
    return sugerencias.filter(item => 
      filtroProveedor === 'todos' || item.proveedor_nombre === filtroProveedor
    );
  }, [sugerencias, filtroProveedor, puedeVerInventario]);

  const presupuestoTotal = useMemo(() => {
    if (!puedeVerInventario) return 0;

    return sugerenciasFiltradas
      .filter(item => !compradosIds.includes(item.insumo_id))
      .reduce((total, item) => total + (parseFloat(item.presupuesto_estimado) || 0), 0);
  }, [sugerenciasFiltradas, compradosIds, puedeVerInventario]);

  const guardarPolitica = async (id, politicaData) => {
    if (!puedeEditarInventario) {
      return { success: false, error: "No tienes facultades para modificar políticas de compra." };
    }
    
    const res = await estimacionesService.actualizarPoliticaCompra(id, politicaData);
    if (res.success) await cargarDatos();
    return res;
  };

  const confirmarCompra = async (insumo, usuarioId) => {
    if (!puedeEditarInventario) {
      return { success: false, error: "Acceso denegado: No puedes registrar compras." };
    }

    const res = await estimacionesService.registrarCompraRealizada(
      insumo.insumo_id, insumo.cajas_a_pedir, insumo.presupuesto_estimado, usuarioId, sucursalId
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
    proyeccionProductos, // 👈 Exportamos la proyección de platillos para la UI
    presupuestoTotal,
    
    // Estados y setters
    filtroProveedor, 
    setFiltroProveedor,
    loading, 
    compradosIds,
    
    // Acciones
    recargarDatos: cargarDatos, 
    guardarPolitica,
    confirmarCompra,

    // 🛡️ Banderas de seguridad
    puedeVerInventario,
    puedeVerProveedores,
    puedeEditarInventario
  };
};