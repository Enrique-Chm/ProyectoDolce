// api/sb.js
// Vercel Edge Function — proxy para Supabase.
// Corre en el edge (30+ regiones, sin cold start, sub-ms startup).
// Recibe peticiones del frontend, agrega las credenciales reales,
// y las reenvía a Supabase. La URL y key NUNCA llegan al navegador.

export const config = { runtime: 'edge' };

export default async function handler(request) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

  // Validar configuración del servidor
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return new Response(
      JSON.stringify({ error: 'Configuración del servidor incompleta.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Obtener la ruta de Supabase desde el header custom
  const supabasePath = request.headers.get('x-sb-path');

  if (!supabasePath) {
    return new Response(
      JSON.stringify({ error: 'Ruta no proporcionada.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Construir la URL real de Supabase
    const targetUrl = `${SUPABASE_URL}${supabasePath}`;

    // Headers para Supabase — inyectamos las credenciales reales
    const supabaseHeaders = new Headers();
    supabaseHeaders.set('apikey', SUPABASE_KEY);
    supabaseHeaders.set('Authorization', `Bearer ${SUPABASE_KEY}`);

    // Copiar headers importantes del request original
    // (el Supabase client envía Prefer, Range, Content-Type, etc.)
    const headersToForward = [
      'content-type',
      'prefer',
      'range',
      'accept',
      'accept-profile',
      'content-profile'
    ];

    for (const header of headersToForward) {
      const value = request.headers.get(header);
      if (value) supabaseHeaders.set(header, value);
    }

    // Preparar body para métodos que lo necesitan
    let body = null;
    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method)) {
      body = await request.text();
    }

    // Hacer la petición a Supabase
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: supabaseHeaders,
      body
    });

    // Construir headers de respuesta
    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', 'application/json');

    // Copiar headers de respuesta importantes de Supabase
    const responseHeadersToForward = [
      'content-range',
      'x-total-count',
      'preference-applied'
    ];

    for (const header of responseHeadersToForward) {
      const value = response.headers.get(header);
      if (value) responseHeaders.set(header, value);
    }

    // Retornar la respuesta de Supabase al frontend
    const responseBody = await response.text();

    return new Response(responseBody, {
      status: response.status,
      headers: responseHeaders
    });

  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Error interno del proxy.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}