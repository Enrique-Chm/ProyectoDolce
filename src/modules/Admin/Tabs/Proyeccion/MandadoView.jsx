// Archivo: src/modules/Admin/Tabs/Proyeccion/MandadoView.jsx
import React, { useState, useMemo } from 'react';
import { SearchableSelect } from '../MenuTab/SearchableSelect'; 

export const MandadoView = ({ estimates, s, usuarioId }) => {
  const { 
    sugerenciasFiltradas, 
    compradosIds, 
    confirmarCompra, 
    puedeEditarInventario,
    proveedores,
    filtroProveedor,
    setFiltroProveedor
  } = estimates;
  
  const [filtro, setFiltro] = useState("");

  // 🚀 Preparamos las opciones de proveedores
  const opcionesProveedores = useMemo(() => {
    return [
      { id: 'todos', nombre_empresa: 'Todos los proveedores' },
      ...(Array.isArray(proveedores) ? proveedores : [])
    ];
  }, [proveedores]);

  // --- 🛠️ FILTRADO DE LA LISTA DE MANDADO ---
  const lista = useMemo(() => {
    const base = Array.isArray(sugerenciasFiltradas) ? sugerenciasFiltradas : [];
    
    return base.filter(item => {
      // 1. Validamos si hay CAJAS que comprar. 
      // Ignoramos la cantidad fraccional y nos enfocamos en el empaque que vende el proveedor.
      const necesitaCompra = parseInt(item.cajas_a_pedir) > 0;
      const yaComprado = compradosIds.includes(item.insumo_id);

      if (!necesitaCompra || yaComprado) return false;
      
      // 2. Filtro por texto (Nombre o Modelo)
      if (filtro) {
        const termino = filtro.toLowerCase();
        const nombre = (item.insumo_nombre || "").toLowerCase();
        const modelo = (item.modelo || "").toLowerCase();
        return nombre.includes(termino) || modelo.includes(termino);
      }
      
      return true;
    });
  }, [sugerenciasFiltradas, compradosIds, filtro]);

  // Formateador de moneda rápido
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

  // --- RENDER PRINCIPAL ---
  return (
    <>
      <section className={s.pageHeader} style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className={s.pageTitle} style={{ fontSize: '1.2rem', margin: 0 }}>Lista de Mandado (Por Cajas/Empaques)</h2>
          <span className={s.textSubDetail}>Cantidades redondeadas para comprar directamente al proveedor.</span>
        </div>
        <div className={s.badge} style={{ fontSize: '12px', padding: '6px 12px', backgroundColor: 'var(--color-primary)', color: 'white', borderRadius: '20px', fontWeight: '800' }}>
           {lista.length} Pedidos Pendientes
        </div>
      </section>

      {/* Buscador y Filtro por Proveedor */}
      <div className={s.adminCard} style={{ marginBottom: '20px', padding: '15px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <input 
          type="text" 
          className={s.inputField} 
          placeholder="Buscar insumo en la lista..." 
          value={filtro} 
          onChange={e => setFiltro(e.target.value)} 
          style={{ flex: 2, minWidth: '200px', margin: 0 }}
        />
        
        <div style={{ flex: 1, minWidth: '200px', zIndex: 10 }}>
          <SearchableSelect
            options={opcionesProveedores}
            value={filtroProveedor === 'todos' ? 'Todos los proveedores' : filtroProveedor}
            onChange={(valor) => setFiltroProveedor(valor === 'Todos los proveedores' ? 'todos' : valor)}
            valueKey="nombre_empresa"
            labelKey="nombre_empresa"
            placeholder="Filtrar por proveedor..."
          />
        </div>
      </div>

      {/* Grid de Tarjetas de Compra */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {lista.length === 0 ? (
          <div style={{ gridColumn: '1/-1' }} className={s.adminCard}>
            <div className={s.emptyState} style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🎉</div>
              <h3 style={{ margin: '0 0 5px 0', color: '#334155', fontWeight: '800' }}>¡Todo Abastecido!</h3>
              <p style={{ margin: 0, color: '#64748b' }}>No hay cajas pendientes por comprar según la proyección actual.</p>
            </div>
          </div>
        ) : (
          lista.map(ins => (
            <div 
              key={ins.insumo_id} 
              className={s.adminCard} 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between', 
                gap: '15px',
                padding: '20px',
                margin: 0,
                borderTop: '5px solid var(--color-primary)',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
              }}
            >
              <div>
                <div className={s.productTitle} style={{ fontSize: '1.1rem', marginBottom: '4px', fontWeight: '800' }}>
                  {ins.insumo_nombre}
                </div>
                <div className={s.textMuted} style={{ fontSize: '12px', fontWeight: '600' }}>
                   {ins.modelo || 'Estándar'} | {ins.proveedor_nombre}
                </div>
              </div>

              {/* Contenedor de Información de Compra */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                
                {/* 1. CAJAS A PEDIR (Lo más importante) */}
                <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px inset rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: '#475569' }}>Comprar:</span>
                  <span style={{ color: 'var(--color-primary)', fontSize: '1.4rem', fontWeight: '900' }}>
                     {ins.cajas_a_pedir} <small style={{ fontSize: '12px', fontWeight: '700' }}>Caja(s)</small>
                  </span>
                </div>

                {/* 2. Información Adicional (Opcional pero útil para el comprador) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 4px' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                    Requiere: {ins.cantidad_sugerida} {ins.unidad_medida}
                  </span>
                  <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: '800' }}>
                    Est: {formatMoney(ins.presupuesto_estimado)}
                  </span>
                </div>
              </div>

              {/* Acción de Confirmación */}
              <div style={{ marginTop: '5px' }}>
                {puedeEditarInventario ? (
                  <button 
                    className={`${s.btn} ${s.btnSuccess} ${s.btnFull}`} 
                    onClick={() => confirmarCompra(ins, usuarioId)}
                    style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        gap: '10px', 
                        padding: '14px', 
                        fontWeight: '800',
                        fontSize: '13px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}
                  >
                     Registrar Compra
                  </button>
                ) : (
                  <div 
                    className={s.badgeDanger} 
                    style={{ display: 'block', textAlign: 'center', padding: '10px', width: '100%', borderRadius: '8px' }}
                  >
                    Modo Lectura
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
};