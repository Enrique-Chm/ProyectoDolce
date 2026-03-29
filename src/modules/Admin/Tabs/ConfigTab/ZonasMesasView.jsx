// Archivo: src/modules/Admin/Tabs/ConfigTab/ZonasMesasView.jsx
import React, { useState, useEffect } from 'react';
import s from "../../../../assets/styles/EstilosGenerales.module.css";

export const ZonasMesasView = ({
  zonas,
  zEditId, setZEditId, zFormData, setZFormData, handleSubmitZona, resetZona,
  mesaEditId, setMesaEditId, mesaFormData, setMesaFormData, handleSubmitMesa, resetMesa,
  handleSavePlano,
  handleDelete,
  puedeCrearM, puedeEditarM, puedeBorrarConfig,
  mostrarFormularioZ
}) => {
  // 🚀 ESTADOS PARA EL EDITOR VISUAL (DRAG & DROP)
  const [isMapMode, setIsMapMode] = useState(false);
  const [localZonas, setLocalZonas] = useState([]);
  const [activeMapZonaId, setActiveMapZonaId] = useState(null);
  const [draggingTable, setDraggingTable] = useState(null);

  // Sincronizar el estado local del mapa cuando cambian las zonas en la DB
  useEffect(() => {
    setLocalZonas(zonas);
    if (zonas.length > 0 && !activeMapZonaId) {
      setActiveMapZonaId(zonas[0].id);
    }
  }, [zonas, isMapMode, activeMapZonaId]);

  // 🖱️ FUNCIONES DE DRAG & DROP CON SNAP TO GRID
  const handlePointerDown = (e, mesaId) => {
    e.target.setPointerCapture(e.pointerId);
    setDraggingTable(mesaId);
  };

  const handlePointerMove = (e, zonaId) => {
    if (!draggingTable) return;
    const container = document.getElementById('plano-container');
    if (!container) return;

    // Obtener el tamaño de cuadrícula de la zona activa
    const zonaActual = localZonas.find(z => z.id === zonaId);
    const gridSize = zonaActual?.grid_size || 10;
    const step = 100 / gridSize; // Porcentaje que mide cada celda

    const rect = container.getBoundingClientRect();
    
    // Calcular porcentaje respecto al tamaño del contenedor
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;

    // 🧲 LÓGICA DE SNAP (IMÁN): Redondear al paso de cuadrícula más cercano
    let snappedX = Math.round(x / step) * step;
    let snappedY = Math.round(y / step) * step;

    // Limitar para que no se salgan del lienzo (0% a 100%)
    snappedX = Math.max(0, Math.min(100, snappedX));
    snappedY = Math.max(0, Math.min(100, snappedY));

    setLocalZonas(prev => prev.map(z => z.id === zonaId ? {
      ...z,
      cat_mesas: z.cat_mesas.map(m => m.id === draggingTable ? { ...m, pos_x: snappedX, pos_y: snappedY } : m)
    } : z));
  };

  const handlePointerUp = () => {
    setDraggingTable(null);
  };

  const guardarPlanoVisual = () => {
    const zonaActiva = localZonas.find(z => z.id === activeMapZonaId);
    if (zonaActiva && zonaActiva.cat_mesas) {
      // Preparamos el payload con las nuevas posiciones
      const mesasModificadas = zonaActiva.cat_mesas.map(m => ({
        id: m.id,
        zona_id: zonaActiva.id,
        nombre: m.nombre,
        capacidad: m.capacidad,
        activa: m.activa,
        pos_x: m.pos_x,
        pos_y: m.pos_y,
        tipo_elemento: m.tipo_elemento || 'MESA' 
      }));
      handleSavePlano(mesasModificadas);
    }
  };

  // Variable para simplificar la lógica del formulario
  const esObstaculoForm = mesaFormData.tipo_elemento === 'OBSTACULO';

  return (
    <div className={mostrarFormularioZ ? s.splitLayout : s.fullLayout}>
      
      <aside className={s.adminCard} style={{ display: mostrarFormularioZ ? 'block' : 'none' }}>
        <h3 className={s.cardTitle}>{zEditId ? 'Editar Zona' : 'Nueva Zona'}</h3>
        <form onSubmit={handleSubmitZona} className={s.loginForm} style={{ marginBottom: '30px' }}>
          <div className={s.formGroup}>
            <label className={s.label}>NOMBRE DE LA ZONA</label>
            <input 
              className={s.inputField} 
              placeholder="Ej. Terraza Principal"
              value={zFormData.nombre} 
              onChange={e => setZFormData({...zFormData, nombre: e.target.value})} 
              required 
            />
          </div>

          {/* 📐 SELECTOR DE CUADRÍCULA */}
          <div className={s.formGroup}>
            <label className={s.label}>TAMAÑO DE CUADRÍCULA</label>
            <select 
                className={s.inputField}
                value={zFormData.grid_size || 10}
                onChange={e => setZFormData({...zFormData, grid_size: parseInt(e.target.value)})}
            >
                <option value="5">5 x 5 (Elementos grandes)</option>
                <option value="10">10 x 10 (Estándar)</option>
                <option value="15">15 x 15 (Detallado)</option>
            </select>
          </div>

          <div className={s.formGroup}>
            <label className={s.label}>ORDEN DE APARICIÓN</label>
            <input 
              type="number" 
              className={s.inputField} 
              value={zFormData.orden} 
              onChange={e => setZFormData({...zFormData, orden: e.target.value})} 
              required 
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="submit" className={`${s.btn} ${s.btnPrimary}`} style={{ flex: 1 }}>
              {zEditId ? 'ACTUALIZAR ZONA' : 'GUARDAR ZONA'}
            </button>
            {zEditId && (
              <button type="button" className={`${s.btn} ${s.btnDark}`} style={{ flex: 1 }} onClick={resetZona}>
                CANCELAR
              </button>
            )}
          </div>
        </form>

        <hr className={s.hr} style={{ marginBottom: '20px' }} />

        <h3 className={s.cardTitle}>{mesaEditId ? 'Editar Elemento' : 'Nuevo Elemento'}</h3>
        <form onSubmit={handleSubmitMesa} className={s.loginForm}>
          
          <div className={s.formGroup}>
            <label className={s.label}>TIPO DE ELEMENTO</label>
            <div style={{ display: 'flex', gap: '15px', marginTop: '5px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="tipo_elemento" 
                  value="MESA" 
                  checked={!esObstaculoForm} 
                  onChange={e => setMesaFormData({...mesaFormData, tipo_elemento: e.target.value})} 
                />
                Mesa Comensal
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="tipo_elemento" 
                  value="OBSTACULO" 
                  checked={esObstaculoForm} 
                  onChange={e => setMesaFormData({...mesaFormData, tipo_elemento: e.target.value})} 
                />
                Objeto (Puerta, Pared...)
              </label>
            </div>
          </div>

          <div className={s.formGroup}>
            <label className={s.label}>PERTENECE A LA ZONA</label>
            <select 
              className={s.inputField} 
              value={mesaFormData.zona_id} 
              onChange={e => setMesaFormData({...mesaFormData, zona_id: e.target.value})} 
              required
            >
              <option value="">Seleccione una zona...</option>
              {zonas.map(z => (
                <option key={z.id} value={z.id}>{z.nombre}</option>
              ))}
            </select>
          </div>
          <div className={s.formGroup}>
            <label className={s.label}>
              {esObstaculoForm ? 'DESCRIPCIÓN DEL OBJETO' : 'NOMBRE DE MESA'}
            </label>
            <input 
              className={s.inputField} 
              placeholder={esObstaculoForm ? 'Ej. Columna Central o Barra' : 'Ej. Mesa 1'}
              value={mesaFormData.nombre} 
              onChange={e => setMesaFormData({...mesaFormData, nombre: e.target.value})} 
              required 
            />
          </div>

          {!esObstaculoForm && (
            <div className={s.formGroup}>
              <label className={s.label}>CAPACIDAD (PAX)</label>
              <input 
                type="number" 
                className={s.inputField} 
                value={mesaFormData.capacidad} 
                onChange={e => setMesaFormData({...mesaFormData, capacidad: e.target.value})} 
                required 
                min="1" 
              />
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="submit" className={`${s.btn} ${s.btnSuccess}`} style={{ flex: 1 }}>
              {mesaEditId ? 'ACTUALIZAR' : '+ AGREGAR AL PLANO'}
            </button>
            {mesaEditId && (
              <button type="button" className={`${s.btn} ${s.btnDark}`} style={{ flex: 1 }} onClick={resetMesa}>
                CANCELAR
              </button>
            )}
          </div>
        </form>
      </aside>

      <div className={`${s.adminCard} ${s.tableContainer}`} style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'transparent', boxShadow: 'none', border: 'none', padding: 0 }}>
        
        <div className={s.adminCard} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '15px 20px' }}>
          <h3 className={s.cardTitle} style={{ margin: 0 }}>Distribución del Restaurante</h3>
          {zonas.length > 0 && (
            <button 
              className={`${s.btn} ${isMapMode ? s.btnDark : s.btnPrimary}`}
              onClick={() => setIsMapMode(!isMapMode)}
              style={{ padding: '6px 12px', fontSize: '13px' }}
            >
              {isMapMode ? '≡ VER COMO LISTA' : '🗺️ EDITAR PLANO VISUAL'}
            </button>
          )}
        </div>

        {zonas.length === 0 ? (
          <div className={s.adminCard} style={{ padding: "40px", textAlign: "center" }}>
            <span className={s.textMuted}>No hay zonas configuradas.</span>
          </div>
        ) : isMapMode ? (
          
          <div className={s.adminCard} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            
            <nav className={s.tabNav} style={{ marginBottom: '15px' }}>
              {localZonas.map(zona => (
                <button
                  key={zona.id}
                  className={`${s.tabButton} ${activeMapZonaId === zona.id ? s.activeTabButton : ""}`}
                  onClick={() => setActiveMapZonaId(zona.id)}
                >
                  {zona.nombre.toUpperCase()}
                </button>
              ))}
            </nav>

            <div className={s.textMuted} style={{ marginBottom: '10px', fontSize: '12px' }}>
              💡 Arrastra las mesas u objetos. Se ajustarán automáticamente a la cuadrícula.
            </div>

            {/* 🚀 LIENZO CON LA MISMA MAGIA DE LA VISTA DEL MESERO */}
            <div 
              id="plano-container"
              className={s.planoContainer}
              style={{ 
                backgroundSize: `${100 / (localZonas.find(z => z.id === activeMapZonaId)?.grid_size || 10)}% ${100 / (localZonas.find(z => z.id === activeMapZonaId)?.grid_size || 10)}%`,
                position: 'relative',
                overflow: 'hidden',
                // 👈 CLAVE: Permite que 'cqi' funcione para escalar el texto perfectamente
                containerType: 'inline-size' 
              }}
              onPointerMove={(e) => handlePointerMove(e, activeMapZonaId)}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              {localZonas.find(z => z.id === activeMapZonaId)?.cat_mesas.map(mesa => {
                const gridSize = localZonas.find(z => z.id === activeMapZonaId)?.grid_size || 10;
                const tableSize = (100 / gridSize) * 0.75; // 75% de la celda
                const isDragging = draggingTable === mesa.id;
                const esObstaculo = mesa.tipo_elemento === 'OBSTACULO';

                return (
                  <div
                    key={mesa.id}
                    className={esObstaculo ? s.obstaculoPlano : s.mesaPlano}
                    onPointerDown={(e) => handlePointerDown(e, mesa.id)}
                    style={{
                      left: `${mesa.pos_x}%`,
                      top: `${mesa.pos_y}%`,
                      width: `${tableSize}%`, 
                      zIndex: isDragging ? 10 : 1,
                      
                      // 🚀 ALINEACIÓN Y ANIMACIONES FLUIDAS
                      transform: isDragging ? 'translate(-50%, -50%) scale(1.1)' : 'translate(-50%, -50%) scale(1)',
                      transition: isDragging ? 'none' : 'transform 0.2s ease, box-shadow 0.2s ease',
                      boxShadow: isDragging ? '0 10px 15px rgba(0,0,0,0.2)' : (esObstaculo ? 'none' : '0 4px 6px rgba(0,0,0,0.08)'),
                      
                      // 🚀 CENTRADO PERFECTO DEL TEXTO
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      cursor: isDragging ? 'grabbing' : 'grab',

                      ...(esObstaculo ? {
                        // 🧱 ESTILO OBSTÁCULO
                        backgroundColor: '#cbd5e1', 
                        border: `2px solid #94a3b8`,
                        color: '#475569',
                        aspectRatio: '1 / 1', 
                        borderRadius: '4px', // Cuadrado redondeado
                        fontSize: `max(10px, calc(${tableSize * 0.2}cqi + 1px))`, 
                        fontWeight: '600'
                      } : {
                        // 🟢 ESTILO MESA (CÍRCULO PERFECTO)
                        backgroundColor: isDragging ? 'var(--color-primary)' : 'white',
                        border: `2px solid var(--color-primary)`,
                        color: isDragging ? 'white' : 'var(--color-primary)',
                        aspectRatio: '1 / 1', // Fuerza que ancho y alto sean iguales
                        borderRadius: '50%',  // Lo convierte en un círculo perfecto
                        fontSize: `max(11px, calc(${tableSize * 0.25}cqi + 2px))`
                      })
                    }}
                  >
                    <span style={{ 
                      width: '90%', 
                      wordBreak: 'break-word', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      display: '-webkit-box', 
                      WebkitLineClamp: 2, 
                      WebkitBoxOrient: 'vertical',
                      opacity: esObstaculo ? 0.8 : 1,
                      lineHeight: '1.1'
                    }}>
                      {mesa.nombre}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '15px', textAlign: 'right' }}>
              <button className={`${s.btn} ${s.btnSuccess}`} onClick={guardarPlanoVisual}>
                💾 GUARDAR DISTRIBUCIÓN
              </button>
            </div>
          </div>

        ) : (
          /* VISTA DE LISTA */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {zonas.map(zona => (
              <div key={zona.id} className={s.adminCard} style={{ padding: 0, overflow: 'hidden' }}>
                
                {/* CABECERA DE LA ZONA */}
                <div style={{ background: 'var(--color-bg-muted)', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)' }}>
                  <div>
                    <h4 style={{ margin: 0, fontWeight: '800', color: 'var(--color-primary)' }}>📍 {zona.nombre.toUpperCase()}</h4>
                    <small className={s.textMuted}>Cuadrícula: {zona.grid_size}x{zona.grid_size} • Orden de aparición: {zona.orden}</small>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className={`${s.btn} ${s.btnOutlineEditar} ${s.btnSmall}`} 
                      onClick={() => { setZEditId(zona.id); setZFormData({ nombre: zona.nombre, orden: zona.orden, activo: zona.activo, grid_size: zona.grid_size }); }}
                    >
                      📝 EDITAR ZONA
                    </button>
                    {puedeBorrarConfig && (
                      <button className={`${s.btn} ${s.btnOutlineDanger} ${s.btnSmall}`} onClick={() => handleDelete('zona', zona.id)}>
                        ❌
                      </button>
                    )}
                  </div>
                </div>

                {/* TABLA DE MESAS */}
                {(!zona.cat_mesas || zona.cat_mesas.length === 0) ? (
                  <div style={{ padding: '20px', textAlign: 'center' }} className={s.textMuted}>
                    Sin mesas u objetos configurados en esta zona.
                  </div>
                ) : (
                  <div className={s.tableContainer} style={{ borderRadius: 0, border: 'none', boxShadow: 'none' }}>
                    <table className={s.table}>
                      <thead className={s.thead}>
                        <tr>
                          <th className={s.th} style={{ width: '50px' }}>TIPO</th>
                          <th className={s.th}>IDENTIFICADOR</th>
                          <th className={s.th} style={{ textAlign: 'center' }}>CAPACIDAD</th>
                          <th className={s.th} style={{ textAlign: 'center' }}>ESTADO</th>
                          <th className={s.th} style={{ textAlign: 'right' }}>ACCIONES</th>
                        </tr>
                      </thead>
                      <tbody>
                        {zona.cat_mesas.map(m => {
                          const esObstaculo = m.tipo_elemento === 'OBSTACULO';
                          return (
                            <tr key={m.id} style={{ backgroundColor: mesaEditId === m.id ? 'var(--color-bg-app)' : 'transparent' }}>
                              <td className={s.td} style={{ fontSize: '20px', textAlign: 'center' }}>
                                {esObstaculo ? '🧱' : '🪑'}
                              </td>
                              <td className={s.td}>
                                <strong>{m.nombre}</strong>
                                {esObstaculo && <span className={s.textMuted} style={{fontSize: '11px', display: 'block'}}>Objeto estático</span>}
                              </td>
                              <td className={s.td} style={{ textAlign: 'center' }}>
                                {esObstaculo ? '—' : `👥 ${m.capacidad} PAX`}
                              </td>
                              <td className={s.td} style={{ textAlign: 'center' }}>
                                <span style={{ 
                                  fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px', 
                                  background: m.activa ? '#dcfce7' : '#fee2e2', 
                                  color: m.activa ? '#166534' : '#991b1b' 
                                }}>
                                  {m.activa ? 'ACTIVA' : 'INACTIVA'}
                                </span>
                              </td>
                              <td className={s.td} style={{ textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                  <button className={`${s.btn} ${s.btnOutlineEditar} ${s.btnEditar}`} onClick={() => { setMesaEditId(m.id); setMesaFormData({ zona_id: zona.id, nombre: m.nombre, capacidad: m.capacidad, activa: m.activa, tipo_elemento: m.tipo_elemento || 'MESA' }); }}>
                                    {puedeEditarM ? '📝' : '👁️'}
                                  </button>
                                  {puedeBorrarConfig && (
                                    <button className={`${s.btn} ${s.btnOutlineDanger} ${s.btnSmall}`} onClick={() => handleDelete('mesa', m.id)}>
                                      ❌
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};