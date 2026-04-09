// Archivo: src/modules/Admin/Tabs/Produccion/useProduccion.js
import { useState, useEffect, useCallback } from 'react';
import { produccionService } from './Produccion.service';
import { hasPermission } from '../../../../utils/checkPermiso';

/**
 * Hook para gestionar la lógica de la pestaña de Producción (Mise en Place).
 * Coordina la demanda de subrecetas, el contraste con el stock físico en 'stock_subrecetas'
 * y el registro de nueva producción terminada.
 */
export const useProduccion = (sucursalId) => {
  const [planProduccion, setPlanProduccion] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Bloqueo para evitar registros dobles

  // Controlamos el rango de días para la proyección de demanda
  const [diasProyeccion, setDiasProyeccion] = useState(1);

  // 🛡️ Seguridad: RBAC basado en los permisos del usuario
  const puedeVerProduccion = hasPermission('ver_inventario');
  const puedeEditarProduccion = hasPermission('editar_inventario');

  /**
   * Carga los datos desde la función RPC.
   * Trae: subreceta_nombre, cantidad_total (necesario), 
   * cantidad_actual (stock en tabla stock_subrecetas), unidad_medida y origen.
   */
  const cargarPlan = useCallback(async () => {
    // Blindaje inicial
    if (!sucursalId || !puedeVerProduccion) return;

    setLoading(true);
    const res = await produccionService.getPlanProduccion(sucursalId, diasProyeccion);
    
    if (res.success) {
      setPlanProduccion(res.data || []);
    } else {
      console.error("Error al cargar el plan de producción:", res.error);
      setPlanProduccion([]);
    }
    setLoading(false);
  }, [sucursalId, diasProyeccion, puedeVerProduccion]);

  /**
   * 🚀 Registra una nueva producción o ajuste de stock.
   * Llama al servicio que afecta la tabla dedicada de subrecetas.
   * Después de un éxito, recarga el plan para que los balances (Necesario vs Actual) 
   * se actualicen visualmente.
   */
  const handleRegistrarProduccion = async (nombreSubreceta, cantidad, usuarioId) => {
    if (!puedeEditarProduccion) {
      return { success: false, error: "No tienes permisos para editar la producción." };
    }
    
    setIsSubmitting(true);
    const res = await produccionService.registrarProduccion(
      sucursalId, 
      nombreSubreceta, 
      cantidad, 
      usuarioId
    );

    if (res.success) {
      // 🔄 Sincronización inmediata: Recargamos los datos para reflejar el nuevo stock
      await cargarPlan();
    }

    setIsSubmitting(false);
    return res;
  };

  /**
   * Efecto para disparar la carga de datos cada vez que cambie 
   * la sucursal o los días de proyección seleccionados.
   */
  useEffect(() => {
    cargarPlan();
  }, [cargarPlan]);

  return {
    // 📊 Datos y Estados
    planProduccion,
    loading,
    isSubmitting,
    
    // ⚙️ Controladores de Proyección
    diasProyeccion,
    setDiasProyeccion,
    
    // 🚀 Acciones
    recargarPlan: cargarPlan,
    registrarProduccion: handleRegistrarProduccion,
    
    // 🛡️ Facultades del usuario
    puedeVerProduccion,
    puedeEditarProduccion
  };
};