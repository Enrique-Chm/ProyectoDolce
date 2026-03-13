// Archivo: src/utils/checkPermiso.js

/**
 * MATRIZ DE MÓDULOS (Referencia visual para el desarrollador)
 */
export const MATRIZ_MODULOS = [
  { label: 'Mesero (Ventas)',   slug: 'mesero',      acciones: ['ver'] },
  { label: 'Caja (Cobros)',    slug: 'caja',        acciones: ['ver'] },
  { label: 'Catálogo Insumos', slug: 'insumos',     acciones: ['ver', 'editar', 'borrar'] },
  { label: 'Auditoría Inv.',   slug: 'inventarios', acciones: ['ver', 'borrar'] },
  { label: 'Proy. Compras',    slug: 'estimaciones',acciones: ['ver'] },
  { label: 'Recetas',          slug: 'recetas',     acciones: ['ver', 'editar', 'borrar'] },
  { label: 'Productos',        slug: 'productos',   acciones: ['ver', 'editar', 'borrar'] },
  { label: 'Proveedores',      slug: 'proveedores', acciones: ['ver', 'borrar'] },
  { label: 'Empleados',        slug: 'empleados',   acciones: ['ver', 'borrar'] },
  { label: 'Sucursales',       slug: 'sucursales',  acciones: ['ver', 'borrar'] },
  { label: 'Impresoras',       slug: 'impresoras',  acciones: ['ver', 'borrar'] },
  { label: 'Configuración',    slug: 'config',      acciones: ['ver'] },
];

export const hasPermission = (clave) => {
  // Leemos directamente de localStorage para evitar dependencias circulares con Auth.service
  const sessionStr = localStorage.getItem('cloudkitchen_session');
  if (!sessionStr) return false;

  try {
    const session = JSON.parse(sessionStr);
    
    if (!session || !session.user) return false;

    // 1. Verificación de Administrador (ignora mayúsculas/minúsculas)
    const nombreRol = session.user.roles?.nombre_rol?.toLowerCase();
    if (nombreRol === 'administrador') return true;

    // 2. Verificación de Permiso Específico
    const tienePermiso = session.permisos?.includes(clave) || false;

    // DEBUG: Descomenta la siguiente línea si quieres ver por qué falla un permiso en consola
    // console.log(`🔐 [Permisos] Buscando: ${clave} | Resultado: ${tienePermiso} | Mis permisos:`, session.permisos);

    return tienePermiso;
  } catch (error) {
    console.error("Error al parsear la sesión en hasPermission:", error);
    return false;
  }
};