// Archivo: src/modules/Admin/Tabs/MeseroTab/useMeseroTab.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { MeseroService } from './Mesero.service'; 
import { hasPermission } from '../../../../utils/checkPermiso';

/**
 * Hook Maestro para la gestión de Salón y Comandas (VERSIÓN PRO).
 * Controla el flujo desde la apertura de mesa hasta el envío a cocina.
 */
export const useMeseroTab = (sucursalId, usuarioId) => {
  const [view, setView] = useState('cuentas');
  const [cuentasAbiertas, setCuentasAbiertas] = useState([]);
  const [cuentasCobradas, setCuentasCobradas] = useState([]);
  const [ventaActiva, setVentaActiva] = useState(null);
  
  // 🚀 ESTADOS: MAPA DE MESAS (Incluye grid_size por zona)
  const [zonasMesas, setZonasMesas] = useState([]);
  const [mesaId, setMesaId] = useState(null); 
  const [mesaInput, setMesaInput] = useState(''); // Fallback de texto
  const [tipoOrden, setTipoOrden] = useState('salon'); // 'salon', 'mostrador', 'domicilio'
  const [comensales, setComensales] = useState(1);
  const [clienteNombre, setClienteNombre] = useState('');
  const [notasOrden, setNotasOrden] = useState('');

  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [loading, setLoading] = useState(false);

  // ESTADOS PARA EL MODAL DE EXTRAS
  const [mostrarModalExtras, setMostrarModalExtras] = useState(false);
  const [productoParaExtras, setProductoParaExtras] = useState(null);

  // 🛡️ PERMISOS: Basados en la familia 'comandas'
  const puedeVerVentas = hasPermission('ver_comandas');
  const puedeCrearVentas = hasPermission('crear_comandas');
  const puedeEditarVentas = hasPermission('editar_comandas');

  /**
   * Limpia el estado local para regresar a la vista de Salón
   */
  const resetTodo = useCallback(() => {
    setVentaActiva(null);
    setMesaInput('');
    setMesaId(null);
    setTipoOrden('salon');
    setComensales(1);
    setClienteNombre('');
    setNotasOrden('');
    setCarrito([]);
    setView('cuentas');
    setMostrarModalExtras(false);
    setProductoParaExtras(null);
  }, []);

  /**
   * 🔒 SEGURIDAD PROACTIVA:
   * Verifica si hay una caja abierta ANTES de dejar que el mesero haga nada.
   */
  const verificarCajaAntesDeAccion = async () => {
    setLoading(true);
    try {
      const { abierta, error } = await MeseroService.verificarCajaAbierta(Number(sucursalId));
      if (error) throw new Error(error);

      if (!abierta) {
        alert("⚠️ BLOQUEO DE SEGURIDAD: No hay una sesión de caja abierta en esta sucursal. Por favor, solicita al cajero iniciar el turno.");
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error al validar estado de caja:", error);
      alert("Error técnico al verificar la caja. Revisa tu conexión.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🚀 ACTUALIZADO: Carga el catálogo de zonas y mesas (con grid_size y coordenadas)
   */
  const cargarZonas = useCallback(async () => {
    if (!puedeVerVentas || !sucursalId) return;
    try {
      const { data, error } = await MeseroService.getZonasYMesas(Number(sucursalId));
      if (error) throw error;
      // 'data' ahora contiene grid_size por zona gracias al servicio actualizado
      setZonasMesas(data || []);
    } catch (err) {
      console.error("Error al cargar zonas:", err);
    }
  }, [sucursalId, puedeVerVentas]);

  /**
   * Carga las mesas (cuentas) activas de la sucursal
   */
  const cargarCuentas = useCallback(async () => {
    if (!puedeVerVentas || !sucursalId) return;
    setLoading(true);
    try {
      const { data, error } = await MeseroService.getCuentasAbiertas(Number(sucursalId));
      if (error) throw error;
      
      setCuentasAbiertas(data || []);
      
      // Sincronización de mesa activa
      setVentaActiva((prev) => {
        if (!prev) return null;
        const actualizada = (data || []).find(v => v.id === prev.id);
        if (!actualizada && prev.id) {
             alert("Esta mesa ya fue cerrada o liquidada.");
             setTimeout(() => resetTodo(), 0); 
             return null;
        }
        return actualizada;
      });
    } catch (err) {
      console.error("Error al cargar cuentas:", err);
    } finally {
      setLoading(false);
    }
  }, [sucursalId, puedeVerVentas, resetTodo]);

  /**
   * Carga el catálogo de platillos y categorías
   */
  const cargarMenu = useCallback(async () => {
    if (!puedeVerVentas || !sucursalId) return;
    try {
      const menuRes = await MeseroService.getMenuPOS(Number(sucursalId));
      setProductos(menuRes.data || []);

      const { data: catData } = await supabase.from('cat_categorias_menu').select('*').order('nombre');
      setCategorias(catData || []);
    } catch (err) {
      console.error("Error al cargar menú:", err);
    }
  }, [sucursalId, puedeVerVentas]);

  /**
   * Carga historial de ventas pagadas
   */
  const cargarHistorial = useCallback(async () => {
    if (!puedeVerVentas || !sucursalId) return;
    setLoading(true);
    try {
      const { data, error } = await MeseroService.getHistorialCobradas(Number(sucursalId));
      if (error) throw error;
      setCuentasCobradas(data || []);
    } catch (err) {
      console.error("Error al cargar historial:", err);
    } finally {
      setLoading(false);
    }
  }, [sucursalId, puedeVerVentas]);

  // Manejo de vistas automáticas
  useEffect(() => { 
    if (view === 'cuentas') {
      cargarCuentas(); 
      cargarZonas(); 
    }
  }, [view, cargarCuentas, cargarZonas]);
  
  useEffect(() => { 
    if (view === 'menu' && productos.length === 0) cargarMenu(); 
  }, [view, productos.length, cargarMenu]);
  
  useEffect(() => { 
    if (view === 'historial') cargarHistorial(); 
  }, [view, cargarHistorial]);
  
  const iniciarNuevaMesa = async () => {
    if (!puedeCrearVentas) return;
    const ok = await verificarCajaAntesDeAccion();
    if (ok) {
      setMesaInput('');
      setMesaId(null);
      setTipoOrden('salon');
      setComensales(1);
      setClienteNombre('');
      setNotasOrden('');
      setView("mesas");
    }
  };

  const seleccionarCuenta = async (venta = null) => {
    if (!puedeVerVentas) return;
    const ok = await verificarCajaAntesDeAccion();
    if (ok) {
      setVentaActiva(venta);
      setMesaInput(venta?.mesa || '');
      setMesaId(venta?.mesa_id || null);
      setTipoOrden(venta?.tipo_orden || 'salon');
      setComensales(venta?.comensales || 1);
      setClienteNombre(venta?.cliente_nombre || '');
      setNotasOrden(venta?.notas_orden || '');
      
      setCarrito([]); 
      setView('menu');
    }
  };

  /**
   * AGREGAR AL CARRITO INTERCEPTADO
   */
  const agregarAlCarrito = (p) => {
    if (!puedeCrearVentas) return alert("Sin permisos.");
    if (ventaActiva?.estado === 'por_cobrar') return alert("Mesa bloqueada por solicitud de cuenta.");

    if (p.grupos && p.grupos.length > 0) {
      setProductoParaExtras(p);
      setMostrarModalExtras(true);
      return; 
    }

    setCarrito(prev => {
      const existe = prev.find(item => item.id === p.id && (!item.extras_seleccionados || item.extras_seleccionados.length === 0));
      if (existe) {
        return prev.map(item => item.cartItemId === existe.cartItemId ? { ...item, cantidad: item.cantidad + 1 } : item);
      }
      return [...prev, { 
        cartItemId: Date.now().toString() + Math.random().toString(), 
        id: p.id, 
        nombre: p.nombre, 
        precio_venta: p.precio_venta, 
        precio_calculado: p.precio_venta, 
        costo_actual: p.costo_actual || 0, 
        cantidad: 1, 
        notas: '',
        extras_seleccionados: []
      }];
    });
  };

  /**
   * CONFIRMAR PRODUCTO CON EXTRAS
   */
  const confirmarProductoConExtras = (producto, extrasSeleccionados) => {
    const precioDeExtras = extrasSeleccionados.reduce((sum, ext) => sum + parseFloat(ext.precio_venta || 0), 0);
    const precioTotalCalculado = parseFloat(producto.precio_venta) + precioDeExtras;

    setCarrito(prev => [...prev, {
      cartItemId: Date.now().toString() + Math.random().toString(), 
      id: producto.id,
      nombre: producto.nombre,
      precio_venta: producto.precio_venta,
      precio_calculado: precioTotalCalculado,
      costo_actual: producto.costo_actual || 0,
      cantidad: 1, 
      notas: '',
      extras_seleccionados: extrasSeleccionados
    }]);

    setMostrarModalExtras(false);
    setProductoParaExtras(null);
  };

  const cerrarModalExtras = () => {
    setMostrarModalExtras(false);
    setProductoParaExtras(null);
  };

  const eliminarDelCarrito = (cartItemId) => {
    if (ventaActiva?.estado === 'por_cobrar') return;
    setCarrito(prev => prev.filter(item => item.cartItemId !== cartItemId));
  };

  const actualizarNota = (cartItemId, nota) => {
    if (ventaActiva?.estado === 'por_cobrar') return;
    setCarrito(prev => prev.map(item => item.cartItemId === cartItemId ? { ...item, notas: nota } : item));
  };

  /**
   * 🚀 ENVÍO DE COMANDA
   */
  const handleEnviarOrden = async () => {
    if (!puedeCrearVentas) return alert("No tienes permisos para esta acción.");
    if (carrito.length === 0) return alert("Agrega productos al carrito.");
    
    setLoading(true);
    try {
      const payload = {
        id: ventaActiva?.id, 
        sucursal_id: Number(sucursalId),
        usuario_id: Number(usuarioId),
        mesa: mesaInput || 'S/N',
        mesa_id: mesaId,
        tipo_orden: tipoOrden,
        comensales: comensales,
        cliente_nombre: clienteNombre,
        notas_orden: notasOrden
      };

      const res = await MeseroService.procesarVenta(payload, carrito);

      if (res.success) {
        alert("✅ Orden enviada a cocina.");
        resetTodo();
      } else {
        alert("❌ Error al procesar: " + res.error);
      }
    } catch (error) {
      alert("Error crítico de comunicación con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const pedirCuenta = async (ventaId) => {
    if (!puedeEditarVentas) return alert("Sin permisos.");
    setLoading(true);
    try {
      const res = await MeseroService.marcarPorCobrar(ventaId);
      if (res.success) {
        alert("🔔 Cuenta solicitada a caja.");
        resetTodo();
      } else {
        alert("Error al solicitar cuenta.");
      }
    } catch (error) {
      alert("Fallo de conexión.");
    } finally {
      setLoading(false);
    }
  };

  return {
    view, setView,
    cuentasAbiertas, cuentasCobradas,
    ventaActiva, 
    zonasMesas,
    mesaId, setMesaId,
    mesaInput, setMesaInput,
    tipoOrden, setTipoOrden,
    comensales, setComensales,
    clienteNombre, setClienteNombre,
    notasOrden, setNotasOrden,
    productos, categorias,
    carrito, setCarrito,
    loading,
    mostrarModalExtras,
    productoParaExtras,
    confirmarProductoConExtras,
    cerrarModalExtras,
    seleccionarCuenta, iniciarNuevaMesa,
    agregarAlCarrito, eliminarDelCarrito, actualizarNota,
    handleEnviarOrden, pedirCuenta, resetTodo,
    puedeVerVentas, puedeCrearVentas, puedeEditarVentas
  };
};