import { authService } from '../services/Auth.service';

/**
 * MATRIZ DE MÓDULOS ACTUALIZADA
 * Basada en tu barra de navegación y archivos .jsx
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
  const session = authService.getCurrentSession();
  if (!session || !session.user) return false;
  if (session.user.roles?.nombre_rol === 'Administrador') return true;
  return session.permisos?.includes(clave) || false;
};