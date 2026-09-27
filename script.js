/* ==================================================
   PROYECTO: CAR WASH PRO ADMIN
   ARCHIVO: script.js
   ================================================== */

const STORAGE_KEY = 'car_wash_admin_data_v3_1';
const SCRIPT_VERSION = 'pistas-fix-20260908-0535';

/* ==================================================
   ALERTAS PERSONALIZADAS
   Reemplaza la alerta nativa del navegador por un modal
   visual consistente con el diseño de la aplicación.
   ================================================== */
function showAppAlert(message) {
    let modal = document.getElementById('appAlertModal');

    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'appAlertModal';
        modal.className = 'app-alert-overlay';
        modal.innerHTML = `
            <div class="app-alert-card" role="alertdialog" aria-modal="true">
                <div class="app-alert-icon"><i class="fa-solid fa-circle-exclamation"></i></div>
                <div class="app-alert-title">Atención</div>
                <div class="app-alert-message"></div>
                <button type="button" class="app-alert-button" onclick="closeAppAlert()">Entendido</button>
            </div>`;
        document.body.appendChild(modal);
    }

    const msg = modal.querySelector('.app-alert-message');
    if (msg) msg.textContent = String(message ?? '');
    modal.classList.add('open');
}

// Asegúrate de que esta función ESTÉ ANTES de la línea que la usa
function showAppAlert(mensaje) {
    const modal = document.getElementById('appAlertModal');
    if (modal) {
        modal.querySelector('.alert-mensaje').textContent = mensaje;
        modal.classList.add('open');
    }
}

function closeAppAlert() {
    document.getElementById('appAlertModal')?.classList.remove('open');
}

// Sobrescribimos el alert nativo CON SEGURIDAD
if (typeof showAppAlert === 'function') {
    window.alert = showAppAlert;
    console.log('✅ Alert personalizado cargado correctamente');
} else {
    console.warn('⚠️ showAppAlert no está definida aún');
}


/* ==================================================
   SELECTORES PERSONALIZADOS
   Evita el selector nativo de Android y mantiene un
   diseño uniforme en toda la aplicación.
   ================================================== */
function abrirSelectorPersonalizado(select) {
    if (!select || select.disabled || select.classList.contains('is-hidden')) return;

    const opciones = Array.from(select.options).filter(o => !o.disabled);
    if (!opciones.length) return;

    let overlay = document.getElementById('customSelectModal');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'customSelectModal';
        overlay.className = 'custom-select-overlay';
        document.body.appendChild(overlay);
    }

    const titulo = select.getAttribute('data-select-title') || 'Seleccionar opción';
    const valorActual = String(select.value || '');

    overlay.innerHTML = `
        <div class="custom-select-card" role="dialog" aria-modal="true">
            <div class="custom-select-header">
                <div class="custom-select-title">${escapeHtml(titulo)}</div>
                <button type="button" class="custom-select-close" aria-label="Cerrar">&times;</button>
            </div>
            <div class="custom-select-options">
                ${opciones.map((op, i) => `
                    <button type="button" class="custom-select-option ${String(op.value) === valorActual ? 'selected' : ''}" data-value="${escapeHtml(String(op.value))}">
                        <span>${escapeHtml(op.textContent || '')}</span>
                        <span class="custom-select-check">${String(op.value) === valorActual ? '<i class="fa-solid fa-check"></i>' : ''}</span>
                    </button>
                `).join('')}
            </div>
            <button type="button" class="custom-select-cancel">Cancelar</button>
        </div>`;

    overlay.classList.add('open');
    document.body.classList.add('custom-select-open');

    const cerrar = () => {
        overlay.classList.remove('open');
        document.body.classList.remove('custom-select-open');
    };

    overlay.querySelector('.custom-select-close')?.addEventListener('click', cerrar);
    overlay.querySelector('.custom-select-cancel')?.addEventListener('click', cerrar);

    overlay.querySelectorAll('.custom-select-option').forEach(btn => {
        btn.addEventListener('click', () => {
            select.value = btn.dataset.value ?? '';
            select.dispatchEvent(new Event('change', { bubbles: true }));
            select.dispatchEvent(new Event('input', { bubbles: true }));
            select.focus({ preventScroll: true });
            cerrar();
            clearFieldError(select);
        });
    });

    overlay.addEventListener('click', function onOverlayClick(ev) {
        if (ev.target === overlay) {
            cerrar();
            overlay.removeEventListener('click', onOverlayClick);
        }
    });
}

function inicializarSelectoresPersonalizados() {
    document.querySelectorAll('select').forEach(select => {
        if (select.dataset.customSelectReady === '1') return;

        select.dataset.customSelectReady = '1';

        select.setAttribute(
            'data-select-title',
            select.getAttribute('data-select-title') ||
            (
                select.id === 'recordPista' ? 'Seleccionar Pista' :
                select.id === 'recordTipoVehiculo' || select.id === 'expressTipoVehiculo' ? 'Tipo de Vehículo' :
                select.id === 'recordLavador' || select.id === 'expressLavador' || select.id === 'gastoLavador' ? 'Seleccionar Lavador' :
                select.id === 'expressTipoLavado' ? 'Tipo de Lavado' :
                select.id === 'gastoTipo' ? 'Destino de la salida' :
                'Seleccionar opción'
            )
        );

        /*
         * IMPORTANTE:
         * El select real queda solamente para guardar el valor.
         * No permitimos que Android reciba el toque directamente,
         * porque eso abre el selector nativo gris.
         */
        select.style.pointerEvents = 'none';

        const contenedor = select.parentElement;

        if (!contenedor) return;

        contenedor.style.cursor = 'pointer';
        contenedor.dataset.customSelectTrigger = '1';

        contenedor.addEventListener('click', function(ev) {
            if (select.disabled || select.classList.contains('is-hidden')) return;

            ev.preventDefault();
            ev.stopPropagation();

            abrirSelectorPersonalizado(select);
        });
    });
}

document.addEventListener('DOMContentLoaded', inicializarSelectoresPersonalizados);

/* ==================================================
   ERRORES DE CAMPO
   Lleva al usuario al campo exacto y muestra el mensaje
   debajo del mismo, sin alertas de pantalla completa.
   ================================================== */
function clearFieldError(field) {
    if (!field) return;
    field.classList.remove('field-error');
    const old = field.closest('.form-group, .gasto-destino-row, .relative-container')?.querySelector('.field-error-message[data-for="' + field.id + '"]');
    if (old) old.remove();
}

