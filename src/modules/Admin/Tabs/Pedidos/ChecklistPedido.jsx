// src/modules/Admin/Tabs/Pedidos/ChecklistPedido.jsx
import React, { useEffect } from 'react';
import styles from '../../../../assets/styles/EstilosGenerales.module.css';
import { usePedidos } from './2usePedidos';
import { AuthService } from '../../../Auth/Auth.service';
import toast from 'react-hot-toast';

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

  const esSoloLectura = ['Completado', 'Cancelado'].includes(detalleOrdenActual.estatus);
  const puedeEditar = !esSoloLectura && permisos.editar;

  const itemsComprados = detalleOrdenActual.detalles.filter(d => d.estatus === 'Comprado').length;
  const totalItems = detalleOrdenActual.detalles.length;
  const progreso = totalItems > 0 ? (itemsComprados / totalItems) * 100 : 0;

  /**
   * Finaliza el surtido global de la orden.
   */
  const handleFinalizarCompra = async () => {
    if (itemsComprados < totalItems) {
      if (!window.confirm('Hay productos sin marcar. ¿Deseas finalizar el surtido de este pedido?')) return;
    }
    const exito = await cambiarEstatusOrden(detalleOrdenActual.id, 'Completado');
    if (exito) onVolver();
  };

  /**
   * Dispara la reasignación al proveedor secundario.
   * La confirmación se maneja dentro del Hook para centralizar la lógica.
   */
  const handleNoHay = async (e, item) => {
    e.stopPropagation(); // Evita que se dispare el toggle de estatus del card
    
    // Llamamos a la función del Hook que ya contiene el flujo transaccional
    const exito = await pasarASegundoProveedor(item.id, item.producto_id);
    
    if (exito) {
      // El Hook ya se encarga de limpiar el estado local y mostrar el toast con el folio
      console.log(`Item ${item.id} reasignado exitosamente.`);
    }
  };

  /**
   * Genera el documento PDF de la requisición (Sin información de costos).
   */
  const descargarPdf = () => {
    try {
      const doc = new jsPDF();
      
      // Encabezado Estético
      doc.setFillColor(0, 95, 86); 
      doc.rect(0, 0, 210, 35, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('REQUISICIÓN DE INSUMOS', 14, 22);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`FOLIO: ${detalleOrdenActual.folio || 'N/A'}`, 14, 28);
      doc.text(`FECHA: ${new Date(detalleOrdenActual.created_at).toLocaleDateString('es-MX')}`, 140, 28);
      
      // Información de Proveedor y Destino
      doc.setTextColor(51, 51, 51);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Proveedor:', 14, 48);
      doc.setFont('helvetica', 'normal');
      doc.text(`Nombre: ${detalleOrdenActual.proveedor?.nombre || 'General'}`, 14, 54);
      doc.text(`Contacto: ${detalleOrdenActual.proveedor?.numero_contacto || 'No registrado'}`, 14, 60);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Destino de Entrega:', 120, 48);
      doc.setFont('helvetica', 'normal');
      doc.text(`Sucursal: ${detalleOrdenActual.sucursal?.nombre || 'General'}`, 120, 54);
      doc.text(`Solicitado por: ${detalleOrdenActual.solicitante?.nombre_completo || 'Sistema'}`, 120, 60);
      
      doc.setDrawColor(220, 220, 220);
      doc.line(14, 68, 196, 68);

      // Tabla de Productos Operativos
      const columnas = ['Producto', 'Marca', 'Cant.', 'Presentación', 'Contenido Total'];
      const filas = detalleOrdenActual.detalles.map(item => [
        item.producto?.nombre || 'Insumo',
        item.producto?.marca || 'S/M',
        item.cantidad,
        item.producto?.presentacion || 'PIEZA',
        `${item.cantidad * (item.producto?.contenido || 1)} ${item.producto?.um?.abreviatura || ''}`
      ]);

      autoTable(doc, {
        head: [columnas],
        body: filas,
        startY: 74,
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: [0, 95, 86], textColor: [255, 255, 255] },
        theme: 'striped'
      });

      const finalY = doc.lastAutoTable?.finalY || 80;

      // Notas al pie
      if (detalleOrdenActual.notas || detalleOrdenActual.notes) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 100, 100);
        doc.text('Notas adicionales:', 14, finalY + 15);
        doc.text(detalleOrdenActual.notas || detalleOrdenActual.notes, 14, finalY + 20);
      }

      doc.save(`Requisicion_${detalleOrdenActual.folio || 'S_F'}.pdf`);
      toast.success('¡PDF generado con éxito!');
    } catch (error) {
      toast.error('No se pudo crear el PDF');
      console.error(error);
    }
  };

  return (
    <div className={styles.fadeIN} style={{ width: '100%', maxWidth: '100%', paddingBottom: '120px' }}>
      
      {/* --- ENCABEZADO --- */}
      <header style={{ marginBottom: 'var(--space-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <span className={styles.labelTop} style={{ display: 'block', marginBottom: '2px' }}>CONTROL DE SURTIDO</span>
          <h1 className={styles.title} style={{ fontSize: '2rem', lineHeight: '1', marginTop: 0, marginBottom: 0 }}>
            {esSoloLectura ? 'Resumen de\nPedido' : 'Surtir\nInsumos'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px', marginBottom: 0 }}>
            Folio: <b style={{ color: 'var(--text-main)' }}>{detalleOrdenActual.folio || 'S/F'}</b> • {detalleOrdenActual.proveedor?.nombre}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={descargarPdf} 
            className={styles.btnSecondary} 
            style={{ width: '38px', height: '38px', padding: 0, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Descargar PDF"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>picture_as_pdf</span>
          </button>
          <button 
            onClick={onVolver} 
            className={styles.btnSecondary} 
            style={{ width: '38px', height: '38px', padding: 0, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>close</span>
          </button>
        </div>
      </header>

      {/* --- BARRA DE PROGRESO --- */}
      <div style={{ marginBottom: '20px', backgroundColor: 'white', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-ghost)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <span style={{ color: progreso === 100 ? 'var(--color-primary)' : 'var(--text-muted)' }}>
            {progreso === 100 ? 'Surtido Completo' : 'Progreso de Carga'}
          </span>
          <span>{itemsComprados} / {totalItems} Artículos</span>
        </div>
        <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--color-surface-low)', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ 
            width: `${progreso}%`, 
            height: '100%', 
            backgroundColor: 'var(--color-primary)', 
            transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)' 
          }}></div>
        </div>
      </div>

      {/* --- LISTADO DE PRODUCTOS --- */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {detalleOrdenActual.detalles.map((item) => {
          const esComprado = item.estatus === 'Comprado';
          const contenidoBase = item.producto?.contenido || 1;
          const totalNeto = item.cantidad * contenidoBase;
          
          return (
            <div 
              key={item.id} 
              onClick={() => puedeEditar && toggleEstatusItem(item.id, item.estatus)}
              className={styles.card}
              style={{ 
                display: 'flex', 
                flexDirection: 'row',
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor: esComprado ? 'var(--color-surface-lowest)' : 'white',
                borderLeft: esComprado ? '4px solid #999' : '4px solid var(--color-primary)',
                opacity: esComprado ? 0.7 : 1,
                cursor: puedeEditar ? 'pointer' : 'default',
                minHeight: '64px',
                gap: '12px',
                transition: 'all 0.2s ease'
              }}
            >
              {/* Checkbox Visual */}
              <div style={{ 
                width: '24px', height: '24px', borderRadius: '6px', 
                border: esComprado ? 'none' : '2px solid var(--border-ghost)',
                backgroundColor: esComprado ? 'var(--color-primary)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                {esComprado && <span className="material-symbols-outlined" style={{ color: 'white', fontSize: '1rem' }}>done</span>}
              </div>

              {/* Información del Insumo */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ 
                  margin: 0,
                  fontSize: '0.9rem', 
                  fontWeight: 'bold', 
                  textDecoration: esComprado ? 'line-through' : 'none',
                  color: esComprado ? 'var(--text-muted)' : 'var(--text-main)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                }}>
                  {item.producto?.nombre}
                </h4>
                
                <p style={{ marginTop: '2px', marginBottom: 0, fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                  <span style={{ fontWeight: '800', color: esComprado ? 'inherit' : 'var(--text-main)' }}>
                    {item.cantidad} {item.producto?.presentacion || 'PIEZA'}
                  </span>
                  
                  {contenidoBase > 1 && (
                    <span style={{ 
                      marginLeft: '6px',
                      color: 'var(--color-primary)', 
                      fontWeight: 'bold',
                      backgroundColor: 'var(--color-surface-low)',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      fontSize: '0.65rem'
                    }}>
                      ({totalNeto} {item.producto?.um?.abreviatura})
                    </span>
                  )}
                  
                  {item.producto?.marca && ` • ${item.producto.marca}`}
                </p>
              </div>

              {/* Acciones del Item */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                {puedeEditar && !esComprado && item.producto?.proveedor_secundario_id && (
                  <button 
                    onClick={(e) => handleNoHay(e, item)}
                    style={{ 
                      backgroundColor: 'transparent', border: '1px solid #ba1a1a', color: '#ba1a1a',
                      borderRadius: '6px', padding: '4px 8px',
                      fontSize: '0.65rem', fontWeight: '900',
                      display: 'flex', alignItems: 'center', gap: '4px'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>swap_horiz</span>
                    NO HAY
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* --- BOTÓN FLOTANTE FINALIZAR --- */}
      {puedeEditar && (
        <div style={{ 
          position: 'fixed', bottom: '85px', left: '16px', right: '16px', zIndex: 100
        }}>
          <button 
            onClick={handleFinalizarCompra}
            className={`${styles.btnBase} ${styles.btnPrimary}`} 
            style={{ 
              width: '100%', padding: '1rem', borderRadius: '14px', fontWeight: 'bold',
              boxShadow: '0 8px 24px rgba(0, 95, 86, 0.3)', fontSize: '0.9rem'
            }}
          >
            <span className="material-symbols-outlined">check_circle</span>
            FINALIZAR SURTIDO
          </button>
        </div>
      )}
    </div>
  );
}