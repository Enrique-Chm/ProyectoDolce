// Archivo: src/modules/Admin/Tabs/Produccion/useProduccion.js
import { useState, useEffect, useCallback } from 'react';
import { produccionService } from './Produccion.service';
import { hasPermission } from '../../../../utils/checkPermiso';
import Swal from 'sweetalert2';

/**
 * Hook para gestionar la lógica de la pestaña de Producción (Mise en Place).
 * Consume datos procesados nativamente en el backend (PostgreSQL) y coordina
 * el registro de producción física con el plan proyectado.
 */
export const useProduccion = (sucursalId) => {
  const [planProduccion, setPlanProduccion] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Controlamos el rango de días para la proyección de demanda (por defecto 1 día)
  const [diasProyeccion, setDiasProyeccion] = useState(1);

  // 🛡️ RBAC: Permisos del usuario
  // Verifica que estos permisos existan en tu lógica de usuarios
  const puedeVerProduccion = hasPermission('ver_inventario');
  const puedeEditarProduccion = hasPermission('editar_inventario');

  /**
   * Carga el plan de producción desde el Service.
   * Cruza la demanda proyectada de ventas con el stock físico de subrecetas.
   */
  const cargarPlan = useCallback(async () => {
    // 🔍 DIAGNÓSTICO: Si la lista sale vacía, descomenta la siguiente línea 
    // y revisa en la consola si sucursalId es válido y si tienes permisos.
    // console.log("DEBUG: Intentando cargar plan", { sucursalId, puedeVerProduccion, diasProyeccion });

    if (!sucursalId || isNaN(sucursalId) || !puedeVerProduccion) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await produccionService.getPlanProduccion(sucursalId, diasProyeccion);
      
      if (res.success) {
        // Aseguramos que los datos lleguen como array
        setPlanProduccion(res.data || []);
      } else {
        console.error("Error al cargar el plan de producción:", res.error);
        setPlanProduccion([]);
      }
    } catch (error) {
      console.error("Error inesperado en cargarPlan:", error);
      setPlanProduccion([]);
    } finally {
      setLoading(false);
    }
  }, [sucursalId, diasProyeccion, puedeVerProduccion]);

  /**
   * 🚀 Maneja el registro de una nueva tanda de producción o ajuste.
   * Valida la entrada, bloquea doble envío y refresca la vista al terminar.
   */
  const handleRegistrarProduccion = useCallback(async (nombreSubreceta, cantidad, usuarioId) => {
    if (!puedeEditarProduccion) {
      Swal.fire("Acceso denegado", "No tienes permisos para editar inventario.", "error");
      return { success: false };
    }

    const cantidadNum = parseFloat(cantidad);

    // Validación básica de entrada
    if (isNaN(cantidadNum) || cantidadNum === 0) {
      Swal.fire("Cantidad inválida", "Por favor ingresa un número válido diferente de cero.", "warning");
      return { success: false };
    }

    setIsSubmitting(true);
    try {
      const res = await produccionService.registrarProduccion(
        sucursalId, 
        nombreSubreceta, 
        cantidadNum, 
        usuarioId
      );

      if (res.success) {
        // Recargamos el plan para actualizar los indicadores de "Cubierto"
        await cargarPlan();
        
        Swal.fire({
          title: "Registro exitoso",
          text: `Se han actualizado las existencias de: ${nombreSubreceta}`,
          icon: "success",
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        Swal.fire("Error", res.error, "error");
      }
      
      return res;

    } catch (error) {
      console.error("Error en handleRegistrarProduccion:", error);
      Swal.fire("Error crítico", "No se pudo conectar con el servidor.", "error");
      return { success: false };
    } finally {
      setIsSubmitting(false);
    }
  }, [sucursalId, puedeEditarProduccion, cargarPlan]);

  /**
   * Efecto: Recarga los datos automáticamente cuando cambia la sucursal o los días.
   */
  useEffect(() => {
    // Solo disparamos la carga si hay una sucursal válida definida
    if (sucursalId && !isNaN(sucursalId)) {
      cargarPlan();
    }
  }, [cargarPlan, sucursalId]);

  return {
    // Estado de datos
    planProduccion,
    loading,
    isSubmitting,
    
    // Configuración de vista
    diasProyeccion,
    setDiasProyeccion,
    
    // Acciones manuales
    recargarPlan: cargarPlan,
    registrarProduccion: handleRegistrarProduccion,
    
    // Facultades de seguridad
    puedeVerProduccion,
    puedeEditarProduccion
  };
};