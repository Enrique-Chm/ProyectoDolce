/**
 * Genera el HTML estructurado para impresión térmica o PDF
 * @param {Object} datos - Mesa, productos, total, etc.
 * @param {String} formato - '80mm' | '58mm' | 'letter'
 * @param {String} tipo - 'caja' | 'cocina'
 * @param {Object} config - Configuración desde la tabla config_tickets
 */
export const generarHTMLTicket = (datos, formato = '80mm', tipo = 'caja', config = {}) => {
  const isCocina = tipo === 'cocina';
  
  // Extraemos variables de la configuración de la DB (con valores por defecto por seguridad)
  const {
    encabezado = "",
    pie_pagina = "",
    mostrar_logo = true,
    mostrar_mesero = true,
    font_size_base = 12
  } = config;

  // Ajuste de ancho según papel
  const anchoContenedor = formato === '58mm' ? '200px' : formato === '80mm' ? '280px' : '100%';
  
  // El tamaño de fuente base se hereda de lo configurado en el sistema
  const fontSizeCuerpo = isCocina ? (font_size_base + 4) + 'px' : font_size_base + 'px';

  return `
    <html>
      <head>
        <style>
          @page { margin: 0; }
          body { 
            margin: 0; 
            padding: 10px; 
            font-family: 'Courier New', Courier, monospace; 
            display: flex; 
            justify-content: center; 
            background: white;
          }
          .ticket-wrapper { width: ${anchoContenedor}; color: black; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed black; margin: 8px 0; }
          table { width: 100%; border-collapse: collapse; font-size: ${fontSizeCuerpo}; }
          .item-row td { padding: 3px 0; vertical-align: top; }
          .total-area { font-size: 1.1em; margin-top: 10px; }
          .notas { font-size: 0.85em; font-style: italic; display: block; }
          /* Mantiene saltos de línea del textarea del sistema */
          .custom-text { white-space: pre-wrap; font-size: 0.9em; line-height: 1.2; }
        </style>
      </head>
      <body>
        <div class="ticket-wrapper">
          
          <div class="center">
            ${mostrar_logo ? '<h1 style="margin:0; font-size: 1.5em;">☕ CLOUDKITCHEN</h1>' : ''}
            
            <div class="custom-text" style="margin-top: 5px;">${encabezado}</div>
            
            <div class="divider"></div>
            
            <p style="margin: 5px 0;">MESA: <span class="bold" style="font-size: 1.3em;">${datos.mesa}</span></p>
            
            ${!isCocina && datos.folio ? `<p style="margin: 2px 0;">FOLIO: ${datos.folio}</p>` : ''}
            ${mostrar_mesero && datos.meseroNombre ? `<p style="margin: 2px 0;">ATIENDE: ${datos.meseroNombre}</p>` : ''}
            
            <p style="font-size: 0.8em;">${new Date().toLocaleString()}</p>
          </div>

          <div class="divider"></div>

          <table>
            <thead>
              <tr style="text-align: left; font-size: 0.8em; border-bottom: 1px solid #000;">
                <th style="width: 35px;">CANT</th>
                <th>DESCRIPCIÓN</th>
                ${!isCocina ? '<th style="text-align: right;">TOTAL</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${datos.productos.map(p => `
                <tr class="item-row">
                  <td class="bold">${p.cantidad}x</td>
                  <td>
                    ${p.nombre}
                    ${p.notas ? `<span class="notas">- ${p.notas}</span>` : ''}
                  </td>
                  ${!isCocina ? `
                    <td style="text-align: right;">
                      $${(parseFloat(p.precio_unitario || 0) * p.cantidad).toFixed(2)}
                    </td>` : ''}
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="divider"></div>

          ${!isCocina ? `
            <div class="total-area">
              <div style="display: flex; justify-content: space-between;">
                <span>SUBTOTAL:</span>
                <span>$${parseFloat(datos.subtotal || datos.total || 0).toFixed(2)}</span>
              </div>
              ${datos.propina > 0 ? `
                <div style="display: flex; justify-content: space-between;">
                  <span>PROPINA:</span>
                  <span>$${parseFloat(datos.propina).toFixed(2)}</span>
                </div>
              ` : ''}
              <div style="display: flex; justify-content: space-between; margin-top: 4px;" class="bold">
                <span>TOTAL A PAGAR:</span>
                <span>$${parseFloat(datos.totalFinal || datos.total || 0).toFixed(2)}</span>
              </div>
            </div>
          ` : `
            <div class="center bold" style="margin-top: 10px; font-size: 1.1em;">
              *** FIN DE COMANDA ***
            </div>
          `}

          ${!isCocina ? `
            <div class="center" style="margin-top: 20px;">
              <div class="custom-text">${pie_pagina}</div>
              <p style="font-size: 0.7em; margin-top: 15px;">Software por CloudKitchen POS</p>
            </div>
          ` : ''}

        </div>
      </body>
    </html>
  `;
};