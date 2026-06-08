// src/modules/Admin/Tabs/Pedidos/ChecklistPedido.jsx
import React, { useEffect, useState } from 'react';
import styles from '../../../../assets/styles/EstilosGenerales.module.css';
import { usePedidos } from './2usePedidos';
import { useAuth } from '../../../Auth/useAuth'; // CORRECCIÓN P1: reemplaza AuthService
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Token semántico — fallback incluido hasta agregarlo a variables.css
const COLOR_DANGER = 'var(--color-danger, #ba1a1a)';

// Color primario en RGB para el PDF — terracota #a23f27
// CORRECCIÓN P1: era (0, 95, 86) — verde teal incorrecto para esta paleta
const PDF_COLOR_PRIMARY = [162, 63, 39];
const PDF_COLOR_WHITE   = [255, 255, 255];
const PDF_COLOR_TEXTO   = [43, 36, 33];   // --text-main: #2b2421

export default function ChecklistPedido({ ordenId, onVolver }) {
  const {
    loading,
    detalleOrdenActual,
    cargarDetalleDeOrden,
    toggleEstatusItem,
    cambiarEstatusOrden
  } = usePedidos();

  // CORRECCIÓN P1: Consumimos el Context centralizado
  const { usuario } = useAuth();
  const permisos = usuario?.permisos?.pedidos || {};

  // Estado local para alternar la visualización informativa de la Opción B
  const [mostrandoOpcionB, setMostrandoOpcionB] = useState({});

  /**
   * CORRECCIÓN P1: Estado para confirmación de finalización.
   * Reemplaza window.confirm — cuando hay ítems sin marcar,
   * mostramos un panel de confirmación inline en lugar de
   * bloquear el hilo con el diálogo nativo del navegador.
   */
  const [confirmarFinalizacion, setConfirmarFinalizacion] = useState(false);

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
  const puedeEditar   = !esSoloLectura && permisos.editar;

  const itemsComprados = detalleOrdenActual.detalles.filter(d => d.estatus === 'Comprado').length;
  const totalItems     = detalleOrdenActual.detalles.length;
  const progreso       = totalItems > 0 ? (itemsComprados / totalItems) * 100 : 0;

  const handleFinalizarCompra = async () => {
    // Si hay ítems pendientes y aún no se confirmó, mostramos el panel de confirmación
    if (itemsComprados < totalItems && !confirmarFinalizacion) {
      setConfirmarFinalizacion(true);
      return;
    }
    // Segunda llamada: ya confirmó, procedemos
    setConfirmarFinalizacion(false);
    const exito = await cambiarEstatusOrden(detalleOrdenActual.id, 'Completado');
    if (exito) onVolver();
  };

  const handleCancelarConfirmacion = () => {
    setConfirmarFinalizacion(false);
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

      // CORRECCIÓN P1: Color del header — terracota en lugar de teal
      doc.setFillColor(...PDF_COLOR_PRIMARY);
      doc.rect(0, 0, 210, 35, 'F');
      doc.setTextColor(...PDF_COLOR_WHITE);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('REQUISICIÓN DE INSUMOS', 14, 22);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`FOLIO: ${detalleOrdenActual.folio || 'N/A'}`, 14, 28);
      doc.text(`FECHA: ${new Date(detalleOrdenActual.created_at).toLocaleDateString('es-MX')}`, 140, 28);

      doc.setTextColor(...PDF_COLOR_TEXTO);
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
      const filas = detalleOrdenActual.detalles.map(item => {
        const rawEquiv     = item.producto?.producto_equivalente;
        const prodEquivalente = Array.isArray(rawEquiv) ? rawEquiv[0] : rawEquiv;
        return [
          item.producto?.nombre || 'Insumo',
          item.producto?.marca  || 'S/M',
          item.cantidad,
          item.producto?.presentacion || 'PIEZA',
          `${item.cantidad * (item.producto?.contenido || 1)} ${item.producto?.um?.abreviatura || ''}`
        ];
      });

      autoTable(doc, {
        head: [columnas],
        body: filas,
        startY: 74,
        styles: { fontSize: 9, cellPadding: 4 },
        // CORRECCIÓN P1: Color de cabecera de tabla — terracota en lugar de teal
        headStyles: { fillColor: PDF_COLOR_PRIMARY, textColor: PDF_COLOR_WHITE },
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
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button
            onClick={descargarPdf}
            className={styles.btnSecondary}
            style={{ width: '38px', height: '38px', padding: 0, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>download</span>
          </button>
          <button
            onClick={onVolver}
            className={styles.btnSecondary}
            style={{ width: '38px', height: '38px', padding: 0, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>close</span>
          </button>
        </div>
      </header>

      {/* --- BARRA DE PROGRESO --- */}
      <div style={{
        marginBottom: '20px',
        backgroundColor: 'var(--color-surface-lowest)',
        padding: '12px',
        borderRadius: 'var(--radius-xl)',       // CORRECCIÓN: era '12px'
        border: '1px solid var(--border-ghost)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)', fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <span>{progreso === 100 ? 'Surtido Completo' : 'Progreso de Carga'}</span>
          <span>{itemsComprados} / {totalItems} Artículos</span>
        </div>
        <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--color-surface-low)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
          <div style={{ width: `${progreso}%`, height: '100%', backgroundColor: 'var(--color-primary)', transition: 'width 0.6s' }} />
        </div>
      </div>

      {/* --- LISTADO DE ÍTEMS --- */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        {detalleOrdenActual.detalles.map((item) => {
          const esComprado  = item.estatus === 'Comprado';
          const verOpcionB  = !!mostrandoOpcionB[item.id];
          const tieneOpcionB = !!item.producto?.producto_equivalente_id;

          // EXTRACCIÓN SEGURA (Si Supabase devuelve un arreglo, tomamos el elemento 0)
          const rawEquiv       = item.producto?.producto_equivalente;
          const prodEquivalente = Array.isArray(rawEquiv) ? rawEquiv[0] : rawEquiv;
          const rawProvOrig    = item.producto?.proveedor;
          const provOriginal   = Array.isArray(rawProvOrig) ? rawProvOrig[0] : rawProvOrig;
          const rawProvEquiv   = prodEquivalente?.proveedor;
          const provEquivalente = Array.isArray(rawProvEquiv) ? rawProvEquiv[0] : rawProvEquiv;

          return (
            <div
              key={item.id}
              className={styles.card}
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '12px 14px',
                borderRadius: 'var(--radius-xl)',                  // CORRECCIÓN: era '10px'
                backgroundColor: esComprado
                  ? 'var(--color-surface-lowest)'
                  : 'var(--color-surface-lowest)',
                borderLeft: esComprado
                  ? `4px solid var(--text-light)`                   // CORRECCIÓN: era '#999'
                  : verOpcionB
                    ? `4px solid ${COLOR_DANGER}`
                    : '4px solid var(--color-primary)',
                opacity: esComprado ? 0.7 : 1,
                minHeight: '64px',
                transition: 'all 0.2s ease'
              }}
            >
              {/* ── FILA PRINCIPAL (siempre visible) ── */}
              <div
                onClick={() => puedeEditar && !verOpcionB && toggleEstatusItem(item.id, item.estatus)}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: puedeEditar && !verOpcionB ? 'pointer' : 'default'
                }}
              >
                {/* Checkbox */}
                <div style={{
                  width: '24px', height: '24px',
                  borderRadius: 'var(--radius-lg)',                // CORRECCIÓN: era '6px'
                  border: esComprado ? 'none' : '2px solid var(--border-ghost)',
                  backgroundColor: esComprado ? 'var(--color-primary)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {esComprado && (
                    <span className="material-symbols-outlined" style={{ color: 'var(--color-surface-lowest)', fontSize: '1rem' }}>
                      done
                    </span>
                  )}
                </div>

                {/* Info del producto ORIGINAL */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{
                    margin: 0, fontSize: '0.9rem', fontWeight: 'bold',
                    textDecoration: esComprado ? 'line-through' : 'none',
                    color: esComprado ? 'var(--text-muted)' : 'var(--text-main)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                  }}>
                    {item.producto?.nombre} {item.producto?.marca && `- ${item.producto.marca}`}
                  </h4>
                  <p style={{ marginTop: '2px', marginBottom: 0, fontSize: '0.7rem', color: esComprado ? 'var(--text-muted)' : 'var(--text-main)', fontWeight: '800' }}>
                    {item.cantidad} {item.producto?.presentacion || 'PIEZA'}
                  </p>
                  <p style={{ marginTop: '1px', marginBottom: 0, fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                    Comprar con: <span style={{ color: 'var(--color-primary)', textTransform: 'uppercase' }}>{provOriginal?.nombre || 'No asignado'}</span>
                  </p>
                </div>

                {/* Botón VER OPCIÓN B */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                  {puedeEditar && !esComprado && tieneOpcionB && (
                    <button
                      onClick={(e) => handleNoHayInformativo(e, item.id)}
                      style={{
                        backgroundColor: verOpcionB ? 'var(--text-muted)' : 'transparent',
                        border: verOpcionB ? '1px solid var(--text-muted)' : `1px solid ${COLOR_DANGER}`,
                        color: verOpcionB ? 'var(--color-surface-lowest)' : COLOR_DANGER,
                        borderRadius: 'var(--radius-lg)',            // CORRECCIÓN: era '6px'
                        padding: '6px 10px',
                        fontSize: '0.65rem',
                        fontWeight: '900',
                        transition: 'all 0.15s ease',
                        cursor: 'pointer'
                      }}
                    >
                      {verOpcionB ? 'VER ORIGINAL' : 'VER OPCIÓN B'}
                    </button>
                  )}
                </div>
              </div>

              {/* ── PANEL EXPANDIDO: OPCIÓN B ── */}
              {verOpcionB && tieneOpcionB && (
                <div style={{
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: `1px dashed ${COLOR_DANGER}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  animation: 'slideUp 0.2s ease'
                }}>
                  <span style={{ fontSize: '0.6rem', fontWeight: '900', textTransform: 'uppercase', color: COLOR_DANGER, letterSpacing: '0.5px' }}>
                    ⚠ Insumo alternativo disponible
                  </span>
                  <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'bold', color: COLOR_DANGER, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {prodEquivalente?.nombre || 'Sin nombre'} {prodEquivalente?.marca && `- ${prodEquivalente.marca}`}
                  </h4>
                  <p style={{ marginTop: '2px', marginBottom: 0, fontSize: '0.7rem', color: 'var(--text-main)', fontWeight: '800' }}>
                    {item.cantidad} {prodEquivalente?.presentacion || 'PIEZA'}
                    {prodEquivalente?.contenido
                      ? ` • ${item.cantidad * prodEquivalente.contenido} ${item.producto?.um?.abreviatura || ''} total`
                      : ''}
                  </p>
                  <p style={{ marginTop: '1px', marginBottom: 0, fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                    Comprar con: <span style={{ color: 'var(--color-primary)', textTransform: 'uppercase' }}>{provEquivalente?.nombre || 'No asignado'}</span>
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* --- ÁREA FIJA INFERIOR: BOTÓN + CONFIRMACIÓN --- */}
      {puedeEditar && (
        <div style={{ position: 'fixed', bottom: '85px', left: '16px', right: '16px', zIndex: 100, display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>

          {/* Panel de confirmación — reemplaza window.confirm */}
          {confirmarFinalizacion && (
            <div style={{
              backgroundColor: 'var(--color-surface-lowest)',
              border: `1px solid ${COLOR_DANGER}`,
              borderRadius: 'var(--radius-xl)',
              padding: '12px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              boxShadow: 'var(--shadow-dropdown, 0 8px 24px rgba(0,0,0,0.15))',
              animation: 'slideUp 0.2s ease'
            }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: COLOR_DANGER, fontWeight: 'bold' }}>
                Hay productos sin marcar. ¿Finalizar de todas formas?
              </p>
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                <button
                  onClick={handleCancelarConfirmacion}
                  className={`${styles.btnBase} ${styles.btnSecondary}`}
                  style={{ height: '32px', padding: '0 12px', fontSize: '0.7rem', borderRadius: 'var(--radius-lg)' }}
                >
                  Volver
                </button>
                <button
                  onClick={handleFinalizarCompra}
                  className={`${styles.btnBase} ${styles.btnDanger}`}
                  style={{ height: '32px', padding: '0 12px', fontSize: '0.7rem', borderRadius: 'var(--radius-lg)' }}
                >
                  Finalizar
                </button>
              </div>
            </div>
          )}

          {/* Botón principal */}
          <button
            onClick={handleFinalizarCompra}
            className={`${styles.btnBase} ${styles.btnPrimary}`}
            style={{
              width: '100%',
              padding: '1rem',
              borderRadius: 'var(--radius-xl)',
              fontWeight: 'bold',
              boxShadow: 'var(--shadow-card)'  // CORRECCIÓN P1: era rgba(0,95,86,0.3) — teal incorrecto
            }}
          >
            <span className="material-symbols-outlined">check_circle</span>
            {confirmarFinalizacion ? 'CONFIRMAR FINALIZACIÓN' : 'FINALIZAR SURTIDO'}
          </button>
        </div>
      )}
    </div>
  );
}