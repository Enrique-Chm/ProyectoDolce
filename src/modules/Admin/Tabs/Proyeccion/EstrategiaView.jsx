// Archivo: src/modules/Admin/Tabs/Proyeccion/EstrategiaView.jsx
import React, { useState, useMemo } from "react";
import { formatCurrency } from "../../../../utils/formatCurrency";
// 🚀 1. Importamos el componente
import { SearchableSelect } from '../MenuTab/SearchableSelect';

export const EstrategiaView = ({ estimates, s }) => {
  const {
    sugerenciasFiltradas,
    proveedores,
    presupuestoTotal,
    guardarPolitica,
    puedeEditarInventario,
    setFiltroProveedor,
    diasCompra,
    setDiasCompra,
    porcentajeColchon,
    setPorcentajeColchon
  } = estimates;

  // --- ESTADOS LOCALES ---
  const [filtroBuscar, setFiltroBuscar] = useState("");
  const [editandoId, setEditandoId] = useState(null);

  const [tempPolitica, setTempPolitica] = useState({
    metodo: "dinamico",
    cobertura: 7,
    seguridad: 2,
    minimo: 0,
    maximo: 0,
  });

  // 🚀 2. Preparamos las opciones inyectando "Todos los proveedores" al inicio
  const opcionesProveedores = useMemo(() => {
    return [
      { id: 'todos', nombre_empresa: 'Todos los proveedores' },
      ...proveedores
    ];
  }, [proveedores]);

  // 🚀 LÓGICA: Generar la etiqueta de los días (Ej: LUN / MAR / MIÉ)
  const etiquetaDias = useMemo(() => {
    const diasCortos = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
    const hoyIndex = new Date().getDay();
    const resultado = [];
    
    // Iteramos según la cantidad de días de compra, empezando por mañana (i = 1)
    for (let i = 1; i <= diasCompra; i++) {
      resultado.push(diasCortos[(hoyIndex + i) % 7]);
    }
    
    return resultado.join(" / ");
  }, [diasCompra]);

  // --- LÓGICA DE ACCIONES ---
  const iniciarEdicion = (item) => {
    setEditandoId(item.insumo_id);
    setTempPolitica({
      metodo: item.metodo_compra || "dinamico",
      cobertura: item.dias_cobertura_objetivo || 0,
      seguridad: item.dias_stock_seguridad || 0,
      minimo: item.stock_minimo || 0,
      maximo: item.stock_maximo || 0,
    });
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
  };

  const handleSave = async (id) => {
    const res = await guardarPolitica(id, tempPolitica);
    if (res.success) {
      setEditandoId(null);
    }
  };

  // --- FILTRADO DE DATOS ---
  const dataFiltrada = (sugerenciasFiltradas || []).filter((i) => {
    const termino = filtroBuscar.toLowerCase();
    const nombreInsumo = (i.insumo_nombre || "").toLowerCase();
    const modeloInsumo = (i.modelo || "").toLowerCase();

    const textoBusqueda = `${nombreInsumo} ${modeloInsumo}`;
    return !filtroBuscar || textoBusqueda.includes(termino);
  });

  // --- RENDERIZADO DE TABLAS ---
  const renderCabecera = () => {
    return (
      <tr>
        <th className={s.th}>INSUMO</th>
        <th className={s.th}>STOCK ACTUAL</th>
        <th className={s.th}>REQUERIDO ({diasCompra} DÍAS)</th>
        <th className={s.th}>A COMPRAR</th>
        <th className={s.th}>PROYECCION</th>
        <th className={s.th} style={{ width: "100px", textAlign: "center" }}>
          ACCIÓN
        </th>
      </tr>
    );
  };

  const renderFilasInsumos = () => {
    return dataFiltrada.map((item) => {
      const isEditing = editandoId === item.insumo_id;
      
      // El valor de la DB ya viene multiplicado por los días y con el colchón
      const requeridoFinal = parseFloat(item.consumo_diario_real) || 0;
      const stockActual = parseFloat(item.stock_fisico_hoy) || 0;

      return (
        <tr key={item.insumo_id}>
          <td className={s.td}>
            <div className={s.productTitle}>{item.insumo_nombre}</div>
            <div className={s.textMuted} style={{ fontSize: "11px" }}>
              {item.modelo || "Sin modelo"} | {item.proveedor_nombre}
            </div>
          </td>
          <td className={s.textMuted} >
            <span
              style={{
                color: stockActual < requeridoFinal ? "var(--color-danger)" : "inherit",
              }}
            >
              {stockActual.toFixed(1)}
            </span>
            <small className={s.textMuted}> {item.unidad_medida}</small>
          </td>
          <td className={s.td}>
            <span style={{ fontWeight: "600", color: "var(--color-primary)" }}>
              {requeridoFinal.toFixed(1)} {item.unidad_medida}
            </span>
            <div className={s.textMuted} style={{ fontSize: "10px", lineHeight: "1.2", marginTop: "2px" }}>
              {etiquetaDias} {porcentajeColchon > 0 && `(+${porcentajeColchon}%)`}
            </div>
          </td>

          <td className={s.td}>
            <div
              className={s.productTitle}
              style={{
                color:
                  item.cantidad_sugerida > 0 ? "var(--color-success)" : "#888",
              }}
            >
              {item.cantidad_sugerida > 0 ? `+${item.cantidad_sugerida}` : "0"}{" "}
              <small>{item.unidad_medida}</small>
            </div>
            {item.cajas_a_pedir > 0 && (
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "var(--color-success)",
                }}
              >
                Pedir {item.cajas_a_pedir} caja(s)
              </div>
            )}
          </td>
          <td className={s.td}>
            {isEditing ? (
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <select
                  className={s.inputField}
                  style={{ padding: "4px", fontSize: "12px" }}
                  value={tempPolitica.metodo}
                  onChange={(e) =>
                    setTempPolitica({ ...tempPolitica, metodo: e.target.value })
                  }
                >
                  <option value="dinamico">Basado en Ventas (JIT)</option>
                  <option value="estatico">Manual Fijo (Cantidades)</option>
                </select>

                {tempPolitica.metodo === "dinamico" ? (
                  <div style={{ display: "flex", gap: "4px" }}>
                    <input
                      type="number"
                      title="Días Cobertura"
                      placeholder="Cob."
                      className={s.inputField}
                      style={{ width: "55px", padding: "4px" }}
                      value={tempPolitica.cobertura}
                      onChange={(e) =>
                        setTempPolitica({
                          ...tempPolitica,
                          cobertura: e.target.value,
                        })
                      }
                    />
                    <input
                      type="number"
                      title="Días Seguridad"
                      placeholder="Seg."
                      className={s.inputField}
                      style={{ width: "55px", padding: "4px" }}
                      value={tempPolitica.seguridad}
                      onChange={(e) =>
                        setTempPolitica({
                          ...tempPolitica,
                          seguridad: e.target.value,
                        })
                      }
                    />
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "4px" }}>
                    <input
                      type="number"
                      title="Mínimo"
                      placeholder="Mín."
                      className={s.inputField}
                      style={{ width: "55px", padding: "4px" }}
                      value={tempPolitica.minimo}
                      onChange={(e) =>
                        setTempPolitica({
                          ...tempPolitica,
                          minimo: e.target.value,
                        })
                      }
                    />
                    <input
                      type="number"
                      title="Máximo"
                      placeholder="Máx."
                      className={s.inputField}
                      style={{ width: "55px", padding: "4px" }}
                      value={tempPolitica.maximo}
                      onChange={(e) =>
                        setTempPolitica({
                          ...tempPolitica,
                          maximo: e.target.value,
                        })
                      }
                    />
                  </div>
                )}
              </div>
            ) : (
              <div>
                <span
                  className={s.badge}
                  style={{
                    marginBottom: "4px",
                    display: "inline-block",
                    fontSize: "10px",
                    backgroundColor: "#e3f2fd",
                    color: "#1976d2",
                  }}
                >
                  {item.metodo_compra === "estatico"
                    ? "STOCK FIJO"
                    : "DEMANDA JIT"}
                </span>
                <div style={{ fontSize: "11px", fontWeight: "600" }}>
                  {item.metodo_compra === "estatico"
                    ? `Mín: ${item.stock_minimo} | Máx: ${item.stock_maximo}`
                    : `Cubriendo ${diasCompra} d.`}
                </div>
              </div>
            )}
          </td>

          <td className={s.td} style={{ textAlign: "center" }}>
            {puedeEditarInventario &&
              (isEditing ? (
                <div
                  style={{
                    display: "flex",
                    gap: "5px",
                    justifyContent: "center",
                  }}
                >
                  <button
                    className={`${s.btn} ${s.btnSuccess} ${s.btnSmall}`}
                    onClick={() => handleSave(item.insumo_id)}
                  >
                    💾
                  </button>
                  <button
                    className={`${s.btn} ${s.btnDanger} ${s.btnSmall}`}
                    onClick={cancelarEdicion}
                  >
                    ❌
                  </button>
                </div>
              ) : (
                <button
                  className={`${s.btn} ${s.btnEditar} ${s.btnSmall}`}
                  onClick={() => iniciarEdicion(item)}
                >
                  📝
                </button>
              ))}
          </td>
        </tr>
      );
    });
  };

  // --- RENDER PRINCIPAL ---
  return (
    <>
      <section
        className={s.pageHeader}
        style={{
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "15px"
        }}
      >
        <div>
          <h2 style={{ fontSize: "1.2rem", margin: 0 }}>
            Estrategia de Abastecimiento
          </h2>
          <p className={s.textMuted} style={{ fontSize: "12px", margin: 0 }}>
            Calculando la suma exacta de los requerimientos de los próximos {diasCompra} días.
          </p>
        </div>
        <div
          className={s.adminCard}
          style={{
            padding: "10px 20px",
            borderLeft: "4px solid var(--color-primary)",
            margin: 0,
          }}
        >
          <span
            style={{
              fontSize: "11px",
              fontWeight: "700",
              color: "#888",
              display: "block",
            }}
          >
            INVERSIÓN ESTIMADA PARA {diasCompra} DÍA(S)
          </span>
          <span
            style={{
              color: "var(--color-primary)",
              fontSize: "1.4rem",
              fontWeight: "900",
            }}
          >
            {formatCurrency(presupuestoTotal)}
          </span>
        </div>
      </section>

      {/* 🚀 PANEL DE CONTROL DE DEMANDA */}
      <div className={s.adminCard} style={{ 
        display: "flex", 
        flexWrap: "wrap",
        gap: "20px", 
        alignItems: "center", 
        padding: "15px 20px", 
        marginBottom: "20px", 
        backgroundColor: "#f8fafc", 
        border: "1px solid #e2e8f0" 
      }}>
        
        {/* Control: Días a Comprar */}
        <div style={{ display: "flex", flexDirection: "column", flex: "1 1 200px" }}>
          <label style={{ fontSize: "12px", fontWeight: "800", color: "#475569", marginBottom: "8px" }}>
            DÍAS A ABASTECER
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button 
              className={s.btn} 
              style={{ padding: "8px 12px", fontWeight: "bold" }}
              onClick={() => setDiasCompra(Math.max(1, diasCompra - 1))}
            >
              -
            </button>
            <input 
              type="number" 
              className={s.inputField} 
              style={{ textAlign: "center", width: "80px", margin: 0, fontWeight: "bold", fontSize: "1.1rem" }} 
              value={diasCompra} 
              min="1"
              onChange={(e) => setDiasCompra(Math.max(1, parseInt(e.target.value) || 1))} 
            />
            <button 
              className={s.btn} 
              style={{ padding: "8px 12px", fontWeight: "bold" }}
              onClick={() => setDiasCompra(diasCompra + 1)}
            >
              +
            </button>
          </div>
          <span style={{ fontSize: "11px", color: "#94a3b8", marginTop: "5px" }}>
            Cubriendo: <strong>{etiquetaDias}</strong>
          </span>
        </div>

        {/* Control Porcentaje Colchón (Caja de Texto) */}
        <div style={{ display: "flex", flexDirection: "column", flex: "1 1 250px" }}>
          <label style={{ fontSize: "12px", fontWeight: "800", color: "#475569", marginBottom: "8px" }}>
            COLCHÓN DE SEGURIDAD
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button 
              className={s.btn} 
              style={{ padding: "8px 12px", fontWeight: "bold" }}
              onClick={() => setPorcentajeColchon(Math.max(0, porcentajeColchon - 5))}
            >
              -
            </button>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input 
                type="number" 
                className={s.inputField} 
                style={{ textAlign: "center", width: "80px", margin: 0, fontWeight: "bold", fontSize: "1.1rem", paddingRight: "15px" }} 
                value={porcentajeColchon} 
                min="0"
                onChange={(e) => setPorcentajeColchon(Math.max(0, parseInt(e.target.value) || 0))} 
              />
              <span style={{ position: "absolute", right: "12px", fontWeight: "bold", color: "#94a3b8", pointerEvents: "none" }}>
                %
              </span>
            </div>
            <button 
              className={s.btn} 
              style={{ padding: "8px 12px", fontWeight: "bold" }}
              onClick={() => setPorcentajeColchon(porcentajeColchon + 5)}
            >
              +
            </button>
          </div>
          <span style={{ fontSize: "11px", color: "#94a3b8", marginTop: "5px" }}>Añade un margen extra para imprevistos.</span>
        </div>

      </div>

      <div className={`${s.adminCard} ${s.tableContainer}`}>
        <div
          style={{
            padding: "16px",
            display: "flex",
            gap: "12px",
            background: "#fcfcfc",
            borderBottom: "1px solid #eee",
          }}
        >
          <input
            type="text"
            className={s.inputField}
            placeholder="Buscar insumo o modelo..."
            value={filtroBuscar}
            onChange={(e) => setFiltroBuscar(e.target.value)}
            style={{ flex: 2 }}
          />
          
          <div style={{ flex: 1, minWidth: '200px', zIndex: 10 }}>
            <SearchableSelect
              options={opcionesProveedores}
              value={estimates.filtroProveedor === 'todos' ? 'Todos los proveedores' : estimates.filtroProveedor}
              onChange={(valor) => setFiltroProveedor(valor === 'Todos los proveedores' ? 'todos' : valor)}
              valueKey="nombre_empresa"
              labelKey="nombre_empresa"
              placeholder="Filtrar por proveedor..."
            />
          </div>
        </div>

        <table className={s.table}>
          <thead className={s.thead}>{renderCabecera()}</thead>
          <tbody>
            {dataFiltrada.length > 0 ? (
              renderFilasInsumos()
            ) : (
              <tr>
                <td
                  colSpan="6"
                  className={s.td}
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: "#888",
                  }}
                >
                  No hay datos disponibles para los filtros seleccionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};