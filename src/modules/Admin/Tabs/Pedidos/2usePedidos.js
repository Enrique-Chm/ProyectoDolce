// src/modules/Admin/Tabs/Pedidos/2usePedidos.js
import { useState, useCallback } from 'react';
import { PedidosService } from './1Pedidos.Service';
import { AuthService } from '../../../Auth/Auth.service'; // <-- Importado para la lógica de roles
import toast from 'react-hot-toast';

export const usePedidos = () => {
  const [loading, setLoading] = useState(false);
  
  // Recuperamos la sesión actual para aplicar filtros de seguridad
  const sesion = AuthService.getSesion();
  
  // Estado para el Dashboard (Solo lo que está en curso)
  const [ordenesActivas, setOrdenesActivas] = useState([]);
  
  // Estado para el Checklist (Operación en tiempo real en el mercado)
  const [detalleOrdenActual, setDetalleOrdenActual] = useState(null);

  // ==========================================
  // OBTENCIÓN DE DATOS (READ)
  // ==========================================

  // 1. Carga las órdenes para la pestaña "Activos" con filtro por sucursal
  const cargarOrdenesActivas = useCallback(async () => {
    setLoading(true);
    const { data, error } = await PedidosService.getOrdenesActivas();
    setLoading(false);
    
    if (error) {
      toast.error('Error al sincronizar pedidos activos');
      console.error(error);
      return;
    }

    let datosFinales = data || [];

    // LÓGICA DE VISIBILIDAD POR ROL:
    // - Gerente y Comprador: Ven TODO.
    // - Cocina (y otros): Solo ven los pedidos de SU propia sucursal.
    if (sesion && sesion.rol !== 'Gerente' && sesion.rol !== 'Comprador') {
        datosFinales = datosFinales.filter(orden => orden.sucursal_id === sesion.sucursal_id);
    }

    setOrdenesActivas(datosFinales);
  }, [sesion]);

  // 2. Carga el detalle de una orden (Para el Checklist o edición)
  const cargarDetalleDeOrden = useCallback(async (ordenId) => {
    setLoading(true);
    const { data, error } = await PedidosService.getDetalleDeOrden(ordenId);
    setLoading(false);
    
    if (error) {
      toast.error('No se pudo recuperar el detalle de la orden');
      return null;
    }
    setDetalleOrdenActual(data);
    return data;
  }, []);

  // ==========================================
  // ACCIONES DEL CHECKLIST (OPERACIONES DE PRODUCTOS)
  // ==========================================

  // 3. Toggle de estatus de un producto (Optimistic UI para rapidez en el móvil)
  const toggleEstatusItem = async (detalleId, estatusActual) => {
    const nuevoEstatus = estatusActual === 'Comprado' ? 'Pendiente' : 'Comprado';
    
    if (detalleOrdenActual) {
      // Guardamos backup por si falla la red
      const backup = { ...detalleOrdenActual };
      
      // Aplicamos cambio instantáneo en la pantalla
      const nuevosDetalles = detalleOrdenActual.detalles.map(det => 
        det.id === detalleId ? { ...det, estatus: nuevoEstatus } : det
      );
      setDetalleOrdenActual({ ...detalleOrdenActual, detalles: nuevosDetalles });

      // Enviamos a la base de datos
      const { error } = await PedidosService.actualizarEstatusItem(detalleId, nuevoEstatus);
      
      if (error) {
        toast.error('Error de conexión al actualizar item');
        setDetalleOrdenActual(backup); // Revertimos al estado anterior
        return false;
      }
    }
    return true;
  };

  // ==========================================
  // ACCIONES DE LA ORDEN (CIERRE Y GESTIÓN)
  // ==========================================

  // 4. Cambiar estatus global (Pasar a 'En Proceso', 'Completado', etc.)
  const cambiarEstatusOrden = async (ordenId, nuevoEstatus) => {
    setLoading(true);
    const { error } = await PedidosService.actualizarEstatusOrden(ordenId, nuevoEstatus);
    setLoading(false);

    if (error) {
      toast.error(`Error al cambiar estatus a ${nuevoEstatus}`);
      return false;
    }

    // FEEDBACK VISUAL
    if (nuevoEstatus === 'Completado') {
      toast.success('¡Orden enviada al Historial!');
    } else {
      toast.success(`Orden actualizada a ${nuevoEstatus}`);
    }
    
    // LOGICA DE REFRESCO:
    if (['Completado', 'Cancelado'].includes(nuevoEstatus)) {
      setOrdenesActivas(prev => prev.filter(o => o.id !== ordenId));
      setDetalleOrdenActual(null);
    } else {
      await cargarOrdenesActivas();
    }
    
    return true;
  };

  // 5. Cancelación directa desde el Dashboard o Checklist
  const cancelarPedido = async (ordenId) => {
    if (!window.confirm('¿Confirmas que deseas cancelar este pedido? Se moverá al historial como cancelado.')) return;

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