// src/modules/Admin/Tabs/Pedidos/ChecklistPedido.jsx
import React, { useEffect, useState } from 'react';
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
    cambiarEstatusOrden
  } = usePedidos();

  const sesion = AuthService.getSesion();
  const permisos = sesion?.permisos?.pedidos || {};

  // Estado local para alternar la visualización informativa de la Opción B en cada tarjeta individual
  const [mostrandoOpcionB, setMostrandoOpcionB] = useState({});

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

  const handleFinalizarCompra = async () => {
    if (itemsComprados < totalItems) {
      if (!window.confirm('Hay productos sin marcar. ¿Deseas finalizar el surtido de este pedido?')) return;
    }
    const exito = await cambiarEstatusOrden(detalleOrdenActual.id, 'Completado');
    if (exito) onVolver();
  };

  const handleNoHayInformativo = (e, itemId) => {
    e.stopPropagation(); 
    setMostrandoOpcionB(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const descargarPdf = () => {
    try {
      const doc = new jsPDF();
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
      if (detalleOrdenActual.notes || detalleOrdenActual.notas) {
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
          <button onClick={descargarPdf} className={styles.btnSecondary} style={{ width: '38px', height: '38px', padding: 0, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>download</span>
          </button>
          <button onClick={onVolver} className={styles.btnSecondary} style={{ width: '38px', height: '38px', padding: 0, borderRadius: '8px', display: 'flex', alignItems: 'center', center: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>close</span>
          </button>
        </div>
      </header>

      <div style={{ marginBottom: '20px', backgroundColor: 'white', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-ghost)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <span>{progreso === 100 ? 'Surtido Completo' : 'Progreso de Carga'}</span>
          <span>{itemsComprados} / {totalItems} Artículos</span>
        </div>
        <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--color-surface-low)', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ width: `${progreso}%`, height: '100%', backgroundColor: 'var(--color-primary)', transition: 'width 0.6s' }}></div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {detalleOrdenActual.detalles.map((item) => {
          const esComprado = item.estatus === 'Comprado';
          const verOpcionB = !!mostrandoOpcionB[item.id];
          const prodEquivalente = item.producto?.producto_equivalente;
          const tieneOpcionB = !!item.producto?.producto_equivalente_id;
          
          return (
            <div 
              key={item.id} 
              onClick={() => puedeEditar && !verOpcionB && toggleEstatusItem(item.id, item.estatus)}
              className={styles.card}
              style={{ 
                display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 14px', borderRadius: '10px', backgroundColor: esComprado ? 'var(--color-surface-lowest)' : 'white',
                borderLeft: esComprado ? '4px solid #999' : (verOpcionB ? '4px solid #ba1a1a' : '4px solid var(--color-primary)'),
                opacity: esComprado ? 0.7 : 1, cursor: puedeEditar && !verOpcionB ? 'pointer' : 'default',
                minHeight: '64px', gap: '12px', transition: 'all 0.2s ease'
              }}
            >
              <div style={{ width: '24px', height: '24px', borderRadius: '6px', border: esComprado ? 'none' : '2px solid var(--border-ghost)', backgroundColor: esComprado ? 'var(--color-primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {esComprado && <span className="material-symbols-outlined" style={{ color: 'white', fontSize: '1rem' }}>done</span>}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                {!verOpcionB ? (
                  <>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'bold', textDecoration: esComprado ? 'line-through' : 'none', color: esComprado ? 'var(--text-muted)' : 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.producto?.nombre} {item.producto?.marca && `- ${item.producto.marca}`}
                    </h4>
                    <p style={{ marginTop: '2px', marginBottom: 0, fontSize: '0.7rem', color: esComprado ? 'var(--text-muted)' : 'var(--text-main)', fontWeight: '800' }}>
                      {item.cantidad} {item.producto?.presentacion || 'PIEZA'}
                    </p>
                  </>
                ) : (
                  <>
                    <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: '800', color: '#ba1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      [OPCIÓN B]: {prodEquivalente?.nombre || 'S/N'} {prodEquivalente?.marca && `- ${prodEquivalente.marca}`}
                    </h4>
                    <p style={{ marginTop: '2px', marginBottom: 0, fontSize: '0.7rem', color: 'var(--text-main)', fontWeight: 'bold' }}>
                      Formato: {item.cantidad} {prodEquivalente?.presentacion || 'PIEZA'} ({item.cantidad * (prodEquivalente?.contenido || 1)} {item.producto?.um?.abreviatura || ''})
                    </p>
                    <p style={{ marginTop: '1px', marginBottom: 0, fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                      Comprar con: <span style={{ color: 'var(--color-primary)', textTransform: 'uppercase' }}>{prodEquivalente?.proveedor?.nombre || 'No asignado'}</span>
                    </p>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                {puedeEditar && !esComprado && tieneOpcionB && (
                  <button 
                    onClick={(e) => handleNoHayInformativo(e, item.id)}
                    style={{ 
                      backgroundColor: verOpcionB ? 'var(--text-muted)' : 'transparent', 
                      border: verOpcionB ? '1px solid var(--text-muted)' : '1px solid #ba1a1a', 
                      color: verOpcionB ? 'white' : '#ba1a1a', 
                      borderRadius: '6px', padding: '6px 10px', fontSize: '0.65rem', fontWeight: '900', transition: 'all 0.15s ease'
                    }}
                  >
                    {verOpcionB ? 'VER ORIGINAL' : 'VER OPCIÓN B'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {puedeEditar && (
        <div style={{ position: 'fixed', bottom: '85px', left: '16px', right: '16px', zIndex: 100 }}>
          <button onClick={handleFinalizarCompra} className={`${styles.btnBase} ${styles.btnPrimary}`} style={{ width: '100%', padding: '1rem', borderRadius: '14px', fontWeight: 'bold', boxShadow: '0 8px 24px rgba(0, 95, 86, 0.3)' }}>
            <span className="material-symbols-outlined">check_circle</span> FINALIZAR SURTIDO
          </button>
        </div>
      )}
    </div>
  );
}