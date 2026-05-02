// src/modules/Admin/Tabs/Pedidos/2usePedidos.js
import { useState, useCallback } from 'react';
import { PedidosService } from './1Pedidos.Service';
import { AuthService } from '../../../Auth/Auth.service'; 
import toast from 'react-hot-toast';

export const usePedidos = () => {
  const [loading, setLoading] = useState(false);
  
  // Recuperamos la sesión actual
  const sesion = AuthService.getSesion();
  
  // Estado para el Dashboard (Solo lo que está en curso)
  const [ordenesActivas, setOrdenesActivas] = useState([]);

  // Estado para el Historial (Órdenes Completadas / Canceladas en rango de fechas)
  const [ordenesHistorial, setOrdenesHistorial] = useState([]);
  
  // Estado para el Checklist (Operación en tiempo real)
  const [detalleOrdenActual, setDetalleOrdenActual] = useState(null);

  /**
   * EXTRAER VALORES PRIMITIVOS PARA DEPENDENCIAS
   * Esto es vital para evitar el bucle infinito. Usamos el ID y el permiso (boolean)
   * en lugar del objeto 'sesion' completo, ya que los objetos cambian de referencia 
   * en cada renderizado.
   */
  const sucursalId = sesion?.sucursal_id;
  const tieneAccesoGlobal = sesion?.permisos?.configuracion?.leer || false;

  // ==========================================
  // OBTENCIÓN DE DATOS (READ)
  // ==========================================

  /**
   * Carga las órdenes para la pestaña "Activos" aplicando filtros de seguridad.
   * Las dependencias [sucursalId, tieneAccesoGlobal] ahora son estables.
   */
  const cargarOrdenesActivas = useCallback(async () => {
    setLoading(true);
    const { data, error } = await PedidosService.getOrdenesActivas();
    
    if (error) {
      toast.error('Error al sincronizar pedidos activos');
      console.error("Error getOrdenesActivas:", error.message);
      setLoading(false);
      return;
    }

    let datosFinales = data || [];

    /**
     * LÓGICA DE VISIBILIDAD BASADA EN PERMISOS JSON:
     * Si no tiene acceso global, filtramos por la sucursal del usuario.
     */
    if (!tieneAccesoGlobal && sucursalId) {
        datosFinales = datosFinales.filter(orden => orden.sucursal_id === sucursalId);
    }

    setOrdenesActivas(datosFinales);
    setLoading(false);
  }, [sucursalId, tieneAccesoGlobal]);

  /**
   * Carga el historial de órdenes completadas o canceladas filtrado por rango de fechas
   * aplicando los mismos filtros de seguridad de sucursal.
   */
  const cargarHistorialPorFechas = useCallback(async (fechaInicio, fechaFin) => {
    if (!fechaInicio || !fechaFin) {
      toast.error('Selecciona un rango de fechas válido');
      return;
    }

    setLoading(true);
    const { data, error } = await PedidosService.getHistorialPorFechas(fechaInicio, fechaFin);
    
    if (error) {
      toast.error('Error al recuperar historial');
      console.error("Error getHistorialPorFechas:", error.message);
      setLoading(false);
      return;
    }

    let datosFinales = data || [];

    /**
     * LÓGICA DE VISIBILIDAD BASADA EN PERMISOS JSON:
     * Filtramos por sucursal de igual manera que con las activas si no es administrador global.
     */
    if (!tieneAccesoGlobal && sucursalId) {
      datosFinales = datosFinales.filter(orden => orden.sucursal_id === sucursalId);
    }

    setOrdenesHistorial(datosFinales);
    setLoading(false);
  }, [sucursalId, tieneAccesoGlobal]);

  /**
   * Carga el detalle profundo de una orden (Cabecera + Partidas)
   */
  const cargarDetalleDeOrden = useCallback(async (ordenId) => {
    if (!ordenId) return;
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

  /**
   * Cambia el estado de un item (Pendiente <-> Comprado).
   * Usa Optimistic UI para que la experiencia en móviles sea instantánea.
   */
  const toggleEstatusItem = async (detalleId, estatusActual) => {
    const nuevoEstatus = estatusActual === 'Comprado' ? 'Pendiente' : 'Comprado';
    
    if (detalleOrdenActual) {
      // 1. Guardamos backup por si falla la conexión
      const backup = { ...detalleOrdenActual };
      
      // 2. Actualizamos la UI inmediatamente (Optimista)
      const nuevosDetalles = detalleOrdenActual.detalles.map(det => 
        det.id === detalleId ? { ...det, estatus: nuevoEstatus } : det
      );
      setDetalleOrdenActual({ ...detalleOrdenActual, detalles: nuevosDetalles });

      // 3. Enviamos la petición a Supabase
      const { error } = await PedidosService.actualizarEstatusItem(detalleId, nuevoEstatus);
      
      if (error) {
        toast.error('Error de red al actualizar item');
        setDetalleOrdenActual(backup); // Revertimos en caso de error
        return false;
      }
    }
    return true;
  };

  /**
   * Pasa un producto no disponible al segundo proveedor registrado de ese insumo.
   * Crea una nueva orden para el segundo proveedor y retira el item de la orden actual.
   */
  const pasarASegundoProveedor = async (detalleId, productoId) => {
    if (!detalleId || !productoId) return false;
    setLoading(true);

    try {
      const { error } = await PedidosService.cambiarAlSegundoProveedor(detalleId, productoId);

      if (error) {
        toast.error(error.message || 'No se pudo transferir el insumo al segundo proveedor');
        setLoading(false);
        return false;
      }

      setLoading(false);
      return true;
    } catch (err) {
      console.error('Error en pasarASegundoProveedor:', err);
      toast.error('Ocurrió un error inesperado');
      setLoading(false);
      return false;
    }
  };

  // ==========================================
  // ACCIONES DE LA ORDEN (CIERRE Y GESTIÓN)
  // ==========================================

  /**
   * Cambia el estatus global de la orden (ej: pasar a 'Completado')
   */
  const cambiarEstatusOrden = async (ordenId, nuevoEstatus) => {
    setLoading(true);
    const { error } = await PedidosService.actualizarEstatusOrden(ordenId, nuevoEstatus);
    setLoading(false);

    if (error) {
      toast.error(`Error al cambiar estatus a ${nuevoEstatus}`);
      return false;
    }

    // Feedback visual al usuario
    if (nuevoEstatus === 'Completado') {
      toast.success('¡Orden finalizada y guardada!');
    } else {
      toast.success(`Orden marcada como ${nuevoEstatus}`);
    }
    
    // Limpieza de estados tras completar o cancelar
    if (['Completado', 'Cancelado'].includes(nuevoEstatus)) {
      setOrdenesActivas(prev => prev.filter(o => o.id !== ordenId));
      setDetalleOrdenActual(null);
    } else {
      // Si solo cambió a "En Proceso", refrescamos la lista
      await cargarOrdenesActivas();
    }
    
    return true;
  };

  /**
   * Cancela la orden completa
   */
  const cancelarPedido = async (ordenId) => {
    if (!window.confirm('¿Seguro que deseas cancelar este pedido? Se moverá al historial como cancelado.')) return;

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
    ordenesHistorial,
    detalleOrdenActual,
    setDetalleOrdenActual,
    cargarOrdenesActivas,
    cargarHistorialPorFechas,
    cargarDetalleDeOrden,
    toggleEstatusItem,
    pasarASegundoProveedor,
    cambiarEstatusOrden,
    cancelarPedido
  };
};