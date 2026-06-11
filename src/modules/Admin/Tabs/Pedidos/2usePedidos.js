// src/modules/Admin/Tabs/Pedidos/2usePedidos.js
import { useState, useCallback } from 'react';
import { PedidosService } from './1Pedidos.Service';
import { useAuth } from '../../../Auth/useAuth';
import toast from 'react-hot-toast';

export const usePedidos = () => {
  const [loading, setLoading] = useState(false);

  const { usuario } = useAuth();

  // Estado para el Dashboard (Pedidos en curso)
  const [ordenesActivas, setOrdenesActivas] = useState([]);

  // PAGINACIÓN: total de registros en BD y flag de si hay más por cargar
  const [totalActivas, setTotalActivas] = useState(0);
  const [hayMasActivas, setHayMasActivas] = useState(false);

  // Estado para el Checklist (Datos de la orden seleccionada para surtir)
  const [detalleOrdenActual, setDetalleOrdenActual] = useState(null);

  /**
   * ESTABILIZACIÓN DE DEPENDENCIAS:
   * usuario.sucursales_ids es un arreglo — usarlo directo en useCallback
   * causaría re-renders infinitos porque cada render crea una nueva referencia.
   */
  const sucursalesIdsStr   = JSON.stringify(usuario?.sucursales_ids || []);
  const tieneAccesoGlobal  = usuario?.permisos?.configuracion?.leer || false;

  // ==========================================
  // OBTENCIÓN DE DATOS (READ)
  // ==========================================

  /**
   * Carga inicial de pedidos activos (primera página).
   * Resetea la lista y carga desde el inicio.
   */
  const cargarOrdenesActivas = useCallback(async () => {
    setLoading(true);
    try {
      const sucursalesIds = JSON.parse(sucursalesIdsStr);

      const { data, error, count } = await PedidosService.getOrdenesActivas(
        tieneAccesoGlobal,
        sucursalesIds,
        0  // PAGINACIÓN: siempre desde el inicio en carga inicial
      );

      if (error) {
        toast.error('Error al sincronizar pedidos activos');
        console.error("Error getOrdenesActivas:", error.message);
        return;
      }

      const registros = data || [];
      const total     = count || 0;

      setOrdenesActivas(registros);
      setTotalActivas(total);
      setHayMasActivas(registros.length < total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [sucursalesIdsStr, tieneAccesoGlobal]);

  /**
   * PAGINACIÓN: Carga el siguiente bloque de pedidos activos
   * y los agrega al final de la lista existente.
   */
  const cargarMasActivas = useCallback(async () => {
    if (loading || !hayMasActivas) return;

    setLoading(true);
    try {
      const sucursalesIds = JSON.parse(sucursalesIdsStr);

      const { data, error, count } = await PedidosService.getOrdenesActivas(
        tieneAccesoGlobal,
        sucursalesIds,
        ordenesActivas.length  // PAGINACIÓN: offset = registros ya cargados
      );

      if (error) {
        toast.error('Error al cargar más pedidos');
        return;
      }

      const nuevosRegistros = data || [];
      const total           = count || 0;
      const listaActualizada = [...ordenesActivas, ...nuevosRegistros];

      setOrdenesActivas(listaActualizada);
      setTotalActivas(total);
      setHayMasActivas(listaActualizada.length < total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [loading, hayMasActivas, ordenesActivas, sucursalesIdsStr, tieneAccesoGlobal]);

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
    const { error } = await PedidosService.actualizarEstatusOrden(ordenId, nuevoEstatus, usuario?.id);
    setLoading(false);

    if (error) {
      toast.error(`Error al cambiar estatus a ${nuevoEstatus}`);
      return false;
    }

    if (nuevoEstatus === 'Completado') {
      toast.success('¡Pedido surtido y archivado correctamente!');
      setOrdenesActivas(prev => prev.filter(o => o.id !== ordenId));
      setTotalActivas(prev => prev - 1);
      setDetalleOrdenActual(null);
    } else {
      toast.success(`Pedido marcado como ${nuevoEstatus}`);
      await cargarOrdenesActivas();
    }

    return true;
  };

  /**
   * Cancela una orden directamente — sin window.confirm.
   * La confirmación visual es responsabilidad del componente.
   */
  const cancelarPedido = async (ordenId) => {
    setLoading(true);
    const { error } = await PedidosService.cancelarOrden(ordenId, usuario?.id);
    setLoading(false);

    if (error) {
      toast.error('No se pudo cancelar el pedido');
      return false;
    }

    toast.success('Pedido cancelado correctamente');
    setOrdenesActivas(prev => prev.filter(o => o.id !== ordenId));
    setTotalActivas(prev => prev - 1);
    setDetalleOrdenActual(null);
    return true;
  };

  return {
    loading,
    ordenesActivas,
    totalActivas,       // PAGINACIÓN: total de registros en BD
    hayMasActivas,      // PAGINACIÓN: flag para mostrar/ocultar botón "Cargar más"
    detalleOrdenActual,
    setDetalleOrdenActual,
    cargarOrdenesActivas,
    cargarMasActivas,   // PAGINACIÓN: función para cargar siguiente bloque
    cargarDetalleDeOrden,
    toggleEstatusItem,
    cambiarEstatusOrden,
    cancelarPedido
  };
};