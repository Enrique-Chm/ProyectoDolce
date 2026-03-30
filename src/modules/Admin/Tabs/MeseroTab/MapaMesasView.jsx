// Archivo: src/modules/Admin/Tabs/MeseroTab/MapaMesasView.jsx
import React, { useState, useEffect } from "react";
import s from "../../../../assets/styles/ServicioTab.module.css";
import stylesAdmin from "../../../../assets/styles/EstilosGenerales.module.css";

export const MapaMesasView = ({
  zonasMesas,
  cuentasAbiertas,
  seleccionarCuenta,
  mesaId, setMesaId,
  mesaInput, setMesaInput,
  tipoOrden, setTipoOrden,
  comensales, setComensales,
  clienteNombre, setClienteNombre,
  notasOrden, setNotasOrden,
  setView,
  puedeTomarOrdenes,
  puedeVerHistorial,
  usuarioIdLogueado, // 🚀 Para el Table Ownership
  abrirMenuMesaNueva // 🚀 NUEVO: Función interceptora desde el hook para validar Race Conditions
}) => {
  const [activeZonaId, setActiveZonaId] = useState(null);
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);

  useEffect(() => {
    if (zonasMesas.length > 0 && !activeZonaId) {
      setActiveZonaId(zonasMesas[0].id);
    }
  }, [zonasMesas, activeZonaId]);

  const zonaActiva = zonasMesas.find(z => z.id === activeZonaId);
  const mesas = zonaActiva?.cat_mesas || [];

  const getCuentaDeMesa = (mId) => {
    return cuentasAbiertas.find(cuenta => cuenta.mesa_id === mId);
  };

  const handleClickMesa = (mesa) => {
    // Evitamos clics en obstáculos
    if (mesa.tipo_elemento === 'OBSTACULO') return;

    setMesaSeleccionada(mesa);
    const cuentaActiva = getCuentaDeMesa(mesa.id);
    if (!cuentaActiva) {
      setMesaId(mesa.id);
      setMesaInput(mesa.nombre);
      setTipoOrden('salon');
      setComensales(mesa.capacidad || 1);
      setClienteNombre('');
      setNotasOrden('');
    }
  };

  const handleAbrirMesaNueva = (e) => {
    e.preventDefault();
    if (!puedeTomarOrdenes) return;
    
    // 🚀 EN LUGAR DE setView("menu"), LLAMAMOS A LA VALIDACIÓN
    if (abrirMenuMesaNueva) {
      abrirMenuMesaNueva();
    } else {
      // Fallback de seguridad por si no se pasó la prop correctamente
      setView("menu");
    }
  };

  const cuentaDeMesaSeleccionada = mesaSeleccionada ? getCuentaDeMesa(mesaSeleccionada.id) : null;

  return (
    <div className={stylesAdmin.fadeIn} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      
      {/* HEADER DE SECCIÓN */}
      <div className={s.headerRow} style={{ marginBottom: '0' }}>
        <h2 className={s.sectionTitle}>Mapa de Mesas</h2>
        <div className={s.flexCenterGap}>
          {puedeVerHistorial && (
            <button className={s.btnCancel} style={{ padding: "6px 12px", fontSize: "12px" }} onClick={() => setView("historial")}>
              HISTORIAL DE COBROS
            </button>
          )}
          {puedeTomarOrdenes && (
             <button className={s.btnPrimary} style={{ padding: "6px 12px", fontSize: "12px" }} onClick={() => {
               setMesaId(null);
               setMesaInput('Mostrador');
               setTipoOrden('mostrador');
               setView("menu");
             }}>
             VENTA MOSTRADOR
             </button>
          )}
        </div>
      </div>

      {zonasMesas.length === 0 ? (
        <div className={stylesAdmin.emptyState} style={{ marginTop: '20px' }}>
          No hay zonas configuradas.
        </div>
      ) : (
        <>
          {/* TABS DE ZONAS */}
          <nav className={stylesAdmin.tabNav} style={{ marginTop: '15px' }}>
            {zonasMesas.map(zona => (
              <button
                key={zona.id}
                className={`${stylesAdmin.tabButton} ${activeZonaId === zona.id ? stylesAdmin.activeTabButton : ""}`}
                onClick={() => {
                  setActiveZonaId(zona.id);
                  setMesaSeleccionada(null);
                }}
              >
                {zona.nombre.toUpperCase()}
              </button>
            ))}
          </nav>

          <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: '20px', alignItems: 'stretch', gap: '20px' }}>
            
            {/* 🪟 VIEWPORT CON SCROLL */}
            <div style={{ 
              flex: '2 1 500px', // 🚀 Aumentamos flex para que tome más espacio en desktop
              minWidth: '300px',
              overflow: 'auto',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              backgroundColor: '#f8fafc',
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.05)'
            }}>
              
              {/* 🚀 IZQUIERDA: LIENZO CON CUADRÍCULA Y MESAS ESCALABLES */}
              <div 
                className={stylesAdmin.planoContainer} 
                style={{ 
                  width: '100%',
                  minWidth: '800px',
                  aspectRatio: '16 / 10', 
                  position: 'relative',
                  backgroundImage: `radial-gradient(#cbd5e1 1.5px, transparent 0)`,
                  backgroundSize: `${100 / (zonaActiva?.grid_size || 10)}% ${100 / (zonaActiva?.grid_size || 10)}%`,
                  border: 'none', 
                  boxShadow: 'none',
                  containerType: 'inline-size' 
                }}
              >
                {mesas.map(mesa => {
                  const cuenta = getCuentaDeMesa(mesa.id);
                  const isSelected = mesaSeleccionada?.id === mesa.id;
                  
                  const esObstaculo = mesa.tipo_elemento === 'OBSTACULO';

                  // CÁLCULO DE TAMAÑO PROPORCIONAL A LA CUADRÍCULA
                  const gridSize = zonaActiva?.grid_size || 10;
                  const tableSize = (100 / gridSize) * 0.75; // Ocupa el 75% del espacio de la celda

                  // 🔒 LÓGICA DE BLOQUEO VISUAL (TABLE OWNERSHIP)
                  let statusStyle = { background: '#fff', border: '2px solid #cbd5e1', color: '#1e293b' };
                  let nombreDueño = null;
                  let esMesaBloqueada = false;

                  if (esObstaculo) {
                     statusStyle = { background: '#cbd5e1', border: '2px solid #94a3b8', color: '#475569', aspectRatio: '1 / 1' };
                  } else if (cuenta) {
                     // Evaluamos la propiedad
                     const esMiMesa = cuenta.usuario_id === Number(usuarioIdLogueado);
                     const esAdmin = puedeVerHistorial; // Asumimos rol gerencial
                     esMesaBloqueada = !esMiMesa && !esAdmin;
                     
                     nombreDueño = cuenta.usuarios_internos?.nombre?.split(' ')[0] || 'Ocupada';

                     if (esMesaBloqueada) {
                         // 🔴 ROJO / GRIS: Ocupada por OTRO
                         statusStyle = { background: '#fee2e2', border: '3px solid #ef4444', color: '#7f1d1d', opacity: 0.8 };
                     } else if (cuenta.estado === 'por_cobrar') {
                         // 🟡 AMARILLO: Ticket Impreso
                         statusStyle = { background: '#fef3c7', border: '3px solid #f59e0b', color: '#92400e' };
                     } else {
                         // 🟢 VERDE: En Consumo
                         statusStyle = { background: '#dcfce7', border: '3px solid #10b981', color: '#166534' };
                     }
                  }

                  // Función interceptora del clic en la mesa
                  const onMesaClick = () => {
                     if (esObstaculo) return;
                     if (esMesaBloqueada) {
                        alert(`⛔ MESA BLOQUEADA\nAtendida por: ${cuenta.usuarios_internos?.nombre || 'Otro Mesero'}`);
                        return;
                     }
                     handleClickMesa(mesa);
                  };

                  return (
                    <div 
                      key={mesa.id}
                      onClick={onMesaClick}
                      className={esObstaculo ? stylesAdmin.obstaculoPlano : stylesAdmin.mesaPlano}
                      style={{
                        left: `${mesa.pos_x || 0}%`,
                        top: `${mesa.pos_y || 0}%`,
                        ...statusStyle,
                        touchAction: 'auto',
                        width: `${tableSize}%`,
                        boxShadow: isSelected && !esObstaculo ? '0 0 0 4px rgba(0, 86, 150, 0.3)' : (esObstaculo ? 'none' : '0 4px 6px rgba(0,0,0,0.08)'),
                        zIndex: isSelected ? 10 : 1,
                        transform: `translate(-50%, -50%) ${isSelected && !esObstaculo ? 'scale(1.15)' : 'scale(1)'}`,
                        transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        fontSize: esObstaculo 
                           ? `max(10px, calc(${tableSize * 0.2}cqi + 1px))`
                           : `max(11px, calc(${tableSize * 0.25}cqi + 2px))`,
                        cursor: esObstaculo ? 'default' : (esMesaBloqueada ? 'not-allowed' : 'pointer')
                      }}
                    >
                      <span style={{ 
                        fontWeight: esObstaculo ? '600' : '900', 
                        lineHeight: 1,
                        width: '100%', 
                        wordBreak: 'break-word', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        display: '-webkit-box', 
                        WebkitLineClamp: cuenta ? 1 : 2,
                        WebkitBoxOrient: 'vertical',
                        opacity: esObstaculo ? 0.8 : 1
                      }}>
                        {mesa.nombre}
                      </span>
                      {cuenta && !esObstaculo && (
                        <span style={{ fontSize: '0.65em', fontWeight: 'bold', marginTop: '2px', lineHeight: '1' }}>
                          {esMesaBloqueada ? `🔒 ${nombreDueño}` : `$${parseFloat(cuenta.total).toFixed(0)}`}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DERECHA: PANEL DE ACCIONES */}
            <aside className={stylesAdmin.adminCard} style={{ 
              flex: '1 1 300px', // 🚀 Cambiado para que sea responsivo (ya no width 100% fijo)
              minWidth: '300px', 
              display: 'flex', 
              flexDirection: 'column' 
            }}>
              {!mesaSeleccionada ? (
                <div className={stylesAdmin.emptyState} style={{ margin: 'auto', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🛋️</div>
                  <p>Selecciona una mesa para gestionar la orden.</p>
                </div>
              ) : cuentaDeMesaSeleccionada ? (
                /* PANEL MESA OCUPADA */
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ backgroundColor: '#dcfce7', margin: '-24px -24px 20px -24px', padding: '24px', borderRadius: '8px 8px 0 0', textAlign: 'center' }}>
                    <h3 style={{ margin: 0, color: '#166534', fontSize: '1.5rem' }}>Mesa {mesaSeleccionada.nombre}</h3>
                    <span style={{ fontWeight: 'bold', color: '#166534', fontSize: '0.8rem' }}>
                      {cuentaDeMesaSeleccionada.estado === 'por_cobrar' ? '🔔 SOLICITUD DE PAGO' : '🟢 EN CONSUMO'}
                    </span>
                  </div>
                  
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div className={stylesAdmin.flexBetween} style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                      <span className={stylesAdmin.textMuted}>Pax:</span>
                      <strong>{cuentaDeMesaSeleccionada.comensales} personas</strong>
                    </div>
                    <div className={stylesAdmin.flexBetween} style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                      <span className={stylesAdmin.textMuted}>Total Actual:</span>
                      <strong style={{ fontSize: '1.3rem', color: 'var(--color-primary)' }}>${parseFloat(cuentaDeMesaSeleccionada.total).toFixed(2)}</strong>
                    </div>
                    {cuentaDeMesaSeleccionada.cliente_nombre && (
                      <div className={stylesAdmin.flexBetween}>
                        <span className={stylesAdmin.textMuted}>Cliente:</span>
                        <strong>{cuentaDeMesaSeleccionada.cliente_nombre}</strong>
                      </div>
                    )}
                  </div>

                  <button className={`${stylesAdmin.btn} ${stylesAdmin.btnPrimary} ${stylesAdmin.btnFull}`}
                    style={{ marginTop: '20px', padding: '15px', fontWeight: 'bold' }}
                    onClick={() => seleccionarCuenta(cuentaDeMesaSeleccionada)}>
                    VER COMANDA
                  </button>
                </div>
              ) : (
                /* PANEL ABRIR MESA */
                <form onSubmit={handleAbrirMesaNueva} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ backgroundColor: 'var(--color-bg-muted)', margin: '-24px -24px 20px -24px', padding: '24px', borderRadius: '8px 8px 0 0', textAlign: 'center', borderBottom: '1px solid var(--color-border)' }}>
                    <h3 style={{ margin: 0, fontSize: '1.5rem' }}>Mesa {mesaSeleccionada.nombre}</h3>
                    <span className={stylesAdmin.textMuted} style={{ fontSize: '0.8rem' }}>ESTADO: DISPONIBLE</span>
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div className={stylesAdmin.formGroup}>
                      <label className={stylesAdmin.label}>PERSONAS (PAX) *</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button type="button" className={stylesAdmin.btn} onClick={() => setComensales(Math.max(1, comensales - 1))}>-</button>
                        <input type="number" className={stylesAdmin.inputField} style={{ textAlign: 'center', fontWeight: 'bold' }} 
                          value={comensales} onChange={(e) => setComensales(parseInt(e.target.value) || 1)} min="1" />
                        <button type="button" className={stylesAdmin.btn} onClick={() => setComensales(comensales + 1)}>+</button>
                      </div>
                    </div>

                    <div className={stylesAdmin.formGroup}>
                      <label className={stylesAdmin.label}>CLIENTE</label>
                      <input type="text" className={stylesAdmin.inputField} placeholder="Nombre..." 
                        value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} />
                    </div>

                    <div className={stylesAdmin.formGroup}>
                      <label className={stylesAdmin.label}>NOTAS DE LA MESA</label>
                      <textarea className={stylesAdmin.inputField} placeholder="Alergias, dividir cuenta..." rows="3"
                        value={notasOrden} onChange={(e) => setNotasOrden(e.target.value)} />
                    </div>
                  </div>

                  <button type="submit" className={`${stylesAdmin.btn} ${stylesAdmin.btnSuccess} ${stylesAdmin.btnFull}`}
                    style={{ marginTop: '20px', padding: '15px', fontWeight: 'bold' }}
                    disabled={!puedeTomarOrdenes}>
                    ABRIR MESA
                  </button>
                </form>
              )}
            </aside>
          </div>
        </>
      )}
    </div>
  );
};