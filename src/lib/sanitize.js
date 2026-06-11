// src/lib/sanitize.js

/**
 * SANITIZACIÓN DE INPUTS
 * Previene ataques XSS limpiando HTML/scripts de strings antes de guardar en BD.
 * Se usa en los services antes de enviar datos a Supabase.
 */

/**
 * Elimina etiquetas HTML y caracteres peligrosos de un string.
 * Preserva acentos, ñ y caracteres normales del español.
 * @param {string} str - Texto a sanitizar
 * @returns {string} - Texto limpio
 */
export const sanitizeString = (str) => {
  if (str === null || str === undefined) return str;
  if (typeof str !== 'string') return str;

  return str
    // Elimina etiquetas HTML/XML completas
    .replace(/<[^>]*>/g, '')
    // Elimina atributos de eventos inline (onclick, onerror, etc.)
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    // Elimina javascript: en URLs
    .replace(/javascript\s*:/gi, '')
    // Elimina data: URLs (pueden contener scripts)
    .replace(/data\s*:\s*text\/html/gi, '')
    // Elimina expresiones CSS (expression())
    .replace(/expression\s*\(/gi, '')
    // Limpia espacios múltiples resultantes
    .replace(/\s{2,}/g, ' ')
    .trim();
};

/**
 * Sanitiza todos los campos string de un objeto de forma recursiva.
 * Ignora campos que no son strings (números, booleans, arrays de UUIDs, etc.)
 * @param {object} obj - Objeto con datos del formulario
 * @param {string[]} excluir - Campos a excluir de la sanitización (ej: 'password')
 * @returns {object} - Objeto con strings sanitizados
 */
export const sanitizeObject = (obj, excluir = []) => {
  if (!obj || typeof obj !== 'object') return obj;

  // No sanitizar arrays (sucursales_ids, dias_abierto, etc.)
  if (Array.isArray(obj)) {
    return obj.map(item => {
      if (typeof item === 'string') return sanitizeString(item);
      if (typeof item === 'object') return sanitizeObject(item, excluir);
      return item;
    });
  }

  const resultado = {};

  for (const [key, value] of Object.entries(obj)) {
    // Saltar campos excluidos (ej: password no se sanitiza porque se hashea)
    if (excluir.includes(key)) {
      resultado[key] = value;
      continue;
    }

    // Sanitizar strings
    if (typeof value === 'string') {
      resultado[key] = sanitizeString(value);
    }
    // Recursión para objetos anidados (ej: permisos)
    else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      resultado[key] = sanitizeObject(value, excluir);
    }
    // Todo lo demás pasa sin cambio (números, booleans, arrays, null)
    else {
      resultado[key] = value;
    }
  }

  return resultado;
};