function showFieldError(field, message) {
    if (!field) return;

    clearFieldError(field);
    field.classList.add('field-error');

    const holder = field.closest('.form-group, .gasto-destino-row') || field.parentElement;
    if (!holder) return;

    const msg = document.createElement('div');
    msg.className = 'field-error-message';
    msg.dataset.for = field.id || '';
    msg.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${escapeHtml(message)}`;
    holder.appendChild(msg);

    field.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => field.focus({ preventScroll: true }), 220);
}


/* Captura validaciones nativas para mostrar el mismo mensaje compacto
   debajo del campo y llevar al usuario hasta él. */
document.addEventListener('invalid', function(ev) {
    const field = ev.target;
    if (!field || !field.id) return;

    ev.preventDefault();

    const mensajes = {
        recordPlaca: 'Placa obligatoria',
        recordLavador: 'Seleccione un Lavador',
        expressLavador: 'Seleccione un Lavador',
        gastoConcepto: 'Indique el motivo',
        gastoMonto: 'Indique un monto válido',
        ingresoConcepto: 'Indique el motivo',
        ingresoMonto: 'Indique un monto válido',
        newLavadorName: 'Ingrese el nombre del Lavador',
        newItemName: 'Ingrese el nombre del artículo',
        newItemStock: 'Indique el stock inicial',
        cajaInicialInput: 'Indique el monto inicial de Caja',
        clienteModalName: 'Ingrese el nombre del cliente'
    };

    showFieldError(field, mensajes[field.id] || 'Este campo es obligatorio');
}, true);

document.addEventListener('input', function(ev) {
    if (ev.target?.classList?.contains('field-error')) clearFieldError(ev.target);
});

document.addEventListener('change', function(ev) {
    if (ev.target?.classList?.contains('field-error')) clearFieldError(ev.target);
});

/* Matriz de tarifas estándar por tipo de vehículo y servicio */
const TARIFA_MATRIZ = {
    'SEDAN': {
        'Completo': 6.00,
        'Sencillo': 5.00,
        'Fuera': 4.00,
        'Interior': 4.00,
        'Motor': 10.00
    },

    'CAMIONETA_CHICA': {
        'Completo': 7.00,
        'Sencillo': 6.00,
        'Fuera': 4.00,
        'Interior': 4.00,
        'Motor': 10.00
    },

    'CAMIONETA_MEDIANA': {
        'Completo': 8.00,
        'Sencillo': 7.00,
        'Fuera': 5.00,
        'Interior': 4.00,
        'Motor': 10.00
    },

    'CAMIONETA_GRANDE': {
        'Completo': 9.00,
        'Sencillo': 8.00,
        'Fuera': 6.00,
        'Interior': 5.00,
        'Motor': 10.00
    },

    'PICKUP': {
        'Completo': 9.00,
        'Sencillo': 8.00,
        'Fuera': 6.00,
        'Interior': 5.00,
        'Motor': 10.00
    },

    'FORD_RANGER': {
        'Completo': 10.00,
        'Sencillo': 9.00,
        'Fuera': 7.00,
        'Interior': 5.00,
        'Motor': 10.00
    }
};


/* ==================================================
   SECCIÓN: MAPPING Y NORMALIZACIÓN DE COLORES CSS
   ================================================== */
function getCarColorClass(colorStr) {
    if (!colorStr) return 'badge-car-default';
    
    const c = colorStr.toString().toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    if (c.includes('negro') || c.includes('humo')) return 'badge-car-negro';
    if (c.includes('blanc') || c.includes('perla')) return 'badge-car-blanco';
    if (c.includes('gris') || c.includes('plata') || c.includes('silver')) return 'badge-car-gris';
    if (c.includes('moca') || c.includes('chocolate') || c.includes('cafe') || c.includes('marron')) return 'badge-car-chocolate';
    if (c.includes('crema') || c.includes('beige') || c.includes('champagne')) return 'badge-car-crema';
    if (c.includes('agua')) return 'badge-car-verde-agua';
    if (c.includes('verde')) return 'badge-car-verde';
    if (c.includes('celeste')) return 'badge-car-celeste';
    if (c.includes('azul') || c.includes('navy')) return 'badge-car-azul';
    if (c.includes('rosad') || c.includes('rosa') || c.includes('fucsia')) return 'badge-car-rosado';
    if (c.includes('rojo') || c.includes('vino') || c.includes('granate')) return 'badge-car-rojo';
    if (c.includes('amarill') || c.includes('dorad')) return 'badge-car-amarillo';
    if (c.includes('naranj')) return 'badge-car-naranja';
    if (c.includes('morad') || c.includes('violeta')) return 'badge-car-morado';

    return 'badge-car-default';
}

/* ==================================================
   SECCIÓN: CÁLCULOS Y REPARTO DE COMISIONES Y PROPINAS
   ================================================== */
function splitMonto(monto) {
    const m = parseFloat(monto) || 0;
    if (m === 0) return { lavador: 0, adminBruto: 0, subadmin: 0, adminNeto: 0 };

    let mitad = m / 2;
    let lavador = Math.ceil(mitad); // Redondeo a favor del lavador
    let adminBruto = m - lavador;

    let subadmin = adminBruto >= 1.00 ? 1.00 : adminBruto;
    let adminNeto = Math.max(0, adminBruto - subadmin);

    return {
        lavador: lavador,
        adminBruto: adminBruto,
        subadmin: subadmin,
        adminNeto: adminNeto
    };
}

function getMontoCobro(r) {
    const monto = Math.max(0, parseFloat(r?.monto) || 0);
    const descuento = Math.min(monto, Math.max(0, parseFloat(r?.descuento) || 0));
    const propina = Math.max(0, parseFloat(r?.propina) || 0);
    return Math.max(0, monto - descuento) + propina;
}

function calculateGlobalTotals() {
    const ganadoPorLavador = {}, propinasPorLavador = {}, totalLavadorConPropina = {}, autosPorLavador = {}, adminBrutoPorLavador = {};
    let totalLav = 0, totalProp = 0, totalAdminBruto = 0, totalSub = 0;
    
    if (Array.isArray(appData.lavadores)) {
        appData.lavadores.forEach(l => { 
            ganadoPorLavador[l] = 0; 
            propinasPorLavador[l] = 0;
            totalLavadorConPropina[l] = 0;
            autosPorLavador[l] = 0;
            adminBrutoPorLavador[l] = 0;
        });
    }

    const sumaBrutaPorLavador = {};
    appData.registros.forEach(r => {
        const lav = r.lavador || 'Sin Asignar';
        const montoAuto = parseFloat(r.monto) || 0;
        const propinaAuto = parseFloat(r.propina) || 0;
        
        if (montoAuto > 0 || propinaAuto > 0) {
            if (!sumaBrutaPorLavador[lav]) sumaBrutaPorLavador[lav] = 0;
            sumaBrutaPorLavador[lav] += montoAuto;

            if (!propinasPorLavador[lav]) propinasPorLavador[lav] = 0;
            propinasPorLavador[lav] += propinaAuto;

            if (!autosPorLavador[lav]) autosPorLavador[lav] = 0;
            autosPorLavador[lav]++;

            const split = splitMonto(montoAuto);
            totalSub += split.subadmin;
        }
    });

    Object.keys(sumaBrutaPorLavador).forEach(lav => {
        const totalBrutoLavador = sumaBrutaPorLavador[lav];
        let mitad = totalBrutoLavador / 2;
        let lavadorGanancia = Math.ceil(mitad); 
        let propinaLavador = propinasPorLavador[lav] || 0;
        let gerenciaBruta = totalBrutoLavador - lavadorGanancia;

        ganadoPorLavador[lav] = lavadorGanancia;
        totalLavadorConPropina[lav] = lavadorGanancia + propinaLavador;
        adminBrutoPorLavador[lav] = gerenciaBruta;

        totalLav += lavadorGanancia;
        totalProp += propinaLavador;
        totalAdminBruto += gerenciaBruta;
    });

    const yaPagado = typeof calcularPagosRealizados === 'function' ? calcularPagosRealizados() : {};
    const pendiente = {};
    
    Object.keys(totalLavadorConPropina).forEach(l => { 
        pendiente[l] = Math.max(0, totalLavadorConPropina[l] - (yaPagado[l] || 0)); 
    });

    return {
        ganadoPorLavador, 
        propinasPorLavador,
        totalLavadorConPropina,
        autosPorLavador, 
        yaPagado, 
        pendiente,
        totalLavadoresGanado: totalLav,
        totalPropinas: totalProp,
        totalLavadoresConPropinaSum: totalLav + totalProp,
        totalAdminBruto, 
        totalSubadminEarn: totalSub,
        totalAdminNetEarn: Math.max(0, totalAdminBruto - totalSub)
    };
}

function getDefaultData() {
    return {
        cajaBase: 0.00,
        lavadores: [], 
        clientes: [
            { id: 'cli_general', name: 'Cliente General', phone: '6000-0000', descuento: 0, vehiculos: [], frecuente: false, protegido: true }
        ],
        vehiculosRegistry: {},
        registros: [], 
        inventario: [
            { id: 'inv_1', name: 'Shampoo para Autos', stock: 5 },
            { id: 'inv_2', name: 'Silicona de Tablero', stock: 3 },
            { id: 'inv_3', name: 'Cera Líquida', stock: 2 },
            { id: 'inv_4', name: 'Paños Microfibra', stock: 12 }
        ],
        gastos: [],
        ingresosExtras: [],
        pagosLavadores: [],
        cajaCerrada: false 
    };
}

let appData = loadData();
let montoModificadoManual = false;

/* ==================================================
   SECCIÓN: CARGA Y GUARDADO DE DATOS
   ================================================== */
function loadData() {
    let stored = null;
    const VERSIONES_ANTERIORES = ['car_wash_admin_data_v3_1','car_wash_admin_data_v3_0','car_wash_admin_data_v2_0'];
    for (const clave of VERSIONES_ANTERIORES) {
        const datos = localStorage.getItem(clave);
        if (datos) { stored = datos; break; }
    }
    if (stored) {
        try {
            let data = JSON.parse(stored);
            if(!data.inventario) data.inventario = getDefaultData().inventario;
            if(!data.gastos) data.gastos = [];
            if(!data.ingresosExtras) data.ingresosExtras = [];
            if(!data.pagosLavadores) data.pagosLavadores = [];
            if(!data.vehiculosRegistry) data.vehiculosRegistry = {};
            if(data.cajaCerrada === undefined) data.cajaCerrada = false;
            data.cajaBase = parseFloat(data.cajaBase) || 0.00;
            if(!data.lavadores) data.lavadores = [];
            if(!data.clientes || data.clientes.length === 0) data.clientes = getDefaultData().clientes;
            if (!data.clientes.find(c => c.name === 'Cliente General')) {
                data.clientes.unshift({ id: 'cli_general', name: 'Cliente General', phone: '6000-0000', descuento: 0, vehiculos: [], frecuente: false, protegido: true });
            } else {
                const general = data.clientes.find(c => c.name === 'Cliente General');
                general.id = general.id || 'cli_general';
                general.descuento = parseFloat(general.descuento) || 0;
                general.vehiculos = Array.isArray(general.vehiculos) ? general.vehiculos : [];
                general.protegido = true;
            }

            data.clientes.forEach((c, i) => {
                c.id = c.id || ('cli_' + Date.now().toString(36) + '_' + i + '_' + Math.random().toString(36).slice(2, 7));
                c.name = (c.name || 'Cliente sin nombre').trim();
                c.phone = c.phone || '';
                c.descuento = Math.max(0, parseFloat(c.descuento) || 0);
                c.vehiculos = Array.isArray(c.vehiculos) ? c.vehiculos.map(p => String(p).trim().toUpperCase()).filter(Boolean) : [];
            });

            if (data.registros && data.registros.length > 0) {
                const historialTemporal = {};
                data.registros = data.registros.map(r => {
                    if (r.tipoRegistro === 'EXPRESS') {
                        return {
                            ...r,
                            id: r.id || 'rec_' + Math.random().toString(36).slice(2),
                            auto: (r.auto || r.placa || '').trim().toUpperCase(),
                            pista: r.pista === 'Fuera' ? 'Fuera' : (r.pista || ''),
                            estadoPago: r.estadoPago || 'PENDIENTE',
                            serviciosArray: r.serviciosArray || (r.servicio ? [r.servicio] : ['Completo']),
                            servicio: r.servicio || (r.serviciosArray ? r.serviciosArray.join(' + ') : 'Completo'),
                            monto: parseFloat(r.monto) || 0,
                            propina: parseFloat(r.propina) || 0,
                            descuento: Math.max(0, parseFloat(r.descuento) || 0),
                            clienteId: r.clienteId || '',
                            clienteNombre: r.clienteNombre || r.clienteName || '',
                            fecha: r.fecha || new Date().toLocaleDateString(),
                            timestamp: r.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        };
                    }

                    let placaClean = (r.auto || r.placa || 'SIN-PLACA').trim().toUpperCase();
                    let pistaClean = r.pista === 'Fuera' ? 'Fuera' : (r.pista || '');
                    const regLimpio = {
                        ...r,
                        id: r.id || 'rec_' + Math.random().toString(36).slice(2),
                        auto: placaClean,
                        pista: pistaClean,
                        estadoPago: r.estadoPago || 'PENDIENTE',
                        serviciosArray: r.serviciosArray || (r.servicio ? [r.servicio] : ['Completo']),
                        servicio: r.servicio || (r.serviciosArray ? r.serviciosArray.join(' + ') : 'Completo'),
                        monto: parseFloat(r.monto) || 0,
                        propina: parseFloat(r.propina) || 0,
                        descuento: Math.max(0, parseFloat(r.descuento) || 0),
                        clienteId: r.clienteId || '',
                        clienteNombre: r.clienteNombre || r.clienteName || '',
                        fecha: r.fecha || new Date().toLocaleDateString(),
                        timestamp: r.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    };
                    if (!historialTemporal[placaClean]) historialTemporal[placaClean] = [];
                    historialTemporal[placaClean].push({
                        id: regLimpio.id, fecha: regLimpio.fecha, timestamp: regLimpio.timestamp,
                        servicio: regLimpio.servicio, serviciosArray: regLimpio.serviciosArray,
                        monto: regLimpio.monto, propina: regLimpio.propina, lavador: regLimpio.lavador, pista: regLimpio.pista,
                        formaPago: regLimpio.formaPago, estadoPago: regLimpio.estadoPago
                    });
                    if (!data.vehiculosRegistry[placaClean]) {
                        data.vehiculosRegistry[placaClean] = {
                            placa: placaClean, marca: r.marca || '', modelo: r.modelo || '',
                            color: r.color || '', tipoVehiculo: r.tipoVehiculo || 'SEDAN',
                            propietario: r.clienteName || r.propietario || 'Cliente General', telefono: r.telefono || '6000-0000',
                            frecuente: r.frecuente || false, observaciones: r.observaciones || '',
                            historialVisitas: []
                        };
                    }
                    return regLimpio;
                });
                Object.keys(historialTemporal).forEach(placa => {
                    if (data.vehiculosRegistry[placa]) {
                        data.vehiculosRegistry[placa].historialVisitas = historialTemporal[placa]
                            .sort((a,b) => new Date(a.fecha + ' ' + a.timestamp) - new Date(b.fecha + ' ' + b.timestamp));
                    }
                });
            }
            // Vincula de forma segura datos antiguos con clientes por nombre/propietario,
            // sin crear descuentos retroactivos ni modificar la matemática histórica.
            data.clientes.forEach(cliente => {
                normalizarClienteVehiculos(cliente);
                Object.values(data.vehiculosRegistry).forEach(v => {
                    if ((v.propietario || '').trim().toLowerCase() === (cliente.name || '').trim().toLowerCase()) {
                        guardarAsociacionVehiculo(cliente, v.placa);
                    }
                });
            });
            data.registros.forEach(r => {
                if (!r.clienteId && r.clienteName) {
                    const cliente = data.clientes.find(c => (c.name || '').trim().toLowerCase() === String(r.clienteName).trim().toLowerCase());
                    if (cliente) { r.clienteId = cliente.id; r.clienteNombre = cliente.name; }
                }
            });

            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            return data;
        } catch(e) { console.error("Error al cargar datos:", e); }
    }
    return getDefaultData();
}

/* ==================================================
   SECCIÓN: SINCRONIZACIÓN INICIAL CON SUPABASE
   ================================================== */

// Carga los datos del usuario desde Supabase.
// Si el usuario todavía no tiene datos en la nube,
// utiliza los datos locales actuales como primera copia.
async function sincronizarDatosInicialesSupabase() {
    try {
        const { data: sesionData, error: sesionError } =
            await supabaseClient.auth.getSession();

        if (sesionError) {
            console.error('Error al obtener sesión para sincronizar:', sesionError);
            return;
        }

        const usuario = sesionData?.session?.user;

        if (!usuario) {
            console.log('Sin sesión: no se sincronizan datos.');
            return;
        }

        console.log('Buscando datos en Supabase para:', usuario.id);

        const { data, error } = await supabaseClient
            .from('app_data')
            .select('data, schema_version')
            .eq('user_id', usuario.id)
            .maybeSingle();

        if (error) {
            console.error('Error al buscar datos en Supabase:', error);
            return;
        }

        // Si ya existen datos en la nube, estos son la fuente principal.
        if (data) {
            if (data.data && typeof data.data === 'object') {
                appData = data.data;

                // Guardamos también una copia local actualizada.
                localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify(appData)
                );

                console.log('✅ Datos cargados desde Supabase.');
                updateUI();
                actualizarDisplayCajaBase();
            }

            return;
        }

        // Si no existe registro en la nube, creamos la primera copia.
        console.log('No existen datos en Supabase. Creando copia inicial...');

        const { error: insertError } = await supabaseClient
            .from('app_data')
            .insert({
                user_id: usuario.id,
                data: appData,
                schema_version: 1
            });

        if (insertError) {
            console.error('Error al crear datos iniciales en Supabase:', insertError);
            return;
        }

        console.log('✅ Datos locales guardados por primera vez en Supabase.');

    } catch (error) {
        console.error('Error inesperado en sincronización inicial:', error);
    }
}

function getClienteById(id) {
    if (!id) return null;
    return appData.clientes.find(c => c.id === id) || null;
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;',"\"":'&quot;'}[ch]));
}

function normalizarClienteVehiculos(cliente) {
    cliente.vehiculos = Array.isArray(cliente.vehiculos)
        ? cliente.vehiculos.map(p => String(p).trim().toUpperCase()).filter(Boolean)
        : [];
    cliente.vehiculos = [...new Set(cliente.vehiculos)];
}

function guardarAsociacionVehiculo(cliente, placa) {
    const p = String(placa || '').trim().toUpperCase();
    if (!p) return;
    normalizarClienteVehiculos(cliente);
    if (!cliente.vehiculos.includes(p)) cliente.vehiculos.push(p);
}

function removeAsociacionVehiculo(cliente, placa) {
    normalizarClienteVehiculos(cliente);
    cliente.vehiculos = cliente.vehiculos.filter(p => p !== String(placa).trim().toUpperCase());
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    updateUI();
    actualizarDisplayCajaBase();
}

/* ==================================================
   SECCIÓN: NAVEGACIÓN Y PESTAÑAS
   ================================================== */
/* Pestaña activa global para la vista de Autos */
let currentAutoTab = 'pista';

function switchView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

    const vista = document.getElementById('view-' + viewName);
    if (vista) vista.classList.add('active');

    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const navIndex = {
    'lavadores': 0,
    'clientes': 1,
    'inicio': 2,
    'autos': 3,
    'caja': 4
};

    if (navIndex.hasOwnProperty(viewName)) {
        document.querySelectorAll('.nav-item')[navIndex[viewName]]?.classList.add('active');
    }

    if (viewName === 'reporte') {
        generateReportText();
    }

    if (viewName === 'caja') {
        renderIngresosExtrasList();
        renderGastosList();
        renderPagosCaja();
        renderCajaUI();
    }

    if (viewName === 'autos') {
        switchAutoTab(currentAutoTab || 'pendientes');
    } else {
        setFabVisibility(false);
    }

    window.scrollTo(0, 0);
}

function switchAutoTab(tab) {
    currentAutoTab = tab;

    const tabs = ['Pendientes', 'Pista', 'Pagados', 'Nuevo'];

    tabs.forEach(t => {
        const el = document.getElementById('autoTab' + t);
        if (el) el.style.display = 'none';

        const btn = document.getElementById('tabBtn' + t);
        if (btn) btn.classList.remove('active');
    });

    if (tab === 'pendientes') {
        document.getElementById('autoTabPendientes').style.display = 'block';
        document.getElementById('tabBtnPendientes')?.classList.add('active');

        setFabVisibility(true);

    } else if (tab === 'pista') {
        document.getElementById('autoTabPista').style.display = 'block';
        document.getElementById('tabBtnPista')?.classList.add('active');

        setFabVisibility(true);

    } else if (tab === 'pagados') {
        document.getElementById('autoTabPagados').style.display = 'block';
        document.getElementById('tabBtnPagados')?.classList.add('active');

        setFabVisibility(true);

    } else if (tab === 'nuevo') {
        document.getElementById('autoTabNuevo').style.display = 'block';

        setFabVisibility(false);

        montoModificadoManual = false;
        onServiciosCheckboxChange();
        actualizarPrecioExpress();
    }

    renderRecordsList();
}

// Cambio de Sub-pestañas en Formulario
function guardarRegistroFormulario(e) {
    if (currentFormSubTab === 'express') {
        guardarRegistroExpress(e);
        return;
    }
    saveAutoRecord(e);
}

function switchFormSubTab(subTabName) {
    currentFormSubTab = subTabName;

    const subTabs = ['vehiculo', 'servicio', 'express'];

    subTabs.forEach(s => {
        const btn = document.getElementById(
            `subTabBtn${s.charAt(0).toUpperCase() + s.slice(1)}`
        );

        const content = document.getElementById(
            `subTab${s.charAt(0).toUpperCase() + s.slice(1)}`
        );

        if (btn) btn.classList.remove('active');
        if (content) content.classList.add('is-hidden');
    });

    const activeBtn = document.getElementById(
        `subTabBtn${subTabName.charAt(0).toUpperCase() + subTabName.slice(1)}`
    );

    const activeContent = document.getElementById(
        `subTab${subTabName.charAt(0).toUpperCase() + subTabName.slice(1)}`
    );

    if (activeBtn) activeBtn.classList.add('active');
    if (activeContent) activeContent.classList.remove('is-hidden');

    const btnGuardar = document.getElementById('btnGuardarAuto');
    if (btnGuardar) {
        btnGuardar.innerHTML = subTabName === 'express'
            ? '<i class="fa-solid fa-bolt"></i> Guardar Registro Express'
            : '<i class="fa-solid fa-floppy-disk"></i> Guardar Registro de Vehículo';
    }

    if (subTabName === 'express') actualizarPrecioExpress();
}

// Animación del botón flotante
function setFabVisibility(visible) {
    const fabButton = document.getElementById('fabAddAuto');

    if (!fabButton) return;

    const estaOculto = fabButton.classList.contains('fab-hidden');
    const estaOcultandose = fabButton.classList.contains('fab-hiding');

    // MOSTRAR FAB
    if (visible) {

        if (!estaOculto && !estaOcultandose) {
            return;
        }

        fabButton.classList.remove('fab-hiding');
        fabButton.classList.remove('fab-hidden');

        void fabButton.offsetWidth;

        fabButton.classList.add('fab-showing');

        return;
    }

    // OCULTAR FAB
    if (estaOculto) {
        return;
    }

    if (estaOcultandose) {
        return;
    }

    fabButton.classList.remove('fab-showing');
    fabButton.classList.add('fab-hiding');

    setTimeout(() => {
        fabButton.classList.remove('fab-hiding');
        fabButton.classList.add('fab-hidden');
    }, 250);
}

function openFloatingRegister() {
    switchView('autos');
    resetAutoForm();
    switchAutoTab('nuevo');
}

/* ==================================================
   SECCIÓN: CÁLCULOS Y SERVICIOS
   ================================================== */
function calcularPagosRealizados() {
    const pagado = {};
    appData.lavadores.forEach(l => pagado[l] = 0);
    appData.pagosLavadores.forEach(p => { pagado[p.lavador] = (pagado[p.lavador]||0) + p.monto; });
    return pagado;
}

function calculatePreviewSplit(m) { return splitMonto(m); }

function calculatePreview() {
    const m = document.getElementById('recordMonto')?.value || 0;
    const p = parseFloat(document.getElementById('recordPropina')?.value) || 0;
    const s = calculatePreviewSplit(m);
    
    const elLav = document.getElementById('prevLavador');
    const elAdminBruto = document.getElementById('prevAdminBruto');
    const elProp = document.getElementById('prevPropina');
    
    if(elLav) elLav.textContent = `$${(s.lavador + p).toFixed(2)}`;
    if(elAdminBruto) elAdminBruto.textContent = `$${s.adminBruto.toFixed(2)}`;
    if(elProp) elProp.textContent = `$${p.toFixed(2)}`;
}

function onServiciosCheckboxChange() {
    if (montoModificadoManual) return;

    const sel = document.getElementById('recordTipoVehiculo');
    const input = document.getElementById('recordMonto');

    if (!input) return;

    const tipo = sel?.value || 'SEDAN';

    const servicioSeleccionado =
        document.querySelector('input[name="serviciosMulti"]:checked')?.value || 'Completo';

    // Precio base del tipo de lavado seleccionado
    let monto = TARIFA_MATRIZ[tipo]?.[servicioSeleccionado] || 0;

    // Lavado de motor como adicional
    const cbMotor = document.getElementById('servicioMotor')?.checked;

    if (cbMotor) {
        monto += 10;
    }

    input.value = monto.toFixed(2);

    calculatePreview();
}

function onTipoVehiculoChange() { montoModificadoManual = false; onServiciosCheckboxChange(); }

document.addEventListener('input', e => {
    if (e.target?.id === 'recordMonto') { montoModificadoManual = true; calculatePreview(); }
    if (e.target?.id === 'recordPropina') { calculatePreview(); }
});

/* =====================================
   SECCIÓN: GESTIÓN DE VEHÍCULOS Y PLACAS
   ================================== */
function onPlacaInput(val) {
    const placa = val.trim().toUpperCase();
    const badge = document.getElementById('placaStatusBadge');
    const drop = document.getElementById('placaSuggestions');
    const hist = document.getElementById('vehiculoHistorialContainer');
    
    // Si el input está vacío, limpiamos badge, historial y ocultamos la lista
    if (!placa) { 
        if (badge) { badge.textContent = 'Vehículo Nuevo'; badge.classList.remove('registered'); } 
        if (drop) { drop.innerHTML = ''; drop.style.display = 'none'; } 
        if (hist) hist.style.display = 'none'; 
        return; 
    }

    // Traemos la lista de todos los vehículos registrados en la base de datos
    const registros = Object.values(appData.vehiculosRegistry || {});

    // Filtramos exactamente como en Clientes: cualquier placa que COMIENCE o CONTENGA la letra/número
    const matches = registros.filter(v => 
        v.placa && v.placa.toUpperCase().includes(placa)
    );

    // MUESTRA EL DESPLEGABLE INMEDIATAMENTE DESDE LA PRIMERA LETRA
    if (matches.length > 0 && drop) {
        drop.innerHTML = '';
        matches.forEach(m => {
            const d = document.createElement('div');
            d.className = 'placa-suggestion-item';
            d.onclick = () => selectVehiculoFromSuggestion(m.placa);
            d.innerHTML = `<span><strong>${m.placa}</strong> - ${m.marca || ''} ${m.modelo || ''} (${m.propietario || 'Cliente General'})</span><i class="fa-solid fa-arrow-right" style="color:var(--primary);"></i>`;
            drop.appendChild(d);
        });
        drop.style.display = 'block'; // Fuerza a mostrar la lista flotante
    } else if (drop) {
        drop.innerHTML = '';
        drop.style.display = 'none';
    }

    // Detección automática en caso de coincidencia exacta completa
    const matchExacto = appData.vehiculosRegistry ? appData.vehiculosRegistry[placa] : null;

    if (matchExacto) {
        if (badge) { badge.textContent = 'Vehículo Registrado'; badge.classList.add('registered'); }
        autocompletarVehiculo(matchExacto);
    } else { 
        if (badge) { badge.textContent = 'Vehículo Nuevo'; badge.classList.remove('registered'); } 
        if (hist) hist.style.display = 'none'; 
    }
}

document.addEventListener('click', e => {
    const d = document.getElementById('placaSuggestions'), i = document.getElementById('recordPlaca');
    if (d && i && !d.contains(e.target) && e.target !== i) d.style.display = 'none';
});

function selectVehiculoFromSuggestion(p) {
    const inputPlaca = document.getElementById('recordPlaca');
    if (inputPlaca) inputPlaca.value = p;
    
    const drop = document.getElementById('placaSuggestions');
    if (drop) drop.style.display = 'none';

    if (appData.vehiculosRegistry[p]) {
        const badge = document.getElementById('placaStatusBadge');
        if (badge) {
            badge.textContent = 'Vehículo Registrado';
            badge.classList.add('registered');
        }
        autocompletarVehiculo(appData.vehiculosRegistry[p]);
    }
}

function autocompletarVehiculo(v) {
    document.getElementById('recordMarca').value = v.marca||'';
    document.getElementById('recordModelo').value = v.modelo||'';
    document.getElementById('recordColor').value = v.color||'';
    if(document.getElementById('recordTipoVehiculo')) document.getElementById('recordTipoVehiculo').value = v.tipoVehiculo||'SEDAN';
    document.getElementById('recordPropietario').value = v.propietario||'Cliente General';
    document.getElementById('recordTelefono').value = v.telefono||'6000-0000';
    document.getElementById('recordFrecuente').checked = v.frecuente||false;
    document.getElementById('recordObservaciones').value = v.observaciones||'';
    const editIdInput = document.getElementById('editRecordId');
    if (!editIdInput || !editIdInput.value) { montoModificadoManual=false; onServiciosCheckboxChange(); }
    renderVehiculoHistorial(v.placa);
}

function renderVehiculoHistorial(placa) {
    const c = document.getElementById('vehiculoHistorialContainer'), cont = document.getElementById('vehiculoHistorialContent');
    if(!c || !cont) return;
    const v = appData.vehiculosRegistry[placa];
    if (!v?.historialVisitas?.length) { c.style.display='none'; return; }
    const vis = v.historialVisitas, ult = vis[vis.length-1];
    cont.innerHTML = `
        <div>• <strong>Visitas:</strong> ${vis.length}</div>
        <div>• <strong>Última Visita:</strong> ${ult.fecha} (${ult.timestamp})</div>
        <div>• <strong>Último Servicio:</strong> ${ult.servicio||'N/D'} ($${parseFloat(ult.monto).toFixed(2)})</div>
        <div>• <strong>Total Gastado:</strong> $${vis.reduce((a,b)=>a+(parseFloat(b.monto)||0)+(parseFloat(b.propina)||0),0).toFixed(2)}</div>
        <div>• <strong>Frecuente:</strong> ${v.frecuente?'SÍ ⭐':'NO'}</div>
    `;
    c.style.display = 'block';
}

function asignarPista(valor) {
    const inputPista = document.getElementById('recordPista');
    if (inputPista) inputPista.value = valor;
}

function marcarFueraDePista(id) {
    if (appData.cajaCerrada) { alert('⚠️ Caja cerrada'); return; }
    const r = appData.registros.find(x => x.id === id);
    if (r) {
        r.pista = 'Fuera';
        const v = appData.vehiculosRegistry[r.auto];
        if (v) { const h = v.historialVisitas.find(x => x.id === r.id); if (h) h.pista = 'Fuera'; }
        saveData();
    }
}

/* ==================================================
   SECCIÓN: REGISTRO DE AUTOS Y RENDERS
   ================================================== */
function actualizarPrecioExpress() {
    const tipo = document.getElementById('expressTipoVehiculo')?.value || 'SEDAN';
    const servicio = document.getElementById('expressTipoLavado')?.value || 'Completo';
    const input = document.getElementById('expressMonto');

    if (!input) return;

    // Precio base del lavado
    let monto = TARIFA_MATRIZ[tipo]?.[servicio] || 0;

    // Lavado de motor como adicional
    const cbMotor = document.getElementById('expressServicioMotor')?.checked;

    if (cbMotor) {
        monto += 10;
    }

    input.value = `$${monto.toFixed(2)}`;
}

function guardarRegistroExpress(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (appData.cajaCerrada) {
        alert('⚠️ Caja cerrada');
        return;
    }

    const tipo = document.getElementById('expressTipoVehiculo')?.value || 'SEDAN';
    const servicio = document.getElementById('expressTipoLavado')?.value || 'Completo';
    const cbMotor = document.getElementById('expressServicioMotor')?.checked;
    const lav = document.getElementById('expressLavador')?.value || '';

    if (!lav) {
        showFieldError(document.getElementById('expressLavador'), 'Seleccione un Lavador');
        return;
    }

    // Cliente seleccionado
    const clienteId = document.getElementById('recordClienteId')?.value || '';
    const clienteSeleccionado = clienteId
        ? getClienteById(clienteId)
        : null;

    const clienteNombre = clienteSeleccionado?.name || '';
    const clienteTelefono = clienteSeleccionado?.phone || '';
    const descuento = Math.max(
        0,
        parseFloat(clienteSeleccionado?.descuento) || 0
    );

    // Vehículo seleccionado del cliente
    const placaCliente = document.getElementById('recordPlaca')?.value
        ?.trim()
        .toUpperCase() || '';

    const montoTexto = document.getElementById('expressMonto')?.value || '';
    const monto = parseFloat(montoTexto.replace('$', '')) || 0;

    if (monto <= 0) {
        alert('Precio inválido');
        return;
    }

    // Validar pista seleccionada
    const inputPista = document.getElementById('recordPista');

    const pistaVal = inputPista
        ? String(
            inputPista.options[inputPista.selectedIndex]?.value || ''
        ).trim()
        : '';

    if (!/^[1-6]$/.test(pistaVal)) {
        showFieldError(inputPista, 'Seleccione una Pista');
        return;
    }

    const nid = 'rec_' + Date.now();
    const fecha = new Date().toLocaleDateString();
    const hora = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });

    // Servicios seleccionados
    const serviciosArray = [servicio];

    if (cbMotor) {
        serviciosArray.push('Motor');
    }

    const servicioFinal = serviciosArray.join(' + ');

    // Guardar registro Express
    appData.registros.unshift({
        id: nid,
        tipoRegistro: 'EXPRESS',

        // Cliente y vehículo
        auto: placaCliente,
        tipoVehiculo: tipo,
        clienteId: clienteId,
        clienteName: clienteNombre || 'Registro Express',
        clienteNombre: clienteNombre || 'Registro Express',
        telefono: clienteTelefono,
        descuento: descuento,

        // Servicio
        servicio: servicioFinal,
        serviciosArray: serviciosArray,

        // Datos del lavado
        lavador: lav,
        pista: pistaVal,
        monto: monto,
        propina: 0,
        formaPago: 'Efectivo',
        estadoPago: 'PENDIENTE',
        fecha: fecha,
        timestamp: hora
    });

    saveData();
    resetAutoForm();
    switchFormSubTab('express');
    switchAutoTab('pista');
}

function saveAutoRecord(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (appData.cajaCerrada) { alert('⚠️ Caja cerrada'); return; }
    
    const editIdInput = document.getElementById('editRecordId');
    const editId = editIdInput ? editIdInput.value.trim() : '';
    
    const placaInput = document.getElementById('recordPlaca');
    const placa = placaInput ? placaInput.value.trim().toUpperCase() : '';
    if (!placa) { showFieldError(placaInput, 'Placa obligatoria'); return; }

    const marca = document.getElementById('recordMarca')?.value.trim() || '';
    const modelo = document.getElementById('recordModelo')?.value.trim() || '';
    const color = document.getElementById('recordColor')?.value.trim() || '';
    const tipo = document.getElementById('recordTipoVehiculo')?.value || 'SEDAN';
    const prop = document.getElementById('recordPropietario')?.value.trim() || 'Cliente General';
    const tel = document.getElementById('recordTelefono')?.value.trim() || '6000-0000';
    const frec = document.getElementById('recordFrecuente')?.checked || false;
    const obs = document.getElementById('recordObservaciones')?.value.trim() || '';
    const inputPista = document.getElementById('recordPista');
    const pistaVal = inputPista ? String(inputPista.options[inputPista.selectedIndex]?.value || '').trim() : '';

    // La opción "Pista" es solamente el estado neutral: no es una pista válida.
    if (!/^[1-6]$/.test(pistaVal)) {
        showFieldError(inputPista, 'Seleccione una Pista');
        return;
    }
    
    const radioServicio =
    document.querySelector('input[name="serviciosMulti"]:checked')?.value || 'Completo';

    const cbEspuma = document.getElementById('servicioEspuma')?.checked;
    const cbMotor = document.getElementById('servicioMotor')?.checked;

    let arr = [radioServicio];
    if (cbEspuma) arr.push('Espuma');
    if (cbMotor) arr.push('Motor');
    const srvStr = arr.join(' + ');
    
    const lav = document.getElementById('recordLavador')?.value || '';
    if (!lav) { showFieldError(document.getElementById('recordLavador'), 'Seleccione un Lavador'); return; }
    
    const monto = parseFloat(document.getElementById('recordMonto')?.value) || 0;
    const selectedClienteId = document.getElementById('recordClienteId')?.value.trim() || '';
    const selectedCliente = getClienteById(selectedClienteId);
    const clienteAsociado = selectedCliente && Array.isArray(selectedCliente.vehiculos) && selectedCliente.vehiculos.includes(placa) ? selectedCliente : null;
    if (selectedClienteId && !clienteAsociado) {
        alert('Seleccione un vehículo asociado al cliente o quite el cliente seleccionado.');
        return;
    }
    const descuento = clienteAsociado ? Math.max(0, parseFloat(selectedCliente.descuento) || 0) : 0;
    const clienteId = clienteAsociado ? clienteAsociado.id : '';
    const clienteNombre = clienteAsociado ? clienteAsociado.name : '';
    const clienteTelefono = clienteAsociado ? (clienteAsociado.phone || '') : '';
    if (clienteAsociado) {
        document.getElementById('recordDescuento').value = descuento.toFixed(2);
    } else if (document.getElementById('recordDescuento')) {
        document.getElementById('recordDescuento').value = '0';
    }
    const propina = parseFloat(document.getElementById('recordPropina')?.value) || 0;
    const fp = document.getElementById('recordFormaPago')?.value || 'Efectivo';
    const ep = document.getElementById('recordEstadoPago')?.value || 'PENDIENTE';
    const fh = new Date().toLocaleDateString(), hr = new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});

    const propietarioFinal = clienteAsociado ? clienteAsociado.name : prop;
    const telefonoFinal = clienteAsociado ? clienteTelefono : tel;

    if (!appData.vehiculosRegistry[placa]) {
        appData.vehiculosRegistry[placa] = { placa,marca,modelo,color,tipoVehiculo:tipo,propietario:propietarioFinal,telefono:telefonoFinal,frecuente:frec,observaciones:obs,historialVisitas:[] };
    } else {
        Object.assign(appData.vehiculosRegistry[placa], { marca,modelo,color,tipoVehiculo:tipo,propietario:propietarioFinal,telefono:telefonoFinal,frecuente:frec,observaciones:obs });
    }

    const visita = { fecha:fh, timestamp:hr, servicio:srvStr, serviciosArray:arr, monto, descuento, clienteId, clienteNombre, propina, lavador:lav, pista:pistaVal, formaPago:fp, estadoPago:ep };

    if (editId !== '') {
        const idx = appData.registros.findIndex(r => r.id === editId);
        if (idx !== -1) {
            const viejo = appData.registros[idx];
            appData.registros[idx] = { 
                ...viejo, 
                id: editId, 
                auto: placa, 
                tipoVehiculo: tipo, 
                clienteName: clienteNombre || prop, 
                clienteId,
                clienteNombre,
                telefono: clienteTelefono || tel, 
                servicio: srvStr, 
                serviciosArray: arr, 
                lavador: lav, 
                pista: pistaVal,
                monto, 
                descuento,
                propina,
                formaPago: fp, 
                estadoPago: ep, 
                fecha: fh, 
                timestamp: hr 
            };
            visita.id = editId;
            if (viejo.auto !== placa && appData.vehiculosRegistry[viejo.auto]) {
                appData.vehiculosRegistry[viejo.auto].historialVisitas = appData.vehiculosRegistry[viejo.auto].historialVisitas.filter(h => h.id !== editId);
            }
            if (!appData.vehiculosRegistry[placa].historialVisitas) {
                appData.vehiculosRegistry[placa].historialVisitas = [];
            }
            const h = appData.vehiculosRegistry[placa].historialVisitas;
            const hi = h.findIndex(x => x.id === editId);
            if (hi !== -1) h[hi] = visita; else h.push(visita);
            h.sort((a,b)=>new Date(a.fecha+' '+a.timestamp)-new Date(b.fecha+' '+b.timestamp));
        }
    } else {
        const nid = 'rec_' + Date.now(); 
        visita.id = nid;
        appData.registros.unshift({ id:nid, auto:placa, tipoVehiculo:tipo, clienteName:clienteNombre || prop, clienteId, clienteNombre, telefono:clienteTelefono || tel, servicio:srvStr, serviciosArray:arr, lavador:lav, pista:pistaVal, monto, descuento, propina, formaPago:fp, estadoPago:ep, fecha:fh, timestamp:hr });
        appData.vehiculosRegistry[placa].historialVisitas.push(visita);
    }

    saveData(); 
    resetAutoForm();
    switchAutoTab('pendientes'); 
}

function resetAutoForm() {
    const form = document.getElementById('autoForm');
    if(form) form.reset();
    const editIdInput = document.getElementById('editRecordId');
    if(editIdInput) editIdInput.value = '';
    const titleText = document.getElementById('formTitleText');
    if(titleText) titleText.innerHTML = '<i class="fa-solid fa-circle-plus"></i> Agregar';
    const badge = document.getElementById('placaStatusBadge');
    if(badge) {
        badge.textContent='Vehículo Nuevo';
        badge.classList.remove('registered');
    }
    asignarPista('');
    const histContainer = document.getElementById('vehiculoHistorialContainer');
    if(histContainer) histContainer.style.display='none';
    const estadoPagoInput = document.getElementById('recordEstadoPago');
    if(estadoPagoInput) estadoPagoInput.value='PENDIENTE';
    const propinaInput = document.getElementById('recordPropina');
    if(propinaInput) propinaInput.value='0.00';
    const clienteIdInput = document.getElementById('recordClienteId');
    if(clienteIdInput) clienteIdInput.value='';
    const descuentoInput = document.getElementById('recordDescuento');
    if(descuentoInput) descuentoInput.value='0';
    const clienteSearch = document.getElementById('recordClienteSearch');
    if(clienteSearch) clienteSearch.value='';
    renderRegistroClienteSeleccionado();
    
    montoModificadoManual = false;
    
    const radioCompleto =
    document.querySelector('input[name="serviciosMulti"][value="Completo"]');

    if (radioCompleto) radioCompleto.checked = true;

    const cbMotor = document.getElementById('servicioMotor');
    if (cbMotor) cbMotor.checked = false;

    const cbExpressMotor = document.getElementById('expressServicioMotor');
    if (cbExpressMotor) cbExpressMotor.checked = false;

    onServiciosCheckboxChange();
    actualizarPrecioExpress();
}

function editRecord(id) {
    if (appData.cajaCerrada) { alert('⚠️ Caja cerrada'); return; }
    const r = appData.registros.find(x => x.id === id); if (!r) return;
    switchAutoTab('nuevo');
    
    const editIdInput = document.getElementById('editRecordId');
    if(editIdInput) editIdInput.value = r.id;

    const clienteEdit = getClienteById(r.clienteId || '');
    if (clienteEdit) {
        seleccionarClienteRegistro(clienteEdit.id);
    } else {
        limpiarClienteRegistro();
    }
    const descuentoEdit = document.getElementById('recordDescuento');
    if (descuentoEdit) descuentoEdit.value = Math.max(0, parseFloat(r.descuento) || 0).toFixed(2);
    
    const titleText = document.getElementById('formTitleText');
    if(titleText) titleText.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Editar Registro';
    
    const placaInput = document.getElementById('recordPlaca');
    if(placaInput) {
        placaInput.value = r.auto; 
        onPlacaInput(r.auto);
    }
    
    if(document.getElementById('recordTipoVehiculo')) document.getElementById('recordTipoVehiculo').value = r.tipoVehiculo||'SEDAN';
    
    const arr = r.serviciosArray || [r.servicio||'Completo'];
    const radioFuera = document.querySelector('input[name="serviciosMulti"][value="Fuera"]');
    const radioCompleto = document.querySelector('input[name="serviciosMulti"][value="Completo"]');
    if (arr.includes('Fuera') && radioFuera) radioFuera.checked = true;
    else if (radioCompleto) radioCompleto.checked = true;

    const cbEspuma = document.getElementById('servicioEspuma');
    if (cbEspuma) cbEspuma.checked = arr.includes('Espuma');

    const cbMotor = document.getElementById('servicioMotor');
    if (cbMotor) cbMotor.checked = arr.includes('Motor');
    
    const lavInput = document.getElementById('recordLavador');
    if(lavInput) lavInput.value = r.lavador;

    asignarPista(r.pista === 'Fuera' ? '' : (r.pista || ''));
    
    const montoInput = document.getElementById('recordMonto');
    if(montoInput) montoInput.value = parseFloat(r.monto).toFixed(2);
    
    const propinaInput = document.getElementById('recordPropina');
    if(propinaInput) propinaInput.value = parseFloat(r.propina || 0).toFixed(2);
    
    const formaPagoInput = document.getElementById('recordFormaPago');
    if(formaPagoInput) formaPagoInput.value = r.formaPago || 'Efectivo';
    
    const estadoPagoInput = document.getElementById('recordEstadoPago');
    if(estadoPagoInput) estadoPagoInput.value = r.estadoPago || 'PENDIENTE';
    
    montoModificadoManual = true; 
    calculatePreview();
}

/* ==================================================
   SECCIÓN: CONTADORES Y LISTAS
   ================================================== */
function updateAutoBadges() {
    const arrPendientes = appData.registros.filter(r => r.estadoPago === 'PENDIENTE' && r.pista === 'Fuera');
    const arrPista = appData.registros.filter(r => r.estadoPago === 'PENDIENTE' && r.pista !== 'Fuera');
    const arrPagados = appData.registros.filter(r => r.estadoPago === 'PAGADO');

    const bPend = document.getElementById('badgePendientes');
    const bPista = document.getElementById('badgePista');
    const bPag = document.getElementById('badgePagados');

    if (bPend) bPend.textContent = arrPendientes.length;
    if (bPista) bPista.textContent = arrPista.length;
    if (bPag) bPag.textContent = arrPagados.length;
}

function renderRecordsList() {
    updateAutoBadges();

    if (currentAutoTab === 'pendientes') {
        renderSubList('recordsListContainer', 'searchRecordInput', r => r.estadoPago === 'PENDIENTE' && r.pista === 'Fuera');
    } else if (currentAutoTab === 'pista') {
        renderSubList('recordsPistaListContainer', 'searchRecordInputPista', r => r.estadoPago === 'PENDIENTE' && r.pista !== 'Fuera');
    } else if (currentAutoTab === 'pagados') {
        renderSubList('recordsPagadosListContainer', 'searchRecordInputPagados', r => r.estadoPago === 'PAGADO');
    }
}

function renderSubList(containerId, searchInputId, filterFn) {
    const c = document.getElementById(containerId); 
    if (!c) return;

    const q = (document.getElementById(searchInputId)?.value || '').toLowerCase();
    const lista = appData.registros.filter(filterFn).filter(r => {
        const v = appData.vehiculosRegistry[r.auto] || {};
        return (r.auto || '').toLowerCase().includes(q) ||
               (v.marca || '').toLowerCase().includes(q) ||
               (v.modelo || '').toLowerCase().includes(q) ||
               (v.color || '').toLowerCase().includes(q) ||
               (r.lavador || '').toLowerCase().includes(q) ||
               (r.pista || '').toLowerCase().includes(q);
    });

    if (!lista.length) { 
        c.innerHTML = `<div class="empty-state"><i class="fa-solid fa-car-side"></i><p>Sin vehículos en esta categoría.</p></div>`; 
        return; 
    }

    c.innerHTML = '';
    lista.forEach(r => {
        const ok = r.estadoPago === 'PAGADO';
        const esExpress = r.tipoRegistro === 'EXPRESS';
        const v = appData.vehiculosRegistry[r.auto] || {};
        
        const etiquetasTipoVehiculo = {
            SEDAN: 'Sedán',
            CAMIONETA_CHICA: 'Camioneta Chica',
            CAMIONETA_MEDIANA: 'Camioneta Mediana',
            CAMIONETA_GRANDE: 'Camioneta Grande',
            PICKUP: 'Pickup',
            FORD_RANGER: 'Ford Ranger'
        };
        const marcaModelo = esExpress ? (etiquetasTipoVehiculo[r.tipoVehiculo] || 'Vehículo') : ([v.marca, v.modelo].filter(Boolean).join(' ') || 'Vehículo');
        const carColorClass = esExpress ? 'badge-car-default' : getCarColorClass(v.color);
        const iconoFrecuente = !esExpress && v.frecuente ? '<i class="fa-solid fa-star" style="color: #f59e0b; margin-right: 4px;"></i>' : '';

        const esFuera = r.pista === 'Fuera';
        const textoPista = esFuera ? 'Fuera de Pista' : ('Pista ' + r.pista);
        const colorPistaBg = esFuera ? '#f1f5f9' : '#e0f2fe';
        const colorPistaText = esFuera ? '#475569' : '#0369a1';
        const colorPistaBorder = esFuera ? '#cbd5e1' : '#bae6fd';
        const iconoPista = esFuera ? 'fa-road-circle-xmark' : 'fa-location-dot';

        const infoPista = `<span style="background-color: ${colorPistaBg}; color: ${colorPistaText}; border: 1px solid ${colorPistaBorder}; padding: 3px 8px; border-radius: 6px; font-weight: 700; font-size: 0.72rem; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap;"><i class="fa-solid ${iconoPista}" style="color: ${colorPistaText};"></i> ${textoPista}</span>`;

        const btnFueraPistaRapido = !esFuera ? `<button class="btn" onclick="marcarFueraDePista('${r.id}'); event.stopPropagation();" style="width: 28px; height: 22px; padding: 0; background: #f8fafc; border: 1px solid #cbd5e1; color: #475569; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; font-size: 0.8rem;" title="Sacar a fuera de pista"><i class="fa-solid fa-right-from-bracket"></i></button>` : '';

        const obs = !esExpress && v.observaciones 
            ? `<div style="background-color: #f3f4f6; color: #4b5563; font-size: 0.72rem; padding: 4px 8px; border-radius: 6px; margin-top: 6px; display: flex; align-items: center; gap: 6px; width: 100%;"><i class="fa-solid fa-note-sticky" style="color: #6b7280;"></i> <span><strong>Nota:</strong> ${v.observaciones}</span></div>` 
            : '';
        
        const badgeEstado = ok 
            ? `<span class="badge badge-paid" style="font-size: 0.65rem; padding: 2px 6px;"><i class="fa-solid fa-circle-check"></i> PAGADO</span>` 
            : `<span class="badge badge-pending" style="font-size: 0.65rem; padding: 2px 6px;"><i class="fa-solid fa-clock"></i> PENDIENTE</span>`;

        let badgePago = '';
        if (ok && r.formaPago) {
            const esYappy = r.formaPago === 'Yappy';
            const iconoFormaPago = esYappy ? 'fa-mobile-screen-button' : 'fa-hand-holding-dollar';
            const estiloEfectivo = !esYappy ? 'background-color: #d1fae5; color: #065f46; border: 1px solid #a7f3d0;' : '';
            badgePago = `<span class="badge ${esYappy?'badge-yappy':''}" style="font-size: 0.65rem; padding: 2px 6px; ${estiloEfectivo}"><i class="fa-solid ${iconoFormaPago}"></i> ${r.formaPago}</span>`;
        }

        const propinaVal = Math.max(0, parseFloat(r.propina) || 0);
        const descuentoVal = Math.min(
            Math.max(0, parseFloat(r.monto) || 0),
            Math.max(0, parseFloat(r.descuento) || 0)
        );

        const badgePropina = propinaVal > 0 
            ? `<span class="badge badge-tip"><i class="fa-solid fa-coins"></i> Propina: $${propinaVal.toFixed(2)}</span>` 
            : '';

        const badgeDescuento = descuentoVal > 0
            ? `<span class="badge badge-descuento"><i class="fa-solid fa-tag"></i> -$${descuentoVal.toFixed(2)}</span>`
            : '';

        const serviciosCard = Array.isArray(r.serviciosArray) && r.serviciosArray.length
            ? r.serviciosArray
            : String(r.servicio || 'Completo').split('+').map(x => x.trim()).filter(Boolean);
        const tieneMotor = serviciosCard.some(x => String(x).toLowerCase() === 'motor') || /\+\s*Motor/i.test(r.servicio || '');
        const servicioBase = serviciosCard.find(x => String(x).toLowerCase() !== 'motor' && String(x).toLowerCase() !== 'espuma') || 'Completo';
        const servicioLimpio = String(servicioBase).replace(/\s*\+\s*Espuma/gi, '').trim();
        const badgeMotor = tieneMotor
            ? `<span class="badge badge-motor"><i class="fa-solid fa-gears"></i> Motor</span>`
            : '';

        const totalCobradoVehiculo = getMontoCobro(r);

        const accionCard = esExpress ? '' : `onclick="editRecord('${r.id}')"`;
        const tituloCard = esExpress ? '' : 'title="Haz clic para editar"';
        const identificadorCard = esExpress
            ? '<div class="record-plate"><i class="fa-solid fa-bolt"></i> EXPRESS</div>'
            : `<div class="record-plate"><i class="fa-solid fa-car"></i> ${r.auto}</div>`;

        c.innerHTML += `
            <div class="record-card ${ok?'paid':'pending'}" ${accionCard} style="${esExpress ? '' : 'cursor: pointer;'}" ${tituloCard}>
                <div class="record-top">
                    <div class="record-client ${carColorClass}">${iconoFrecuente}${marcaModelo}</div>
                    ${identificadorCard}
                </div>
                <div class="record-details" style="display: flex; flex-direction: column; gap: 4px;">
                    <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                        <span><i class="fa-solid fa-soap"></i> ${servicioLimpio}</span>
                        ${badgeMotor}
                        <span><i class="fa-solid fa-user"></i> ${r.lavador || 'Sin Asignar'}</span>
                        <span><i class="fa-solid fa-clock"></i> ${r.timestamp}</span>
                    </div>
                    ${obs}
                </div>
                <div class="record-footer" style="margin-top: 10px; display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                    <div style="display: flex; flex-direction: column; gap: 6px; align-items: flex-start;">
                        <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                            <span class="record-amount" style="font-size: 1.3rem; font-weight: 800; color: #0f172a; line-height: 1;">$${totalCobradoVehiculo.toFixed(2)}</span>
                            ${badgeDescuento}
                            ${badgeEstado}
                            ${badgePago}
                            ${badgePropina}
                        </div>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            ${infoPista}
                            ${btnFueraPistaRapido}
                        </div>
                    </div>
                    <div class="record-actions" style="display: flex; align-items: center;">
                        <button class="btn-icon ${ok?'primary':'success'}" onclick="solicitarTipoPago('${r.id}'); event.stopPropagation();" title="Cambiar estado de pago" style="width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center;"><i class="fa-solid ${ok?'fa-rotate-left':'fa-hand-holding-dollar'}" style="font-size: 0.95rem;"></i></button>
                    </div>
                </div>
            </div>`;
    });
}

let paymentModalRecordId = null;

function solicitarTipoPago(id) {
    const r = appData.registros.find(x => x.id === id);
    if (!r) return;

    if (r.estadoPago === 'PAGADO') {
        r.estadoPago = 'PENDIENTE';
        r.formaPago = '';
        saveData();
        return;
    }

    paymentModalRecordId = id;

    const montoServicio = document.getElementById('modalMontoServicio');
    const propinaInput = document.getElementById('modalInputPropina');
    const totalCobro = document.getElementById('modalMontoTotalCobro');
    const modal = document.getElementById('paymentModal');

    const montoBruto = Math.max(0, parseFloat(r.monto) || 0);
    const descuento = Math.min(
        montoBruto,
        Math.max(0, parseFloat(r.descuento) || 0)
    );
    const montoNeto = Math.max(0, montoBruto - descuento);
    const propina = Math.max(0, parseFloat(r.propina) || 0);

    if (montoServicio) montoServicio.textContent = `$${montoNeto.toFixed(2)}`;
    if (propinaInput) propinaInput.value = propina.toFixed(2);
    if (totalCobro) totalCobro.textContent = `$${(montoNeto + propina).toFixed(2)}`;

    if (modal) modal.classList.add('open');
}

function actualizarTotalModalPago() {
    if (!paymentModalRecordId) return;
    const r = appData.registros.find(x => x.id === paymentModalRecordId);
    if (!r) return;

    const montoBruto = Math.max(0, parseFloat(r.monto) || 0);
    const descuento = Math.min(montoBruto, Math.max(0, parseFloat(r.descuento) || 0));
    const montoNeto = Math.max(0, montoBruto - descuento);
    const propina = Math.max(0, parseFloat(document.getElementById('modalInputPropina')?.value) || 0);
    const total = document.getElementById('modalMontoTotalCobro');

    if (total) total.textContent = `$${(montoNeto + propina).toFixed(2)}`;
}

function closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) modal.classList.remove('open');
    paymentModalRecordId = null;
}

function confirmarPagoMetodo(metodo) {
    if (!paymentModalRecordId) return;
    const id = paymentModalRecordId;

    // El modal se cierra inmediatamente al confirmar Efectivo o Yappy.
    const modal = document.getElementById('paymentModal');
    if (modal) modal.classList.remove('open');

    registrarPagoModal(id, metodo);
}

function registrarPagoModal(id, metodo) {
    const r = appData.registros.find(x => x.id === id);
    if (!r) {
        closePaymentModal();
        return;
    }

    const propinaInput = document.getElementById('modalInputPropina');
    if (propinaInput) {
        r.propina = Math.max(0, parseFloat(propinaInput.value) || 0);
    }

    r.estadoPago = 'PAGADO';
    r.formaPago = metodo;

    closePaymentModal();
    saveData();
}

/* ==================================================
   SECCIÓN: RESUMEN DE LAVADORES EN INICIO
   ================================================== */
function renderResumenLavadoresHome() {
    const contenedor = document.getElementById('homeLavadorList');
    if (!contenedor) return;

    if (!appData.lavadores || appData.lavadores.length === 0) {
        contenedor.innerHTML = '<p class="lavador-empty-msg">No hay lavadores registrados.</p>';
        return;
    }

    let html = '';
    let hayActivos = false;

    appData.lavadores.forEach(lavador => {
        const registrosLavador = appData.registros.filter(r => r.lavador === lavador);
        
        let autosPagados = 0;
        let autosPendientes = 0;
        let totalBrutoLavador = 0;
        let totalPropinaLavador = 0;

        registrosLavador.forEach(r => {
            const monto = parseFloat(r.monto) || 0;
            const propina = parseFloat(r.propina) || 0;
            totalBrutoLavador += monto;
            totalPropinaLavador += propina;
            
            if (r.estadoPago === 'PAGADO') {
                autosPagados++;
            } else {
                autosPendientes++;
            }
        });

        const totalAutos = autosPagados + autosPendientes;
        if (totalAutos === 0) return;

        hayActivos = true;
        let gananciaLavador = Math.ceil(totalBrutoLavador / 2);
        let totalLavadorPagar = gananciaLavador + totalPropinaLavador;

        const detallePropinaText = totalPropinaLavador > 0 
            ? `(Ganancia: $${gananciaLavador.toFixed(2)} + Propina: $${totalPropinaLavador.toFixed(2)})`
            : `Total Bruto: $${totalBrutoLavador.toFixed(2)}`;

        html += `
            <div class="lavador-payout-item">
                <div class="lavador-payout-info">
                    <div class="lavador-name-title">
                        <i class="fa-solid fa-user-check"></i>
                        <span>${lavador}</span>
                    </div>
                    <div class="lavador-stats-text">
                        ${totalAutos} auto${totalAutos === 1 ? '' : 's'} - ${autosPendientes} pendiente${autosPendientes === 1 ? '' : 's'}
                    </div>
                </div>
                <div class="lavador-payout-right">
                    <span class="lavador-payout-amount">$${totalLavadorPagar.toFixed(2)}</span>
                    <div class="lavador-bruto-text">${detallePropinaText}</div>
                </div>
            </div>
        `;
    });

    if (!hayActivos) {
        contenedor.innerHTML = '<p class="lavador-empty-msg">No hay registros de autos lavados hoy</p>';
        return;
    }

    contenedor.innerHTML = html;
}

/* ==================================================
   SECCIÓN: ACTUALIZACIÓN DE INTERFAZ GENERAL (UI)
   ================================================== */
function renderCajaUI() {
    const containerReporte = document.getElementById('container-reporte-cierre');
    if (containerReporte) {
        if (appData.cajaCerrada) {
            containerReporte.classList.remove('hidden');
            containerReporte.style.display = 'block';
        } else {
            containerReporte.classList.add('hidden');
            containerReporte.style.display = 'none';
        }
    }
}

function updateUI() {
    const g = calculateGlobalTotals();
    const totAutos = appData.registros.length;
    const pend = appData.registros.filter(r=>r.estadoPago==='PENDIENTE').length;
    
    const statAtendidos = document.getElementById('statAtendidos');
    const statPendientesCount = document.getElementById('statPendientesCount');
    if(statAtendidos) statAtendidos.textContent = totAutos;
    if(statPendientesCount) statPendientesCount.textContent = pend;

    let cobrado = 0, efectivo = 0, yappy = 0;
    appData.registros.forEach(r => {
        if (r.estadoPago === 'PAGADO') {
            const m = getMontoCobro(r);
            cobrado += m;
            if (r.formaPago === 'Efectivo') efectivo += m;
            if (r.formaPago === 'Yappy') yappy += m;
        }
    });

    const ingEx = appData.ingresosExtras.reduce((s,i)=>s+(parseFloat(i.monto)||0),0);
    const gast = appData.gastos.reduce((s,g)=>s+(parseFloat(g.monto)||0),0);
    const pagLav = Object.values(g.yaPagado).reduce((s,v)=>s+v,0);
    
    // ==================================================
// RESUMEN DIARIO EN TIEMPO REAL
// ==================================================

// Descuentos de clientes + salidas asignadas a Administración.
// Estos ajustes sirven para la conciliación y NO modifican el rendimiento bruto.
const hoy = new Date().toLocaleDateString();
const descuentosClientesHoy = appData.registros
    .filter(r => r.fecha === hoy && (parseFloat(r.descuento) || 0) > 0)
    .map(r => ({
        nombre: r.clienteNombre || r.clienteName || 'Cliente',
        monto: Math.min(
            Math.max(0, parseFloat(r.monto) || 0),
            Math.max(0, parseFloat(r.descuento) || 0)
        )
    }));

const salidasAdminHoy = appData.gastos
    .filter(g => (g.tipoMovimiento || 'GENERAL') === 'ADMIN' && (!g.fecha || g.fecha === hoy))
    .map(g => ({
        nombre: g.concepto || 'Administración',
        monto: Math.max(0, parseFloat(g.monto) || 0)
    }));

const ajustesAdministracionHoy = [...descuentosClientesHoy, ...salidasAdminHoy];
const totalDescuentos = ajustesAdministracionHoy.reduce((s, x) => s + x.monto, 0);

// Rendimiento del día.
// Los descuentos NO modifican el rendimiento ni el reparto.
// El descuento solamente reduce el monto que debe pagar el cliente.
const rendimientoDia = g.totalAdminBruto;

// Autos pendientes: monto neto que todavía falta por cobrar.
const montoPendientes = appData.registros
    .filter(r => r.estadoPago === 'PENDIENTE')
    .reduce((s, r) => s + getMontoCobro(r), 0);

// Total disponible antes de otras deducciones.
const totalRendimientoMasCaja = rendimientoDia + (parseFloat(appData.cajaBase) || 0);

// Efectivo final que queda para Administración.
const efectivoParaAdministracion = Math.max(
    0,
    totalRendimientoMasCaja
    - montoPendientes
    - yappy
);

    const totalEnCaja = appData.cajaBase + efectivo + ingEx - gast - pagLav;

    const statCobrado = document.getElementById('statCobrado');
    const cajaNetaEfectivo = document.getElementById('cajaNetaEfectivo');
    const earnAdmin = document.getElementById('earnAdmin');
    const earnLavadores = document.getElementById('earnLavadores');
    const earnPropinas = document.getElementById('earnPropinas');
    const earnEfectivo = document.getElementById('earnEfectivo');
    const earnYappy = document.getElementById('earnYappy');
    const statRendimientoAdmin = document.getElementById('statRendimientoAdmin');
const statDescuentosTotal = document.getElementById('statDescuentosTotal');
const statRendimientoMasCaja = document.getElementById('statRendimientoMasCaja');
const statPendientesCountCard = document.getElementById('statPendientesCountCard');
const statPendientesMonto = document.getElementById('statPendientesMonto');

    if(statCobrado) statCobrado.textContent = `$${cobrado.toFixed(2)}`;
    if(cajaNetaEfectivo) cajaNetaEfectivo.textContent = `$${totalEnCaja.toFixed(2)}`;
    if(earnAdmin) earnAdmin.textContent = `$${g.totalAdminBruto.toFixed(2)}`;
    if(earnLavadores) earnLavadores.textContent = `$${g.totalLavadoresGanado.toFixed(2)}`;
    if(earnPropinas) earnPropinas.textContent = `$${g.totalPropinas.toFixed(2)}`;
    if(earnEfectivo) earnEfectivo.textContent = `$${efectivo.toFixed(2)}`;
    if(earnYappy) earnYappy.textContent = `$${yappy.toFixed(2)}`;
    // Tarjetas del Resumen Diario
    if (statRendimientoAdmin) {
    statRendimientoAdmin.textContent = `$${rendimientoDia.toFixed(2)}`;
}

if (statDescuentosTotal) {
    statDescuentosTotal.textContent = `$${totalDescuentos.toFixed(2)}`;
}

actualizarTickerDescuentos();

if (statRendimientoMasCaja) {
    statRendimientoMasCaja.textContent = `$${totalRendimientoMasCaja.toFixed(2)}`;
}

if (statPendientesCountCard) {
    statPendientesCountCard.textContent = appData.registros
        .filter(r => r.estadoPago === 'PENDIENTE').length;
}

if (statPendientesMonto) {
    statPendientesMonto.textContent = `$${montoPendientes.toFixed(2)} por cobrar`;
}

    const headerTotalBruto = document.getElementById('headerTotalBruto');
    if(headerTotalBruto) headerTotalBruto.textContent = `$${totalEnCaja.toFixed(2)}`;
    
    const widgetDinero = document.getElementById('cajaWidgetContainer');
    const tuBadgeOriginal = document.getElementById('cajaStatusBadge');
    
    const cardCierreOperativo = document.getElementById('cardCierreOperativo');
    const cajaCardTitle = document.getElementById('cajaCardTitle');
    const cajaCardDesc = document.getElementById('cajaCardDesc');
    const btnCerrarCaja = document.getElementById('btnCerrarCaja');

    if (widgetDinero && tuBadgeOriginal) {
        if (appData.cajaCerrada) {
            widgetDinero.style.display = 'none';   
            tuBadgeOriginal.style.display = 'flex';  
            
            if (cardCierreOperativo) cardCierreOperativo.style.border = '2px dashed var(--success)';
            if (cajaCardTitle) {
                cajaCardTitle.style.color = 'var(--success)';
                cajaCardTitle.innerHTML = '<i class="fa-solid fa-lock-open"></i> Apertura Operativa Diaria';
            }
            if (cajaCardDesc) cajaCardDesc.textContent = 'La caja se encuentra cerrada. Haz clic abajo para abrir las operaciones del día.';
            if (btnCerrarCaja) {
                btnCerrarCaja.className = 'btn btn-success-action btn-caja-dinamico';
                btnCerrarCaja.innerHTML = '<i class="fa-solid fa-lock-open"></i> ABRIR CAJA';
            }
        } else {
            widgetDinero.style.display = 'flex';   
            tuBadgeOriginal.style.display = 'none';  
            
            if (cardCierreOperativo) cardCierreOperativo.style.border = '2px dashed var(--danger)';
            if (cajaCardTitle) {
                cajaCardTitle.style.color = 'var(--danger)';
                cajaCardTitle.innerHTML = '<i class="fa-solid fa-lock"></i> Cierre Operativo Diario';
            }
            if (cajaCardDesc) cajaCardDesc.textContent = 'Al cerrar la caja se bloqueará el registro de nuevos autos, transacciones y salidas de caja hasta que reinicies el día.';
            if (btnCerrarCaja) {
                btnCerrarCaja.className = 'btn btn-danger-action btn-caja-dinamico';
                btnCerrarCaja.innerHTML = '<i class="fa-solid fa-lock"></i> CERRAR CAJA';
            }
        }
    }

    renderCajaUI();
    renderRecordsList();
    renderClientsList();
    renderLavadoresList();
    renderResumenLavadoresHome();
    renderInventarioList();
    renderGastosList();
    renderIngresosExtrasList();
    renderPagosCaja();
    populateSelects();
}

/* ==================================================
   SECCIÓN: PAGOS Y LIQUIDACIÓN A LAVADORES
   ================================================== */
function pagarLavador(nombre, monto) {
    if (appData.cajaCerrada) { alert('⚠️ Caja cerrada'); return; }
    const m = parseFloat(monto) || 0;
    if (m <= 0) return;

    if (!confirm(`¿Pagar $${m.toFixed(2)} a ${nombre}?`)) return;
    
    appData.pagosLavadores.push({
        id: 'pag_' + Date.now(), 
        lavador: nombre, 
        monto: m,
        fecha: new Date().toLocaleDateString(),
        hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    saveData();
}

function renderPagosCaja() {
    const c = document.getElementById('pagosLavadoresCaja'); 
    if (!c) return;
    const g = calculateGlobalTotals();
    
    if (!appData.lavadores.length) { 
        c.innerHTML = '<p style="text-align:center;color:var(--gray-400);padding:10px;">Registra lavadores primero.</p>'; 
        return; 
    }
    
    let html = '';
    appData.lavadores.forEach(lav => {
        const gan = g.ganadoPorLavador[lav] || 0;
        const prop = g.propinasPorLavador[lav] || 0;
        const totalLav = g.totalLavadorConPropina[lav] || 0;
        const pag = g.yaPagado[lav] || 0;
        const pen = g.pendiente[lav] || 0;
        const cnt = g.autosPorLavador[lav] || 0;
        
        const btn = pen > 0 && !appData.cajaCerrada
            ? `<button class="btn btn-success" style="padding:6px 12px;font-size:0.8rem;width:auto;" onclick="pagarLavador('${lav}', ${pen.toFixed(2)})"><i class="fa-solid fa-hand-holding-dollar"></i> Pagar $${pen.toFixed(2)}</button>`
            : `<span class="badge badge-pending" style="background:var(--gray-200); color:var(--gray-700);">Pagado ($${pag.toFixed(2)})</span>`;

        const propinaText = prop > 0 ? ` + Propina: $${prop.toFixed(2)}` : '';

        html += `
            <div class="list-card">
                <div class="list-card-info">
                    <h4>${lav} <span style="font-size:0.7rem;color:var(--gray-400);">· ${cnt} ${cnt === 1 ? 'auto' : 'autos'}</span></h4>
                    <p style="font-size:0.75rem;">Ganado: $${gan.toFixed(2)}${propinaText} (Total: $${totalLav.toFixed(2)}) · Entregado: $${pag.toFixed(2)}</p>
                    ${pen > 0 ? `<p style="font-size:0.75rem;color:var(--danger);font-weight:700;">POR PAGAR: $${pen.toFixed(2)}</p>` : `<p style="font-size:0.75rem;color:var(--gray-400);">Sin saldo pendiente</p>`}
                </div>
                ${btn}
            </div>`;
    });
    c.innerHTML = html;
}

/* ==================================================
   SECCIÓN: CIERRE Y CONTROL DE CAJA
   ================================================== */
function toggleCierreCaja() {
    appData.cajaCerrada = !appData.cajaCerrada;
    saveData();
    renderCajaUI();
    alert(appData.cajaCerrada ? '🔒 Caja cerrada. Ya puedes generar el reporte.' : '🔓 Caja reabierta.');
}

function actualizarDisplayCajaBase() {
    const d = document.getElementById('cajaBaseDisplay');
    if (d) d.textContent = `$${(appData.cajaBase||0).toFixed(2)}`;
}

function populateSelects() {
    const s = document.getElementById('recordLavador');
    const e = document.getElementById('expressLavador');

    if (s) {
        const act = s.value;
        s.innerHTML = '<option value="">Lavador</option>';
        appData.lavadores.forEach(l => s.innerHTML += `<option value="${l}">${l}</option>`);
        if (act && appData.lavadores.includes(act)) s.value = act;
    }

    if (e) {
        const actExpress = e.value;
        e.innerHTML = '<option value="">Lavador</option>';
        appData.lavadores.forEach(l => e.innerHTML += `<option value="${l}">${l}</option>`);
        if (actExpress && appData.lavadores.includes(actExpress)) e.value = actExpress;
    }
}

inicializarSelectoresPersonalizados();

/* ==================================================
   SECCIÓN: INGRESOS EXTRAS Y GASTOS
   ================================================== */
function addIngresoExtra(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (appData.cajaCerrada) { alert('⚠️ Caja cerrada'); return; }
    const c = document.getElementById('ingresoConcepto')?.value.trim();
    const m = parseFloat(document.getElementById('ingresoMonto')?.value)||0;
    if (c && m>0) {
        appData.ingresosExtras.push({ id:'inc_'+Date.now(), concepto:c, monto:m, timestamp:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) });
        document.getElementById('ingresoConcepto').value='';
        document.getElementById('ingresoMonto').value='';
        saveData();
    }
}

function deleteIngresoExtra(id) { if (appData.cajaCerrada) return; appData.ingresosExtras = appData.ingresosExtras.filter(i=>i.id!==id); saveData(); }

function renderIngresosExtrasList() {
    const c = document.getElementById('ingresosExtrasListContainer'); if (!c) return;
    if (!appData.ingresosExtras?.length) { c.innerHTML = '<p style="text-align:center;color:var(--gray-400);padding:10px;">Sin ingresos extra.</p>'; return; }
    c.innerHTML = '';
    appData.ingresosExtras.forEach(i => {
        c.innerHTML += `<div class="list-card" style="padding:10px 14px;"><div class="list-card-info"><h4 style="font-size:.9rem;">${i.concepto} <span style="font-size:0.7rem;color:var(--gray-400);">· ${i.timestamp}</span></h4></div><div style="display:flex;gap:10px;align-items:center;"><strong style="color:var(--success);">$${parseFloat(i.monto).toFixed(2)}</strong><button class="btn-icon danger" style="width:28px;height:28px;" onclick="deleteIngresoExtra('${i.id}')"><i class="fa-solid fa-trash"></i></button></div></div>`;
    });
}

function actualizarDestinoGasto() {
    const tipo = document.getElementById('gastoTipo')?.value || 'GENERAL';
    const lavador = document.getElementById('gastoLavador');
    if (!lavador) return;

    if (tipo === 'LAVADOR') {
        lavador.classList.remove('is-hidden');
        const actual = lavador.value;
        lavador.innerHTML = '<option value="">Lavador</option>';
        (appData.lavadores || []).forEach(l => {
            lavador.innerHTML += `<option value="${String(l).replace(/"/g, '&quot;')}">${String(l).replace(/</g, '&lt;')}</option>`;
        });
        if (actual && (appData.lavadores || []).includes(actual)) lavador.value = actual;
    } else {
        lavador.value = '';
        lavador.classList.add('is-hidden');
    }
}

