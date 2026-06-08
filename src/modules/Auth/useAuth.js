// src/modules/Auth/useAuth.js
// La lógica de autenticación ahora vive en AuthContext.jsx.
// Este archivo re-exporta el hook para mantener compatibilidad con todas
// las importaciones existentes en la app (AdminPage, Login, etc.)
// sin necesidad de modificarlas.
export { useAuth } from './AuthContext';