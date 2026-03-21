// Archivo: src/hooks/useMeseroTab.js
import { useState, useEffect, useCallback } from 'react';
import { productosService } from '../services/productos.service';
import { MeseroService } from '../services/Mesero.service'; 
import { hasPermission } from '../utils/checkPermiso';

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

  const puedeVerVentas = hasPermission('ver_ventas');
  const puedeCrearVentas = hasPermission('crear_ventas');
  const puedeEditarVentas = hasPermission('editar_ventas');

  const resetTodo = useCallback(() => {
    setVentaActiva(null);
    setMesaInput('');
    setCarrito([]);
    setView('cuentas');
  }, []);

  const cargarCuentas = useCallback(async () => {
    if (!puedeVerVentas || !sucursalId) return;
    setLoading(true);
    try {
      const { data, error } = await MeseroService.getCuentasAbiertas(sucursalId);
      if (error) throw error;
      
      setCuentasAbiertas(data || []);
      
      setVentaActiva((prevVentaActiva) => {
        if (!prevVentaActiva) return null;
        const actualizada = (data || []).find(v => v.id === prevVentaActiva.id);
        if (!actualizada) {
          if (prevVentaActiva.id) {
             alert("La mesa fue cobrada o cancelada por otro usuario.");
             setTimeout(() => resetTodo(), 0); 
          }
          return null;
        }
        return actualizada;
      });
    } catch (err) {
      console.error("Error al cargar cuentas:", err);
      alert("Error al cargar las mesas activas.");
    } finally {
      setLoading(false);
    }
  }, [sucursalId, puedeVerVentas, resetTodo]);

  const cargarMenu = useCallback(async () => {
    if (!puedeVerVentas || !sucursalId) return;
    try {
      const data = await productosService.getInitialData(sucursalId);
      setProductos(data.productos || []);
      setCategorias(data.categorias || []);
    } catch (err) {
      console.error("Error al cargar menú:", err);
    }
  }, [sucursalId, puedeVerVentas]);

  const cargarHistorial = useCallback(async () => {
    if (!puedeVerVentas || !sucursalId) return;
    setLoading(true);
    try {
      const { data, error } = await MeseroService.getHistorialCobradas(sucursalId);
      if (error) throw error;
      setCuentasCobradas(data || []);
    } catch (err) {
      console.error("Error al cargar historial:", err);
    } finally {
      setLoading(false);
    }
  }, [sucursalId, puedeVerVentas]);

  useEffect(() => { 
    if (view === 'cuentas') cargarCuentas();
  }, [view, cargarCuentas]);

  useEffect(() => {
    if (view === 'menu' && productos.length === 0) cargarMenu();
  }, [view, productos.length, cargarMenu]);

  useEffect(() => {
    if (view === 'historial') cargarHistorial();
  }, [view, cargarHistorial]);
  
  const seleccionarCuenta = (venta = null) => {
    if (!puedeVerVentas) return;
    setVentaActiva(venta);
    setMesaInput(venta?.mesa || '');
    setCarrito([]); 
    setView('menu');
  };

  const agregarAlCarrito = (p) => {
    if (!puedeCrearVentas) {
      alert("No tienes permiso para agregar productos a la orden.");
      return;
    }
    if (ventaActiva?.estado === 'por_cobrar') {
      alert("⚠️ CUENTA BLOQUEADA: La mesa está en proceso de pago.");
      return;
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

  const handleEnviarOrden = async () => {
    if (!puedeCrearVentas) {
      alert("Acceso denegado: No puedes registrar nuevas órdenes.");
      return;
    }
    if (carrito.length === 0) {
        alert("El carrito está vacío.");
        return;
    }
    if (ventaActiva?.estado === 'por_cobrar') {
        alert("La mesa ya solicitó la cuenta.");
        return;
    }
    
    setLoading(true);
    try {
      const payload = {
        id: ventaActiva?.id,
        folio: ventaActiva?.folio,
        sucursal_id: sucursalId,
        usuario_id: usuarioId,
        mesa: mesaInput || 'S/N'
      };

      const res = await MeseroService.procesarVenta(payload, carrito);

      if (res.success) {
        alert("¡Comanda enviada a cocina!");
        resetTodo();
      } else {
        alert("Error al enviar: " + (typeof res.error === 'string' ? res.error : "Verifica la conexión."));
      }
    } catch (error) {
      alert("Error crítico en la conexión");
    } finally {
      setLoading(false);
    }
  };

  const pedirCuenta = async (ventaId) => {
    if (!puedeEditarVentas) {
      alert("No tienes permiso para solicitar tickets de pago.");
      return;
    }
    if (!ventaId) return;
    
    setLoading(true);
    try {
      const res = await MeseroService.marcarPorCobrar(ventaId);
      if (res.success) {
        const esReimpresion = ventaActiva?.estado === 'por_cobrar';
        alert(esReimpresion ? "Ticket enviado a reimpresión." : "Ticket enviado a caja. Mesa bloqueada.");
        resetTodo();
      } else {
        alert("Error al procesar: " + (typeof res.error === 'string' ? res.error : "Verifica la conexión."));
      }
    } catch (error) {
      console.error(error);
      alert("Error crítico al solicitar la cuenta");
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