function addGasto(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (appData.cajaCerrada) { alert('⚠️ Caja cerrada'); return; }

    const c = document.getElementById('gastoConcepto')?.value.trim();
    const m = parseFloat(document.getElementById('gastoMonto')?.value) || 0;
    const tipoMovimiento = document.getElementById('gastoTipo')?.value || 'GENERAL';
    const lavador = document.getElementById('gastoLavador')?.value || '';

    if (!c || m <= 0) {
        alert('Indique el motivo y un monto válido.');
        return;
    }

    if (tipoMovimiento === 'LAVADOR' && !lavador) {
        alert('Seleccione el Lavador al que se le entregó el dinero.');
        return;
    }

    appData.gastos.push({
        id: 'exp_' + Date.now(),
        concepto: c,
        monto: m,
        tipoMovimiento: tipoMovimiento,
        lavador: lavador,
        fecha: new Date().toLocaleDateString(),
        timestamp: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})
    });

    document.getElementById('gastoConcepto').value = '';
    document.getElementById('gastoMonto').value = '';
    const gastoTipo = document.getElementById('gastoTipo');
    if (gastoTipo) gastoTipo.value = 'GENERAL';
    actualizarDestinoGasto();
    saveData();
}

function deleteGasto(id) { if (appData.cajaCerrada) return; appData.gastos = appData.gastos.filter(g=>g.id!==id); saveData(); }

