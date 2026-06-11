// src/modules/Admin/Tabs/Configuracion/Sucursales.jsx
import React, { useState, useEffect, useMemo } from 'react';
import styles from '../../../../assets/styles/EstilosGenerales.module.css';
import { useConfiguracion } from './2useConfiguracion';
import toast from 'react-hot-toast';

// Tokens semánticos
const COLOR_DANGER   = 'var(--color-danger,   #ba1a1a)';
const COLOR_TURNO_AM = 'var(--color-turno-am, #e67e22)';
const COLOR_TURNO_PM = 'var(--color-turno-pm, #9b59b6)';
const BG_TURNO_AM    = 'var(--color-turno-am-bg, #fff3e0)';
const BG_TURNO_PM    = 'var(--color-turno-pm-bg, #f3e5f5)';

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const ESTADO_INICIAL = {
  id:                 null,
  nombre:             '',
  direccion:          '',
  horario:            '',
  estatus:            'Activo',
  turnos_permitidos:  ['AM', 'PM'],
  dias_pedido:        [...DIAS_SEMANA]
};

export default function Sucursales({ onVolver }) {
  const {
    loading,
    sucursales,
    proveedores,
    cargarSucursales,
    cargarProveedores,
    guardarSucursal,
    cambiarEstatus,
    // Calendario Sucursal × Proveedor
    asignacionesSucProv,
    cargarAsignaciones,
    guardarAsignacion,
    eliminarAsignacion
  } = useConfiguracion();

  const [mostrandoFormulario,  setMostrandoFormulario]  = useState(false);
  const [mostrandoCalendario,  setMostrandoCalendario]  = useState(false);
  const [sucursalCalendario,   setSucursalCalendario]   = useState(null);
  const [formData,             setFormData]             = useState(ESTADO_INICIAL);

  // Estado para edición inline de días por proveedor en el calendario
  const [proveedorEditandoId,  setProveedorEditandoId]  = useState(null);
  const [diasEditando,         setDiasEditando]         = useState([]);

  // Estado para confirmación de eliminación
  const [pendienteEliminar,    setPendienteEliminar]    = useState(null);

  useEffect(() => {
    cargarSucursales();
  }, [cargarSucursales]);

  // ── HANDLERS DEL FORMULARIO ──

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const toggleTurnoPermitido = (turnoTag) => {
    const actuales = formData.turnos_permitidos || [];
    if (actuales.includes(turnoTag)) {
      setFormData({ ...formData, turnos_permitidos: actuales.filter(t => t !== turnoTag) });
    } else {
      setFormData({ ...formData, turnos_permitidos: [...actuales, turnoTag] });
    }
  };

  const toggleDiaPedido = (dia) => {
    const actuales = formData.dias_pedido || [];
    if (actuales.includes(dia)) {
      setFormData({ ...formData, dias_pedido: actuales.filter(d => d !== dia) });
    } else {
      setFormData({ ...formData, dias_pedido: [...actuales, dia] });
    }
  };

  const toggleTodosDiasPedido = () => {
    const actuales = formData.dias_pedido || [];
    if (actuales.length === DIAS_SEMANA.length) {
      setFormData({ ...formData, dias_pedido: [] });
    } else {
      setFormData({ ...formData, dias_pedido: [...DIAS_SEMANA] });
    }
  };

  const abrirCrear = () => {
    setFormData(ESTADO_INICIAL);
    setMostrandoFormulario(true);
  };

  const abrirEditar = (suc) => {
    setFormData({
      ...suc,
      turnos_permitidos: Array.isArray(suc.turnos_permitidos) ? suc.turnos_permitidos : ['AM', 'PM'],
      dias_pedido:       Array.isArray(suc.dias_pedido)       ? suc.dias_pedido       : [...DIAS_SEMANA]
    });
    setMostrandoFormulario(true);
  };

  const procesarGuardado = async () => {
    if (!formData.nombre.trim()) return toast.error('El nombre de la sucursal es obligatorio'),{ duration: 1000 };
    if (!formData.turnos_permitidos || formData.turnos_permitidos.length === 0) return toast.error('Debe seleccionar al menos un turno'),{ duration: 1000 };
    if (!formData.dias_pedido || formData.dias_pedido.length === 0) return toast.error('Debe seleccionar al menos un día permitido para pedir'),{ duration: 1000 };
    const exito = await guardarSucursal(formData);
    if (exito) {
      setMostrandoFormulario(false);
      setFormData(ESTADO_INICIAL);
    }
  };

  // ── HANDLERS DEL CALENDARIO ──

  const abrirCalendario = async (suc) => {
    setSucursalCalendario(suc);
    setMostrandoCalendario(true);
    setProveedorEditandoId(null);
    setDiasEditando([]);
    setPendienteEliminar(null);
    await cargarAsignaciones(suc.id);
    if (proveedores.length === 0) await cargarProveedores();
  };

  const cerrarCalendario = () => {
    setSucursalCalendario(null);
    setMostrandoCalendario(false);
    setProveedorEditandoId(null);
    setDiasEditando([]);
    setPendienteEliminar(null);
  };

  const iniciarEdicionProveedor = (provId, diasActuales) => {
    setProveedorEditandoId(provId);
    setDiasEditando(diasActuales ? [...diasActuales] : [...DIAS_SEMANA]);
    setPendienteEliminar(null);
  };

  const cancelarEdicion = () => {
    setProveedorEditandoId(null);
    setDiasEditando([]);
  };

  const toggleDiaEditando = (dia) => {
    if (diasEditando.includes(dia)) {
      setDiasEditando(diasEditando.filter(d => d !== dia));
    } else {
      setDiasEditando([...diasEditando, dia]);
    }
  };

  const guardarDiasProveedor = async () => {
    if (!sucursalCalendario?.id || !proveedorEditandoId) return;
    const exito = await guardarAsignacion({
      sucursal_id:     sucursalCalendario.id,
      proveedor_id:    proveedorEditandoId,
      dias_permitidos: diasEditando
    });
    if (exito) cancelarEdicion();
  };

  const confirmarEliminarAsignacion = async (asignacionId) => {
    const exito = await eliminarAsignacion(asignacionId, sucursalCalendario?.id);
    if (exito) setPendienteEliminar(null);
  };

  // Proveedores activos con su asignación (si existe)
  const proveedoresConAsignacion = useMemo(() => {
    const activos = proveedores.filter(p => p.estatus === 'Activo');
    return activos.map(prov => {
      const asignacion = asignacionesSucProv.find(a => a.proveedor_id === prov.id);
      return { ...prov, asignacion: asignacion || null };
    });
  }, [proveedores, asignacionesSucProv]);

  // ── RENDER ──

  return (
    <div className={styles.fadeIN} style={{ width: '100%', maxWidth: '100%' }}>

      {/* --- ENCABEZADO --- */}
      <header style={{ marginBottom: 'var(--space-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <span className={styles.labelTop} style={{ display: 'block', marginBottom: '2px' }}>GESTIÓN DE PUNTOS DE VENTA</span>
          <h1 className={styles.title} style={{ fontSize: '2rem', lineHeight: '1' }}>
            {mostrandoCalendario
              ? 'Calendario\nde Pedidos'
              : mostrandoFormulario
                ? 'Datos de\nSucursal'
                : 'Sucursales'}
          </h1>
          {mostrandoCalendario && sucursalCalendario && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px', marginBottom: 0 }}>
              Configurando: <b style={{ color: 'var(--text-main)' }}>{sucursalCalendario.nombre}</b>
            </p>
          )}
        </div>
        <button
          onClick={
            mostrandoCalendario ? cerrarCalendario
            : mostrandoFormulario ? () => setMostrandoFormulario(false)
            : onVolver
          }
          className={`${styles.btnBase} ${styles.btnSecondary}`}
          style={{ height: '38px', padding: '0 12px', fontSize: '0.8rem' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>arrow_back</span>
          Volver
        </button>
      </header>

      {mostrandoCalendario ? (
        /* ═══════════════════════════════════════════
           VISTA: CALENDARIO SUCURSAL × PROVEEDOR
           ═══════════════════════════════════════════ */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>

          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: 'var(--space-sm)' }}>
            Configura qué días puede pedir <b>{sucursalCalendario?.nombre}</b> a cada proveedor.
            Los que no tengan configuración personalizada usarán los días globales del proveedor.
          </p>

          {proveedoresConAsignacion.length === 0 && !loading && (
            <p style={{ textAlign: 'center', padding: 'var(--space-lg)', color: 'var(--text-muted)' }}>No hay proveedores activos.</p>
          )}

          {proveedoresConAsignacion.map(prov => {
            const tieneConfig = !!prov.asignacion;
            const editando    = proveedorEditandoId === prov.id;
            const pendElim    = pendienteEliminar === prov.asignacion?.id;

            return (
              <div
                key={prov.id}
                className={styles.card}
                style={{
                  display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)',
                  borderLeft: tieneConfig ? '4px solid var(--color-primary)' : '4px solid var(--border-ghost)',
                  padding: 'var(--space-sm) 12px',
                  borderRadius: 'var(--radius-xl)',
                  backgroundColor: 'var(--color-surface-lowest)',
                  boxShadow: 'var(--shadow-card)',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Fila principal */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ fontSize: '0.875rem', margin: 0, fontWeight: 'bold', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {prov.nombre}
                    </h4>
                    <p style={{ margin: '2px 0 0', fontSize: '0.65rem', color: tieneConfig ? 'var(--color-primary)' : 'var(--text-light)', fontWeight: tieneConfig ? 'bold' : 'normal' }}>
                      {tieneConfig
                        ? prov.asignacion.dias_permitidos.length === 7
                          ? '📅 Todos los días'
                          : `📅 ${prov.asignacion.dias_permitidos.join(', ')}`
                        : '🔓 Sin restricción — usa días globales del proveedor'
                      }
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button
                      onClick={() => iniciarEdicionProveedor(prov.id, prov.asignacion?.dias_permitidos)}
                      className={styles.btnSecondary}
                      style={{ padding: '0', width: '34px', height: '34px', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-surface-low)' }}
                      title={tieneConfig ? 'Editar días' : 'Personalizar días'}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>
                        {tieneConfig ? 'edit_calendar' : 'add_circle'}
                      </span>
                    </button>

                    {tieneConfig && (
                      <button
                        onClick={() => setPendienteEliminar(prov.asignacion.id)}
                        className={styles.btnOutlined}
                        style={{ padding: '0', width: '34px', height: '34px', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderColor: COLOR_DANGER, color: COLOR_DANGER, backgroundColor: 'transparent' }}
                        title="Quitar personalización"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '1.05rem' }}>delete</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Confirmación de eliminación */}
                {pendElim && (
                  <div style={{ paddingTop: 'var(--space-sm)', borderTop: `1px dashed ${COLOR_DANGER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-sm)', animation: 'slideUp 0.2s ease' }}>
                    <span style={{ fontSize: '0.7rem', color: COLOR_DANGER, fontWeight: 'bold' }}>
                      ¿Quitar configuración personalizada?
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => setPendienteEliminar(null)} className={`${styles.btnBase} ${styles.btnSecondary}`} style={{ height: '28px', padding: '0 10px', fontSize: '0.65rem', borderRadius: 'var(--radius-lg)' }}>
                        No
                      </button>
                      <button onClick={() => confirmarEliminarAsignacion(prov.asignacion.id)} className={`${styles.btnBase} ${styles.btnDanger}`} style={{ height: '28px', padding: '0 10px', fontSize: '0.65rem', borderRadius: 'var(--radius-lg)' }}>
                        Sí, quitar
                      </button>
                    </div>
                  </div>
                )}

                {/* Editor de días inline */}
                {editando && (
                  <div style={{ paddingTop: 'var(--space-sm)', borderTop: '1px solid var(--border-ghost)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', animation: 'slideUp 0.2s ease' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Días permitidos para pedir a {prov.nombre}:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {DIAS_SEMANA.map(dia => {
                        const sel = diasEditando.includes(dia);
                        return (
                          <button
                            key={dia} type="button"
                            onClick={() => toggleDiaEditando(dia)}
                            style={{
                              padding: '6px 12px', borderRadius: 'var(--radius-full)',
                              border: sel ? 'none' : '1px solid var(--border-ghost)',
                              backgroundColor: sel ? 'var(--color-primary)' : 'var(--color-surface-lowest)',
                              color: sel ? 'var(--color-surface-lowest)' : 'var(--text-main)',
                              fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s ease'
                            }}
                          >
                            {dia}
                          </button>
                        );
                      })}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button onClick={cancelarEdicion} className={`${styles.btnBase} ${styles.btnSecondary}`} style={{ height: '32px', padding: '0 12px', fontSize: '0.7rem', borderRadius: 'var(--radius-lg)' }}>
                        Cancelar
                      </button>
                      <button onClick={guardarDiasProveedor} disabled={loading || diasEditando.length === 0} className={`${styles.btnBase} ${styles.btnPrimary}`} style={{ height: '32px', padding: '0 12px', fontSize: '0.7rem', borderRadius: 'var(--radius-lg)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>save</span>
                        {loading ? 'Guardando...' : 'Guardar'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      ) : mostrandoFormulario ? (
        /* ═══════════════════════════════════
           VISTA: FORMULARIO (existente)
           ═══════════════════════════════════ */
        <section className={styles.card} style={{ animation: 'slideUp 0.3s ease' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>

            <div>
              <label className={styles.labelTop}>NOMBRE DE LA SUCURSAL *</label>
              <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} className={styles.inputEditorial} placeholder="Ej: Sucursal Centro" />
            </div>

            <div>
              <label className={styles.labelTop}>DIRECCIÓN</label>
              <input type="text" name="direccion" value={formData.direccion} onChange={handleInputChange} className={styles.inputEditorial} placeholder="Calle, Número y Colonia" />
            </div>

            <div>
              <label className={styles.labelTop}>HORARIO DE ATENCIÓN</label>
              <input type="text" name="horario" value={formData.horario} onChange={handleInputChange} className={styles.inputEditorial} placeholder="Ej: Lunes a Viernes 8:00 AM - 6:00 PM" />
            </div>

            {/* Turnos Operativos */}
            <div>
              <label className={styles.labelTop}>TURNOS OPERATIVOS PERMITIDOS *</label>
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <div onClick={() => toggleTurnoPermitido('AM')} style={{ flex: 1, height: '42px', borderRadius: 'var(--radius-lg)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-sm)', cursor: 'pointer', border: '1px solid var(--border-ghost)', fontWeight: 'bold', backgroundColor: formData.turnos_permitidos?.includes('AM') ? 'var(--color-primary)' : 'var(--color-surface-lowest)', color: formData.turnos_permitidos?.includes('AM') ? 'var(--color-surface-lowest)' : 'var(--text-main)', transition: 'all 0.2s ease' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>{formData.turnos_permitidos?.includes('AM') ? 'check_box' : 'light_mode'}</span>
                  MAÑANA (AM)
                </div>
                <div onClick={() => toggleTurnoPermitido('PM')} style={{ flex: 1, height: '42px', borderRadius: 'var(--radius-lg)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-sm)', cursor: 'pointer', border: '1px solid var(--border-ghost)', fontWeight: 'bold', backgroundColor: formData.turnos_permitidos?.includes('PM') ? 'var(--color-primary)' : 'var(--color-surface-lowest)', color: formData.turnos_permitidos?.includes('PM') ? 'var(--color-surface-lowest)' : 'var(--text-main)', transition: 'all 0.2s ease' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>{formData.turnos_permitidos?.includes('PM') ? 'check_box' : 'dark_mode'}</span>
                  TARDE/NOCHE (PM)
                </div>
              </div>
            </div>

            {/* Días Permitidos */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                <label className={styles.labelTop} style={{ margin: 0 }}>DÍAS PERMITIDOS PARA PEDIR *</label>
                <button type="button" onClick={toggleTodosDiasPedido} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', outline: 'none' }}>
                  {(formData.dias_pedido || []).length === DIAS_SEMANA.length ? 'DESMARCAR TODOS' : 'MARCAR TODOS'}
                </button>
              </div>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)', lineHeight: '1.3' }}>
                Solo en estos días el personal de esta sucursal podrá generar requisiciones de compra.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
                {DIAS_SEMANA.map(dia => {
                  const seleccionado = (formData.dias_pedido || []).includes(dia);
                  return (
                    <button key={dia} type="button" onClick={() => toggleDiaPedido(dia)} style={{ padding: '8px 14px', borderRadius: 'var(--radius-full)', border: seleccionado ? 'none' : '1px solid var(--border-ghost)', backgroundColor: seleccionado ? 'var(--color-primary)' : 'var(--color-surface-lowest)', color: seleccionado ? 'var(--color-surface-lowest)' : 'var(--text-main)', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                      {dia}
                    </button>
                  );
                })}
              </div>
            </div>

            <button onClick={procesarGuardado} disabled={loading} className={`${styles.btnBase} ${styles.btnPrimary}`} style={{ width: '100%', padding: '1.2rem', marginTop: '10px' }}>
              <span className="material-symbols-outlined">{loading ? 'sync' : 'save'}</span>
              {loading ? 'GUARDANDO...' : 'CONFIRMAR Y GUARDAR'}
            </button>
          </div>
        </section>

      ) : (
        /* ═══════════════════════════════════
           VISTA: LISTADO (existente + botón calendario)
           ═══════════════════════════════════ */
        <>
          <button onClick={abrirCrear} className={`${styles.btnBase} ${styles.btnPrimary}`} style={{ width: '100%', marginBottom: 'var(--space-md)', padding: '0.8rem', fontSize: '0.875rem', height: '44px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>add_business</span>
            REGISTRAR SUCURSAL
          </button>

          {sucursales.length === 0 && !loading && (
            <p style={{ textAlign: 'center', padding: 'var(--space-lg)', color: 'var(--text-muted)' }}>No hay sucursales registradas.</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', width: '100%' }}>
            {sucursales.map((suc) => {
              const esActivo   = suc.estatus === 'Activo';
              const diasPedido = suc.dias_pedido || [];
              const todosLosDias = diasPedido.length === DIAS_SEMANA.length;

              return (
                <div key={suc.id} className={styles.card} style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', opacity: esActivo ? 1 : 0.65, borderLeft: esActivo ? '4px solid var(--color-primary)' : '4px solid var(--text-light)', borderTop: 'none', padding: 'var(--space-sm) 12px', borderRadius: 'var(--radius-xl)', backgroundColor: 'var(--color-surface-lowest)', boxShadow: 'var(--shadow-card)', transition: 'all 0.15s ease', minHeight: '64px', gap: '12px' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap' }}>
                      <h4 className={styles.subtitle} style={{ fontSize: '0.875rem', margin: 0, fontWeight: 'bold', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {suc.nombre}
                      </h4>
                      <span style={{ fontSize: '0.55rem', background: esActivo ? 'var(--color-primary-fixed)' : 'var(--color-surface-high)', color: esActivo ? 'var(--color-on-primary-fixed)' : 'var(--text-muted)', padding: '1px 6px', borderRadius: 'var(--radius-sm)', fontWeight: 'bold', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                        {esActivo ? 'Activa' : 'Baja'}
                      </span>
                      <div style={{ display: 'flex', gap: '3px', marginLeft: 'auto' }}>
                        {suc.turnos_permitidos?.includes('AM') && (
                          <span style={{ fontSize: '0.55rem', fontWeight: 'bold', backgroundColor: BG_TURNO_AM, color: COLOR_TURNO_AM, padding: '1px 5px', borderRadius: 'var(--radius-sm)' }}>AM</span>
                        )}
                        {suc.turnos_permitidos?.includes('PM') && (
                          <span style={{ fontSize: '0.55rem', fontWeight: 'bold', backgroundColor: BG_TURNO_PM, color: COLOR_TURNO_PM, padding: '1px 5px', borderRadius: 'var(--radius-sm)' }}>PM</span>
                        )}
                      </div>
                    </div>

                    <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>location_on</span>
                      {suc.direccion || 'Sin dirección registrada'}
                    </p>

                    <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>event_available</span>
                      {todosLosDias ? 'Pide todos los días' : diasPedido.length === 0 ? 'Sin días de pedido asignados' : `Pide: ${diasPedido.join(', ')}`}
                    </p>

                    {suc.horario && (
                      <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>schedule</span>
                        {suc.horario}
                      </p>
                    )}
                  </div>

                  {/* Botones de acción — NUEVO: botón de calendario */}
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button onClick={() => abrirCalendario(suc)} className={styles.btnSecondary} style={{ padding: '0', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-surface-low)' }} title="Calendario de proveedores">
                      <span className="material-symbols-outlined" style={{ fontSize: '1.05rem', color: 'var(--color-primary)' }}>edit_calendar</span>
                    </button>
                    <button onClick={() => abrirEditar(suc)} className={styles.btnSecondary} style={{ padding: '0', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-surface-low)' }} title="Editar Sucursal">
                      <span className="material-symbols-outlined" style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>edit</span>
                    </button>
                    <button onClick={() => cambiarEstatus('Cat_sucursales', suc.id, suc.estatus, cargarSucursales)} className={styles.btnOutlined} style={{ padding: '0', width: '34px', height: '34px', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderColor: esActivo ? COLOR_DANGER : 'var(--color-primary)', color: esActivo ? COLOR_DANGER : 'var(--color-primary)', backgroundColor: 'transparent' }} title={esActivo ? 'Desactivar Sucursal' : 'Activar Sucursal'}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1.05rem' }}>{esActivo ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}