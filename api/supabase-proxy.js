// api/supabase-proxy.js
// Vercel Serverless Function que actúa como proxy para Supabase.
// Oculta la URL y la anon key del frontend.

export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Configuración del servidor incompleta.' });
  }

  try {
    // Extraer la ruta real de Supabase desde el query parameter
    const supabasePath = req.query.path || '';
    
    // Reconstruir la URL completa de Supabase
    // El frontend envía: /api/supabase-proxy?path=/rest/v1/tabla&select=id,nombre...
    const queryParams = { ...req.query };
    delete queryParams.path;
    
    const queryString = Object.keys(queryParams).length > 0
      ? '?' + new URLSearchParams(queryParams).toString()
      : '';

    const targetUrl = `${SUPABASE_URL}${supabasePath}${queryString}`;

    // Construir headers para Supabase
    const headers = {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    };

    // Copiar headers importantes del request original
    if (req.headers['prefer']) {
      headers['Prefer'] = req.headers['prefer'];
    }
    if (req.headers['range']) {
      headers['Range'] = req.headers['range'];
    }

    // Preparar el body solo para métodos que lo necesitan
    const body = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)
      ? JSON.stringify(req.body)
      : undefined;

    // Hacer la petición a Supabase
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body
    });

    // Leer la respuesta
    const responseText = await response.text();

    // Copiar headers de respuesta importantes
    const contentRange = response.headers.get('content-range');
    if (contentRange) {
      res.setHeader('content-range', contentRange);
    }

    // Enviar respuesta al frontend
    res.status(response.status);
    
    try {
      // Intentar parsear como JSON
      const data = JSON.parse(responseText);
      res.json(data);
    } catch {
      // Si no es JSON, enviar como texto
      res.send(responseText);
    }
  } catch (err) {
    console.error('Error en proxy:', err);
    res.status(500).json({ error: 'Error interno del proxy.' });
  }
}