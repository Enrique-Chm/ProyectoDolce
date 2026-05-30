// src/modules/Admin/Tabs/NuevoPedido/2useNuevoPedido.js
import { useState, useEffect, useCallback } from 'react';
import { NuevoPedidoService } from './1NuevoPedido.Service';
import { AuthService } from '../../../Auth/Auth.service'; 
import toast from 'react-hot-toast';

export const useNuevoPedido = (onVolver) => {
  const [loading, setLoading] = useState(false);
  const sesion = AuthService.getSesion();

  // --- ESTADOS DE DATOS ---
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [carrito, setCarrito] = useState([]);

  // --- ESTADO DE TURNO CON PERMISOS BIOMÉTRICOS/PERFIL (AM / PM) ---
  // Evalúa si el usuario tiene un turno restringido por contrato. Si no, usa la hora del sistema.
  const [turno, setTurnoInternal] = useState(() => {
    const turnoTrabajador = sesion?.turno;
    if (turnoTrabajador && turnoTrabajador !== 'Ambos') {
      return turnoTrabajador; // Bloqueado a su turno asignado (AM o PM)
    }
    const horaActual = new Date().getHours();
    return horaActual < 13 ? 'AM' : 'PM';
  });

  // Manejador seguro para cambiar turno (Se inhabilita si el trabajador está restringido)
  const setTurno = useCallback((nuevoTurno) => {
    const turnoTrabajador = sesion?.turno;
    if (turnoTrabajador && turnoTrabajador !== 'Ambos') {
      // Si el trabajador tiene un turno asignado fijo, no puede alternar entre pestañas
      toast.error(`Tu perfil está limitado exclusivamente al turno ${turnoTrabajador}`);
      return;
    }
    setTurnoInternal(nuevoTurno);
  }, [sesion?.turno]);

  // --- ESTADO DE LA CABECERA ---
  const [header, setHeader] = useState({
    solicitante_id: sesion?.id || '',
    sucursal_id: sesion?.sucursal_id || '',
    observaciones: ''
  });

  // Estabilización de permisos para evitar re-renderizados infinitos
  const categoriasPermitidasStr = JSON.stringify(sesion?.permisos?.categorias_permitidas || []);

  /**
   * FUNCIÓN AUXILIAR: Obtiene el día de la semana actual en español.
   * Formato: "Lunes", "Martes", etc.
   */
  const obtenerDiaActual = () => {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const hoy = new Date();
    return dias[hoy.getDay()];
  };

  /**
   * FUNCIÓN AUXILIAR DE SEGURIDAD: Valida si el horario real es compatible con el perfil.
   * Si es un usuario AM fijo pero ya es la 1:00 PM o más tarde, deniega el acceso.
   */
  const validarHorarioTurnoReal = useCallback(() => {
    const turnoTrabajador = sesion?.turno;
    if (turnoTrabajador === 'AM') {
      const horaReal = new Date().getHours();
      if (horaReal >= 13) {
        return false;
      }
    }
    return true;
  }, [sesion?.turno]);

  // ==========================================
  // 1. CARGA Y FILTRADO POR DÍA, PERMISOS Y TURNO
  // ==========================================
  const cargarProductos = useCallback(async () => {
    setLoading(true);
    try {
      // Validación preventiva al cargar el catálogo de insumos
      if (!validarHorarioTurnoReal()) {
        toast.error('Tu horario operativo AM ha expirado. No puedes realizar solicitudes después de la 1:00 PM.', { duration: 5000 });
        setProductosDisponibles([]);
        return;
      }

      const diaHoy = obtenerDiaActual();
      
      // Llamada al servicio enviando el día actual para el filtro de proveedores
      const { data, error } = await NuevoPedidoService.getProductosDisponibles(diaHoy);
      
      if (error) throw error;

      const categoriesPermitidas = JSON.parse(categoriasPermitidasStr);
      const sucursalUsuario = sesion?.sucursal_id;

      /**
       * NORMALIZACIÓN Y FILTRADO LOCAL:
       * Además del filtro de día en el servidor, validamos sucursal, categorías y TURNO.
       */
      const procesados = (data || [])
        .map(p => ({
          ...p,
          categoria_nombre: p.categoria?.nombre || 'General',
          um_abreviatura: p.um?.abreviatura || 'pz',
          contenido_numerico: Number(p.contenido) || 1
        }))
        .filter(p => {
          // 1. Filtro por permisos de categoría del trabajador
          const cumpleCat = categoriesPermitidas.length === 0 || categoriesPermitidas.includes(p.categoria_id);
          
          // 2. Filtro por visibilidad de sucursal del producto
          const cumpleSuc = !p.sucursales_ids || 
                            p.sucursales_ids.length === 0 || 
                            p.sucursales_ids.includes(sucursalUsuario);
          
          // 3. Filtro por Turno de Uso (Insumos asignados a su turno o insumos universales 'Ambos')
          const cumpleTurno = !p.turno_uso || p.turno_uso === 'Ambos' || p.turno_uso === turno;
          
          return cumpleCat && cumpleSuc && cumpleTurno;
        });

      setProductosDisponibles(procesados);
      
      if (procesados.length === 0) {
        toast(`No hay insumos disponibles para el turno ${turno} el día de hoy.`, { icon: '🗓️' });
      }

    } catch (err) {
      console.error("Error al sincronizar catálogo:", err);
      toast.error('No se pudo cargar el catálogo de insumos');
    } finally {
      setLoading(false);
    }
  }, [categoriasPermitidasStr, sesion?.sucursal_id, turno, validarHorarioTurnoReal]);

  useEffect(() => {
    cargarProductos();
  }, [cargarProductos]);

  // ==========================================
  // 2. GESTIÓN DEL CARRITO (OPERATIVO)
  // ==========================================
  
  const agregarAlCarrito = useCallback((producto, cantidad = 1) => {
    // Verificación de horario real al momento de intentar meter un producto a la lista
    if (!validarHorarioTurnoReal()) {
      toast.error('Operación denegada: Tu horario asignado de mañana (AM) concluyó a las 1:00 PM.');
      return;
    }

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

      return [...prev, {
        producto_id: producto.id,
        nombre: producto.nombre,
        marca: producto.marca,
        abreviatura_um: producto.um_abreviatura,
        quantity: numCant, // Mantenemos compatibilidad si se requiere en un sub-map
        cantidad: numCant,
        proveedor_id: producto.proveedor_id,
        categoria_nombre: producto.categoria_nombre,
        presentacion: producto.presentacion || 'Unidad',
        contenido: producto.contenido_numerico
      }];
    });

    toast.success(`${producto.nombre} agregado`, { duration: 1500, icon: '🛒' });
  }, [validarHorarioTurnoReal]);

  const eliminarDelCarrito = (id) => {
    setCarrito(prev => prev.filter(item => item.producto_id !== id));
    toast.success('Insumo removido');
  };

  // ==========================================
  // 3. PROCESAMIENTO FINAL (DIVISIÓN POR PROVEEDOR)
  // ==========================================
  
  const procesarOrden = async () => {
    if (carrito.length === 0) return toast.error('El carrito está vacío');
    if (!header.solicitante_id || !header.sucursal_id) {
      return toast.error('Error de sesión: Usuario o sucursal no identificados');
    }

    // Doble verificación estricta de tiempo real antes de guardar en el servidor
    if (!validarHorarioTurnoReal()) {
      toast.error('Bloqueo de seguridad: No puedes transmitir requisiciones AM después de la 1:00 PM.');
      return;
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

      // 2. Insertamos cada Orden de Compra (Requisición)
      for (const pId of idsProveedores) {
        const itemsGrupo = gruposPorProveedor[pId];
        
        const randomStr = Math.random().toString(36).substring(7).toUpperCase();
        const folio = `REQ-${new Date().getFullYear()}-${randomStr}`;

        // Pasamos el texto ingresado en las observaciones de forma limpia. 
        // El servicio se encargará de estampar la firma estructural de coautores al inicio.
        const notasConTurno = header.observaciones && header.observaciones.trim() !== ''
          ? `[Turno ${turno}]: ${header.observaciones.trim()}`
          : `Pedido generado en Turno ${turno}`;

        const payloadCabecera = {
          folio,
          solicitante_id: header.solicitante_id,
          sucursal_id: header.sucursal_id,
          proveedor_id: pId === 'SIN-PROVEEDOR' ? null : pId,
          notes: notasConTurno,
          notas: notasConTurno,
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
    agregarAlCarrito,
    eliminarDelCarrito,
    procesarOrden,
    turno,
    setTurno
  };
};