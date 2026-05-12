// src/modules/Admin/Tabs/NuevoPedido/2useNuevoPedido.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { NuevoPedidoService } from './1NuevoPedido.Service';
import { AuthService } from '../../../Auth/Auth.service';
import toast from 'react-hot-toast';

export const useNuevoPedido = (onVolver) => {
  const [loading, setLoading] = useState(false);
  const sesion = AuthService.getSesion();

  // --- ESTADOS DE DATOS ---
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [carrito, setCarrito] = useState([]);

  // --- ESTADO DE LA CABECERA ---
  const [header, setHeader] = useState({
    solicitante_id: sesion?.id || '',
    sucursal_id: sesion?.sucursal_id || '',
    observaciones: ''
  });

  // Estabilización de permisos para evitar re-renderizados infinitos
  const categoriasPermitidasStr = JSON.stringify(sesion?.permisos?.categorias_permitidas || []);

  // ==========================================
  // 1. CARGA Y FILTRADO INICIAL
  // ==========================================
  const cargarProductos = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await NuevoPedidoService.getProductosDisponibles();
      if (error) throw error;

      const categoriasPermitidas = JSON.parse(categoriasPermitidasStr);
      const sucursalUsuario = sesion?.sucursal_id;

      /**
       * NORMALIZACIÓN Y FILTRADO:
       * Mapeamos contenido y UM para que la UI pueda calcular el volumen total.
       */
      const procesados = (data || [])
        .map(p => ({
          ...p,
          categoria_nombre: p.categoria?.nombre || 'General',
          um_abreviatura: p.um?.abreviatura || 'pz',
          // Aseguramos que contenido sea numérico y mínimo 1
          contenido_numerico: Number(p.contenido) || 1
        }))
        .filter(p => {
          // Filtro por permisos de categoría
          const cumpleCat = categoriasPermitidas.length === 0 || categoriasPermitidas.includes(p.categoria_id);
          
          // Filtro por sucursal asignada (si el array está vacío, es producto global)
          const cumpleSuc = !p.sucursales_ids || 
                           p.sucursales_ids.length === 0 || 
                           p.sucursales_ids.includes(sucursalUsuario);
          
          return cumpleCat && cumpleSuc;
        });

      setProductosDisponibles(procesados);
    } catch (err) {
      console.error("Error al sincronizar catálogo:", err);
      toast.error('No se pudo cargar el catálogo de insumos');
    } finally {
      setLoading(false);
    }
  }, [categoriasPermitidasStr, sesion?.sucursal_id]);

  useEffect(() => {
    cargarProductos();
  }, [cargarProductos]);

  // ==========================================
  // 2. GESTIÓN DEL CARRITO (CON CONCIENCIA DE UNIDAD)
  // ==========================================
  
  const agregarAlCarrito = useCallback((producto, cantidad = 1) => {
    const numCant = Number(cantidad);
    if (isNaN(numCant) || numCant <= 0) return;

    setCarrito(prev => {
      const existe = prev.find(item => item.producto_id === producto.id);
      
      if (existe) {
        return prev.map(item => 
          item.producto_id === producto.id 
            ? { ...item, cantidad: item.cantidad + numCant }
            : item
        );
      }

      // Guardamos toda la metadata necesaria para el resumen y la base de datos
      return [...prev, {
        producto_id: producto.id,
        nombre: producto.nombre,
        marca: producto.marca,
        abreviatura_um: producto.um_abreviatura, // ej. "L"
        costo_unitario: producto.costo_actual || 0,
        cantidad: numCant,
        proveedor_id: producto.proveedor_id,
        categoria_nombre: producto.categoria_nombre,
        presentacion: producto.presentacion || 'Unidad', // ej. "Caja"
        contenido: producto.contenido_numerico // ej. 6
      }];
    });

    toast.success(`${producto.nombre} agregado`, { duration: 1500, icon: '🛒' });
  }, []);

  const eliminarDelCarrito = (id) => {
    setCarrito(prev => prev.filter(item => item.producto_id !== id));
    toast.success('Insumo removido');
  };

  const totalEstimado = useMemo(() => {
    return carrito.reduce((acc, item) => acc + (item.cantidad * item.costo_unitario), 0);
  }, [carrito]);

  // ==========================================
  // 3. PROCESAMIENTO FINAL (DIVISIÓN POR PROVEEDOR)
  // ==========================================
  
  const procesarOrden = async () => {
    if (carrito.length === 0) return toast.error('El carrito está vacío');
    if (!header.solicitante_id || !header.sucursal_id) {
      return toast.error('Error de sesión: Usuario o sucursal no identificados');
    }

    setLoading(true);
    try {
      // 1. Agrupamos por proveedor_id para generar órdenes independientes
      const gruposPorProveedor = carrito.reduce((acc, item) => {
        const pId = item.proveedor_id || 'SIN-PROVEEDOR';
        if (!acc[pId]) acc[pId] = [];
        acc[pId].push(item);
        return acc;
      }, {});

      const idsProveedores = Object.keys(gruposPorProveedor);

      // 2. Insertamos cada Orden de Compra
      for (const pId of idsProveedores) {
        const itemsGrupo = gruposPorProveedor[pId];
        const subtotal = itemsGrupo.reduce((acc, i) => acc + (i.cantidad * i.costo_unitario), 0);
        
        const randomStr = Math.random().toString(36).substring(7).toUpperCase();
        const folio = `REQ-${new Date().getFullYear()}-${randomStr}`;

        const payloadCabecera = {
          folio,
          solicitante_id: header.solicitante_id,
          sucursal_id: header.sucursal_id,
          proveedor_id: pId === 'SIN-PROVEEDOR' ? null : pId,
          total_estimado: subtotal,
          notas: header.observaciones,
          estatus: 'Pendiente'
        };

        const { error } = await NuevoPedidoService.guardarOrdenCompleta(payloadCabecera, itemsGrupo);
        if (error) throw error;
      }

      toast.success(`Se enviaron ${idsProveedores.length} requisiciones con éxito`);
      setCarrito([]); 
      if (onVolver) onVolver(); 

    } catch (err) {
      console.error("Error al procesar pedido:", err);
      toast.error('Error al guardar la orden en el servidor');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    productosDisponibles,
    header,
    setHeader,
    carrito,
    totalEstimado,
    agregarAlCarrito,
    eliminarDelCarrito,
    procesarOrden
  };
};