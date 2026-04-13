// src/modules/Admin/Tabs/Configuracion/Configuracion.jsx
import React, { useEffect } from 'react';
import styles from '../../../../assets/styles/EstilosGenerales.module.css';
import { useConfiguracion } from './2useConfiguracion';

export default function Configuracion({ 
  onAbrirProductos, 
  onAbrirProveedores, 
  onAbrirTrabajadores,
  onAbrirSucursales // <-- Nueva prop para navegación
}) {
  // Extraemos la lógica y el estado de nuestro Custom Hook
  const { 
    loading, 
    sucursales, proveedores, trabajadores, 
    cargarSucursales, cargarProveedores, cargarTrabajadores 
  } = useConfiguracion();

  // Cargamos todos los catálogos al montar la pantalla para mostrar métricas reales
  useEffect(() => {
    cargarSucursales();
    cargarProveedores();
    cargarTrabajadores();
  }, [cargarSucursales, cargarProveedores, cargarTrabajadores]);

  return (
    <div className={styles.fadeIN}>
      {/* --- ENCABEZADO --- */}
      <header style={{ marginBottom: 'var(--space-lg)' }}>
        <span className={styles.labelTop} style={{ display: 'block', marginBottom: 'var(--space-xs)' }}>
          AJUSTES DEL SISTEMA
        </span>
        <h1 className={styles.title}>Configuración</h1>
      </header>

      {/* --- TARJETA: PERFIL DEL NEGOCIO --- */}
      <section className={styles.card} style={{ marginBottom: 'var(--space-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '1.5rem' }}>storefront</span>
          <h2 className={styles.subtitle} style={{ fontSize: '1.25rem' }}>Perfil del Negocio</h2>
        </div>
        
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '16px' }}>
          {loading 
            ? "Sincronizando datos..." 
            : `Gestionando ${sucursales.length} sucursal(es) activa(s).`
          }
        </p>

        {/* BOTÓN CONECTADO A SUCURSALES */}
        <button 
          onClick={onAbrirSucursales}
          className={`${styles.btnBase} ${styles.btnSecondary}`} 
          style={{ width: 'fit-content' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>edit</span>
          Editar Sucursales
        </button>
      </section>

      {/* --- TARJETA: CATÁLOGOS BASE --- */}
      <section className={styles.card} style={{ marginBottom: 'var(--space-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--text-main)', fontSize: '1.5rem' }}>folder_managed</span>
          <h2 className={styles.subtitle} style={{ fontSize: '1.25rem' }}>Catálogos del Sistema</h2>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '16px' }}>
          {loading 
            ? "Cargando métricas..." 
            : `Actualmente cuentas con ${proveedores.length} proveedores y ${trabajadores.length} trabajadores registrados.`
          }
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {/* BOTÓN: PRODUCTOS */}
          <button onClick={onAbrirProductos} className={`${styles.btnBase} ${styles.btnPrimary}`}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>inventory</span>
            Productos
          </button>
          
          {/* BOTÓN: PROVEEDORES */}
          <button onClick={onAbrirProveedores} className={`${styles.btnBase} ${styles.btnOutlined}`}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>local_shipping</span>
            Proveedores
          </button>

          {/* BOTÓN: TRABAJADORES */}
          <button onClick={onAbrirTrabajadores} className={`${styles.btnBase} ${styles.btnOutlined}`}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>badge</span>
            Trabajadores
          </button>
        </div>
      </section>

      {/* --- TARJETA: SEGURIDAD Y CUENTA --- */}
      <section className={styles.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--color-tertiary)', fontSize: '1.5rem' }}>shield_person</span>
          <h2 className={styles.subtitle} style={{ fontSize: '1.25rem' }}>Cuenta y Seguridad</h2>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '4px', marginBottom: '16px', alignItems: 'center' }}>
           <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--color-on-primary-fixed)', backgroundColor: 'var(--color-primary-fixed)', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
             Administrador
           </span>
           <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
             Sesión activa
           </p>
        </div>

        <button className={`${styles.btnBase} ${styles.btnDanger}`} style={{ width: 'fit-content' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>logout</span>
          Cerrar Sesión
        </button>
      </section>
    </div>
  );
}