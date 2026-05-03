// src/modules/Admin/Tabs/Pedidos/ChecklistPedido.jsx
import React, { useEffect } from 'react';
import styles from '../../../../assets/styles/EstilosGenerales.module.css';
import { usePedidos } from './2usePedidos';
import { AuthService } from '../../../Auth/Auth.service';
import toast from 'react-hot-toast';

// Importamos jsPDF y autoTable de forma explícita
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ChecklistPedido({ ordenId, onVolver }) {
  const { 
    loading, 
    detalleOrdenActual, 
    cargarDetalleDeOrden, 
    toggleEstatusItem, 
    cambiarEstatusOrden,
    pasarASegundoProveedor
  } = usePedidos();

  const sesion = AuthService.getSesion();
  // Extraemos los permisos de la sesión para validar acciones
  const permisos = sesion?.permisos?.pedidos || {};

  useEffect(() => {
    if (ordenId) {
      cargarDetalleDeOrden(ordenId);
    }
  }, [ordenId, cargarDetalleDeOrden]);

  if (loading && !detalleOrdenActual) {
    return (
      <div style={{ textAlign: 'center', marginTop: '3rem', width: '100%' }}>
        <p className={styles.labelTop} style={{ animation: 'pulse 1.5s infinite' }}>
            Sincronizando lista con la nube...
        </p>
      </div>
    );
  }

  if (!detalleOrdenActual) return null;

  // LÓGICA DE ESTADO Y PERMISOS
  const esSoloLectura = ['Completado', 'Cancelado'].includes(detalleOrdenActual.estatus);
  
  /**
   * Un usuario puede editar el checklist si:
   * 1. La orden no está finalizada o cancelada.
   * 2. Su rol tiene permiso de 'editar' en el módulo de pedidos.
   */
  const puedeEditar = !esSoloLectura && permisos.editar;

  // Métricas de progreso
  const itemsComprados = detalleOrdenActual.detalles.filter(d => d.estatus === 'Comprado').length;
  const totalItems = detalleOrdenActual.detalles.length;
  const progreso = totalItems > 0 ? (itemsComprados / totalItems) * 100 : 0;

  const handleFinalizarCompra = async () => {
    if (itemsComprados < totalItems) {
      if (!window.confirm('Hay productos sin marcar. ¿Deseas finalizar el pedido y moverlo al historial?')) return;
    }
    const exito = await cambiarEstatusOrden(detalleOrdenActual.id, 'Completado');
    if (exito) onVolver();
  };

  // Manejador para cuando no hay stock del producto en el primer proveedor
  const handleNoHay = async (e, item) => {
    e.stopPropagation(); // Evitamos que se dispare el toggle de estatus
    
    if (!window.confirm(`¿Confirmas que no hay stock de "${item.producto?.nombre}"? Se generará una requisición para el segundo proveedor registrado de este insumo.`)) return;

    if (pasarASegundoProveedor) {
      const exito = await pasarASegundoProveedor(item.id, item.producto_id);
      if (exito) {
        toast.success('Insumo reasignado al segundo proveedor con éxito');
        // Recargamos el detalle para ver los cambios actualizados
        cargarDetalleDeOrden(ordenId);
      }
    } else {
      toast.error('La funcionalidad de cambio de proveedor no está lista en el hook.');
    }
  };

  // ==========================================
  // FUNCIÓN PARA GENERAR EL ARCHIVO PDF
  // ==========================================
  const descargarPdf = () => {
    try {
      const doc = new jsPDF();
      
      // 1. Configuración de colores y fuentes (Encabezado)
      doc.setFillColor(0, 95, 86); // Color verde de la app
      doc.rect(0, 0, 210, 35, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('ORDEN DE COMPRA', 14, 22);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`FOLIO: ${detalleOrdenActual.folio || 'N/A'}`, 14, 28);
      doc.text(`FECHA: ${new Date(detalleOrdenActual.created_at).toLocaleDateString('es-MX')}`, 140, 28);

      // 2. Información del Proveedor y Sucursal
      doc.setTextColor(51, 51, 51);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Datos del Proveedor:', 14, 48);
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Nombre: ${detalleOrdenActual.proveedor?.nombre || 'General'}`, 14, 54);
      doc.text(`Contacto: ${detalleOrdenActual.proveedor?.numero_contacto || 'No registrado'}`, 14, 60);

      doc.setFont('helvetica', 'bold');
      doc.text('Destino de Entrega:', 120, 48);

      doc.setFont('helvetica', 'normal');
      doc.text(`Sucursal: ${detalleOrdenActual.sucursal?.nombre || 'General'}`, 120, 54);
      doc.text(`Solicitado por: ${detalleOrdenActual.solicitante?.nombre_completo || 'Sistema'}`, 120, 60);

      // Línea divisoria
      doc.setDrawColor(220, 220, 220);
      doc.line(14, 68, 196, 68);

      // 3. Tabla de Productos
      const columnas = ['Producto', 'Marca', 'Cant.', 'UM', 'Costo Unit.', 'Importe'];
      const filas = detalleOrdenActual.detalles.map(item => [
        item.producto?.nombre || 'Insumo',
        item.producto?.marca || 'S/M',
        item.cantidad,
        item.producto?.um?.abreviatura || 'pz',
        `$${item.costo_unitario}`,
        `$${(Number(item.cantidad) * Number(item.costo_unitario)).toFixed(2)}`
      ]);

      // LLAMADA EXPLICITA A autoTable
      autoTable(doc, {
        head: [columnas],
        body: filas,
        startY: 74,
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: [0, 95, 86], textColor: [255, 255, 255] },
        theme: 'striped'
      });

      // 4. Totales y Notas finales
      const finalY = doc.lastAutoTable?.finalY || 80;
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`TOTAL ESTIMADO: $${Number(detalleOrdenActual.total_estimado || 0).toFixed(2)} MXN`, 125, finalY + 15);

      if (detalleOrdenActual.notas) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 100, 100);
        doc.text('Notas adicionales:', 14, finalY + 25);
        doc.text(detalleOrdenActual.notas, 14, finalY + 30);
      }

      // Guardar PDF
      doc.save(`Pedido_${detalleOrdenActual.folio || 'S_F'}.pdf`);
      toast.success('¡PDF generado con éxito!');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      toast.error('No se pudo crear el PDF');
    }
  };

  return (
    <div className={styles.fadeIN} style={{ width: '100%', maxWidth: '100%', padding: '0 8px' }}>
      {/* --- ENCABEZADO COMPACTO --- */}
      <header style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
        <div style={{ flex: 1 }}>
          <span className={styles.labelTop} style={{ color: esSoloLectura ? 'var(--text-muted)' : 'var(--color-primary)', fontSize: '0.65rem' }}>
            {detalleOrdenActual.folio || 'REVISIÓN'} • {detalleOrdenActual.sucursal?.nombre}
          </span>
          <h1 className={styles.title} style={{ fontSize: '1.5rem', lineHeight: '1.1', margin: '2px 0' }}>
            {esSoloLectura ? 'Resumen' : 'Surtido'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0 }}>
              Proveedor: <b style={{ color: 'var(--text-main)' }}>{detalleOrdenActual.proveedor?.nombre || 'Pendiente'}</b>
          </p>
        </div>

        {/* Acciones del encabezado */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={descargarPdf} 
            className={styles.btnSecondary} 
            style={{ 
              padding: '8px 12px', 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              backgroundColor: 'var(--color-surface-lowest)', 
              color: 'var(--color-primary)', 
              border: '1px solid var(--color-primary)' 
            }}
            title="Descargar PDF para WhatsApp"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>picture_as_pdf</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>PDF</span>
          </button>
          <button onClick={onVolver} className={styles.btnSecondary} style={{ padding: '6px', borderRadius: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>close</span>
          </button>
        </div>
      </header>

      {/* --- BARRA DE PROGRESO MINI --- */}
      <div style={{ marginBottom: '16px', backgroundColor: 'white', padding: '10px', borderRadius: '12px', border: '1px solid var(--border-ghost)', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase' }}>
          <span style={{ color: progreso === 100 ? 'var(--color-primary)' : 'var(--text-light)' }}>
              {progreso === 100 ? 'COMPLETO' : 'PROGRESO SURTIDO'}
          </span>
          <span>{itemsComprados} / {totalItems}</span>
        </div>
        <div style={{ width: '100%', height: '4px', backgroundColor: '#f0f0f0', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ 
            width: `${progreso}%`, 
            height: '100%', 
            backgroundColor: esSoloLectura ? 'var(--text-muted)' : 'var(--color-primary)', 
            transition: 'width 0.5s ease' 
          }}></div>
        </div>
      </div>

      {/* --- LISTA DE PRODUCTOS EN GRID DE 4 COLUMNAS --- */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', marginBottom: puedeEditar ? '110px' : '40px' }}>
        {detalleOrdenActual.detalles.map((item) => {
          const esComprado = item.estatus === 'Comprado';
          
          return (
            <div 
              key={item.id} 
              onClick={() => puedeEditar && toggleEstatusItem(item.id, item.estatus)}
              className={styles.card}
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'auto 1fr auto auto', 
                alignItems: 'center', 
                gap: '16px', 
                cursor: puedeEditar ? 'pointer' : 'default',
                backgroundColor: esComprado ? 'var(--color-surface-lowest)' : 'white',
                borderColor: esComprado ? 'transparent' : 'var(--border-ghost)',
                opacity: esComprado ? 0.7 : 1,
                padding: '10px 16px', 
                borderRadius: '10px',
                width: '100%'
              }}
            >
              {/* Columna 1: Checkbox */}
              <div style={{ 
                width: '22px', 
                height: '22px', 
                borderRadius: '6px', 
                border: esComprado ? 'none' : `1.5px solid var(--border-ghost)`,
                backgroundColor: esComprado ? (esSoloLectura ? 'var(--text-muted)' : 'var(--color-primary)') : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {esComprado && <span className="material-symbols-outlined" style={{ color: 'white', fontSize: '1rem' }}>done</span>}
              </div>

              {/* Columna 2: Información del producto */}
              <div style={{ minWidth: 0 }}>
                <h4 style={{ 
                  margin: 0, 
                  fontSize: '0.95rem', 
                  textDecoration: esComprado ? 'line-through' : 'none',
                  color: esComprado ? 'var(--text-muted)' : 'var(--text-main)',
                  fontWeight: esComprado ? '400' : '600',
                  lineHeight: '1.2'
                }}>
                  {item.producto?.nombre}
                </h4>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {item.cantidad} {item.producto?.um?.abreviatura} 
                  {item.producto?.marca && ` • ${item.producto.marca}`}
                </p>
              </div>

              {/* Columna 3: Botón NO HAY */}
              {puedeEditar && !esComprado ? (
                <button 
                  onClick={(e) => handleNoHay(e, item)}
                  style={{ 
                    backgroundColor: 'transparent',
                    border: '1.5px solid #ba1a1a', 
                    color: '#ba1a1a',
                    borderRadius: '8px', 
                    padding: '6px 12px', 
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap'
                  }}
                  title="Transferir a segundo proveedor"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>swap_horiz</span>
                  NO HAY
                </button>
              ) : (
                <div />
              )}

              {/* Columna 4: Precio */}
              <div style={{ textAlign: 'right', minWidth: '70px' }}>
                <span style={{ 
                    display: 'block', 
                    fontSize: '0.9rem', 
                    fontWeight: 'bold', 
                    color: esComprado ? 'var(--text-light)' : 'var(--text-main)' 
                }}>
                  ${item.costo_unitario}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* --- PIE DE PÁGINA FLOTANTE --- */}
      {puedeEditar && (
        <footer style={{ 
          position: 'fixed', 
          bottom: '85px', 
          left: '12px', 
          right: '12px', 
          zIndex: 100,
          display: 'flex',
          justifyContent: 'center'
        }}>
          <button 
            onClick={handleFinalizarCompra}
            className={`${styles.btnBase} ${styles.btnPrimary}`} 
            style={{ 
              width: '100%', 
              maxWidth: '600px',
              padding: '1rem', 
              boxShadow: '0 8px 20px rgba(0,95,86,0.3)',
              borderRadius: '14px',
              fontSize: '0.95rem',
              fontWeight: 'bold'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}></span>
            FINALIZAR COMPRA
          </button>
        </footer>
      )}
    </div>
  );
}