function renderGastosList() {
    const c = document.getElementById('gastosListContainer');
    if (!c) return;
    if (!appData.gastos?.length) {
        c.innerHTML = '<p style="text-align:center;color:var(--gray-400);padding:10px;">Sin gastos.</p>';
        return;
    }

    c.innerHTML = '';
    appData.gastos.forEach(g => {
        const tipo = g.tipoMovimiento || 'GENERAL';
        const tipoTexto = tipo === 'ADMIN' ? 'Administración' : (tipo === 'LAVADOR' ? `Lavador${g.lavador ? ': ' + g.lavador : ''}` : 'Gasto general');
        const tipoClase = tipo === 'ADMIN' ? 'movimiento-tipo admin' : (tipo === 'LAVADOR' ? 'movimiento-tipo lavador' : 'movimiento-tipo general');
        c.innerHTML += `<div class="list-card" style="padding:10px 14px;">
            <div class="list-card-info">
                <h4 style="font-size:.9rem;">${g.concepto} <span style="font-size:0.7rem;color:var(--gray-400);">· ${g.timestamp || ''}</span></h4>
                <span class="${tipoClase}">${tipoTexto}</span>
            </div>
            <div style="display:flex;gap:10px;align-items:center;">
                <strong style="color:var(--danger);">$${(parseFloat(g.monto) || 0).toFixed(2)}</strong>
                <button class="btn-icon danger" style="width:28px;height:28px;" onclick="deleteGasto('${g.id}')"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>`;
    });
}

