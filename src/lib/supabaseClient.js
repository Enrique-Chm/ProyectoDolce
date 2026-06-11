// src/lib/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

/**
 * CONFIGURACIÓN DE SUPABASE CON PROXY
 *
 * En DESARROLLO (localhost):
 *   → Conexión directa con variables VITE_* del .env local
 *   → El proxy no está disponible en el dev server de Vite
 *
 * En PRODUCCIÓN (Vercel):
 *   → Todas las peticiones pasan por /api/sb (Edge Function)
 *   → La URL y anon key NUNCA llegan al navegador
 *   → Las credenciales viven en las env vars del servidor de Vercel
 *   → El Supabase client usa un fetch personalizado que redirige al proxy
 */
const isDev = import.meta.env.DEV;

/**
 * Crea un fetch personalizado que intercepta todas las peticiones del
 * Supabase client y las redirige al proxy Edge Function.
 * La ruta original de Supabase se envía en el header 'x-sb-path'.
 */
const createProxyFetch = () => {
  return async (input, init) => {
    // Extraer la URL que el Supabase client quiere llamar
    const url = typeof input === 'string' ? new URL(input) : new URL(input.url);

    // Capturar la ruta + query params (ej: /rest/v1/Cat_Trabajadores?select=id,nombre)
    const pathAndQuery = url.pathname + url.search;

    // Preparar headers — removemos las credenciales del frontend
    // (el proxy inyectará las reales desde env vars del servidor)
    const headers = new Headers(init?.headers || {});
    headers.set('x-sb-path', pathAndQuery);
    headers.delete('apikey');
    headers.delete('authorization');

    // Redirigir al proxy Edge Function
    return fetch(`${window.location.origin}/api/sb`, {
      method: init?.method || 'GET',
      headers,
      body: init?.body
    });
  };
};

// ── Configuración según entorno ──────────────────────────────

let supabaseUrl;
let supabaseKey;
let clientOptions = {};

if (isDev) {
  // Desarrollo: conexión directa
  supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn("⚠️ Advertencia: Las credenciales de Supabase no están definidas en el archivo .env");
  }
} else {
  // Producción: proxy — estos valores son placeholders,
  // las credenciales reales las inyecta el Edge Function
  supabaseUrl = 'https://proxy.internal';
  supabaseKey = 'proxy-key';
  clientOptions = {
    global: {
      fetch: createProxyFetch()
    }
  };
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key',
  clientOptions
);