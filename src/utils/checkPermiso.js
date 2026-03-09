import { authService } from '../services/Auth.service';

export const hasPermission = (clave) => {
  const session = authService.getCurrentSession();
  if (!session) return false;
  
  // El Administrador siempre tiene permiso para todo
  if (session.user.roles.nombre_rol === 'Administrador') return true;
  
  // Verificamos si la clave existe en su lista de permisos
  return session.permisos.includes(clave);
};