// Modificar pestañas Entradas y Salidas
function switchMovimientoTab(tabType) {
    const btnSalida = document.getElementById('tabBtnSalida');
    const btnEntrada = document.getElementById('tabBtnEntrada');
    const contentSalida = document.getElementById('tabContentSalida');
    const contentEntrada = document.getElementById('tabContentEntrada');

    if (tabType === 'salida') {
        btnSalida.classList.add('active');
        btnEntrada.classList.remove('active');
        contentSalida.classList.remove('hidden');
        contentEntrada.classList.add('hidden');
    } else {
        btnEntrada.classList.add('active');
        btnSalida.classList.remove('active');
        contentEntrada.classList.remove('hidden');
        contentSalida.classList.add('hidden');
    }
}

let descuentosTickerTimer = null;

function actualizarTickerDescuentos() {
    const ticker = document.getElementById('statDescuentosTicker');
    if (!ticker) return;

    const hoy = new Date().toLocaleDateString();
    const descuentosClientes = appData.registros
        .filter(r => r.fecha === hoy && (parseFloat(r.descuento) || 0) > 0)
        .map(r => ({
            nombre: r.clienteNombre || r.clienteName || 'Cliente',
            monto: Math.min(
                Math.max(0, parseFloat(r.monto) || 0),
                Math.max(0, parseFloat(r.descuento) || 0)
            )
        }));

    const salidasAdmin = appData.gastos
        .filter(g => (g.tipoMovimiento || 'GENERAL') === 'ADMIN' && (!g.fecha || g.fecha === hoy))
        .map(g => ({
            nombre: g.concepto || 'Administración',
            monto: Math.max(0, parseFloat(g.monto) || 0)
        }));

    const ajustes = [...descuentosClientes, ...salidasAdmin];

    if (!ajustes.length) {
        ticker.textContent = 'Sin descuentos ni ajustes hoy';
        return;
    }

    const index = Number(ticker.dataset.index || 0) % ajustes.length;
    const item = ajustes[index];
    ticker.dataset.index = String((index + 1) % ajustes.length);
    ticker.classList.remove('fade-in');
    void ticker.offsetWidth;
    ticker.classList.add('fade-in');
    ticker.textContent = `${item.nombre} — -$${item.monto.toFixed(2)}`;
}

