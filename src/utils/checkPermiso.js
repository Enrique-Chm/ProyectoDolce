// Archivo: src/utils/checkPermiso.js

/**
 * 📋 MATRIZ DE MÓDULOS (CRUD Sincronizado)
 * El slug base define la familia de permisos.
 * La tabla visual de 4 columnas usará este slug para buscar automáticamente:
 * ver_X, crear_X, editar_X y borrar_X.
 */
export const MATRIZ_MODULOS = [
  // --- Operación Principal ---
  { label: 'Ventas, Caja y Tickets',              slug: 'ver_ventas' },
  { label: 'Inventarios y Mermas',                slug: 'ver_inventario' },
  
  // --- Administración ---
  { label: 'Finanzas: Gastos Operativos',         slug: 'ver_gastos' }, // 👈 ¡NUEVO MÓDULO AGREGADO AQUÍ!
  { label: 'Equipo, Roles y Permisos',            slug: 'ver_usuarios' },
  { label: 'Gestión de Sucursales',               slug: 'ver_sucursales' },
  { label: 'Configuración General e Impresoras',  slug: 'ver_configuracion' },
  
  // --- Catálogos Maestros ---
  { label: 'Catálogo: Insumos (Stock)',           slug: 'ver_insumos' },
  { label: 'Catálogo: Productos (Menú)',          slug: 'ver_productos' },
  { label: 'Catálogo: Proveedores',               slug: 'ver_proveedores' },
  { label: 'Catálogo: Recetas',                   slug: 'ver_recetas' }
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
    return session.permisos?.includes(clave.trim()) || false;
  } catch (error) {
    console.error("Error en hasPermission:", error);
    return false;
  }
};