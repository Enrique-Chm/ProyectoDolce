// src/modules/Admin/Tabs/Historial/Historial.jsx
import React, { useEffect, useState } from 'react';
import styles from '../../../../assets/styles/EstilosGenerales.module.css';
import { useHistorial } from './2useHistorial';
import { AuthService } from '../../../Auth/Auth.service';

export default function Historial({ onVerDetalle }) {
  const { loading, ordenesHistorial, cargarHistorial, buscarFolio } = useHistorial();
  const [busqueda, setBusqueda] = useState('');
  
  // Obtenemos la sesión para validar permisos
  const sesion = AuthService.getSesion();
  const esAdmin = sesion?.permisos?.configuracion?.leer || false;

  // Sincronizamos con la base de datos al montar
  useEffect(() => {
    cargarHistorial();
  }, [cargarHistorial]);

  // Manejador del buscador con actualización de estado y llamada al hook
  const handleSearch = (e) => {
    const valor = e.target.value;
    setBusqueda(valor);
    buscarFolio(valor);
  };

  // Formateador de fechas localizado
  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return 'N/A';
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Formateador de moneda MXN
  const formatearDinero = (monto) => {
    return new Intl.NumberFormat('es-MX', { 
      style: 'currency', 
      currency: 'MXN' 
    }).format(monto || 0);
  };

  return (
    <div className={styles.fadeIN}>
      {/* --- ENCABEZADO --- */}
      <header style={{ marginBottom: 'var(--space-lg)' }}>
        <span className={styles.labelTop} style={{ display: 'block', marginBottom: '4px' }}>
          {esAdmin ? 'AUDITORÍA GLOBAL' : `REGISTROS ${sesion?.sucursal_nombre || ''}`}
        </span>
        <h1 className={styles.title} style={{ fontSize: '2.8rem', lineHeight: '1', marginBottom: 'var(--space-md)' }}>
          Órdenes<br />Finalizadas
        </h1>

        {/* BUSCADOR EDITORIAL */}
        <div style={{ position: 'relative', marginTop: 'var(--space-md)' }}>
          <span 
            className="material-symbols-outlined" 
            style={{ 
              position: 'absolute', 
              left: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }}
          >
            search
          </span>
          <input 
            type="text"
            placeholder="Buscar por folio o proveedor..."
            value={busqueda}
            onChange={handleSearch}
            className={styles.inputEditorial}
            style={{ paddingLeft: '45px', fontSize: '1rem' }}
          />
        </div>
      </header>

      {/* --- LISTADO DE ÓRDENES --- */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '100px' }}>
        {loading && ordenesHistorial.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p className={styles.labelTop} style={{ animation: 'pulse 1.5s infinite' }}>
                Consultando el archivo digital...
            </p>
          </div>
        ) : ordenesHistorial.length > 0 ? (
          ordenesHistorial.map((orden) => (
            <div 
              key={orden.id} 
              className={styles.card}
              onClick={() => onVerDetalle(orden.id)}
              style={{ 
                cursor: 'pointer',
                borderLeft: orden.estatus === 'Completado' 
                  ? '6px solid var(--color-primary)' 
                  : '6px solid #ba1a1a',
                backgroundColor: 'white',
                transition: 'transform 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <span className={styles.labelTop} style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>
                    FOLIO: {orden.folio || 'S/F'}
                  </span>
                  <h3 className={styles.subtitle} style={{ fontSize: '1.25rem', margin: '4px 0' }}>
                    {orden.proveedor?.nombre || 'Proveedor Desconocido'}
                  </h3>
                </div>
                
                {/* Badge de Estatus Estilizado */}
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: '800',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  textTransform: 'uppercase',
                  backgroundColor: orden.estatus === 'Completado' ? 'var(--color-primary-container)' : '#ffebee',
                  color: orden.estatus === 'Completado' ? 'var(--color-on-primary-container)' : '#ba1a1a',
                  border: `1px solid ${orden.estatus === 'Completado' ? 'var(--color-primary)' : '#ffcdd2'}`
                }}>
                  {orden.estatus}
                </span>
              </div>

              {/* Información de Contexto */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>storefront</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>{orden.sucursal?.nombre || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>event_note</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>{formatearFecha(orden.created_at)}</span>
                </div>
              </div>

              {/* Footer de la Tarjeta */}
              <div style={{ 
                marginTop: '12px', 
                paddingTop: '12px', 
                borderTop: '1px solid var(--border-ghost)', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>person</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {orden.solicitante?.nombre_completo || 'Sistema'}
                    </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <span style={{ display: 'block', fontSize: '0.6rem', color: 'var(--text-light)', fontWeight: 'bold' }}>VALOR TOTAL</span>
                    <span style={{ fontWeight: '900', color: 'var(--color-primary)', fontSize: '1.1rem' }}>
                      {formatearDinero(orden.total_estimado)}
                    </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ 
              textAlign: 'center', 
              padding: '5rem 1rem', 
              backgroundColor: 'var(--color-surface-lowest)',
              borderRadius: '24px',
              border: '2px dashed var(--border-ghost)'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '4rem', color: 'var(--border-ghost)', marginBottom: '1rem' }}>
              folder_open
            </span>
            <h2 className={styles.subtitle} style={{ color: 'var(--text-muted)' }}>Sin coincidencias</h2>
            <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
              No se encontraron registros que coincidan con "{busqueda}".
            </p>
          </div>
        )}
      </section>
    </div>
  );
}