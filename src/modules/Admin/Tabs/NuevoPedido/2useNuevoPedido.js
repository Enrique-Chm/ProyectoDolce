// src/modules/Admin/Tabs/NuevoPedido/2useNuevoPedido.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { NuevoPedidoService } from './1NuevoPedido.Service';
import { AuthService } from '../../../Auth/Auth.service';
import toast from 'react-hot-toast';

export const useNuevoPedido = (onVolver) => {
  const [loading, setLoading] = useState(false);
  
  // Obtenemos la sesión para automatizar solicitante y sucursal
  const sesion = AuthService.getSesion();

  // --- ESTADOS DE DATOS ---
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [catalogos, setCatalogos] = useState({
    proveedores: [] 
  });

  // --- ESTADO DE LA CABECERA (INFO GENERAL) ---
  const [header, setHeader] = useState({
    solicitante_id: sesion?.id || '',          // Automático de sesión
    sucursal_id: sesion?.sucursal_id || '',    // Automático de sesión
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
   * Evitamos bucles infinitos con los permisos de la sesión transformando
   * el array de permisos en un string para el array de dependencias.
   */
  const categoriasPermitidasStr = JSON.stringify(sesion?.permisos?.categorias_permitidas || []);

  // ==========================================
  // CARGA DE DATOS INICIALES (NORMALIZADA)
  // ==========================================
  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await NuevoPedidoService.getProductosDisponibles();

      if (error) throw error;

      const todosLosProductos = data || [];
      const categoriasPermitidas = JSON.parse(categoriasPermitidasStr);

      /**
       * --- PASO DE NORMALIZACIÓN ---
       * Aplanamos las relaciones (categoria y um) para que el filtrado 
       * en el componente visual (JSX) sea directo e infalible.
       */
      const productosNormalizados = todosLosProductos.map(prod => ({
        ...prod,
        // Si categoria es objeto extraemos nombre, si no, lo marcamos como 'General'
        categoria_nombre: prod.categoria?.nombre || 'General',
        // Si UM es objeto extraemos abreviatura
        um_abreviatura: prod.um?.abreviatura || 'pz'
      }));

      let productosFiltrados = productosNormalizados;

      // Aplicar filtro de seguridad por permisos del usuario (si existen)
      if (categoriasPermitidas && Array.isArray(categoriasPermitidas) && categoriasPermitidas.length > 0) {
        productosFiltrados = productosNormalizados.filter(prod => 
          categoriasPermitidas.includes(prod.categoria_id)
        );
      }

      setProductosDisponibles(productosFiltrados);

      // Mapeamos los proveedores únicos basados en los productos cargados
      const mapProveedores = {};
      todosLosProductos.forEach(p => {
        if (p.proveedor && p.proveedor.id) {
          mapProveedores[p.proveedor.id] = { id: p.proveedor.id, nombre: p.proveedor.nombre };
        }
      });

      setCatalogos({
        proveedores: Object.values(mapProveedores)
      });
    } catch (err) {
      toast.error('Error al sincronizar catálogos de insumos');
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
  
  const agregarAlCarrito = useCallback(() => {
    const { producto_id, cantidad } = seleccion;

    if (!producto_id || cantidad <= 0) return;

    const productoInfo = productosDisponibles.find(p => p.id === producto_id);
    if (!productoInfo) return;

    const existe = carrito.find(item => item.producto_id === producto_id);
    
    // Extracción inteligente del empaque/presentación para visualización en el resumen
    let empaqueSugerido = productoInfo.um_abreviatura;
    if (productoInfo.presentacion) {
      const primeraPalabra = productoInfo.presentacion.trim().split(' ')[0];
      // Si la primera palabra no es un número (ej: "Saco de 20kg"), la usamos como empaque
      if (isNaN(primeraPalabra) && primeraPalabra.length > 0) {
        empaqueSugerido = primeraPalabra;
      }
    }

    if (existe) {
      // Si ya existe, reemplazamos la cantidad (comportamiento de edición directa)
      setCarrito(prev => prev.map(item => 
        item.producto_id === producto_id 
          ? { ...item, cantidad: Number(cantidad) }
          : item
      ));
    } else {
      // Si es nuevo, lo agregamos con toda su metadata normalizada
      setCarrito(prev => [...prev, {
        producto_id: productoInfo.id,
        nombre: productoInfo.nombre,
        marca: productoInfo.marca,
        presentacion: productoInfo.presentacion,
        contenido: productoInfo.contenido,
        abreviatura_um: productoInfo.um_abreviatura,
        empaque: empaqueSugerido,
        costo_unitario: productoInfo.costo_actual || 0,
        cantidad: Number(cantidad),
        proveedor_id: productoInfo.proveedor_id,
        categoria_nombre: productoInfo.categoria_nombre
      }]);
    }

    // Resetear el estado de selección
    setSeleccion({ producto_id: '', cantidad: 1 });
  }, [seleccion, productosDisponibles, carrito]);

  const eliminarDelCarrito = (id) => {
    setCarrito(prev => prev.filter(item => item.producto_id !== id));
  };

  const totalEstimado = useMemo(() => {
    return carrito.reduce((acc, item) => acc + (item.cantidad * item.costo_unitario), 0);
  }, [carrito]);

  // ==========================================
  // PROCESAR LA ORDEN (CON DIVISIÓN POR PROVEEDOR)
  // ==========================================
  
  const procesarOrden = async () => {
    if (carrito.length === 0) return toast.error('El carrito está vacío');
    if (loading) return; 
    
    if (!header.solicitante_id || !header.sucursal_id) {
      return toast.error('Error: No se encontró sucursal o solicitante en tu sesión.');
    }

    setLoading(true);

    try {
      // 1. Agrupar los ítems del carrito por proveedor para crear órdenes separadas
      const itemsPorProveedor = carrito.reduce((acc, item) => {
        const provId = item.proveedor_id || 'sin-proveedor';
        if (!acc[provId]) acc[provId] = [];
        acc[provId].push(item);
        return acc;
      }, {});

      const proveedoresUnicos = Object.keys(itemsPorProveedor);

      // 2. Generar y guardar una orden por cada proveedor involucrado
      for (const provId of proveedoresUnicos) {
        const itemsProveedor = itemsPorProveedor[provId];
        const totalProv = itemsProveedor.reduce((acc, item) => acc + (item.cantidad * item.costo_unitario), 0);
        
        const año = new Date().getFullYear();
        const random = Math.floor(1000 + Math.random() * 9000);
        const folio = `OC-${año}-${random}`;

        const ordenCabecera = {
          folio,
          solicitante_id: header.solicitante_id,
          sucursal_id: header.sucursal_id,
          proveedor_id: provId === 'sin-proveedor' ? null : provId,
          prioridad: header.prioridad,
          total_estimado: totalProv,
          estatus: 'Pendiente',
          notas: header.observaciones 
        };

        const { error } = await NuevoPedidoService.guardarOrdenCompleta(ordenCabecera, itemsProveedor);
        if (error) throw error;
      }

      toast.success(`Se enviaron ${proveedoresUnicos.length} requisiciones correctamente`);
      setCarrito([]); // Limpiar carrito tras éxito
      
      if (onVolver) onVolver();

    } catch (err) {
      console.error(err);
      toast.error('Error al guardar las órdenes de compra');
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