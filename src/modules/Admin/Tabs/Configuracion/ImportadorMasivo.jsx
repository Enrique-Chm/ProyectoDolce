// src/modules/Admin/Tabs/Configuracion/ImportadorMasivo.jsx
import React, { useState } from 'react';
import styles from '../../../../assets/styles/EstilosGenerales.module.css';
import { ConfiguracionService } from './1Configuracion.Service';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────
// Definición de plantillas por catálogo.
// Los headers de la plantilla vacía NO incluyen 'id' (registros nuevos).
// La exportación SÍ incluye 'id' para identificar registros existentes.
// ─────────────────────────────────────────────────────────────
const PLANTILLAS = {
  productos: {
    titulo: 'Productos e Insumos',
    headers: 'nombre,marca,categoria,presentacion,contenido,unidad_medida,proveedor,sucursales,turno_uso,activo',
    headersExport: 'id,nombre,marca,categoria,presentacion,contenido,unidad_medida,proveedor,sucursales,turno_uso,activo',
    descripcion: 'Carga masiva de insumos operativos. Las categorías, unidades de medida y proveedores deben existir previamente. Turno: "AM", "PM" o vacío (se asigna "Ambos").'
  },
  proveedores: {
    titulo: 'Proveedores',
    headers: 'nombre,direccion,numero_contacto,dias_abierto,estatus',
    headersExport: 'id,nombre,direccion,numero_contacto,dias_abierto,estatus',
    descripcion: 'Carga masiva de empresas proveedoras. Los días se separan con comas: "Lunes, Martes, Miércoles".'
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
    descripcion: 'Carga masiva de familias o categorías de insumos (ej: Barra, Cocina, Limpieza).'
  },
  calendario: {
    titulo: 'Calendario Sucursal × Proveedor',
    headers: 'sucursal,proveedor,dias_permitidos',
    headersExport: 'id,sucursal,proveedor,dias_permitidos',
    descripcion: 'Configura qué días puede pedir cada sucursal a cada proveedor. Los días se separan con comas: "Lunes, Miércoles, Viernes". Los nombres de sucursales y proveedores deben coincidir exactamente con los registrados en el sistema.'
  }
};

// ─────────────────────────────────────────────────────────────
// Utilidades CSV
// ─────────────────────────────────────────────────────────────

/** Escapa un valor para CSV: envuelve en comillas si contiene comas o comillas */
const escaparCSV = (val) => {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/** Convierte un arreglo de objetos a string CSV usando las columnas indicadas */
const arrayToCSV = (data, columnas) => {
  const headerLine = columnas.join(',');
  const rows = data.map(row =>
    columnas.map(col => escaparCSV(row[col])).join(',')
  );
  return [headerLine, ...rows].join('\n');
};

/** Dispara la descarga de un string como archivo .csv */
const descargarArchivo = (contenido, nombreArchivo) => {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + contenido], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nombreArchivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/** Parseador de CSV robusto (soporta comillas y comas internas) */
const procesarArchivoCSV = (text) => {
  const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) {
    throw new Error('El archivo no contiene suficientes registros.');
  }
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  return lines.slice(1).map(line => {
    const values = [];
    let start = 0;
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') {
        inQuotes = !inQuotes;
      } else if (line[i] === ',' && !inQuotes) {
        let val = line.substring(start, i).trim();
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1).trim();
        }
        values.push(val);
        start = i + 1;
      }
    }
    let lastVal = line.substring(start).trim();
    if (lastVal.startsWith('"') && lastVal.endsWith('"')) {
      lastVal = lastVal.substring(1, lastVal.length - 1).trim();
    }
    values.push(lastVal);
    const rowObj = {};
    headers.forEach((header, index) => {
      rowObj[header] = values[index] !== undefined ? values[index] : '';
    });
    return rowObj;
  });
};

