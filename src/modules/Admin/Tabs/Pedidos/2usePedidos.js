// src/modules/Admin/Tabs/Pedidos/2usePedidos.js
import { useState, useCallback } from 'react';
import { PedidosService } from './1Pedidos.Service';
import { AuthService } from '../../../Auth/Auth.service'; 
import toast from 'react-hot-toast';

export const usePedidos = () => {
  const [loading, setLoading] = useState(false);
  
  // Recuperamos la sesión actual para validaciones de seguridad
  const sesion = AuthService.getSesion();
  
  // Estado para el Dashboard (Pedidos en curso)
  const [ordenesActivas, setOrdenesActivas] = useState([]);
  
  // Estado para el Checklist (Datos de la orden seleccionada para surtir)
  const [detalleOrdenActual, setDetalleOrdenActual] = useState(null);

  /**
   * EXTRAER VALORES PRIMITIVOS PARA DEPENDENCIAS
   * Evita bucles infinitos en el useEffect al usar IDs en lugar del objeto sesión completo.
   */
  const sucursalId = sesion?.sucursal_id;
  const tieneAccesoGlobal = sesion?.permisos?.configuracion?.leer || false;

  // ==========================================
  // OBTENCIÓN DE DATOS (READ)
  // ==========================================

  const cargarOrdenesActivas = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await PedidosService.getOrdenesActivas();
      
      if (error) {
        toast.error('Error al sincronizar pedidos activos');
        console.error("Error getOrdenesActivas:", error.message);
        return;
      }

      let datosFinales = data || [];

      if (!tieneAccesoGlobal && sucursalId) {
          datosFinales = datosFinales.filter(orden => orden.sucursal_id === sucursalId);
      }

      setOrdenesActivas(datosFinales);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [sucursalId, tieneAccesoGlobal]);

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

  const cancelarPedido = async (ordenId) => {
    if (!window.confirm('¿Seguro que deseas cancelar este pedido?')) return;

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