import { useState, useEffect, useCallback } from 'react';
import { productosService } from '../services/productos.service';
import { VentasService } from '../services/Ventas.service';

export const useMeseroTab = (sucursalId, usuarioId) => {
  // --- ESTADOS ---
  const [view, setView] = useState('cuentas'); // cuentas | mesas | menu | historial
  const [cuentasAbiertas, setCuentasAbiertas] = useState([]);
  const [cuentasCobradas, setCuentasCobradas] = useState([]);
  const [ventaActiva, setVentaActiva] = useState(null);
  const [mesaInput, setMesaInput] = useState('');
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- CARGA DE DATOS ---

  // Cargar mesas activas (Abiertas y Por Cobrar)
  const cargarCuentas = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await VentasService.getCuentasAbiertas(sucursalId);
      setCuentasAbiertas(data || []);
      
      // Sincronizar venta activa si hubo cambios externos (ej. la cajera la cobró)
      if (ventaActiva) {
        const actualizada = data.find(v => v.id === ventaActiva.id);
        if (actualizada) {
          setVentaActiva(actualizada);
        } else if (view === 'menu') {
          // Si ya no aparece en abiertas, es que se cobró o canceló
          alert("La mesa ya no está activa.");
          resetTodo();
        }
      }
    } catch (err) {
      console.error("Error al cargar cuentas:", err);
    } finally {
      setLoading(false);
    }
  }, [sucursalId, ventaActiva, view]);

  const cargarMenu = useCallback(async () => {
    try {
      const data = await productosService.getInitialData(sucursalId);
      setProductos(data.productos || []);
      setCategorias(data.categorias || []);
    } catch (err) {
      console.error("Error al cargar menú:", err);
    }
  }, [sucursalId]);

  const cargarHistorial = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await VentasService.getHistorialCobradas(sucursalId);
      setCuentasCobradas(data || []);
    } catch (err) {
      console.error("Error al cargar historial:", err);
    } finally {
      setLoading(false);
    }
  }, [sucursalId]);

  // --- EFECTOS ---
  useEffect(() => { 
    if (view === 'cuentas') cargarCuentas();
    if (view === 'menu' && productos.length === 0) cargarMenu();
    if (view === 'historial') cargarHistorial();
  }, [view, cargarCuentas, cargarMenu, cargarHistorial, productos.length]);

  // --- LÓGICA DE INTERFAZ Y CARRITO ---
  
  const seleccionarCuenta = (venta) => {
    setVentaActiva(venta);
    setMesaInput(venta.mesa);
    setCarrito([]); 
    setView('menu');
  };

  const agregarAlCarrito = (p) => {
    // REGLA DE ORO: Si ya se pidió la cuenta, el consumo está bloqueado
    if (ventaActiva?.estado === 'por_cobrar') {
      alert("⚠️ CUENTA BLOQUEADA: La mesa está en proceso de pago. No puedes agregar más productos.");
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
    // Bloqueo adicional por seguridad
    if (ventaActiva?.estado === 'por_cobrar') return;
    setCarrito(prev => prev.filter(item => item.id !== id));
  };

  const actualizarNota = (id, nota) => {
    if (ventaActiva?.estado === 'por_cobrar') return;
    setCarrito(prev => prev.map(item => item.id === id ? { ...item, notas: nota } : item));
  };

  const resetTodo = () => {
    setVentaActiva(null);
    setMesaInput('');
    setCarrito([]);
    setView('cuentas');
  };

  // --- ACCIONES DE BASE DE DATOS ---

  const handleEnviarOrden = async () => {
    if (carrito.length === 0 || ventaActiva?.estado === 'por_cobrar') return;
    
    setLoading(true);
    try {
      const res = await VentasService.procesarVenta({
        id: ventaActiva?.id,
        folio: ventaActiva?.folio,
        sucursal_id: sucursalId,
        usuario_id: usuarioId,
        mesa: mesaInput
      }, carrito);

      if (res.success) {
        alert("¡Comanda enviada a cocina!");
        resetTodo();
      } else {
        alert("Error al enviar: " + res.error);
      }
    } catch (error) {
      alert("Error crítico en la conexión");
    } finally {
      setLoading(false);
    }
  };

  const pedirCuenta = async (ventaId) => {
    if (!ventaId) return;
    setLoading(true);
    try {
      const res = await VentasService.marcarPorCobrar(ventaId);
      if (res.success) {
        // Si el estado ya era por_cobrar, es una reimpresión
        const esReimpresion = ventaActiva?.estado === 'por_cobrar';
        alert(esReimpresion ? "Ticket enviado a reimpresión." : "Ticket enviado a caja. Mesa bloqueada.");
        resetTodo();
      } else {
        alert("Error al procesar: " + res.error);
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
    cuentasAbiertas,
    cuentasCobradas,
    ventaActiva,
    mesaInput, setMesaInput,
    productos,
    categorias,
    carrito, setCarrito,
    loading,
    // Funciones
    seleccionarCuenta,
    agregarAlCarrito,
    eliminarDelCarrito,
    actualizarNota,
    handleEnviarOrden,
    pedirCuenta,
    resetTodo
  };
};