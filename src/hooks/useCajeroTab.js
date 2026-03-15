import { useState, useEffect, useCallback } from 'react';
import { CajaService } from '../services/Caja.service';
import Swal from 'sweetalert2';

export const useCajeroTab = (usuarioId) => {
    const [loading, setLoading] = useState(true);
    const [sesionActiva, setSesionActiva] = useState(null);
    const [movimientos, setMovimientos] = useState([]);
    const [historial, setHistorial] = useState([]);
    const [motivosCatalogo, setMotivosCatalogo] = useState([]);
    const [tiposDisponibles, setTiposDisponibles] = useState([]); 

    /**
     * Sincronización global de datos de caja
     */
    const cargarDatosCaja = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Cargar catálogo de motivos desde cat_motivos_inventario
            const { data: catData } = await CajaService.getMotivosInventario();
            setMotivosCatalogo(catData || []);

            // Extraer tipos únicos para alimentar el primer select
            if (catData) {
                const tiposUnicos = [...new Set(catData.map(item => item.tipo))];
                setTiposDisponibles(tiposUnicos);
            }

            // 2. Obtener sesión activa
            const { data: sesion } = await CajaService.getSesionActiva(usuarioId);
            setSesionActiva(sesion);

            if (sesion) {
                // 3. Cargar movimientos del turno actual
                const { data: movs } = await CajaService.getMovimientosSesion(sesion.id);
                setMovimientos(movs || []);
            }

            // 4. Cargar historial de sesiones cerradas
            const { data: hist } = await CajaService.getHistorialSesiones();
            setHistorial(hist || []);

        } catch (error) {
            console.error("Error en sincronización de caja:", error);
        } finally {
            setLoading(false);
        }
    }, [usuarioId]);

    useEffect(() => {
        cargarDatosCaja();
    }, [cargarDatosCaja]);

    /**
     * Filtra los motivos del catálogo según el tipo
     */
    const getMotivosPorTipo = (tipo) => {
        return motivosCatalogo.filter(m => m.tipo === tipo);
    };

    /**
     * Abre un nuevo turno
     */
    const abrirTurno = async (monto) => {
        const montoNum = parseFloat(monto);
        if (isNaN(montoNum) || montoNum < 0) {
            return Swal.fire('Error', 'Ingresa un monto de apertura válido', 'error');
        }

        const { data, error } = await CajaService.abrirCaja({
            usuario_id: usuarioId,
            monto_apertura: montoNum
        });

        if (error) {
            Swal.fire('Error', 'No se pudo abrir la caja', 'error');
        } else {
            setSesionActiva(data);
            await cargarDatosCaja();
            Swal.fire('Éxito', 'Turno iniciado', 'success');
        }
    };

    /**
     * Registra movimiento usando los datos del catálogo
     */
    const registrarMovimientoEfectivo = async (tipo, monto, motivoNombre) => {
        if (!sesionActiva) return;

        const montoNum = parseFloat(monto);
        if (isNaN(montoNum) || montoNum <= 0 || !motivoNombre) {
            return Swal.fire('Error', 'Monto y motivo son obligatorios', 'error');
        }

        const { error } = await CajaService.registrarMovimiento({
            turno_id: sesionActiva.id,
            usuario_id: usuarioId,
            tipo: tipo, 
            monto: montoNum,
            motivo: motivoNombre 
        });

        if (error) {
            console.error("Error al registrar movimiento:", error);
            Swal.fire('Error', 'No se pudo guardar el movimiento. Verifique la conexión.', 'error');
        } else {
            await cargarDatosCaja();
            Swal.fire('Registrado', 'Movimiento guardado con éxito', 'success');
        }
    };

    /**
     * Arqueo y cierre de caja
     * ACTUALIZADO: Usa monto_cierre_real y monto_cierre_esperado para coincidir con la DB
     */
    const cerrarTurno = async (montoCierre) => {
        const montoCierreNum = parseFloat(montoCierre);
        if (isNaN(montoCierreNum)) {
            return Swal.fire('Error', 'Ingresa el monto físico contado', 'error');
        }

        const { totalVentas } = await CajaService.getTotalesEfectivoSesion(sesionActiva.id);
        const ingresos = movimientos.filter(m => m.tipo === 'ingreso').reduce((a, b) => a + b.monto, 0);
        const egresos = movimientos.filter(m => m.tipo === 'egreso').reduce((a, b) => a + b.monto, 0);
        
        const montoEsperado = sesionActiva.monto_apertura + totalVentas + ingresos - egresos;
        const diferencia = montoCierreNum - montoEsperado;

        const confirm = await Swal.fire({
            title: '¿Confirmar Arqueo?',
            html: `
                <div style="text-align: left;">
                    <p>Monto Esperado: <b>$${montoEsperado.toFixed(2)}</b></p>
                    <p>Diferencia: <b style="color: ${diferencia < 0 ? '#ef4444' : '#10b981'}">$${diferencia.toFixed(2)}</b></p>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Cerrar Turno'
        });

        if (confirm.isConfirmed) {
            // Enviamos los datos mapeados a las columnas reales de tu tabla
            const { error } = await CajaService.cerrarCaja(sesionActiva.id, {
                monto_cierre_real: montoCierreNum,
                monto_cierre_esperado: montoEsperado,
                diferencia: diferencia
            });

            if (error) {
                console.error("Error al cerrar turno:", error);
                Swal.fire('Error', 'No se pudo procesar el cierre en la base de datos.', 'error');
            } else {
                setSesionActiva(null);
                await cargarDatosCaja();
                Swal.fire('Cerrado', 'La caja ha sido cerrada correctamente', 'success');
            }
        }
    };

    return {
        loading,
        sesionActiva,
        movimientos,
        historial,
        motivosCatalogo,
        tiposDisponibles,
        getMotivosPorTipo, 
        abrirTurno,
        cerrarTurno,
        registrarMovimientoEfectivo,
        refrescarTodo: cargarDatosCaja
    };
};