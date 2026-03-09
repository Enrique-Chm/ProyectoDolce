import React, { useState, useEffect } from 'react';

import { supabase } from '../../../lib/supabaseClient';

import { categoriasService } from '../../../services/Categorias.service';

import s from '../AdminPage.module.css';

import { hasPermission } from '../../../utils/checkPermiso';



export const ConfigTab = () => {

  const [subTab, setSubTab] = useState('unidades'); // unidades | categorias

  const [loading, setLoading] = useState(false);



  // --- ESTADOS: UNIDADES ---

  const [unidades, setUnidades] = useState([]);

  const [uNombre, setUNombre] = useState('');

  const [uAbrev, setUAbrev] = useState('');

  const [uEditId, setUEditId] = useState(null);



  // --- ESTADOS: CATEGORÍAS ---

  const [catMenu, setCatMenu] = useState([]);

  const [catInsumos, setCatInsumos] = useState([]);

  const [cMenuNombre, setCMenuNombre] = useState('');

  const [cMenuColor, setCMenuColor] = useState('#005696');

  const [cInsumoNombre, setCInsumoNombre] = useState('');

  const [cMenuEditId, setCMenuEditId] = useState(null);

  const [cInsumoEditId, setCInsumoEditId] = useState(null);



  // Permisos

  const puedeEditarU = hasPermission('ver_unidades');

  const puedeEditarC = hasPermission('ver_categorias');

  const puedeBorrar = hasPermission('borrar_registros');



  useEffect(() => {

    fetchData();

  }, [subTab]);



  const fetchData = async () => {

    setLoading(true);

    try {

      if (subTab === 'unidades') {

        const { data } = await supabase.from('cat_unidades_medida').select('*').order('nombre');

        setUnidades(data || []);

      } else {

        const [menu, insumos] = await Promise.all([

          categoriasService.getMenu(),

          categoriasService.getInsumos()

        ]);

        setCatMenu(menu.data || []);

        setCatInsumos(insumos.data || []);

      }

    } catch (error) {

      console.error("Error al cargar configuración:", error);

    } finally {

      setLoading(false);

    }

  };



  // --- LÓGICA: UNIDADES ---

  const handleSubmitUnidad = async (e) => {

    e.preventDefault();

    if (!puedeEditarU) return;

    const payload = { nombre: uNombre, abreviatura: uAbrev };

    const { error } = uEditId

      ? await supabase.from('cat_unidades_medida').update(payload).eq('id', uEditId)

      : await supabase.from('cat_unidades_medida').insert([payload]);



    if (!error) {

      setUEditId(null); setUNombre(''); setUAbrev('');

      fetchData();

    }

  };



  // --- LÓGICA: CATEGORÍAS ---

  const handleSubmitCatMenu = async (e) => {

    e.preventDefault();

    if (!puedeEditarC) return;

    const { error } = await categoriasService.saveMenu({ nombre: cMenuNombre, color_etiqueta: cMenuColor }, cMenuEditId);

    if (!error) { setCMenuEditId(null); setCMenuNombre(''); fetchData(); }

  };



  const handleSubmitCatInsumo = async (e) => {

    e.preventDefault();

    if (!puedeEditarC) return;

    const { error } = await categoriasService.saveInsumo({ nombre: cInsumoNombre }, cInsumoEditId);

    if (!error) { setCInsumoEditId(null); setCInsumoNombre(''); fetchData(); }

  };



  return (

    <div className={s.pageWrapper} style={{ padding: '1rem' }}>

      <h2 className={s.sectionTitle}>Configuración del Sistema</h2>



      <nav className={s.subNav}>

        <button

          className={`${s.subBtn} ${subTab === 'unidades' ? s.subBtnActive : ''}`}

          onClick={() => setSubTab('unidades')}

        >

          Unidades

        </button>

        <button

          className={`${s.subBtn} ${subTab === 'categorias' ? s.subBtnActive : ''}`}

          onClick={() => setSubTab('categorias')}

        >

          Categorías

        </button>

      </nav>



      {/* VISTA: UNIDADES */}

      {subTab === 'unidades' && (

        <div className={s.container}>

          <aside className={s.card}>

            <div className={s.cardHeader}><h3 className={s.cardTitle}>{uEditId ? 'Editar' : 'Nueva'} Unidad</h3></div>

            <form className={s.cardBody} onSubmit={handleSubmitUnidad}>

              <div className={s.formGroup}>

                <label className={s.label}>Nombre</label>

                <input className={s.input} value={uNombre} onChange={e => setUNombre(e.target.value)} required readOnly={!puedeEditarU} />

              </div>

              <div className={s.formGroup}>

                <label className={s.label}>Abreviatura</label>

                <input className={s.input} value={uAbrev} onChange={e => setUAbrev(e.target.value)} required readOnly={!puedeEditarU} />

              </div>

              {puedeEditarU && <button type="submit" className={s.btnPrimary}>Guardar</button>}

              {uEditId && <button type="button" className={s.btnCancel} onClick={() => {setUEditId(null); setUNombre(''); setUAbrev('');}}>Cancelar</button>}

            </form>

          </aside>

          <div className={s.tableWrapper}>

            <table className={s.table}>

              <thead><tr><th>ID</th><th>Descripción</th><th style={{ textAlign: 'right' }}>Acciones</th></tr></thead>

              <tbody>

                {unidades.map(u => (

                  <tr key={u.id}>

                    <td>#{u.id}</td>

                    <td><strong>{u.nombre}</strong> ({u.abreviatura})</td>

                    <td style={{ textAlign: 'right' }}>

                      <button className={s.btnEdit} onClick={() => {setUEditId(u.id); setUNombre(u.nombre); setUAbrev(u.abreviatura);}}>{puedeEditarU ? 'EDITAR' : 'VER'}</button>

                      {puedeBorrar && <button className={s.btnDelete}>BORRAR</button>}

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

      )}



      {/* VISTA: CATEGORÍAS */}

      {subTab === 'categorias' && (

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* Categorías Menú */}

          <div className={s.container}>

            <aside className={s.card}>

              <div className={s.cardHeader}><h3 className={s.cardTitle}>Categoría Menú</h3></div>

              <form className={s.cardBody} onSubmit={handleSubmitCatMenu}>

                <div className={s.formGroup}><label className={s.label}>Nombre</label>

                  <input className={s.input} value={cMenuNombre} onChange={e => setCMenuNombre(e.target.value)} required readOnly={!puedeEditarC} />

                </div>

                <div className={s.formGroup}><label className={s.label}>Color</label>

                  <input type="color" className={s.input} value={cMenuColor} onChange={e => setCMenuColor(e.target.value)} disabled={!puedeEditarC} />

                </div>

                {puedeEditarC && <button type="submit" className={s.btnPrimary}>Guardar</button>}

              </form>

            </aside>

            <div className={s.tableWrapper}>

              <table className={s.table}>

                <thead><tr><th>Color</th><th>Nombre</th><th style={{ textAlign: 'right' }}>Acciones</th></tr></thead>

                <tbody>

                  {catMenu.map(c => (

                    <tr key={c.id}>

                      <td><div style={{ width: '20px', height: '20px', borderRadius: '50%', background: c.color_etiqueta }} /></td>

                      <td><strong>{c.nombre}</strong></td>

                      <td style={{ textAlign: 'right' }}>

                        <button className={s.btnEdit} onClick={() => {setCMenuEditId(c.id); setCMenuNombre(c.nombre); setCMenuColor(c.color_etiqueta);}}>{puedeEditarC ? 'EDITAR' : 'VER'}</button>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          </div>

          {/* Categorías Insumos */}

          <div className={s.container}>

            <aside className={s.card}>

              <div className={s.cardHeader}><h3 className={s.cardTitle}>Categoría Insumo</h3></div>

              <form className={s.cardBody} onSubmit={handleSubmitCatInsumo}>

                <div className={s.formGroup}><label className={s.label}>Nombre Grupo</label>

                  <input className={s.input} value={cInsumoNombre} onChange={e => setCInsumoNombre(e.target.value)} required readOnly={!puedeEditarC} />

                </div>

                {puedeEditarC && <button type="submit" className={s.btnPrimary}>Guardar</button>}

              </form>

            </aside>

            <div className={s.tableWrapper}>

              <table className={s.table}>

                <thead><tr><th>ID</th><th>Nombre</th><th style={{ textAlign: 'right' }}>Acciones</th></tr></thead>

                <tbody>

                  {catInsumos.map(c => (

                    <tr key={c.id}>

                      <td>#{c.id}</td>

                      <td><strong>{c.nombre}</strong></td>

                      <td style={{ textAlign: 'right' }}>

                        <button className={s.btnEdit} onClick={() => {setCInsumoEditId(c.id); setCInsumoNombre(c.nombre);}}>{puedeEditarC ? 'EDITAR' : 'VER'}</button>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          </div>

        </div>

      )}

    </div>

  );

};