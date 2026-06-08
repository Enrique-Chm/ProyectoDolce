// src/modules/Admin/Tabs/Configuracion/Sucursales.jsx
import React, { useState, useEffect } from 'react';
import styles from '../../../../assets/styles/EstilosGenerales.module.css';
import { useConfiguracion } from './2useConfiguracion';
import toast from 'react-hot-toast';

// Tokens semánticos — fallbacks incluidos
const COLOR_DANGER   = 'var(--color-danger,   #ba1a1a)';
const COLOR_TURNO_AM = 'var(--color-turno-am, #e67e22)';
const COLOR_TURNO_PM = 'var(--color-turno-pm, #9b59b6)';
const BG_TURNO_AM    = 'var(--color-turno-am-bg, #fff3e0)';
const BG_TURNO_PM    = 'var(--color-turno-pm-bg, #f3e5f5)';

// Constantes fuera del componente
const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const ESTADO_INICIAL = {
  id:                 null,
  nombre:             '',
  direccion:          '',
  horario:            '',
  estatus:            'Activo',
  turnos_permitidos:  ['AM', 'PM'],
  dias_pedido:        [...DIAS_SEMANA]  // Por defecto todos los días habilitados
};

export default function Sucursales({ onVolver }) {
  const {
    loading,
    sucursales,
    cargarSucursales,
    guardarSucursal,
    cambiarEstatus
  } = useConfiguracion();

  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);
  const [formData, setFormData] = useState(ESTADO_INICIAL);

  useEffect(() => {
    cargarSucursales();
  }, [cargarSucursales]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Toggle para turnos operativos
  const toggleTurnoPermitido = (turnoTag) => {
    const actuales = formData.turnos_permitidos || [];
    if (actuales.includes(turnoTag)) {
      setFormData({ ...formData, turnos_permitidos: actuales.filter(t => t !== turnoTag) });
    } else {
      setFormData({ ...formData, turnos_permitidos: [...actuales, turnoTag] });
    }
  };

  // Toggle para días de pedido
  const toggleDiaPedido = (dia) => {
    const actuales = formData.dias_pedido || [];
    if (actuales.includes(dia)) {
      setFormData({ ...formData, dias_pedido: actuales.filter(d => d !== dia) });
    } else {
      setFormData({ ...formData, dias_pedido: [...actuales, dia] });
    }
  };

  // Seleccionar/deseleccionar todos los días de pedido
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
    if (!formData.nombre.trim()) {
      return toast.error('El nombre de la sucursal es obligatorio');
    }
    if (!formData.turnos_permitidos || formData.turnos_permitidos.length === 0) {
      return toast.error('Debe seleccionar al menos un turno permitido para operar');
    }
    if (!formData.dias_pedido || formData.dias_pedido.length === 0) {
      return toast.error('Debe seleccionar al menos un día permitido para pedir');
    }
    const exito = await guardarSucursal(formData);
    if (exito) {
      setMostrandoFormulario(false);
      setFormData(ESTADO_INICIAL);
    }
  };

  return (
    <div className={styles.fadeIN} style={{ width: '100%', maxWidth: '100%' }}>

      {/* --- ENCABEZADO --- */}
      <header style={{ marginBottom: 'var(--space-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <span className={styles.labelTop} style={{ display: 'block', marginBottom: '2px' }}>GESTIÓN DE PUNTOS DE VENTA</span>
          <h1 className={styles.title} style={{ fontSize: '2rem', lineHeight: '1' }}>
            {mostrandoFormulario ? 'Datos de\nSucursal' : 'Sucursales'}
          </h1>
        </div>
        <button
          onClick={mostrandoFormulario ? () => setMostrandoFormulario(false) : onVolver}
          className={`${styles.btnBase} ${styles.btnSecondary}`}
          style={{ height: '38px', padding: '0 12px', fontSize: '0.8rem' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>arrow_back</span>
          Volver
        </button>
      </header>

      {mostrandoFormulario ? (
        /* --- VISTA: FORMULARIO --- */
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

            {/* Turnos Operativos Permitidos */}
            <div>
              <label className={styles.labelTop}>TURNOS OPERATIVOS PERMITIDOS *</label>
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <div
                  onClick={() => toggleTurnoPermitido('AM')}
                  style={{
                    flex: 1, height: '42px', borderRadius: 'var(--radius-lg)',
                    fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 'var(--space-sm)', cursor: 'pointer', border: '1px solid var(--border-ghost)', fontWeight: 'bold',
                    backgroundColor: formData.turnos_permitidos?.includes('AM') ? 'var(--color-primary)' : 'var(--color-surface-lowest)',
                    color: formData.turnos_permitidos?.includes('AM') ? 'var(--color-surface-lowest)' : 'var(--text-main)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>
                    {formData.turnos_permitidos?.includes('AM') ? 'check_box' : 'light_mode'}
                  </span>
                  TURNO AM
                </div>
                <div
                  onClick={() => toggleTurnoPermitido('PM')}
                  style={{
                    flex: 1, height: '42px', borderRadius: 'var(--radius-lg)',
                    fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 'var(--space-sm)', cursor: 'pointer', border: '1px solid var(--border-ghost)', fontWeight: 'bold',
                    backgroundColor: formData.turnos_permitidos?.includes('PM') ? 'var(--color-primary)' : 'var(--color-surface-lowest)',
                    color: formData.turnos_permitidos?.includes('PM') ? 'var(--color-surface-lowest)' : 'var(--text-main)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>
                    {formData.turnos_permitidos?.includes('PM') ? 'check_box' : 'dark_mode'}
                  </span>
                  TURNO PM
                </div>
              </div>
            </div>

            {/* ── NUEVO: DÍAS PERMITIDOS PARA PEDIR ── */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                <label className={styles.labelTop} style={{ margin: 0 }}>DÍAS PERMITIDOS PARA PEDIR *</label>
                <button
                  type="button"
                  onClick={toggleTodosDiasPedido}
                  style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', outline: 'none' }}
                >
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
                    <button
                      key={dia}
                      type="button"
                      onClick={() => toggleDiaPedido(dia)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 'var(--radius-full)',
                        border: seleccionado ? 'none' : '1px solid var(--border-ghost)',
                        backgroundColor: seleccionado ? 'var(--color-primary)' : 'var(--color-surface-lowest)',
                        color: seleccionado ? 'var(--color-surface-lowest)' : 'var(--text-main)',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
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
        /* --- VISTA: LISTADO --- */
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
                <div
                  key={suc.id}
                  className={styles.card}
                  style={{
                    display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                    opacity: esActivo ? 1 : 0.65,
                    borderLeft: esActivo ? '4px solid var(--color-primary)' : '4px solid var(--text-light)',
                    borderTop: 'none',
                    padding: 'var(--space-sm) 12px',
                    borderRadius: 'var(--radius-xl)',
                    backgroundColor: 'var(--color-surface-lowest)',
                    boxShadow: 'var(--shadow-card)',
                    transition: 'all 0.15s ease',
                    minHeight: '64px',
                    gap: '12px'
                  }}
                >
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap' }}>
                      <h4 className={styles.subtitle} style={{ fontSize: '0.875rem', margin: 0, fontWeight: 'bold', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {suc.nombre}
                      </h4>
                      <span style={{
                        fontSize: '0.55rem',
                        background: esActivo ? 'var(--color-primary-fixed)' : 'var(--color-surface-high)',
                        color: esActivo ? 'var(--color-on-primary-fixed)' : 'var(--text-muted)',
                        padding: '1px 6px', borderRadius: 'var(--radius-sm)',
                        fontWeight: 'bold', textTransform: 'uppercase', whiteSpace: 'nowrap'
                      }}>
                        {esActivo ? 'Activa' : 'Baja'}
                      </span>

                      {/* Etiquetas de Turnos */}
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

                    {/* Días de pedido */}
                    <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>event_available</span>
                      {todosLosDias
                        ? 'Pide todos los días'
                        : diasPedido.length === 0
                          ? 'Sin días de pedido asignados'
                          : `Pide: ${diasPedido.join(', ')}`
                      }
                    </p>

                    {suc.horario && (
                      <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>schedule</span>
                        {suc.horario}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
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