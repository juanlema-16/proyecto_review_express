import { html, montar } from '../nucleo/plantilla.js';

export function cargando(texto = 'Cargando…') {
    return html`<div class="estado estado-cargando" role="status"><span class="girador" aria-hidden="true"></span>${texto}</div>`;
}

export function estadoVacio(texto, accion = '') {
    return html`<div class="estado estado-vacio"><p>${texto}</p>${accion}</div>`;
}

export function estadoError(error) {
    const titulo = error.estado === 0 ? 'Sin conexión'
        : error.estado === 503 || error.estado === 502 ? 'El servicio no está disponible'
            : error.estado === 404 ? 'No lo encontramos'
                : 'Algo salió mal';
    return html`
        <div class="estado estado-error" role="alert">
            <p class="estado-titulo">${titulo}</p>
            <p>${error.message}</p>
            <button class="boton boton-secundario" type="button" data-reintentar>Reintentar</button>
        </div>`;
}

// carga, error con reintentar y lista vacía en un solo lugar, para cualquier vista
export async function conEstados(contenedor, opciones) {
    const { cargar, pintar, vacio = 'No hay nada para mostrar.', accionVacio = '', esVacio = (datos) => Array.isArray(datos) && datos.length === 0 } = opciones;
    montar(contenedor, cargando());
    try {
        const datos = await cargar();
        if (!contenedor.isConnected) return;
        if (esVacio(datos)) montar(contenedor, estadoVacio(vacio, accionVacio));
        else pintar(contenedor, datos);
    } catch (error) {
        // un 401 ya lo atiende principal.js mandando al login
        if (error.estado === 401 || !contenedor.isConnected) return;
        montar(contenedor, estadoError(error));
        contenedor.querySelector('[data-reintentar]').addEventListener('click', () => conEstados(contenedor, opciones));
    }
}