function iniciarTickerDescuentos() {
    if (descuentosTickerTimer) clearInterval(descuentosTickerTimer);
    actualizarTickerDescuentos();
    descuentosTickerTimer = setInterval(actualizarTickerDescuentos, 3500);
}

/* ==================================================
   SECCIÓN: GESTIÓN DE CLIENTES Y DESCUENTOS FIJOS
   ================================================== */
let clienteModalVehiculos = [];

function openClienteModal(index = '') {
    const title = document.getElementById('clienteModalTitle');
    const idxInput = document.getElementById('editClienteIndex');
    const nombre = document.getElementById('clienteModalNombre');
    const telefono = document.getElementById('clienteModalTelefono');
    const descuento = document.getElementById('clienteModalDescuento');
    const vehiculoInput = document.getElementById('clienteModalVehiculoInput');

    if (index !== '' && appData.clientes[index]) {
        const c = appData.clientes[index];
        if (title) title.textContent = 'Editar Cliente';
        if (idxInput) idxInput.value = index;
        if (nombre) nombre.value = c.name || '';
        if (telefono) telefono.value = c.phone || '';
        if (descuento) descuento.value = (parseFloat(c.descuento) || 0).toFixed(2);
        clienteModalVehiculos = Array.isArray(c.vehiculos) ? [...c.vehiculos] : [];
    } else {
        if (title) title.textContent = 'Nuevo Cliente';
        if (idxInput) idxInput.value = '';
        if (nombre) nombre.value = '';
        if (telefono) telefono.value = '';
        if (descuento) descuento.value = '0.00';
        clienteModalVehiculos = [];
    }
    if (vehiculoInput) vehiculoInput.value = '';
    renderClienteModalVehiculos();
    document.getElementById('clienteModal')?.classList.add('open');
}

