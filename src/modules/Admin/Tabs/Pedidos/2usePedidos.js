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

  /**
   * Carga las órdenes para la pestaña "Activos" aplicando filtros por sucursal.
   */
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

      // Si el usuario no es administrador global, solo ve lo de su sucursal
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

  /**
   * Carga el detalle profundo de una orden (Cabecera + Partidas)
   */
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

  /**
   * Cambia el estado de un item (Pendiente <-> Comprado).
   * Implementa Optimistic UI para que el check sea instantáneo.
   */
  const toggleEstatusItem = async (detalleId, estatusActual) => {
    const nuevoEstatus = estatusActual === 'Comprado' ? 'Pendiente' : 'Comprado';
    
    if (detalleOrdenActual) {
      // 1. Backup de seguridad
      const backup = { ...detalleOrdenActual };
      
      // 2. Actualización optimista
      const nuevosDetalles = detalleOrdenActual.detalles.map(det => 
        det.id === detalleId ? { ...det, estatus: nuevoEstatus } : det
      );
      setDetalleOrdenActual({ ...detalleOrdenActual, detalles: nuevosDetalles });

      // 3. Petición real
      const { error } = await PedidosService.actualizarEstatusItem(detalleId, nuevoEstatus);
      
      if (error) {
        toast.error('Error de conexión al actualizar ítem');
        setDetalleOrdenActual(backup); // Revertimos cambios si falla
        return false;
      }
    }
    return true;
  };

  /**
   * Gestiona el traspaso de un insumo al segundo proveedor por falta de stock.
   * Remueve el ítem del checklist actual tras la transferencia exitosa.
   */
  const pasarASegundoProveedor = async (detalleId, productoId) => {
    if (!detalleId || !productoId) return false;
    
    // Preguntamos al usuario para evitar reasignaciones accidentales
    const confirmar = window.confirm('¿Confirmas que no hay stock? Se creará un nuevo pedido con el proveedor secundario.');
    if (!confirmar) return false;

    setLoading(true);
    try {
      const { success, nuevoFolio, error } = await PedidosService.cambiarAlSegundoProveedor(detalleId, productoId);

      if (!success) {
        toast.error(error || 'No se pudo transferir el insumo');
        return false;
      }

      // LIMPIEZA LOCAL (UI): Eliminamos el ítem del checklist actual
      if (detalleOrdenActual) {
        const nuevosDetalles = detalleOrdenActual.detalles.filter(det => det.id !== detalleId);
        setDetalleOrdenActual({ ...detalleOrdenActual, detalles: nuevosDetalles });
      }

      toast.success(`Insumo reasignado al pedido: ${nuevoFolio}`, { duration: 5000 });
      return true;
    } catch (err) {
      console.error('Error en pasarASegundoProveedor:', err);
      toast.error('Ocurrió un error inesperado');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // ACCIONES DE LA ORDEN (CIERRE Y GESTIÓN)
  // ==========================================

  /**
   * Cambia el estatus global de la orden
   */
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
   * Cancela la orden completa.
   */
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
    pasarASegundoProveedor,
    cambiarEstatusOrden,
    cancelarPedido
  };
};