// src/modules/Admin/Tabs/Configuracion/ImportadorMasivo.jsx
import React, { useState, useMemo } from 'react';
import styles from '../../../../assets/styles/EstilosGenerales.module.css';
import { ConfiguracionService } from './1Configuracion.Service';
import toast from 'react-hot-toast';

const PLANTILLAS = {
  productos: {
    titulo: 'Productos e Insumos',
    headers: 'nombre,marca,categoria,presentacion,contenido,unidad_medida,proveedor,sucursales,turno_uso,activo',
    headersExport: 'id,nombre,marca,categoria,presentacion,contenido,unidad_medida,proveedor,sucursales,turno_uso,activo',
    descripcion: 'Carga masiva de insumos operativos. Las categorías, unidades de medida y proveedores deben existir previamente.'
  },
  proveedores: {
    titulo: 'Proveedores',
    headers: 'nombre,direccion,numero_contacto,dias_abierto,estatus',
    headersExport: 'id,nombre,direccion,numero_contacto,dias_abierto,estatus',
    descripcion: 'Carga masiva de empresas proveedoras. Días: "Lunes, Martes, Miércoles".'
  },
  sucursales: {
    titulo: 'Sucursales',
    headers: 'nombre,direccion,horario,estatus',
    headersExport: 'id,nombre,direccion,horario,estatus',
    descripcion: 'Carga masiva de puntos de venta y ubicaciones físicas.'
  },
  categorias: {
    titulo: 'Categorías',
    headers: 'nombre,descripcion,estatus',
    headersExport: 'id,nombre,descripcion,estatus',
    descripcion: 'Carga masiva de familias o categorías de insumos.'
  },
  calendario: {
    titulo: 'Calendario Sucursal × Proveedor',
    headers: 'sucursal,proveedor,dias_permitidos',
    headersExport: 'id,sucursal,proveedor,dias_permitidos',
    descripcion: 'Configura qué días puede pedir cada sucursal a cada proveedor.'
  }
};

// --- UTILIDADES ---
const normalizar = (str) => {
  if (!str) return '';
  return String(str).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');
};

const escaparCSV = (val) => {
  if (val === null || val === undefined) return '';
  const str = String(val);
  return (str.includes(',') || str.includes('"')) ? `"${str.replace(/"/g, '""')}"` : str;
};