function editarCliente(i) {
    if (!appData.clientes[i]) return;
    openClienteModal(i);
}

function closeClienteModal() {
    document.getElementById('clienteModal')?.classList.remove('open');
}

function renderClienteModalVehiculos() {
    const c = document.getElementById('clienteModalVehiculosList');
    if (!c) return;
    clienteModalVehiculos = [...new Set((clienteModalVehiculos || []).map(p => String(p).trim().toUpperCase()).filter(Boolean))];
    if (!clienteModalVehiculos.length) {
        c.innerHTML = '<span style="font-size:.76rem;color:var(--gray-400);">Sin placas asociadas.</span>';
        return;
    }
    c.innerHTML = clienteModalVehiculos.map(p => `
        <span style="display:inline-flex;align-items:center;gap:6px;background:var(--gray-100);border:1px solid var(--gray-200);border-radius:20px;padding:6px 9px;font-size:.78rem;font-weight:800;color:var(--dark);">
            ${escapeHtml(p)}
            <button type="button" onclick="quitarVehiculoClienteModal('${escapeHtml(p)}')" style="border:0;background:none;color:var(--danger);padding:0;cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
        </span>`).join('');
}

function agregarVehiculoClienteModal() {
    const input = document.getElementById('clienteModalVehiculoInput');
    const placa = input?.value.trim().toUpperCase() || '';
    if (!placa) return;
    if (!clienteModalVehiculos.includes(placa)) clienteModalVehiculos.push(placa);
    if (input) input.value = '';
    renderClienteModalVehiculos();
}

function quitarVehiculoClienteModal(placa) {
    clienteModalVehiculos = clienteModalVehiculos.filter(p => p !== String(placa).trim().toUpperCase());
    renderClienteModalVehiculos();
}

function saveClienteFromModal(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    const idx = document.getElementById('editClienteIndex')?.value || '';
    const n = document.getElementById('clienteModalNombre')?.value.trim() || '';
    const t = document.getElementById('clienteModalTelefono')?.value.trim() || '';
    const d = Math.max(0, parseFloat(document.getElementById('clienteModalDescuento')?.value) || 0);
    if (!n) return;

    const existente = idx !== '' ? appData.clientes[parseInt(idx)] : null;
    if (existente?.protegido && n !== 'Cliente General') {
        alert('⚠️ No se modifica Cliente General');
        return;
    }

    const cli = {
        id: existente?.id || ('cli_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8)),
        name: n,
        phone: t,
        descuento: d,
        vehiculos: [...new Set(clienteModalVehiculos)],
        protegido: existente?.protegido || false
    };

    if (idx !== '') appData.clientes[parseInt(idx)] = cli;
    else appData.clientes.push(cli);

    saveData();
    closeClienteModal();
}

function deleteCliente(i) {
    if (appData.clientes[i]?.protegido) { alert('⚠️ Cliente General no se borra'); return; }
    if (!appData.clientes[i]) return;
    if (!confirm(`¿Eliminar al cliente "${appData.clientes[i].name}"?`)) return;
    appData.clientes.splice(i, 1);
    saveData();
}

function renderClientsList() {
    const c = document.getElementById('clientsListContainer');
    if (!c) return;
    const q = (document.getElementById('searchClientInput')?.value || '').toLowerCase().trim();
    const f = appData.clientes.map((x,i)=>({...x,_i:i})).filter(x => !x.protegido && (
        (x.name || '').toLowerCase().includes(q) ||
        (x.phone || '').toLowerCase().includes(q) ||
        (x.vehiculos || []).some(p => p.toLowerCase().includes(q))
    ));
    if (!f.length) { c.innerHTML = `<div class="empty-state"><i class="fa-solid fa-users"></i><p>Sin clientes.</p></div>`; return; }
    c.innerHTML = '';
    f.forEach(x => {
        const acciones = x.protegido
            ? `<span style="font-size:.65rem;color:var(--gray-400);padding:4px 8px;background:var(--gray-100);border-radius:10px;">Sistema</span>`
            : `<button class="btn-icon primary" onclick="editarCliente(${x._i})" title="Editar"><i class="fa-solid fa-pen"></i></button>
               <button class="btn-icon danger" onclick="deleteCliente(${x._i})" title="Eliminar"><i class="fa-solid fa-trash"></i></button>`;
        const vehiculos = Array.isArray(x.vehiculos) ? x.vehiculos.length : 0;
        const descuento = Math.max(0, parseFloat(x.descuento) || 0);
        c.innerHTML += `<div class="list-card">
            <div class="list-card-info">
                <h4><i class="fa-solid fa-user-tag" style="color:var(--primary);"></i> ${escapeHtml(x.name || '')}</h4>
                <p><i class="fa-solid fa-phone"></i> ${escapeHtml(x.phone || 'Sin teléfono')} · <i class="fa-solid fa-car"></i> ${vehiculos} ${vehiculos === 1 ? 'vehículo' : 'vehículos'}</p>
                <p class="cliente-descuento-line"><i class="fa-solid fa-tag"></i> Descuento: $${descuento.toFixed(2)}</p>
            </div>
            <div style="display:flex;gap:6px;align-items:center;">${acciones}</div>
        </div>`;
    });
}

function renderRegistroClientesSuggestions(value = '') {
    const drop = document.getElementById('registroClienteSuggestions');
    if (!drop) return;
    const q = String(value || '').trim().toLowerCase();
    if (!q) {
        drop.classList.add('is-hidden');
        drop.style.display = 'none';
        return;
    }
    const matches = appData.clientes.filter(c => !c.protegido && (
        (c.name || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q) ||
        (c.vehiculos || []).some(p => p.toLowerCase().includes(q))
    )).slice(0, 8);
    if (!matches.length) {
        drop.innerHTML = '<div class="placa-suggestion-item"><span>Sin clientes con descuento encontrados</span></div>';
        drop.classList.remove('is-hidden');
        drop.style.display = 'block';
        return;
    }
    drop.innerHTML = matches.map(c => `<div class="placa-suggestion-item" onclick="seleccionarClienteRegistro('${escapeHtml(c.id)}')">
        <span><strong>${escapeHtml(c.name)}</strong> · ${c.vehiculos?.length || 0} vehículos</span>
        <strong class="cliente-descuento-line">-$${(parseFloat(c.descuento)||0).toFixed(2)}</strong>
    </div>`).join('');
    drop.classList.remove('is-hidden');
    drop.style.display = 'block';
}

function seleccionarClienteRegistro(id) {
    const cliente = getClienteById(id);
    if (!cliente) return;
    const idInput = document.getElementById('recordClienteId');
    const search = document.getElementById('recordClienteSearch');
    const descuento = document.getElementById('recordDescuento');
    if (idInput) idInput.value = cliente.id;
    if (search) search.value = cliente.name || '';
    if (descuento) descuento.value = (parseFloat(cliente.descuento)||0).toFixed(2);
    const drop = document.getElementById('registroClienteSuggestions');
    if (drop) {
        drop.classList.add('is-hidden');
        drop.style.display = 'none';
    }
    renderRegistroClienteSeleccionado();
}

function renderRegistroClienteSeleccionado() {
    const box = document.getElementById('registroClienteSeleccionado');
    const chips = document.getElementById('registroClienteVehiculos');
    const id = document.getElementById('recordClienteId')?.value || '';
    const cliente = getClienteById(id);
    if (!cliente) {
        if (box) { box.classList.add('is-hidden'); box.innerHTML = ''; }
        if (chips) { chips.classList.add('is-hidden'); chips.innerHTML = ''; }
        return;
    }
    const d = Math.max(0, parseFloat(cliente.descuento) || 0);
    if (box) {
        box.classList.remove('is-hidden');
        box.innerHTML = `<div><strong>${escapeHtml(cliente.name)}</strong><span>${cliente.phone ? escapeHtml(cliente.phone) : 'Sin teléfono'}</span></div><strong class="cliente-descuento-badge">-$${d.toFixed(2)}</strong><button type="button" onclick="limpiarClienteRegistro()" title="Quitar cliente"><i class="fa-solid fa-xmark"></i></button>`;
    }
    const placas = Array.isArray(cliente.vehiculos) ? cliente.vehiculos : [];
    if (chips) {
        chips.classList.remove('is-hidden');
        chips.innerHTML = placas.length
            ? `<span class="cliente-vehiculos-label">Vehículos:</span>` + placas.map(p => `<button type="button" class="cliente-vehiculo-chip" onclick="seleccionarVehiculoClienteRegistro('${escapeHtml(p)}')">${escapeHtml(p)}</button>`).join('')
            : '<span style="font-size:.75rem;color:var(--gray-400);">Este cliente no tiene placas asociadas.</span>';
    }
}

function seleccionarVehiculoClienteRegistro(placa) {
    const id = document.getElementById('recordClienteId')?.value || '';
    const cliente = getClienteById(id);
    const p = String(placa || '').trim().toUpperCase();
    if (!cliente || !cliente.vehiculos?.includes(p)) return;
    document.getElementById('recordPlaca').value = p;
    if (appData.vehiculosRegistry[p]) {
        selectVehiculoFromSuggestion(p);
    } else {
        document.getElementById('placaStatusBadge').textContent = 'Vehículo Nuevo';
        document.getElementById('placaStatusBadge').classList.remove('registered');
        document.getElementById('recordPropietario').value = cliente.name || 'Cliente General';
        document.getElementById('recordTelefono').value = cliente.phone || '';
    }
    document.getElementById('recordPropietario').value = cliente.name || 'Cliente General';
    document.getElementById('recordTelefono').value = cliente.phone || '';
    const descuento = document.getElementById('recordDescuento');
    if (descuento) descuento.value = (parseFloat(cliente.descuento)||0).toFixed(2);
}

function limpiarClienteRegistro() {
    const id = document.getElementById('recordClienteId');
    const search = document.getElementById('recordClienteSearch');
    const descuento = document.getElementById('recordDescuento');
    if (id) id.value = '';
    if (search) search.value = '';
    if (descuento) descuento.value = '0';
    renderRegistroClienteSeleccionado();
}

/* ==================================================
   SECCIÓN: GESTIÓN DE LAVADORES
   ================================================== */
function addLavador(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (appData.cajaCerrada) { alert('⚠️ Caja cerrada'); return; }
    const n = document.getElementById('newLavadorName')?.value.trim();
    if (n && !appData.lavadores.includes(n)) { 
        appData.lavadores.push(n); 
        document.getElementById('newLavadorName').value = ''; 
        saveData(); 
    }
}

function deleteLavador(n) {
    if (appData.cajaCerrada) { alert('⚠️ Caja cerrada'); return; }
    if (!confirm(`¿Eliminar al lavador "${n}"?`)) return;
    appData.lavadores = appData.lavadores.filter(l => l !== n); 
    saveData();
}

function renderLavadoresList() {
    const c = document.getElementById('lavadoresListContainer'); 
    if (!c) return;
    
    if (!appData.lavadores || appData.lavadores.length === 0) { 
        c.innerHTML = `<div class="empty-state"><i class="fa-solid fa-user-slash"></i><p>No hay lavadores registrados.</p></div>`; 
        return; 
    }
    
    c.innerHTML = '';
    const g = calculateGlobalTotals();
    
    appData.lavadores.forEach(l => {
        const cnt = g.autosPorLavador[l] || 0;
        const ganado = g.ganadoPorLavador[l] || 0;
        const propina = g.propinasPorLavador[l] || 0;
        const totalConPropina = g.totalLavadorConPropina[l] || 0;
        
        const propinaStr = propina > 0 ? ` + $${propina.toFixed(2)} propina = $${totalConPropina.toFixed(2)}` : '';

        c.innerHTML += `
            <div class="list-card">
                <div class="list-card-info">
                    <h4><i class="fa-solid fa-user-gear" style="color: var(--primary);"></i> ${l}</h4>
                    <p style="font-size:0.75rem;color:var(--gray-400);">${cnt} ${cnt === 1 ? 'auto atendido' : 'autos atendidos'} · Ganancia: $${ganado.toFixed(2)}${propinaStr}</p>
                </div>
                <button class="btn-icon danger" onclick="deleteLavador('${l}')" title="Eliminar lavador">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>`;
    });
}

/* ==================================================
   SECCIÓN: INVENTARIO
   ================================================== */
function addInventarioItem(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    const n = document.getElementById('invItemName')?.value.trim();
    const s = parseInt(document.getElementById('invItemStock')?.value)||0;
    if (n) { appData.inventario.push({ id:'inv_'+Date.now(), name:n, stock:s }); document.getElementById('invItemName').value=''; document.getElementById('invItemStock').value=''; saveData(); }
}

function updateStock(id, d) { const it = appData.inventario.find(i=>i.id===id); if (it) { it.stock = Math.max(0, it.stock+d); saveData(); } }

function deleteInventarioItem(id) { appData.inventario = appData.inventario.filter(i=>i.id!==id); saveData(); }

function renderInventarioList() {
    const c = document.getElementById('inventarioListContainer'); if (!c) return;
    if (!appData.inventario?.length) { c.innerHTML = `<div class="empty-state"><i class="fa-solid fa-box-open"></i><p>Sin insumos.</p></div>`; return; }
    c.innerHTML = '';
    appData.inventario.forEach(i => {
        c.innerHTML += `<div class="list-card"><div class="list-card-info"><h4>${i.name}</h4><p>Stock: <strong>${i.stock}</strong></p></div><div style="display:flex;gap:6px;align-items:center;"><button class="btn-icon" onclick="updateStock('${i.id}',-1)">-</button><span style="width:25px;text-align:center;font-weight:800;">${i.stock}</span><button class="btn-icon primary" onclick="updateStock('${i.id}',1)">+</button><button class="btn-icon danger" onclick="deleteInventarioItem('${i.id}')"><i class="fa-solid fa-trash"></i></button></div></div>`;
    });
}

/* ==================================================
   SECCIÓN: MODAL DE CAJA BASE
   ================================================== */
function openCajaModal() {
    if (appData.cajaCerrada) { alert('⚠️ Caja cerrada'); return; }
    
    const input = document.getElementById('inputCajaBaseModal');
    input.value = '';
    input.placeholder = '0.00';
    
    document.getElementById('cajaModal').classList.add('open');
}

function closeCajaModal() { document.getElementById('cajaModal').classList.remove('open'); }

function saveCajaBase(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    const v = parseFloat(document.getElementById('inputCajaBaseModal').value);
    if (!isNaN(v) && v >= 0) { appData.cajaBase = v; saveData(); closeCajaModal(); }
}

/* ==================================================
   SECCIÓN: REPORTE DIARIO
   ================================================== */
function generateReportText() {
    const fh = new Date().toLocaleDateString();
    const hr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const g = calculateGlobalTotals();
    let ef = 0, yp = 0, cob = 0, pen = 0, descuentosReporte = 0;
    
    appData.registros.forEach(r => {
        descuentosReporte += Math.min(
            Math.max(0, parseFloat(r.monto) || 0),
            Math.max(0, parseFloat(r.descuento) || 0)
        );
        const m = getMontoCobro(r);
        if (r.estadoPago === 'PAGADO') { 
            cob += m; 
            if (r.formaPago === 'Efectivo') ef += m; 
            else yp += m; 
        } else {
            pen += m;
        }
    });

    const ie = appData.ingresosExtras.reduce((s, i) => s + (parseFloat(i.monto) || 0), 0);
    const ga = appData.gastos.reduce((s, x) => s + (parseFloat(x.monto) || 0), 0);
    const pl = Object.values(g.yaPagado).reduce((s, v) => s + v, 0);
    const caja = appData.cajaBase + ef + ie - ga - pl;

    let det = '';
    appData.lavadores.forEach(l => {
        const cant = g.autosPorLavador[l] || 0;
        const gano = (g.ganadoPorLavador[l] || 0).toFixed(2);
        const prop = (g.propinasPorLavador[l] || 0).toFixed(2);
        const tot = (g.totalLavadorConPropina[l] || 0).toFixed(2);
        const pag = (g.yaPagado[l] || 0).toFixed(2);
        const debe = (g.pendiente[l] || 0).toFixed(2);
        det += `• ${l}: ${cant} auto${cant === 1 ? '' : 's'} | Base: $${gano} + Propina: $${prop} = Total: $${tot}\n  Pagado: $${pag} | Saldo: $${debe}\n`;
    });

    const r = 
`🚗 CAR WASH PRO ADMIN
📅 Fecha: ${fh} (${hr})
──────────────────────────────
📊 RESUMEN OPERATIVO
• Autos Atendidos: ${appData.registros.length}
• Total Cobrado:   $${cob.toFixed(2)}
  ├ Efectivo:      $${ef.toFixed(2)}
  └ Yappy:         $${yp.toFixed(2)}
• Por Cobrar:      $${pen.toFixed(2)}
• Descuentos:      $${descuentosReporte.toFixed(2)}
• Ingresos Extra:  $${ie.toFixed(2)}
• Gastos:          $${ga.toFixed(2)}

💰 REPARTO DE INGRESOS
• Ganancia Lavadores: $${g.totalLavadoresGanado.toFixed(2)}
• Total Propinas:     $${g.totalPropinas.toFixed(2)}
• Total Lavadores:    $${g.totalLavadoresConPropinaSum.toFixed(2)}
• Administración:     $${Math.max(0, g.totalAdminBruto - descuentosReporte).toFixed(2)}

👷 DETALLE POR LAVADOR
${det || '  (Sin lavadores activos)\n'}• Total Pagado:       $${pl.toFixed(2)}

💵 BALANCE Y ARQUEO
• Caja Base:          $${appData.cajaBase.toFixed(2)}
──────────────────────────────
✅ EFECTIVO EN CAJA: $${caja.toFixed(2)}
──────────────────────────────`;

    const reportElem = document.getElementById('reportTextContent');
    if (reportElem) reportElem.textContent = r;
    return r;
}

function copyReportToClipboard() { 
    navigator.clipboard.writeText(generateReportText()).then(() => alert('📋 Reporte copiado al portapapeles.')); 
}

function verOCopiarReporteCierre() {
    switchView('reporte');
}

/* ==================================================
   SECCIÓN: REINICIO DE DATOS
   ================================================== */
function confirmResetData() {
    if (!confirm("¿Deseas reiniciar el día y limpiar el acumulado de los lavadores?")) return;
    
    appData.registros = [];
    appData.pagosLavadores = [];
    appData.gastos = [];
    appData.ingresosExtras = [];
    appData.cajaBase = 0;
    appData.cajaCerrada = false;
    
    saveData();
    location.reload();
}

/* ==================================================
   SUPABASE + INICIO DE SESIÓN
   Primer paso: proteger el acceso a la aplicación.
   Todavía NO carga ni guarda appData en la nube.
   ================================================== */
const SUPABASE_URL = 'https://brarnwvjpujnfbhaauhs.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_krROk-RYVfDYTvtT8V96kQ_6hVdCyhq';

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

async function comprobarSesionSupabase() {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
        console.error('Error al comprobar sesión Supabase:', error);
        mostrarLoginError('No se pudo comprobar la sesión.');
        return null;
    }

    if (data.session?.user) {
        console.log('Usuario Supabase conectado:', data.session.user.id);
        ocultarLogin();
        return data.session.user;
    }

    console.log('No hay sesión Supabase iniciada.');
    mostrarLogin();
    return null;
}

