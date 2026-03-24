// Archivo: src/utils/checkPermiso.js

/**
 * 📋 MATRIZ DE MÓDULOS (CRUD Sincronizado)
 * El slug base define la familia de permisos.
 * La tabla visual de 4 columnas usará este slug para buscar automáticamente:
 * ver_[slug], crear_[slug], editar_[slug] y borrar_[slug].
 */
export const MATRIZ_MODULOS = [
  // --- GRUPO: SERVICIO Y ATENCIÓN ---
  { label: 'Toma de Pedidos (Comandas)', slug: 'comandas', cat: 'SERVICIO' },
  { label: 'Catálogo de Platillos (Precios)', slug: 'productos', cat: 'SERVICIO' },

  // --- GRUPO: CONTROL DE DINERO ---
  { label: 'Dashboard y Reportes', slug: 'analitica', cat: 'FINANZAS' }, 
  { label: 'Punto de Venta y Caja', slug: 'ventas', cat: 'FINANZAS' },
  { label: 'Gastos Operativos', slug: 'gastos', cat: 'FINANZAS' },

  // --- GRUPO: ALMACÉN E INVENTARIOS ---
  { label: 'Inventarios y Mermas', slug: 'inventario', cat: 'ALMACEN' },
  { label: 'Catálogo de Insumos (Stock)', slug: 'insumos', cat: 'ALMACEN' },
  { label: 'Gestión de Recetas', slug: 'recetas', cat: 'ALMACEN' },
  { label: 'Gestión de Proveedores', slug: 'proveedores', cat: 'ALMACEN' },

  // --- GRUPO: ADMINISTRACIÓN ---
  { label: 'Equipo y Roles', slug: 'usuarios', cat: 'ADMIN' },
  { label: 'Gestión de Sucursales', slug: 'sucursales', cat: 'ADMIN' },
  { label: 'Ajustes e Impresoras', slug: 'configuracion', cat: 'ADMIN' }
];

/**
 * 🛡️ Función principal para validar permisos (El Guardián)
 * Úsala en cualquier parte de tu app: hasPermission('borrar_ventas')
 */
export const hasPermission = (clave) => {
  if (!clave) return false;

  const sessionStr = localStorage.getItem('cloudkitchen_session');
  if (!sessionStr) return false;

  try {
    const session = JSON.parse(sessionStr);
    if (!session || !session.user) return false;

    // 1. Super Administrador siempre tiene acceso total a todo (Rol ID 1)
    const esAdmin = session.user.rol === 'Administrador' || session.user.rol_id === 1;
    if (esAdmin) return true;

    // 2. Verificación de Permiso Específico en el array de la sesión
    // .trim() elimina espacios accidentales y .toLowerCase() asegura consistencia
    return session.permisos?.includes(clave.trim()) || false;
  } catch (error) {
    console.error("Error en hasPermission:", error);
    return false;
  }
};