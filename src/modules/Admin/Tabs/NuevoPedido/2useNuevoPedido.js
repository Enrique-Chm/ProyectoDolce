// src/modules/Admin/Tabs/NuevoPedido/useNuevoPedido.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { PedidosService } from '../Pedidos/1Pedidos.Service';
import { AuthService } from '../../../Auth/Auth.service';
import toast from 'react-hot-toast';

export const useNuevoPedido = (onVolver) => {
  const [loading, setLoading] = useState(false);
  
  // Obtenemos la sesión para automatizar solicitante y sucursal
  const sesion = AuthService.getSesion();

  // --- ESTADOS DE CATÁLOGOS ---
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [catalogos, setCatalogos] = useState({
    proveedores: [] // Solo mantenemos proveedores por si se requiere consulta, aunque el proceso es auto
  });

  // --- ESTADO DE LA CABECERA (INFO GENERAL) ---
  const [header, setHeader] = useState({
    solicitante_id: sesion?.id || '',          // Automático de sesión
    sucursal_id: sesion?.sucursal_id || '',    // Automático de sesión
    proveedor_id: '',                          // Se ligará al primer producto agregado
    prioridad: 'Normal',
    observaciones: ''
  });

  // --- ESTADO DEL CARRITO Y SELECCIÓN ---
  const [carrito, setCarrito] = useState([]);
  const [seleccion, setSeleccion] = useState({
    producto_id: '',
    cantidad: 1
  });

  // ==========================================
  // CARGA DE DATOS INICIALES (OPTIMIZADA)
  // ==========================================
  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const [resProds, resCats] = await Promise.all([
        PedidosService.getProductosParaOrden(),
        PedidosService.getCatalogosParaOrden()
      ]);

      if (resProds.error) throw resProds.error;
      if (resCats.error) throw resCats.error;

      setProductosDisponibles(resProds.data || []);
      setCatalogos({
        proveedores: resCats.proveedores
        // Ya no cargamos sucursales ni trabajadores: ahorro de ancho de banda
      });
    } catch (err) {
      toast.error('Error al sincronizar catálogos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // ==========================================
  // LÓGICA DEL CARRITO (VINCULACIÓN DE PROVEEDOR)
  // ==========================================
  
  const agregarAlCarrito = () => {
    const { producto_id, cantidad } = seleccion;

    if (!producto_id || cantidad <= 0) {
      return toast.error('Selecciona un producto y cantidad válida');
    }

    const productoInfo = productosDisponibles.find(p => p.id === producto_id);
    const existe = carrito.find(item => item.producto_id === producto_id);
    
    if (existe) {
      setCarrito(carrito.map(item => 
        item.producto_id === producto_id 
          ? { ...item, cantidad: Number(item.cantidad) + Number(cantidad) }
          : item
      ));
    } else {
      setCarrito([...carrito, {
        producto_id: productoInfo.id,
        nombre: productoInfo.nombre,
        marca: productoInfo.marca,
        presentacion: productoInfo.presentacion,
        abreviatura_um: productoInfo.um?.abreviatura || 'pz',
        costo_unitario: productoInfo.costo_actual || 0,
        cantidad: Number(cantidad),
        proveedor_id: productoInfo.proveedor_id // Guardamos referencia por item
      }]);
    }

    /**
     * LÓGICA DE PROVEEDOR AUTOMÁTICO:
     * Si la orden aún no tiene proveedor definido, le asignamos el del primer producto
     */
    if (!header.proveedor_id && productoInfo.proveedor_id) {
      setHeader(prev => ({ ...prev, proveedor_id: productoInfo.proveedor_id }));
    }

    setSeleccion({ producto_id: '', cantidad: 1 });
    toast.success('Agregado al carrito');
  };

  const eliminarDelCarrito = (id) => {
    const nuevoCarrito = carrito.filter(item => item.producto_id !== id);
    setCarrito(nuevoCarrito);
    
    // Si vaciamos el carrito, reseteamos el proveedor de la cabecera
    if (nuevoCarrito.length === 0) {
      setHeader(prev => ({ ...prev, proveedor_id: '' }));
    }
  };

  const totalEstimado = useMemo(() => {
    return carrito.reduce((acc, item) => acc + (item.cantidad * item.costo_unitario), 0);
  }, [carrito]);

  // ==========================================
  // PROCESAR LA ORDEN (VINCULACIÓN TOTAL)
  // ==========================================
  
  const procesarOrden = async () => {
    if (carrito.length === 0) return toast.error('El carrito está vacío');
    
    // Verificamos que los datos de sesión sigan presentes
    if (!header.solicitante_id || !header.sucursal_id) {
      return toast.error('Error de identidad: Tu usuario no tiene una sucursal asignada.');
    }

    setLoading(true);
    try {
      const folio = `OC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const ordenCabecera = {
        folio,
        solicitante_id: header.solicitante_id,
        sucursal_id: header.sucursal_id,
        proveedor_id: header.proveedor_id || null, // Viene del producto auto-asignado
        prioridad: header.prioridad,
        total_estimado: totalEstimado,
        estatus: 'Pendiente',
        notas: header.observaciones
      };

      const { error } = await PedidosService.crearNuevaOrden(ordenCabecera, carrito);

      if (error) throw error;

      toast.success(`Orden ${folio} generada con éxito`);
      setCarrito([]);
      if (onVolver) onVolver();

    } catch (err) {
      console.error(err);
      toast.error('Error al guardar la orden');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    productosDisponibles,
    catalogos,
    header,
    setHeader,
    carrito,
    seleccion,
    setSeleccion,
    totalEstimado,
    agregarAlCarrito,
    eliminarDelCarrito,
    procesarOrden
  };
};