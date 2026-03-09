import { createClient } from "@supabase/supabase-js"; // ✅ Este es el nombre correcto

// Usamos import.meta.env que es el estándar de Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Si alguna variable falta, lanzamos un error claro en consola en lugar de un 500
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Advertencia: Las credenciales de Supabase no están definidas en el archivo .env");
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);