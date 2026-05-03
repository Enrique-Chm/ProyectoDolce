// src/modules/Admin/Tabs/Configuracion/ImportadorMasivo.jsx
import React, { useState } from 'react';
import styles from '../../../../assets/styles/EstilosGenerales.module.css';
import { ConfiguracionService } from './1Configuracion.Service';
import toast from 'react-hot-toast';

export default function ImportadorMasivo({ onVolver }) {
  const [tipoImportacion, setTipoImportacion] = useState('productos');
  const [loading, setLoading] = useState(false);

  // Definición de las plantillas exactas para orientar al usuario
  const plantillas = {
    productos: {
      titulo: 'Productos e Insumos',
      headers: 'nombre,marca,modelo,categoria,presentacion,contenido,unidad_medida,costo_actual,proveedor,proveedor_secundario,sucursales,activo',
      descripcion: 'Carga masiva de insumos. Recuerda que las categorías, unidades de medida y proveedores deben estar previamente creados en el sistema para que se vinculen correctamente.'
    },
    proveedores: {
      titulo: 'Proveedores',
      headers: 'nombre,direccion,numero_contacto,dias_abierto,activo',
      descripcion: 'Carga masiva de empresas que suministran insumos para tu negocio.'
    },
    sucursales: {
      titulo: 'Sucursales',
      headers: 'nombre,direccion,telefono,activo',
      descripcion: 'Carga masiva de puntos de venta y ubicaciones físicas del negocio.'
    },
    categorias: {
      titulo: 'Categorías',
      headers: 'nombre,activo',
      descripcion: 'Carga masiva de familias o categorías de insumos (ej: Barra, Cocina, Limpieza).'
    }
  };

  // Parseador de CSV seguro que respeta las comas dentro de comillas
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
          // Removemos comillas dobles si el valor las tiene al inicio y al final
          if (val.startsWith('"') && val.endsWith('"')) {
            val = val.substring(1, val.length - 1).trim();
          }
          values.push(val);
          start = i + 1;
        }
      }

      // Añadimos el último valor de la línea
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

        // Enrutamos al servicio de configuración para todas las opciones
        if (tipoImportacion === 'productos') {
          res = await ConfiguracionService.importarProductosMasivo(rows);
        } else if (tipoImportacion === 'proveedores') {
          res = await ConfiguracionService.importarProveedoresMasivo(rows);
        } else if (tipoImportacion === 'sucursales') {
          res = await ConfiguracionService.importarSucursalesMasivo(rows);
        } else if (tipoImportacion === 'categorias') {
          res = await ConfiguracionService.importarCategoriasMasivo(rows);
        }

        if (res?.error) {
          toast.error(`Error en la importación:\n${res.error.message || 'Error desconocido'}`, {
            duration: 6000
          });
        } else {
          toast.success(`¡Se han importado exitosamente ${res?.data?.length || 0} registros de ${tipoImportacion}!`);
          e.target.value = ''; // Limpiamos el input
        }
      } catch (err) {
        console.error("Error al procesar el archivo CSV:", err);
        toast.error(err.message || 'Error al leer el archivo. Asegúrate de que sea un formato CSV válido.');
      } finally {
        setLoading(false);
      }
    };

    reader.readAsText(file);
  };

  return (
    <div style={{ width: '100%', maxWidth: '100%', animation: 'slideUp 0.3s ease' }}>
      {/* --- ENCABEZADO INTERNO --- */}
      <header style={{ marginBottom: 'var(--space-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <span className={styles.labelTop} style={{ display: 'block', marginBottom: '2px' }}>Herramientas de datos</span>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        {/* PANEL IZQUIERDO: SELECCIÓN */}
        <section className={styles.card} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 className={styles.labelTop} style={{ color: 'var(--color-primary)', borderBottom: '1px solid var(--border-ghost)', paddingBottom: '8px' }}>
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
            </select>
          </div>

          <div style={{ backgroundColor: 'var(--color-surface-lowest)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-ghost)' }}>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '0.825rem', color: 'var(--text-main)', fontWeight: 'bold' }}>
              Descripción:
            </h4>
            <p style={{ margin: 0, fontSize: '0.775rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              {plantillas[tipoImportacion].descripcion}
            </p>
          </div>
        </section>

        {/* PANEL DERECHO: PLANTILLA Y SUBIDA */}
        <section className={styles.card} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 className={styles.labelTop} style={{ color: 'var(--color-primary)', borderBottom: '1px solid var(--border-ghost)', paddingBottom: '8px' }}>
            2. Plantilla y Carga
          </h3>

          <div>
            <label className={styles.labelTop}>Encabezados del CSV (Fila 1)</label>
            <div style={{
              backgroundColor: 'var(--color-surface-lowest)',
              border: '1px solid var(--border-ghost)',
              borderRadius: '10px',
              padding: '10px',
              fontSize: '0.725rem',
              color: 'var(--text-main)',
              fontFamily: 'monospace',
              whiteSpace: 'normal',
              wordBreak: 'break-all'
            }}>
              {plantillas[tipoImportacion].headers}
            </div>
          </div>

          {/* DRAG AND DROP / SUBIR FILE */}
          <div style={{
            border: '2px dashed var(--border-ghost)',
            borderRadius: '12px',
            padding: '24px 16px',
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
                Selecciona tu archivo de {plantillas[tipoImportacion].titulo}
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
              style={{ cursor: 'pointer', height: '38px', padding: '0 16px', marginTop: '4px' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>attach_file</span>
              {loading ? 'Subiendo datos...' : 'Elegir archivo'}
            </label>
          </div>
        </section>

      </div>
    </div>
  );
}