// ─────────────────────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────────────────────
export default function ImportadorMasivo({ onVolver }) {
  const [tipoImportacion, setTipoImportacion] = useState('productos');
  const [loading, setLoading] = useState(false);

  const plantilla = PLANTILLAS[tipoImportacion];

  // ── 1. DESCARGAR PLANTILLA VACÍA ──────────────────────────
  const descargarPlantilla = () => {
    const contenido = plantilla.headers + '\n';
    descargarArchivo(contenido, `plantilla_${tipoImportacion}.csv`);
    toast.success('Plantilla descargada correctamente');
  };

  // ── 2. EXPORTAR DATOS ACTUALES ────────────────────────────
  const exportarDatosActuales = async () => {
    setLoading(true);
    try {
      let data = [];
      let columnas = [];

      switch (tipoImportacion) {
        case 'productos': {
          const res = await ConfiguracionService.exportarProductos();
          if (res.error) throw res.error;
          data = res.data || [];
          columnas = ['id', 'nombre', 'marca', 'categoria', 'presentacion', 'contenido', 'unidad_medida', 'proveedor', 'sucursales', 'turno_uso', 'activo'];
          break;
        }
        case 'proveedores': {
          const res = await ConfiguracionService.getProveedores();
          if (res.error) throw res.error;
          data = (res.data || []).map(p => ({
            id:               p.id,
            nombre:           p.nombre          || '',
            direccion:        p.direccion        || '',
            numero_contacto:  p.numero_contacto  || '',
            dias_abierto:     (p.dias_abierto || []).join(', '),
            estatus:          p.estatus          || 'Activo'
          }));
          columnas = ['id', 'nombre', 'direccion', 'numero_contacto', 'dias_abierto', 'estatus'];
          break;
        }
        case 'sucursales': {
          const res = await ConfiguracionService.getSucursales();
          if (res.error) throw res.error;
          data = (res.data || []).map(s => ({
            id:        s.id,
            nombre:    s.nombre    || '',
            direccion: s.direccion || '',
            horario:   s.horario   || '',
            estatus:   s.estatus   || 'Activo'
          }));
          columnas = ['id', 'nombre', 'direccion', 'horario', 'estatus'];
          break;
        }
        case 'categorias': {
          const res = await ConfiguracionService.getCategorias();
          if (res.error) throw res.error;
          data = (res.data || []).map(c => ({
            id:          c.id,
            nombre:      c.nombre      || '',
            descripcion: c.descripcion || '',
            estatus:     c.estatus     || 'activo'
          }));
          columnas = ['id', 'nombre', 'descripcion', 'estatus'];
          break;
        }
        case 'calendario': {
          const res = await ConfiguracionService.exportarAsignaciones();
          if (res.error) throw res.error;
          data = res.data || [];
          columnas = ['id', 'sucursal', 'proveedor', 'dias_permitidos'];
          break;
        }
        default:
          break;
      }

      if (data.length === 0) {
        toast('No hay registros que exportar', { icon: '📭' });
        return;
      }

      const csv = arrayToCSV(data, columnas);
      descargarArchivo(csv, `${tipoImportacion}_exportados.csv`);
      toast.success(`Se exportaron ${data.length} registros de ${plantilla.titulo}`);
    } catch (err) {
      console.error('Error al exportar:', err);
      toast.error('No se pudieron exportar los datos');
    } finally {
      setLoading(false);
    }
  };

  // ── 3. IMPORTAR ARCHIVO CSV ───────────────────────────────
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      setLoading(true);
      try {
        const text = evt.target.result;
        const rows = procesarArchivoCSV(text);
        let res = null;

        switch (tipoImportacion) {
          case 'productos':
            res = await ConfiguracionService.importarProductosMasivo(rows);
            break;
          case 'proveedores':
            res = await ConfiguracionService.importarProveedoresMasivo(rows);
            break;
          case 'sucursales':
            res = await ConfiguracionService.importarSucursalesMasivo(rows);
            break;
          case 'categorias':
            res = await ConfiguracionService.importarCategoriasMasivo(rows);
            break;
          case 'calendario':
            res = await ConfiguracionService.importarAsignacionesMasivo(rows);
            break;
          default:
            break;
        }

        if (res?.error) {
          toast.error(`Error en la importación:\n${res.error.message || 'Error desconocido'}`, { duration: 6000 });
        } else {
          toast.success(`¡Se procesaron exitosamente ${res?.data?.length || 0} registros de ${plantilla.titulo}!`);
          e.target.value = '';
        }
      } catch (err) {
        console.error('Error al procesar CSV:', err);
        toast.error(err.message || 'Error al leer el archivo. Asegúrate de que sea CSV válido.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ width: '100%', maxWidth: '100%', animation: 'slideUp 0.3s ease' }}>

      {/* --- ENCABEZADO --- */}
      <header style={{ marginBottom: 'var(--space-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <span className={styles.labelTop} style={{ display: 'block', marginBottom: '2px' }}>HERRAMIENTAS DE DATOS</span>
          <h1 className={styles.title} style={{ fontSize: '2rem', lineHeight: '1' }}>
            Importación<br />Masiva
          </h1>
        </div>
        <button
          onClick={onVolver}
          className={`${styles.btnBase} ${styles.btnSecondary}`}
          style={{ height: '38px', padding: '0 12px', fontSize: '0.8rem' }}
          disabled={loading}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>arrow_back</span>
          Volver
        </button>
      </header>

      {/* --- GRID DE CONFIGURACIÓN --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-md)' }}>

        {/* ── SECCIÓN 1: SELECCIÓN ── */}
        <section className={styles.card} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 className={styles.labelTop} style={{ color: 'var(--color-primary)', borderBottom: '1px solid var(--border-ghost)', paddingBottom: 'var(--space-sm)' }}>
            1. Selección de Catálogo
          </h3>

          <div>
            <label className={styles.labelTop}>Catálogo a Cargar</label>
            <select
              value={tipoImportacion}
              onChange={(e) => setTipoImportacion(e.target.value)}
              className={styles.selectEditorial}
              disabled={loading}
            >
              <option value="productos">Productos e Insumos</option>
              <option value="proveedores">Proveedores</option>
              <option value="sucursales">Sucursales</option>
              <option value="categorias">Categorías</option>
              <option value="calendario">Calendario Sucursal × Proveedor</option>
            </select>
          </div>

          <div style={{ backgroundColor: 'var(--color-surface-lowest)', padding: '12px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-ghost)' }}>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '0.825rem', color: 'var(--text-main)', fontWeight: 'bold' }}>
              Descripción:
            </h4>
            <p style={{ margin: 0, fontSize: '0.775rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              {plantilla.descripcion}
            </p>
          </div>

          {/* ── BOTONES DE DESCARGA ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            <button
              onClick={descargarPlantilla}
              disabled={loading}
              className={`${styles.btnBase} ${styles.btnSecondary}`}
              style={{ width: '100%', height: '38px', fontSize: '0.8rem' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>description</span>
              Descargar Plantilla Vacía
            </button>

            <button
              onClick={exportarDatosActuales}
              disabled={loading}
              className={`${styles.btnBase} ${styles.btnOutlined}`}
              style={{ width: '100%', height: '38px', fontSize: '0.8rem', borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>download</span>
              {loading ? 'Exportando...' : 'Exportar Datos Actuales'}
            </button>
          </div>

          <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-light)', lineHeight: '1.3', padding: '0 4px' }}>
            💡 <b>Flujo recomendado:</b> Exporta los datos actuales → modifica el CSV → re-importa para aplicar cambios.
            Los registros con <b>id</b> se actualizan; los que no tienen id se crean como nuevos.
          </p>
        </section>

        {/* ── SECCIÓN 2: PLANTILLA Y CARGA ── */}
        <section className={styles.card} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 className={styles.labelTop} style={{ color: 'var(--color-primary)', borderBottom: '1px solid var(--border-ghost)', paddingBottom: 'var(--space-sm)' }}>
            2. Encabezados y Carga
          </h3>

          <div>
            <label className={styles.labelTop}>Encabezados del CSV (Fila 1)</label>
            <div style={{
              backgroundColor: 'var(--color-surface-lowest)',
              border: '1px solid var(--border-ghost)',
              borderRadius: 'var(--radius-xl)',
              padding: '10px',
              fontSize: '0.725rem',
              color: 'var(--text-main)',
              fontFamily: 'monospace',
              whiteSpace: 'normal',
              wordBreak: 'break-all'
            }}>
              {plantilla.headers}
            </div>
          </div>

          <div style={{
            border: '2px dashed var(--border-ghost)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-md) 16px',
            textAlign: 'center',
            backgroundColor: 'var(--color-surface-lowest)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '2.8rem', color: 'var(--color-primary)' }}>
              cloud_upload
            </span>
            <div>
              <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', fontSize: '0.875rem' }}>
                Selecciona tu archivo de {plantilla.titulo}
              </p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Solo se admiten archivos .csv
              </p>
            </div>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={loading}
              style={{ display: 'none' }}
              id="global-csv-import"
            />
            <label
              htmlFor="global-csv-import"
              className={`${styles.btnBase} ${styles.btnPrimary}`}
              style={{ cursor: loading ? 'default' : 'pointer', height: '38px', padding: '0 16px', marginTop: '4px' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>attach_file</span>
              {loading ? 'Procesando datos...' : 'Elegir archivo CSV'}
            </label>
          </div>
        </section>
      </div>
    </div>
  );
}