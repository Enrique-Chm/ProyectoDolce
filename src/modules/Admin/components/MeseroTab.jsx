import React, { useState, useEffect } from 'react';
import { productosService } from '../../../services/productos.service';
import { ventasService } from '../../../services/Ventas.service';
import s from '../AdminPage.module.css';

export const MeseroTab = ({ sucursalId, usuarioId }) => {
  // --- ESTADOS ---
  const [view, setView] = useState('cuentas'); // cuentas | mesas | menu
  const [cuentasAbiertas, setCuentasAbiertas] = useState([]);
  const [ventaActiva, setVentaActiva] = useState(null);
  const [mesaInput, setMesaInput] = useState('');
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Estados para Cierre de Cuenta
  const [showCierre, setShowCierre] = useState(false);
  const [datosPago, setDatosPago] = useState({ metodo_pago: 'efectivo', propina: 0, pagado_con: 0 });

  // --- EFECTOS ---
  useEffect(() => { 
    if (view === 'cuentas') cargarCuentas();
    if (view === 'menu') cargarMenu();
  }, [view, sucursalId]);

  // --- CARGA DE DATOS ---
  const cargarCuentas = async () => {
    setLoading(true);
    try {
      const { data } = await ventasService.getCuentasAbiertas(sucursalId);
      setCuentasAbiertas(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const cargarMenu = async () => {
    try {
      const data = await productosService.getInitialData(sucursalId);
      setProductos(data.productos || []);
      setCategorias(data.categorias || []);
    } catch (err) {
      console.error(err);
    }
  };

  // --- LÓGICA DE CARRITO ---
  const seleccionarCuenta = (venta) => {
    setVentaActiva(venta);
    setMesaInput(venta.mesa);
    setCarrito([]); 
    setView('menu');
  };

  const agregarAlCarrito = (p) => {
    const existe = carrito.find(item => item.id === p.id);
    if (existe) {
      setCarrito(carrito.map(item => 
        item.id === p.id ? { ...item, cantidad: item.cantidad + 1 } : item
      ));
    } else {
      setCarrito([...carrito, { 
        id: p.id, 
        nombre: p.nombre, 
        precio_venta: p.precio_venta, 
        costo_actual: p.costo_actual || 0,
        cantidad: 1, 
        notas: '' 
      }]);
    }
  };

  // --- ACCIONES DE VENTA ---
  const handleEnviarOrden = async () => {
    if (carrito.length === 0) return;
    setLoading(true);
    
    try {
      const res = await ventasService.procesarVenta({
        id: ventaActiva?.id,
        folio: ventaActiva?.folio,
        sucursal_id: sucursalId,
        usuario_id: usuarioId,
        mesa: mesaInput
      }, carrito);

      if (res.success) {
        alert("¡Comanda enviada!");
        resetTodo();
      } else {
        alert("Error al enviar: " + res.error);
      }
    } catch (error) {
      alert("Error crítico en la conexión");
    } finally {
      setLoading(false);
    }
  };

  const ejecutarCierre = async () => {
    setLoading(true);
    const totalPropina = (parseFloat(ventaActiva?.total) || 0) + (parseFloat(datosPago.propina) || 0);
    const cambio = (parseFloat(datosPago.pagado_con) || 0) - totalPropina;

    try {
      const res = await ventasService.cerrarCuenta(ventaActiva.id, {
        ...datosPago,
        totalFinal: totalPropina,
        cambio: cambio > 0 ? cambio : 0
      });

      if (res.success) {
        setShowCierre(false);
        resetTodo();
      } else {
        alert("Error al cerrar: " + res.error);
      }
    } catch (error) {
      alert("Error en el cierre de cuenta");
    } finally {
      setLoading(false);
    }
  };

  const resetTodo = () => {
    setVentaActiva(null);
    setMesaInput('');
    setCarrito([]);
    setView('cuentas');
    setDatosPago({ metodo_pago: 'efectivo', propina: 0, pagado_con: 0 });
  };

  // Cálculos para el Modal
  const totalCierre = (parseFloat(ventaActiva?.total) || 0) + (parseFloat(datosPago.propina) || 0);
  const cambioCalculado = (parseFloat(datosPago.pagado_con) || 0) - totalCierre;

  return (
    <div className={s.posContainer}>
      
      {/* VISTA 0: MONITOR DE SALÓN */}
      {view === 'cuentas' && (
        <div style={{padding: '10px'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
             <h2 className={s.sectionTitle}>Servicio de Comedor</h2>
             <button className={s.btnPrimary} onClick={() => { setVentaActiva(null); setMesaInput(''); setView('mesas'); }}>+ ABRIR MESA</button>
          </div>
          <div className={s.productGrid} style={{marginTop:'20px'}}>
            {cuentasAbiertas.map(v => (
              <div key={v.id} className={s.mesaCard} onClick={() => seleccionarCuenta(v)}>
                <span className={s.mesaBadge}>ACTIVA</span>
                <div>
                  <h3>{v.mesa}</h3>
                  <div style={{fontSize: '11px', color: '#64748b'}}>{v.folio}</div>
                </div>
                <div style={{fontWeight:900, fontSize:'1.3rem', color: '#005696'}}>${v.total}</div>
              </div>
            ))}
            {!loading && cuentasAbiertas.length === 0 && (
              <p style={{gridColumn:'1/-1', textAlign:'center', color:'#94a3b8', padding: '2rem'}}>No hay mesas activas.</p>
            )}
          </div>
        </div>
      )}

      {/* VISTA 1: IDENTIFICAR MESA */}
      {view === 'mesas' && (
        <div className={s.mesaSelectorManual}>
          <h2 style={{fontWeight:900}}>Nueva Comanda</h2>
          <form onSubmit={(e) => { e.preventDefault(); if(mesaInput) setView('menu'); }}>
            <input 
              className={s.mesaInput} 
              value={mesaInput} 
              onChange={e => setMesaInput(e.target.value)} 
              placeholder="Ej: 15" 
              autoFocus required 
            />
            <button type="submit" className={s.btnEmpezarOrden}>COMENZAR CAPTURA</button>
            <button type="button" className={s.btnCancel} style={{marginTop:'15px', width:'100%'}} onClick={() => setView('cuentas')}>VOLVER</button>
          </form>
        </div>
      )}

      {/* VISTA 2: COMANDERO */}
      {view === 'menu' && (
        <div className={s.posGrid}>
          <div className={s.menuArea}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px'}}>
              <button className={s.btnCancel} onClick={() => setView('cuentas')}>SALÓN</button>
              <div style={{textAlign:'right'}}>
                <h3 style={{margin:0, fontWeight:900}}>{mesaInput.toUpperCase()}</h3>
                {ventaActiva && <span style={{fontSize:'12px', color:'#16a34a', fontWeight:700}}>Consumo: ${ventaActiva.total}</span>}
              </div>
            </div>
            
            {categorias.map(cat => (
              <div key={cat.id} style={{marginBottom:'20px'}}>
                <h4 style={{borderLeft:'4px solid #005696', paddingLeft:'10px', color:'#005696'}}>{cat.nombre}</h4>
                <div className={s.productGrid}>
                  {productos.filter(p => p.categoria === cat.id).map(p => (
                    <div key={p.id} className={s.productCard} onClick={() => agregarAlCarrito(p)}>
                      <div style={{fontWeight:700, fontSize:'13px'}}>{p.nombre}</div>
                      <div style={{color:'#005696', fontWeight:900}}>${p.precio_venta}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <aside className={s.cartArea}>
            <div className={s.cartHeader}>NUEVA CAPTURA</div>
            <div className={s.cartItems}>
              {carrito.map((item) => (
                <div key={item.id} className={s.cartItem}>
                  <div style={{display:'flex', justifyContent:'space-between'}}>
                    <strong>{item.cantidad}x {item.nombre}</strong>
                    <button onClick={() => setCarrito(carrito.filter(i => i.id !== item.id))} style={{color:'red', border:'none', background:'none'}}>✕</button>
                  </div>
                  <input 
                    placeholder="Nota de cocina..." 
                    className={s.inputNota}
                    value={item.notas}
                    onChange={(e) => setCarrito(carrito.map(i => i.id === item.id ? {...i, notas: e.target.value} : i))}
                  />
                </div>
              ))}
            </div>
            <div style={{padding:'20px', background:'white', borderTop:'1px solid #e2e8f0'}}>
              <button className={s.btnOrder} style={{marginBottom:'10px'}} onClick={handleEnviarOrden} disabled={loading || carrito.length === 0}>
                {loading ? 'ENVIANDO...' : 'ENVIAR A COCINA'}
              </button>
              {ventaActiva && (
                <button className={s.btnDelete} style={{width:'100%', padding:'12px', background: '#e11d48', color: 'white'}} onClick={() => setShowCierre(true)}>
                  COBRAR CUENTA
                </button>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* MODAL DE LIQUIDACIÓN */}
      {showCierre && (
        <div className={s.modalOverlay}>
          <div className={s.modalCierre}>
            <h2 style={{marginTop:0, textAlign: 'center'}}>Mesa {ventaActiva.mesa}</h2>
            <div className={s.totalHighlight}>
               <span>TOTAL CUENTA</span>
               <strong>${ventaActiva.total}</strong>
            </div>
            
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
                <div>
                    <label className={s.label}>Pago</label>
                    <select className={s.input} value={datosPago.metodo_pago} onChange={e => setDatosPago({...datosPago, metodo_pago: e.target.value})}>
                        <option value="efectivo">Efectivo</option>
                        <option value="tarjeta">Tarjeta</option>
                    </select>
                </div>
                <div>
                    <label className={s.label}>Propina</label>
                    <input type="number" className={s.input} value={datosPago.propina} onChange={e => setDatosPago({...datosPago, propina: e.target.value})} />
                </div>
            </div>

            <div style={{margin:'20px 0', padding:'15px', background:'#f0fdf4', borderRadius:'15px', textAlign:'center'}}>
               <span style={{fontSize:'12px'}}>TOTAL CON PROPINA</span>
               <div style={{fontSize:'2rem', fontWeight:900, color:'#16a34a'}}>${totalCierre.toFixed(2)}</div>
            </div>

            {datosPago.metodo_pago === 'efectivo' && (
               <div style={{background:'#fff7ed', padding:'15px', borderRadius:'12px', border: '1px solid #ffedd5'}}>
                  <label className={s.label}>Pagó con:</label>
                  <input type="number" className={s.input} value={datosPago.pagado_con} onChange={e => setDatosPago({...datosPago, pagado_con: e.target.value})} />
                  <div style={{marginTop:'5px', fontWeight:800, color:'#9a3412'}}>Cambio: ${cambioCalculado.toFixed(2)}</div>
               </div>
            )}

            <div style={{display:'flex', gap:'10px', marginTop:'20px'}}>
              <button className={s.btnOrder} style={{flex:2}} onClick={ejecutarCierre} disabled={loading}>FINALIZAR</button>
              <button className={s.btnCancel} style={{flex:1}} onClick={() => setShowCierre(false)}>VOLVER</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};