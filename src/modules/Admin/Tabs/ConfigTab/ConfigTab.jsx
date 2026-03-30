import React, { useState } from 'react';
import s from "../../../../assets/styles/EstilosGenerales.module.css";
import { useConfigTab } from './useConfigTab';
import { hasPermission } from '../../../../utils/checkPermiso';

// Importación de las sub-vistas
import { UnidadesView } from './UnidadesView';
import { CategoriasView } from './CategoriasView';
import { MotivosView } from './MotivosView';
import { ZonasMesasView } from './ZonasMesasView';

export const ConfigTab = () => {
  const [subTab, setSubTab] = useState('unidades');

  const {
    loading,
    unidades,
    catMenu,
    catInsumos,
    motivosInventario,
    
    // 🚀 NUEVOS DATOS: TIPOS DE DESCUENTO
    tiposDescuento,
    tdNombre, setTdNombre,
    tdTipoCalculo, setTdTipoCalculo,
    tdValorDefecto, setTdValorDefecto,
    tdRequiereAuth, setTdRequiereAuth,
    tdEditId, setTdEditId,
    handleSubmitTipoDescuento,

    // ESTADOS DE ZONAS Y MESAS
    zonas,
    
    uNombre, setUNombre,
    uAbrev, setUAbrev,
    uEditId, setUEditId,
    cMenuNombre, setCMenuNombre,
    cMenuColor, setCMenuColor,
    cMenuEditId, setCMenuEditId,
    cInsumoNombre, setCInsumoNombre,
    cInsumoEditId, setCInsumoEditId,
    mNombre, setMNombre,
    mTipo, setMTipo,
    mEditId, setMEditId,
    
    // SETTERS Y HANDLERS DE ZONAS/MESAS
    zEditId, setZEditId, zFormData, setZFormData, handleSubmitZona, resetZona,
    mesaEditId, setMesaEditId, mesaFormData, setMesaFormData, handleSubmitMesa, resetMesa,
    handleSavePlano,

    handleSubmitUnidad,
    handleSubmitCatMenu,
    handleSubmitCatInsumo,
    handleSubmitMotivo,
    handleDelete, 
    // 🛡️ Facultades importadas del hook
    puedeVerConfig,
    puedeCrearU, puedeEditarU,
    puedeCrearC, puedeEditarC,
    puedeCrearM, puedeEditarM,
    puedeBorrarConfig 
  } = useConfigTab(subTab);

  const handleTabChange = (newTab) => {
    setSubTab(newTab);
    // Reset Unidades
    setUEditId(null); setUNombre(''); setUAbrev('');
    
    // 🚀 Reset Descuentos
    setTdEditId(null); setTdNombre(''); setTdTipoCalculo('libre'); 
    setTdValorDefecto(0); setTdRequiereAuth(false);

    // Reset Categorías
    setCMenuEditId(null); setCMenuNombre(''); setCMenuColor('#005696');
    setCInsumoEditId(null); setCInsumoNombre('');
    
    // Reset Motivos
    setMEditId(null); setMNombre(''); setMTipo('ENTRADA');
    
    // Reset Zonas/Mesas
    resetZona();
    resetMesa();
  };

  const mostrarFormularioU = puedeCrearU || uEditId;
  const mostrarFormularioCMenu = puedeCrearC || cMenuEditId;
  const mostrarFormularioCInsumo = puedeCrearC || cInsumoEditId;
  const mostrarFormularioM = puedeCrearM || mEditId;
  const mostrarFormularioZ = puedeVerConfig; 

  if (loading && !zonas.length) return <div className={s.tabContent}><p>Cargando configuración...</p></div>;

  return (
    <div className={s.tabWrapper}>
      {/* SECCIÓN CABECERA */}
      <div className={s.pageHeader}>
        <h2 className={s.pageTitle}>Configuración del Sistema</h2>
      </div>

      {/* Navegación de Sub-pestañas */}
      <nav className={s.tabNav}>
        {hasPermission('ver_unidades') && (
          <button
            className={`${s.tabButton} ${subTab === 'unidades' ? s.activeTabButton : ''}`}
            onClick={() => handleTabChange('unidades')}
          >
            Unidades y Descuentos
          </button>
        )}
        {hasPermission('ver_categorias') && (
          <button
            className={`${s.tabButton} ${subTab === 'categorias' ? s.activeTabButton : ''}`}
            onClick={() => handleTabChange('categorias')}
          >
            Categorías
          </button>
        )}
        {hasPermission('ver_configuracion') && (
          <button
            className={`${s.tabButton} ${subTab === 'motivos' ? s.activeTabButton : ''}`}
            onClick={() => handleTabChange('motivos')}
          >
            Motivos Inventario
          </button>
        )}
        {hasPermission('ver_configuracion') && (
          <button
            className={`${s.tabButton} ${subTab === 'zonas' ? s.activeTabButton : ''}`}
            onClick={() => handleTabChange('zonas')}
          >
            Zonas y Mesas
          </button>
        )}
      </nav>

      {/* --- SECCIÓN UNIDADES Y DESCUENTOS --- */}
      {subTab === 'unidades' && hasPermission('ver_unidades') && (
        <UnidadesView 
          s={s}
          // Props Unidades
          unidades={unidades}
          uEditId={uEditId}
          setUEditId={setUEditId}
          uNombre={uNombre}
          setUNombre={setUNombre}
          uAbrev={uAbrev}
          setUAbrev={setUAbrev}
          handleSubmitUnidad={handleSubmitUnidad}
          
          // 🚀 Props Descuentos
          tiposDescuento={tiposDescuento}
          tdEditId={tdEditId}
          setTdEditId={setTdEditId}
          tdNombre={tdNombre}
          setTdNombre={setTdNombre}
          tdTipoCalculo={tdTipoCalculo}
          setTdTipoCalculo={setTdTipoCalculo}
          tdValorDefecto={tdValorDefecto}
          setTdValorDefecto={setTdValorDefecto}
          tdRequiereAuth={tdRequiereAuth}
          setTdRequiereAuth={setTdRequiereAuth}
          handleSubmitTipoDescuento={handleSubmitTipoDescuento}

          // Comunes
          handleDelete={handleDelete}
          puedeCrearU={puedeCrearU}
          puedeEditarU={puedeEditarU}
          puedeBorrarConfig={puedeBorrarConfig}
          mostrarFormularioU={mostrarFormularioU}
        />
      )}

      {/* --- SECCIÓN CATEGORÍAS --- */}
      {subTab === 'categorias' && hasPermission('ver_categorias') && (
        <CategoriasView 
          s={s}
          catMenu={catMenu}
          catInsumos={catInsumos}
          cMenuEditId={cMenuEditId}
          setCMenuEditId={setCMenuEditId}
          cMenuNombre={cMenuNombre}
          setCMenuNombre={setCMenuNombre}
          cMenuColor={cMenuColor}
          setCMenuColor={setCMenuColor}
          cInsumoEditId={cInsumoEditId}
          setCInsumoEditId={setCInsumoEditId}
          cInsumoNombre={cInsumoNombre}
          setCInsumoNombre={setCInsumoNombre}
          handleSubmitCatMenu={handleSubmitCatMenu}
          handleSubmitCatInsumo={handleSubmitCatInsumo}
          handleDelete={handleDelete}
          puedeCrearC={puedeCrearC}
          puedeEditarC={puedeEditarC}
          puedeBorrarConfig={puedeBorrarConfig}
          mostrarFormularioCMenu={mostrarFormularioCMenu}
          mostrarFormularioCInsumo={mostrarFormularioCInsumo}
        />
      )}

      {/* --- SECCIÓN MOTIVOS INVENTARIO --- */}
      {subTab === 'motivos' && hasPermission('ver_configuracion') && (
        <MotivosView 
          s={s}
          motivosInventario={motivosInventario}
          mEditId={mEditId}
          setMEditId={setMEditId}
          mNombre={mNombre}
          setMNombre={setMNombre}
          mTipo={mTipo}
          setMTipo={setMTipo}
          handleSubmitMotivo={handleSubmitMotivo}
          handleDelete={handleDelete}
          puedeCrearM={puedeCrearM}
          puedeEditarM={puedeEditarM}
          puedeBorrarConfig={puedeBorrarConfig}
          mostrarFormularioM={mostrarFormularioM}
        />
      )}

      {/* --- SECCIÓN ZONAS Y MESAS --- */}
      {subTab === 'zonas' && hasPermission('ver_configuracion') && (
        <ZonasMesasView 
          zonas={zonas}
          zEditId={zEditId} 
          setZEditId={setZEditId} 
          zFormData={zFormData} 
          setZFormData={setZFormData} 
          handleSubmitZona={handleSubmitZona} 
          resetZona={resetZona}
          mesaEditId={mesaEditId} 
          setMesaEditId={setMesaEditId} 
          mesaFormData={mesaFormData} 
          setMesaFormData={setMesaFormData} 
          handleSubmitMesa={handleSubmitMesa} 
          resetMesa={resetMesa}
          handleSavePlano={handleSavePlano}
          handleDelete={handleDelete}
          puedeCrearM={puedeCrearM} 
          puedeEditarM={puedeEditarM} 
          puedeBorrarConfig={puedeBorrarConfig} 
          mostrarFormularioZ={mostrarFormularioZ}
        />
      )}
    </div>
  );
};

export default ConfigTab;