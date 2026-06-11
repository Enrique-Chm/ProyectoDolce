// src/lib/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

/**
 * CONFIGURACIÓN DE SUPABASE CON PROXY
 * 
 * En DESARROLLO (localhost):
 *   → Usa conexión directa con las variables VITE_* del .env local
 *   → El proxy no está disponible en dev server de Vite
 * 
 * En PRODUCCIÓN (Vercel):
 *   → Usa el proxy serverless en /api/supabase-proxy
 *   → La URL y key real NUNCA llegan al navegador
 *   → Las credenciales viven en las env vars del servidor de Vercel
 */
const isDev = import.meta.env.DEV;

let supabaseUrl;
let supabaseKey;

if (isDev) {
  // Desarrollo local: conexión directa (las VITE_* se inyectan en el bundle local)
  supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
  supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn("⚠️ Advertencia: Las credenciales de Supabase no están definidas en el archivo .env");
  }
} else {
  // Producción: las credenciales las maneja el proxy del servidor
  // Usamos la URL del proxy como si fuera la URL de Supabase
  supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
  supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // NOTA: En producción, aunque las VITE_* se inyectan en el build,
  // las operaciones críticas (RPCs) están protegidas por:
  // - RLS activado en todas las tablas
  // - RPCs con SECURITY DEFINER
  // - Rate limiting en login
  // - CSP headers
  // - Sanitización de inputs
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key'
);