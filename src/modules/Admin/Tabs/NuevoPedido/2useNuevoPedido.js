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
    proveedores: [] 
  });

  // --- ESTADO DE LA CABECERA (INFO GENERAL) ---
  const [header, setHeader] = useState({
    solicitante_id: sesion?.id || '',          // Automático de sesión
    sucursal_id: sesion?.sucursal_id || '',    // Automático de sesión
    proveedor_id: '',                          // Se manejará dinámicamente al procesar
    prioridad: 'Normal',
    observaciones: ''
  });

  // --- ESTADO DEL CARRITO Y SELECCIÓN ---
  const [carrito, setCarrito] = useState([]);
  const [seleccion, setSeleccion] = useState({
    producto_id: '',
    cantidad: 1
  });

  /**
   * ESTABILIZACIÓN DE DEPENDENCIAS:
   * Convertimos las categorías permitidas en texto para evitar que el cambio de 
   * referencia del objeto 'sesion.permisos' dispare bucles infinitos en el useEffect.
   */
  const categoriasPermitidasStr = JSON.stringify(sesion?.permisos?.categorias_permitidas || []);

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

      const todosLosProductos = resProds.data || [];
      const categoriasPermitidas = JSON.parse(categoriasPermitidasStr);

      let productosFiltrados = todosLosProductos;

      if (categoriasPermitidas && Array.isArray(categoriasPermitidas) && categoriasPermitidas.length > 0) {
        productosFiltrados = todosLosProductos.filter(prod => 
          categoriasPermitidas.includes(prod.categoria_id)
        );
      }

      setProductosDisponibles(productosFiltrados);
      setCatalogos({
        proveedores: resCats.proveedores
      });
    } catch (err) {
      toast.error('Error al sincronizar catálogos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [categoriasPermitidasStr]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // ==========================================
  // LÓGICA DEL CARRITO
  // ==========================================
  
  const agregarAlCarrito = () => {
    const { producto_id, cantidad } = seleccion;

    if (!producto_id || cantidad <= 0) {
      return toast.error('Selecciona un producto y cantidad válida');
    }

    const productoInfo = productosDisponibles.find(p => p.id === producto_id);
    const existe = carrito.find(item => item.producto_id === producto_id);
    
    // Extracción inteligente del empaque/presentación
    let empaqueSugerido = productoInfo.um?.abreviatura || 'pz';
    if (productoInfo.presentacion) {
      const primeraPalabra = productoInfo.presentacion.trim().split(' ')[0];
      if (isNaN(primeraPalabra) && primeraPalabra.length > 0) {
        empaqueSugerido = primeraPalabra;
      }
    }

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
        contenido: productoInfo.contenido,
        abreviatura_um: productoInfo.um?.abreviatura || 'pz',
        empaque: empaqueSugerido,
        costo_unitario: productoInfo.costo_actual || 0,
        cantidad: Number(cantidad),
        proveedor_id: productoInfo.proveedor_id // Guardamos referencia por item
      }]);
    }

    setSeleccion({ producto_id: '', cantidad: 1 });
    toast.success('Agregado al carrito');
  };

  const eliminarDelCarrito = (id) => {
    const nuevoCarrito = carrito.filter(item => item.producto_id !== id);
    setCarrito(nuevoCarrito);
  };

  const totalEstimado = useMemo(() => {
    return carrito.reduce((acc, item) => acc + (item.cantidad * item.costo_unitario), 0);
  }, [carrito]);

  // ==========================================
  // PROCESAR LA ORDEN (CON DIVISIÓN POR PROVEEDOR)
  // ==========================================
  
  const procesarOrden = async () => {
    if (carrito.length === 0) return toast.error('El carrito está vacío');
    if (loading) return; // Evitamos ejecuciones duplicadas
    
    if (!header.solicitante_id || !header.sucursal_id) {
      return toast.error('Error de identidad: Tu usuario no tiene una sucursal asignada.');
    }

    setLoading(true);

    try {
      // 1. Agrupar los productos del carrito por proveedor_id
      const itemsPorProveedor = carrito.reduce((acc, item) => {
        const provId = item.proveedor_id || 'sin-proveedor';
        if (!acc[provId]) acc[provId] = [];
        acc[provId].push(item);
        return acc;
      }, {});

      const proveedoresUnicos = Object.keys(itemsPorProveedor);

      // 2. Iterar sobre cada proveedor y crear una orden individual
      for (const provId of proveedoresUnicos) {
        const itemsProveedor = itemsPorProveedor[provId];
        const totalProv = itemsProveedor.reduce((acc, item) => acc + (item.cantidad * item.costo_unitario), 0);
        
        const folio = `OC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

        const ordenCabecera = {
          folio,
          solicitante_id: header.solicitante_id,
          sucursal_id: header.sucursal_id,
          proveedor_id: provId === 'sin-proveedor' ? null : provId,
          prioridad: header.prioridad,
          total_estimado: totalProv,
          estatus: 'Pendiente',
          notes: header.observaciones // El service normaliza 'notes' y 'notas'
        };

        const { error } = await PedidosService.crearNuevaOrden(ordenCabecera, itemsProveedor);
        
        if (error) throw error;
      }

      toast.success(`Se generaron ${proveedoresUnicos.length} requisiciones con éxito`);
      setCarrito([]);
      setLoading(false);
      
      if (onVolver) onVolver();

    } catch (err) {
      console.error(err);
      toast.error('Error al guardar las órdenes de compra');
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