export default function ImportadorMasivo({ onVolver }) {
  const [tipoImportacion, setTipoImportacion] = useState('productos');
  const [loading, setLoading] = useState(false);
  
  // Estados para el flujo inteligente
  const [paso, setPaso] = useState(1); // 1: Carga, 2: Previsualización/Validación
  const [filasAnalizadas, setRowsAnalizadas] = useState([]);
  const [stats, setStats] = useState({ validos: 0, errores: 0 });

  const plantilla = PLANTILLAS[tipoImportacion];

  // ── 1. DESCARGAS ──────────────────────────
  const descargarPlantilla = () => {
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + plantilla.headers + '\n'], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `plantilla_${tipoImportacion}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Plantilla descargada');
  };

  const exportarDatosActuales = async () => {
    setLoading(true);
    try {
      let res;
      let columnas = [];
      if (tipoImportacion === 'productos') {
        res = await ConfiguracionService.exportarProductos();
        columnas = ['id', 'nombre', 'marca', 'categoria', 'presentacion', 'contenido', 'unidad_medida', 'proveedor', 'sucursales', 'turno_uso', 'activo'];
      } else if (tipoImportacion === 'proveedores') {
        res = await ConfiguracionService.getProveedores();
        res.data = (res.data || []).map(p => ({ ...p, dias_abierto: (p.dias_abierto || []).join(', ') }));
        columnas = ['id', 'nombre', 'direccion', 'numero_contacto', 'dias_abierto', 'estatus'];
      } else if (tipoImportacion === 'sucursales') {
        res = await ConfiguracionService.getSucursales();
        columnas = ['id', 'nombre', 'direccion', 'horario', 'estatus'];
      } else if (tipoImportacion === 'categorias') {
        res = await ConfiguracionService.getCategorias();
        columnas = ['id', 'nombre', 'descripcion', 'estatus'];
      } else if (tipoImportacion === 'calendario') {
        res = await ConfiguracionService.exportarAsignaciones();
        columnas = ['id', 'sucursal', 'proveedor', 'dias_permitidos'];
      }

      if (res.error) throw res.error;
      const csv = [columnas.join(','), ...res.data.map(row => columnas.map(col => escaparCSV(row[col])).join(','))].join('\n');
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${tipoImportacion}_exportados.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Exportación lista');
    } catch (err) {
      toast.error('Error al exportar');
    } finally {
      setLoading(false);
    }
  };

  // ── 2. PROCESAMIENTO E INTELIGENCIA ──────────────────────────
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      setLoading(true);
      try {
        const text = evt.target.result;
        const rawRows = parseCSV(text);
        
        // Cargar catálogos actuales para validar
        const cats = await ConfiguracionService.getCatalogosParaValidacion();
        if (cats.error) throw cats.error;

        // Crear mapas de búsqueda para validación instantánea
        const mapProv = new Set(cats.proveedores.map(p => normalizar(p.nombre)));
        const mapSucs = new Set(cats.sucursales.map(s => normalizar(s.nombre)));
        const mapUms  = new Set(cats.unidades.flatMap(u => [normalizar(u.nombre), normalizar(u.abreviatura)]));
        const mapCats = new Set(cats.categorias.map(c => normalizar(c.nombre)));

        let vCount = 0;
        let eCount = 0;

        const analizadas = rawRows.map(row => {
          let errores = [];
          
          if (tipoImportacion === 'productos') {
            if (!mapCats.has(normalizar(row.categoria))) errores.push(`Categoría "${row.categoria}" no existe`);
            if (row.proveedor && !mapProv.has(normalizar(row.proveedor))) errores.push(`Proveedor "${row.proveedor}" no existe`);
            if (row.unidad_medida && !mapUms.has(normalizar(row.unidad_medida))) errores.push(`UM "${row.unidad_medida}" no existe`);
          } else if (tipoImportacion === 'calendario') {
            if (!mapSucs.has(normalizar(row.sucursal))) errores.push(`Sucursal "${row.sucursal}" no existe`);
            if (!mapProv.has(normalizar(row.proveedor))) errores.push(`Proveedor "${row.proveedor}" no existe`);
          }

          if (errores.length > 0) eCount++; else vCount++;
          return { ...row, __errores: errores, __valido: errores.length === 0 };
        });

        setRowsAnalizadas(analizadas);
        setStats({ validos: vCount, errores: eCount });
        setPaso(2);
      } catch (err) {
        toast.error(err.message || 'Error al procesar archivo');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const parseCSV = (text) => {
    const lines = text.split(/\r\n|\n/).filter(l => l.trim());
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    return lines.slice(1).map(line => {
      const values = [];
      let s = 0, q = false;
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') q = !q;
        else if (line[i] === ',' && !q) {
          values.push(line.substring(s, i).replace(/^"|"$/g, '').trim());
          s = i + 1;
        }
      }
      values.push(line.substring(s).replace(/^"|"$/g, '').trim());
      return headers.reduce((obj, h, i) => ({ ...obj, [h]: values[i] || '' }), {});
    });
  };

  const ejecutarImportacionFinal = async () => {
    setLoading(true);
    try {
      const datosAEnviar = filasAnalizadas.filter(f => f.__valido);
      if (datosAEnviar.length === 0) return toast.error('No hay registros válidos para subir');

      let res;
      if (tipoImportacion === 'productos') res = await ConfiguracionService.importarProductosMasivo(datosAEnviar);
      else if (tipoImportacion === 'proveedores') res = await ConfiguracionService.importarProveedoresMasivo(datosAEnviar);
      else if (tipoImportacion === 'sucursales') res = await ConfiguracionService.importarSucursalesMasivo(datosAEnviar);
      else if (tipoImportacion === 'categorias') res = await ConfiguracionService.importarCategoriasMasivo(datosAEnviar);
      else if (tipoImportacion === 'calendario') res = await ConfiguracionService.importarAsignacionesMasivo(datosAEnviar);

      if (res.error) throw res.error;
      toast.success(`¡Carga exitosa! ${res.data.length} registros procesados.`);
      onVolver();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: paso === 2 ? '1200px' : '100%', margin: '0 auto', animation: 'slideUp 0.3s ease' }}>
      
      {/* HEADER */}
      <header style={{ marginBottom: 'var(--space-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <span className={styles.labelTop} style={{ display: 'block', marginBottom: '2px' }}>HERRAMIENTAS DE DATOS</span>
          <h1 className={styles.title} style={{ fontSize: '2rem', lineHeight: '1' }}>
            {paso === 1 ? 'Importación\nMasiva' : 'Validación de\nRegistros'}
          </h1>
        </div>
        <button onClick={paso === 2 ? () => setPaso(1) : onVolver} className={`${styles.btnBase} ${styles.btnSecondary}`} style={{ height: '38px', padding: '0 12px' }}>
          <span className="material-symbols-outlined">{paso === 2 ? 'close' : 'arrow_back'}</span>
          {paso === 2 ? 'Cancelar' : 'Volver'}
        </button>
      </header>

      {paso === 1 ? (
        /* --- PASO 1: CONFIGURACIÓN Y CARGA --- */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-md)' }}>
          <section className={styles.card}>
            <h3 className={styles.labelTop} style={{ color: 'var(--color-primary)', borderBottom: '1px solid var(--border-ghost)', paddingBottom: '8px' }}>1. Selección</h3>
            <div style={{ marginTop: '10px' }}>
              <label className={styles.labelTop}>Catálogo</label>
              <select value={tipoImportacion} onChange={(e) => setTipoImportacion(e.target.value)} className={styles.selectEditorial}>
                <option value="productos">Productos e Insumos</option>
                <option value="proveedores">Proveedores</option>
                <option value="sucursales">Sucursales</option>
                <option value="categorias">Categorías</option>
                <option value="calendario">Calendario Sucursal × Proveedor</option>
              </select>
            </div>
            <div style={{ marginTop: '12px', background: 'var(--color-surface-low)', padding: '12px', borderRadius: '10px' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{plantilla.descripcion}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              <button onClick={descargarPlantilla} className={`${styles.btnBase} ${styles.btnSecondary}`} style={{ height: '38px', fontSize: '0.75rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>description</span> Descargar Plantilla
              </button>
              <button onClick={exportarDatosActuales} className={`${styles.btnBase} ${styles.btnOutlined}`} style={{ height: '38px', fontSize: '0.75rem', color: 'var(--color-primary)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>download</span> Exportar Existentes
              </button>
            </div>
          </section>

          <section className={styles.card}>
            <h3 className={styles.labelTop} style={{ color: 'var(--color-primary)', borderBottom: '1px solid var(--border-ghost)', paddingBottom: '8px' }}>2. Carga de Archivo</h3>
            <div style={{ border: '2px dashed var(--border-ghost)', borderRadius: '12px', padding: '30px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--color-primary)' }}>cloud_upload</span>
              <p style={{ fontWeight: 'bold', fontSize: '0.85rem', margin: 0 }}>Sube tu archivo .csv corregido</p>
              <input type="file" accept=".csv" onChange={handleFileUpload} disabled={loading} style={{ display: 'none' }} id="csv-file" />
              <label htmlFor="csv-file" className={`${styles.btnBase} ${styles.btnPrimary}`} style={{ cursor: 'pointer' }}>
                {loading ? 'Analizando...' : 'Seleccionar Archivo'}
              </label>
            </div>
          </section>
        </div>
      ) : (
        /* --- PASO 2: PREVISUALIZACIÓN INTELIGENTE --- */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Resumen de Salud del Archivo */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1, background: '#e8f5e9', padding: '15px', borderRadius: '12px', border: '1px solid #c8e6c9', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="material-symbols-outlined" style={{ color: '#2e7d32', fontSize: '2rem' }}>check_circle</span>
              <div>
                <b style={{ display: 'block', fontSize: '1.2rem', color: '#1b5e20' }}>{stats.validos}</b>
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 'bold', color: '#2e7d32' }}>Registros Listos</span>
              </div>
            </div>
            <div style={{ flex: 1, background: stats.errores > 0 ? '#ffebee' : '#f5f5f5', padding: '15px', borderRadius: '12px', border: stats.errores > 0 ? '1px solid #ffcdd2' : '1px solid #ddd', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="material-symbols-outlined" style={{ color: stats.errores > 0 ? '#c62828' : '#999', fontSize: '2rem' }}>report</span>
              <div>
                <b style={{ display: 'block', fontSize: '1.2rem', color: stats.errores > 0 ? '#b71c1c' : '#666' }}>{stats.errores}</b>
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 'bold', color: stats.errores > 0 ? '#c62828' : '#999' }}>Con Errores</span>
              </div>
            </div>
          </div>

          {/* Tabla de Previsualización */}
          <div className={styles.card} style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--color-surface-low)', zIndex: 10 }}>
                  <tr style={{ textAlign: 'left' }}>
                    <th style={{ padding: '12px' }}>ESTADO</th>
                    {Object.keys(filasAnalizadas[0] || {}).filter(k => !k.startsWith('__')).map(h => (
                      <th key={h} style={{ padding: '12px', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filasAnalizadas.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-ghost)', backgroundColor: row.__valido ? 'transparent' : '#fff5f5' }}>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span className="material-symbols-outlined" style={{ color: row.__valido ? '#4caf50' : '#f44336' }}>
                          {row.__valido ? 'check_circle' : 'error'}
                        </span>
                      </td>
                      {Object.entries(row).filter(([k]) => !k.startsWith('__')).map(([k, v], i) => (
                        <td key={i} style={{ padding: '12px', color: row.__valido ? 'inherit' : '#b71c1c' }}>
                          {v}
                          {!row.__valido && row.__errores.some(e => e.toLowerCase().includes(k)) && (
                            <div style={{ fontSize: '0.6rem', color: '#ff5252', fontWeight: 'bold' }}>X Error</div>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Acción Final */}
          <button 
            onClick={ejecutarImportacionFinal} 
            disabled={loading || stats.validos === 0} 
            className={`${styles.btnBase} ${styles.btnPrimary}`} 
            style={{ height: '54px', borderRadius: '14px', fontSize: '1rem' }}
          >
            <span className="material-symbols-outlined">rocket_launch</span>
            {loading ? 'PROCESANDO...' : `CONFIRMAR Y CARGAR ${stats.validos} REGISTROS`}
          </button>
          
          {stats.errores > 0 && (
            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#c62828', fontWeight: 'bold' }}>
              ⚠️ Los {stats.errores} registros marcados en rojo serán ignorados. Corrígelos en tu CSV y vuelve a subir si deseas incluirlos.
            </p>
          )}
        </div>
      )}
    </div>
  );
}