function mostrarLogin() {
    document.getElementById('authLoginOverlay')?.classList.remove('is-hidden');
}

function ocultarLogin() {
    document.getElementById('authLoginOverlay')?.classList.add('is-hidden');
}

async function mostrarDatosCuenta() {
    const estado = document.getElementById('cuentaEstado');
    const email = document.getElementById('cuentaEmail');
    const badge = document.getElementById('cuentaBadge');

    if (!estado || !email) return;

    const { data, error } = await supabaseClient.auth.getUser();

    if (error || !data?.user) {
        estado.textContent = 'No hay una cuenta conectada';
        email.textContent = '—';

        if (badge) {
            badge.textContent = 'Sin sesión';
            badge.style.background = '#fee2e2';
            badge.style.color = '#991b1b';
        }

        return;
    }

    estado.textContent = 'Cuenta conectada';
    email.textContent = data.user.email || 'Correo no disponible';

    if (badge) {
        badge.textContent = 'Conectada';
        badge.style.background = '#dcfce7';
        badge.style.color = '#166534';
    }
}

async function cerrarSesionCuenta() {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        console.error('Error al cerrar sesión:', error);
        alert('No se pudo cerrar la sesión.');
        return;
    }

    console.log('Sesión cerrada correctamente.');
}

function mostrarLoginError(mensaje) {
    const el = document.getElementById('authLoginError');
    if (!el) return;
    el.textContent = mensaje;
    el.classList.add('show');
}

function limpiarLoginError() {
    const el = document.getElementById('authLoginError');
    if (!el) return;
    el.textContent = '';
    el.classList.remove('show');
}

// Crea una cuenta nueva desde la propia aplicación.
async function crearUsuario(e) {
    if (e) e.preventDefault();

    const email = document.getElementById('authLoginEmail')?.value.trim();
    const password = document.getElementById('authLoginPassword')?.value;
    const btn = document.getElementById('authLoginSubmit');
    const loading = document.getElementById('authLoginLoading');

    limpiarLoginError();

    if (!email || !password) {
        mostrarLoginError('Ingresa un correo y una contraseña.');
        return;
    }

    if (password.length < 6) {
        mostrarLoginError('La contraseña debe tener al menos 6 caracteres.');
        return;
    }

    if (btn) btn.disabled = true;
    if (loading) { loading.textContent = 'Creando usuario...'; loading.classList.add('show'); }

    const { data, error } = await supabaseClient.auth.signUp({
        email,
        password
    });

    if (error) {
        console.error('Error al crear usuario:', error);
        mostrarLoginError(error.message || 'No se pudo crear el usuario.');
        if (btn) btn.disabled = false;
        if (loading) { loading.textContent = 'Verificando acceso...'; loading.classList.remove('show'); }
        return;
    }

    if (data.session?.user) {
        ocultarLogin();
    } else {
        mostrarLoginError('Usuario creado. Revisa tu correo para confirmar la cuenta y luego inicia sesión.');
        document.getElementById('authLoginPassword').value = '';
    }

    if (btn) btn.disabled = false;
    if (loading) { loading.textContent = 'Verificando acceso...'; loading.classList.remove('show'); }
}

function mostrarRegistroCuenta() {
    const form = document.getElementById('authLoginForm');
    const btn = document.getElementById('authLoginSubmit');
    const link = document.getElementById('authRegisterToggle');
    const note = document.getElementById('authRegisterNote');
    const title = document.querySelector('.auth-login-brand p');

    limpiarLoginError();
    if (!form || !btn || !link) return;

    form.setAttribute('onsubmit', 'crearUsuario(event)');
    btn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Crear usuario';
    link.textContent = 'Ya tengo una cuenta · Iniciar sesión';
    link.setAttribute('onclick', 'volverAInicioSesion()');
    note?.classList.add('show');
    if (title) title.textContent = 'Crea tu cuenta para comenzar';
}

function volverAInicioSesion() {
    const form = document.getElementById('authLoginForm');
    const btn = document.getElementById('authLoginSubmit');
    const link = document.getElementById('authRegisterToggle');
    const note = document.getElementById('authRegisterNote');
    const title = document.querySelector('.auth-login-brand p');

    limpiarLoginError();
    if (!form || !btn || !link) return;

    form.setAttribute('onsubmit', 'iniciarSesion(event)');
    btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Iniciar sesión';
    link.textContent = 'Crear usuario';
    link.setAttribute('onclick', 'mostrarRegistroCuenta()');
    note?.classList.remove('show');
    if (title) title.textContent = 'Inicia sesión para continuar';
}

async function iniciarSesion(e) {
    if (e) e.preventDefault();

    const email = document.getElementById('authLoginEmail')?.value.trim();
    const password = document.getElementById('authLoginPassword')?.value;
    const btn = document.getElementById('authLoginSubmit');
    const loading = document.getElementById('authLoginLoading');

    limpiarLoginError();

    if (!email || !password) {
        mostrarLoginError('Ingresa tu correo y contraseña.');
        return;
    }

    if (btn) btn.disabled = true;
    loading?.classList.add('show');

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        console.error('Error al iniciar sesión:', error);
        mostrarLoginError('Correo o contraseña incorrectos.');
        if (btn) btn.disabled = false;
        loading?.classList.remove('show');
        return;
    }

    console.log('Inicio de sesión correcto:', data.user?.id);
    loading?.classList.remove('show');
    ocultarLogin();

    if (btn) btn.disabled = false;
}

supabaseClient.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
        ocultarLogin();
        mostrarDatosCuenta();
    } else {
        mostrarLogin();
    }
});

/* ==================================================
   SECCIÓN: INICIALIZACIÓN
   ================================================== */
const PROFILE_IMG_KEY = 'car_wash_admin_logo';
function loadBusinessLogo() {
    const pi = document.getElementById('profile-image');
    const s = localStorage.getItem(PROFILE_IMG_KEY);
    if (s && pi) pi.src = s;
}

document.addEventListener('DOMContentLoaded', async () => {
    const fi = document.getElementById('file-input'), pi = document.getElementById('profile-image');
    if (fi) fi.addEventListener('change', e => {
        const f = e.target.files[0]; if (!f?.type.startsWith('image/')) return;
        const rd = new FileReader();
        rd.onload = ev => { const d = ev.target.result; if(pi) pi.src=d; localStorage.setItem(PROFILE_IMG_KEY,d); };
        rd.readAsDataURL(f);
    });
    
    const btnReporteCierre = document.getElementById('btn-generar-reporte');
    if (btnReporteCierre) {
        btnReporteCierre.addEventListener('click', verOCopiarReporteCierre);
    }

    loadBusinessLogo();
    actualizarDisplayCajaBase();
    updateUI();
    iniciarTickerDescuentos();
    
    const b = document.getElementById('btnModificarCaja');
    if (b) b.addEventListener('click', openCajaModal);

    // Comprobar acceso al iniciar la aplicación.
    await comprobarSesionSupabase();
});

/* ==================================================
   PWA: INSTALACIÓN EN ANDROID
   No modifica la lógica del negocio.
   ================================================== */
let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    console.log('✅ PWA instalable: beforeinstallprompt disponible.');

    if (!document.getElementById('pwaInstallButton')) {
        const btn = document.createElement('button');
        btn.id = 'pwaInstallButton';
        btn.type = 'button';
        btn.textContent = 'Instalar Admin Car Wash';
        btn.style.cssText = 'position:fixed;left:50%;bottom:82px;transform:translateX(-50%);z-index:100000;border:0;border-radius:999px;padding:12px 18px;background:#0284c7;color:#fff;font-weight:800;box-shadow:0 6px 20px rgba(0,0,0,.22);font-size:14px;';
        btn.addEventListener('click', async () => {
            if (!deferredInstallPrompt) return;
            deferredInstallPrompt.prompt();
            const result = await deferredInstallPrompt.userChoice;
            console.log('Resultado instalación PWA:', result?.outcome);
            deferredInstallPrompt = null;
            btn.remove();
        });
        document.body.appendChild(btn);
    }
});

window.addEventListener('appinstalled', () => {
    console.log('✅ Admin Car Wash fue instalada como PWA.');
    deferredInstallPrompt = null;
    document.getElementById('pwaInstallButton')?.remove();
});