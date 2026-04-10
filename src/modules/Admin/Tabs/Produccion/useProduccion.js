// Archivo: src/modules/Admin/Tabs/Produccion/useProduccion.js
import { useState, useEffect, useCallback } from 'react';
import { produccionService } from './Produccion.service';
import { hasPermission } from '../../../../utils/checkPermiso';

/**
 * Hook para gestionar la lógica de la pestaña de Producción (Mise en Place).
 * Ahora consume datos procesados nativamente en el backend (PostgreSQL),
 * lo que garantiza que las unidades de medida, la explosión de recetas y 
 * las estimaciones manuales sean consistentes y rápidas.
 */
export const useProduccion = (sucursalId) => {
  const [planProduccion, setPlanProduccion] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Bloqueo para evitar registros dobles

  // Controlamos el rango de días para la proyección de demanda (1 a 7 días)
  const [diasProyeccion, setDiasProyeccion] = useState(1);

  // 🛡️ Seguridad: RBAC basado en los permisos del usuario
  const puedeVerProduccion = hasPermission('ver_inventario');
  const puedeEditarProduccion = hasPermission('editar_inventario');

  /**
   * Carga los datos desde el Service.
   * El Service llama a la función RPC 'get_plan_produccion' que ya entrega:
   * - subreceta_nombre
   * - cantidad_total (proyectada según recetas y demanda)
   * - cantidad_actual (stock físico en cocina)
   * - unidad_medida (la definida en la tabla recetas)
   * - basado_en_productos (lista de platos que generan la necesidad)
   */
  const cargarPlan = useCallback(async () => {
    // Blindaje de seguridad y parámetros
    if (!sucursalId || !puedeVerProduccion) return;

    setLoading(true);
    
    // Llamada al service que ahora delega el cálculo al motor SQL de Supabase
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
   * 🚀 Registra una nueva tanda de producción o un ajuste de inventario.
   * Después de un éxito, recarga el plan para que los indicadores (Faltantes/Cubiertos)
   * se actualicen visualmente con el nuevo stock.
   * * @param {string} nombreSubreceta - Identificador textual de la preparación.
   * @param {number} cantidad - Valor a sumar (producción) o restar (merma/ajuste).
   * @param {number} usuarioId - Responsable del movimiento.
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
      // 🔄 Sincronización inmediata de la vista
      await cargarPlan();
    }

    setIsSubmitting(false);
    return res;
  };

  /**
   * Efecto principal:
   * Dispara la carga cada vez que cambia la sucursal o el rango de días.
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