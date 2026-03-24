// Archivo: src/hooks/useMeseroTab.js
import { useState, useEffect, useCallback } from 'react';
import { productosService } from '../services/productos.service';
import { MeseroService } from '../services/Mesero.service'; 
import { hasPermission } from '../utils/checkPermiso';

/**
 * Hook Maestro para la gestión de Salón y Comandas.
 * Controla el flujo desde la apertura de mesa hasta el envío a cocina.
 */
export const useMeseroTab = (sucursalId, usuarioId) => {
  const [view, setView] = useState('cuentas');
  const [cuentasAbiertas, setCuentasAbiertas] = useState([]);
  const [cuentasCobradas, setCuentasCobradas] = useState([]);
  const [ventaActiva, setVentaActiva] = useState(null);
  const [mesaInput, setMesaInput] = useState('');
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🛡️ SISTEMA DE PERMISOS: Basado en la familia 'comandas'
  const puedeVerVentas = hasPermission('ver_comandas');
  const puedeCrearVentas = hasPermission('crear_comandas');
  const puedeEditarVentas = hasPermission('editar_comandas');

  /**
   * Limpia el estado local para regresar a la vista de Salón
   */
  const resetTodo = useCallback(() => {
    setVentaActiva(null);
    setMesaInput('');
    setCarrito([]);
    setView('cuentas');
  }, []);

  /**
   * 🔒 HELPER DE SEGURIDAD: Candado proactivo
   * Verifica en tiempo real si hay una caja abierta en la sucursal antes de realizar acciones.
   */
  const verificarCajaAntesDeAccion = async () => {
    setLoading(true);
    try {
      // Forzamos el ID de sucursal a número para la consulta
      const { abierta } = await MeseroService.verificarCajaAbierta(Number(sucursalId));
      if (!abierta) {
        alert("⚠️ OPERACIÓN BLOQUEADA: No hay una sesión de caja abierta en esta sucursal. Por favor, solicita al cajero iniciar el turno.");
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error al verificar caja:", error);
      alert("Error técnico al verificar el estado de la caja.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Carga las mesas con órdenes pendientes o por cobrar
   */
  const cargarCuentas = useCallback(async () => {
    if (!puedeVerVentas || !sucursalId) return;
    setLoading(true);
    try {
      const { data, error } = await MeseroService.getCuentasAbiertas(Number(sucursalId));
      if (error) throw error;
      
      setCuentasAbiertas(data || []);
      
      // Sincronización de la venta activa si el usuario está dentro de una mesa
      setVentaActiva((prev) => {
        if (!prev) return null;
        const actualizada = (data || []).find(v => v.id === prev.id);
        if (!actualizada && prev.id) {
             alert("La mesa ya no está disponible (fue cobrada o cancelada).");
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
   * Carga el catálogo de productos disponible para la sucursal
   */
  const cargarMenu = useCallback(async () => {
    if (!puedeVerVentas || !sucursalId) return;
    try {
      // El mesero necesita 'ver_productos' (permiso de datos) aunque no vea el tab de admin
      const data = await productosService.getInitialData(Number(sucursalId));
      setProductos(data.productos || []);
      setCategorias(data.categorias || []);
    } catch (err) {
      console.error("Error al cargar menú:", err);
    }
  }, [sucursalId, puedeVerVentas]);

  /**
   * Carga historial de ventas ya liquidadas
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

  // Efectos de carga de datos según la vista activa
  useEffect(() => { if (view === 'cuentas') cargarCuentas(); }, [view, cargarCuentas]);
  useEffect(() => { if (view === 'menu' && productos.length === 0) cargarMenu(); }, [view, productos.length, cargarMenu]);
  useEffect(() => { if (view === 'historial') cargarHistorial(); }, [view, cargarHistorial]);
  
  /**
   * Acción: Iniciar flujo para mesa nueva
   */
  const iniciarNuevaMesa = async () => {
    if (!puedeCrearVentas) return;
    const cajaLista = await verificarCajaAntesDeAccion();
    if (cajaLista) {
      setMesaInput("");
      setView("mesas");
    }
  };

  /**
   * Acción: Entrar a una mesa existente
   */
  const seleccionarCuenta = async (venta = null) => {
    if (!puedeVerVentas) return;
    const cajaLista = await verificarCajaAntesDeAccion();
    if (cajaLista) {
      setVentaActiva(venta);
      setMesaInput(venta?.mesa || '');
      setCarrito([]); 
      setView('menu');
    }
  };

  /**
   * Lógica de Carrito de Compras
   */
  const agregarAlCarrito = (p) => {
    if (!puedeCrearVentas) return alert("No tienes permiso para agregar productos.");
    if (ventaActiva?.estado === 'por_cobrar') {
      return alert("⚠️ MESA BLOQUEADA: La cuenta ya ha sido solicitada a caja.");
    }

    setCarrito(prev => {
      const existe = prev.find(item => item.id === p.id);
      if (existe) {
        return prev.map(item => 
          item.id === p.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [...prev, { 
        id: p.id, 
        nombre: p.nombre, 
        precio_venta: p.precio_venta, 
        costo_actual: p.costo_actual || 0,
        cantidad: 1, 
        notas: '' 
      }];
    });
  };

  const eliminarDelCarrito = (id) => {
    if (ventaActiva?.estado === 'por_cobrar') return;
    setCarrito(prev => prev.filter(item => item.id !== id));
  };

  const actualizarNota = (id, nota) => {
    if (ventaActiva?.estado === 'por_cobrar') return;
    setCarrito(prev => prev.map(item => item.id === id ? { ...item, notas: nota } : item));
  };

  /**
   * 🚀 ENVÍO DE COMANDA: Punto crítico de integración
   */
  const handleEnviarOrden = async () => {
    if (!puedeCrearVentas) return alert("Sin permisos.");
    if (carrito.length === 0) return alert("El carrito está vacío.");
    if (ventaActiva?.estado === 'por_cobrar') return alert("Mesa bloqueada por pago.");
    
    setLoading(true);
    try {
      // Blindamos los IDs como números para Supabase
      const payload = {
        id: ventaActiva?.id, 
        sucursal_id: Number(sucursalId),
        usuario_id: Number(usuarioId),
        mesa: mesaInput || 'S/N'
      };

      const res = await MeseroService.procesarVenta(payload, carrito);

      if (res.success) {
        alert("✅ ¡Comanda enviada a cocina!");
        resetTodo();
      } else {
        alert("❌ Error: " + (res.error || "Ocurrió un problema en el servidor."));
      }
    } catch (error) {
      console.error(error);
      alert("Error crítico al procesar la comanda.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Notifica a Caja que la mesa desea liquidar
   */
  const pedirCuenta = async (ventaId) => {
    if (!puedeEditarVentas) return alert("Sin permisos para solicitar cuenta.");
    if (!ventaId) return;
    
    setLoading(true);
    try {
      const res = await MeseroService.marcarPorCobrar(ventaId);
      if (res.success) {
        alert("🔔 Ticket solicitado. La mesa ha sido bloqueada para nuevas ediciones.");
        resetTodo();
      } else {
        alert("Error al solicitar cuenta.");
      }
    } catch (error) {
      alert("Error en la conexión con caja.");
    } finally {
      setLoading(false);
    }
  };

  return {
    view, setView,
    cuentasAbiertas: puedeVerVentas ? cuentasAbiertas : [],
    cuentasCobradas: puedeVerVentas ? cuentasCobradas : [],
    ventaActiva,
    mesaInput, setMesaInput,
    productos: puedeVerVentas ? productos : [],
    categorias: puedeVerVentas ? categorias : [],
    carrito, setCarrito,
    loading,
    seleccionarCuenta,
    iniciarNuevaMesa,
    agregarAlCarrito,
    eliminarDelCarrito,
    actualizarNota,
    handleEnviarOrden,
    pedirCuenta,
    resetTodo,
    puedeVerVentas,
    puedeCrearVentas,
    puedeEditarVentas
  };
};