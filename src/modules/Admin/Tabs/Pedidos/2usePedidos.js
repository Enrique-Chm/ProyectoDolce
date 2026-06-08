// src/modules/Admin/Tabs/Pedidos/2usePedidos.js
import { useState, useCallback } from 'react';
import { PedidosService } from './1Pedidos.Service';
import { useAuth } from '../../../Auth/useAuth'; // CORRECCIÓN P1: reemplaza AuthService.getSesion()
import toast from 'react-hot-toast';

export const usePedidos = () => {
  const [loading, setLoading] = useState(false);

  // CORRECCIÓN P1: Consumimos el Context centralizado en lugar de leer
  // localStorage directamente con AuthService.getSesion()
  const { usuario } = useAuth();

  // Estado para el Dashboard (Pedidos en curso)
  const [ordenesActivas, setOrdenesActivas] = useState([]);

  // Estado para el Checklist (Datos de la orden seleccionada para surtir)
  const [detalleOrdenActual, setDetalleOrdenActual] = useState(null);

  /**
   * ESTABILIZACIÓN DE DEPENDENCIAS:
   * usuario.sucursales_ids es un arreglo — usarlo directo en useCallback
   * causaría re-renders infinitos porque cada render crea una nueva referencia.
   * Lo convertimos a string para que React pueda compararlo por valor.
   * El arreglo se reconstruye con JSON.parse dentro del callback cuando se necesita.
   */
  const sucursalesIdsStr   = JSON.stringify(usuario?.sucursales_ids || []);
  const tieneAccesoGlobal  = usuario?.permisos?.configuracion?.leer || false;

  // ==========================================
  // OBTENCIÓN DE DATOS (READ)
  // ==========================================

  const cargarOrdenesActivas = useCallback(async () => {
    setLoading(true);
    try {
      // Reconstruimos el arreglo desde el string estabilizado
      const sucursalesIds = JSON.parse(sucursalesIdsStr);

      // CORRECCIÓN P1: Pasamos los parámetros al servicio para que el filtro
      // ocurra en BD con .in(), eliminando el filtrado en memoria del cliente.
      const { data, error } = await PedidosService.getOrdenesActivas(
        tieneAccesoGlobal,
        sucursalesIds
      );

      if (error) {
        toast.error('Error al sincronizar pedidos activos');
        console.error("Error getOrdenesActivas:", error.message);
        return;
      }

      setOrdenesActivas(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [sucursalesIdsStr, tieneAccesoGlobal]);

  const cargarDetalleDeOrden = useCallback(async (ordenId) => {
    if (!ordenId) return;
    setLoading(true);
    try {
      const { data, error } = await PedidosService.getDetalleDeOrden(ordenId);
      if (error) {
        toast.error('No se pudo recuperar el detalle de la orden');
        return null;
      }
      setDetalleOrdenActual(data);
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // ACCIONES DEL CHECKLIST (OPERACIONES DE PRODUCTOS)
  // ==========================================

  const toggleEstatusItem = async (detalleId, estatusActual) => {
    const nuevoEstatus = estatusActual === 'Comprado' ? 'Pendiente' : 'Comprado';

    if (detalleOrdenActual) {
      const backup = { ...detalleOrdenActual };

      const nuevosDetalles = detalleOrdenActual.detalles.map(det =>
        det.id === detalleId ? { ...det, estatus: nuevoEstatus } : det
      );
      setDetalleOrdenActual({ ...detalleOrdenActual, detalles: nuevosDetalles });

      const { error } = await PedidosService.actualizarEstatusItem(detalleId, nuevoEstatus);

      if (error) {
        toast.error('Error de conexión al actualizar ítem');
        setDetalleOrdenActual(backup);
        return false;
      }
    }
    return true;
  };

  // ==========================================
  // ACCIONES DE LA ORDEN (CIERRE Y GESTIÓN)
  // ==========================================

  const cambiarEstatusOrden = async (ordenId, nuevoEstatus) => {
    setLoading(true);
    const { error } = await PedidosService.actualizarEstatusOrden(ordenId, nuevoEstatus);
    setLoading(false);

    if (error) {
      toast.error(`Error al cambiar estatus a ${nuevoEstatus}`);
      return false;
    }

    if (nuevoEstatus === 'Completado') {
      toast.success('¡Pedido surtido y archivado correctamente!');
      setOrdenesActivas(prev => prev.filter(o => o.id !== ordenId));
      setDetalleOrdenActual(null);
    } else {
      toast.success(`Pedido marcado como ${nuevoEstatus}`);
      await cargarOrdenesActivas();
    }

    return true;
  };

  /**
   * Cancela una orden directamente — sin window.confirm.
   * CORRECCIÓN P1: La confirmación visual es responsabilidad del componente
   * que llama a esta función (Pedidos.jsx). El hook solo ejecuta la acción.
   * Esto mantiene la separación de responsabilidades del patrón de 3 capas:
   * el hook no debe controlar UI, solo datos y lógica de negocio.
   */
  const cancelarPedido = async (ordenId) => {
    setLoading(true);
    const { error } = await PedidosService.cancelarOrden(ordenId);
    setLoading(false);

    if (error) {
      toast.error('No se pudo cancelar el pedido');
      return false;
    }

    toast.success('Pedido cancelado correctamente');
    setOrdenesActivas(prev => prev.filter(o => o.id !== ordenId));
    setDetalleOrdenActual(null);
    return true;
  };

  return {
    loading,
    ordenesActivas,
    detalleOrdenActual,
    setDetalleOrdenActual,
    cargarOrdenesActivas,
    cargarDetalleDeOrden,
    toggleEstatusItem,
    cambiarEstatusOrden,
    cancelarPedido
  };
};