// Archivo: src/hooks/useEstimacionesTab.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { estimacionesService } from '../services/Estimaciones.service';
import { hasPermission } from '../utils/checkPermiso'; // 🛡️ Blindaje de seguridad

export const useEstimacionesTab = (sucursalId) => { // 👈 Agregamos sucursalId como parámetro
  const [sugerencias, setSugerencias] = useState([]);
  const [proveedores, setProveedores] = useState([]);
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

    // 🛡️ Solo solicitamos datos de los módulos a los que el usuario tiene acceso
    const [resS, resP] = await Promise.all([
      puedeVerInventario ? estimacionesService.getSugerenciasCompra(sucursalId) : { success: true, data: [] }, // 👈 Pasamos el sucursalId
      puedeVerProveedores ? estimacionesService.getProveedoresActivos() : { success: true, data: [] }
    ]);

    if (resS.success) setSugerencias(resS.data || []);
    if (resP.success) setProveedores(resP.data || []);
    
    setLoading(false);
  }, [puedeVerInventario, puedeVerProveedores, sucursalId]); // 👈 Añadimos sucursalId a las dependencias

  const sugerenciasFiltradas = useMemo(() => {
    // 🛡️ Blindaje de salida: Si no puede ver inventario, retornamos vacío
    if (!puedeVerInventario) return [];
    
    return sugerencias.filter(item => 
      filtroProveedor === 'todos' || item.proveedor_nombre === filtroProveedor
    );
  }, [sugerencias, filtroProveedor, puedeVerInventario]);

  const presupuestoTotal = useMemo(() => {
    // 🛡️ Si no puede ver inventario, el presupuesto es 0 por seguridad
    if (!puedeVerInventario) return 0;

    return sugerenciasFiltradas
      .filter(item => !compradosIds.includes(item.insumo_id))
      .reduce((total, item) => total + (parseFloat(item.presupuesto_estimado) || 0), 0);
  }, [sugerenciasFiltradas, compradosIds, puedeVerInventario]);

  const guardarPolitica = async (id, cob, seg) => {
    // 🛡️ BLINDAJE: Bloqueo de acción de edición
    if (!puedeEditarInventario) {
      return { success: false, error: "No tienes facultades para modificar políticas de compra." };
    }
    
    const res = await estimacionesService.actualizarPoliticaCompra(id, cob, seg);
    if (res.success) await cargarDatos();
    return res;
  };

  const confirmarCompra = async (insumo, usuarioId) => {
    // 🛡️ BLINDAJE: Bloqueo de acción de registro
    if (!puedeEditarInventario) {
      return { success: false, error: "Acceso denegado: No puedes registrar compras." };
    }

    // 💡 Pasamos el sucursalId del contexto activo en lugar de recibirlo como parámetro
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
  }, [cargarDatos]); // Como cargarDatos ahora depende de sucursalId, esto se recargará al cambiar de sucursal

  return {
    // 🛡️ Datos blindados
    sugerenciasFiltradas, 
    proveedores: puedeVerProveedores ? proveedores : [],
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

    // 🛡️ Banderas de seguridad para la UI
    puedeVerInventario,
    puedeVerProveedores,
    puedeEditarInventario
  };
};