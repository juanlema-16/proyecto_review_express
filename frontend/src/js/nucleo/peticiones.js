import { CONFIGURACION } from './configuracion.js';

export const EVENTOS = {
    NO_AUTENTICADO: 'api:no-autenticado',
    VERSION_INCOMPATIBLE: 'api:version-incompatible',
    VERSION_SERVIDOR: 'api:version-servidor'
};

export class ErrorApi extends Error {
    constructor(estado, codigo, mensaje, detalles = null) {
        super(mensaje);
        this.estado = estado;
        this.codigo = codigo;
        this.detalles = detalles;
    }
}

function avisar(evento, detalle = null) {
    window.dispatchEvent(new CustomEvent(evento, { detail: detalle }));
}

// el único lugar de toda la interfaz que llama a fetch
export async function pedir(metodo, ruta, { cuerpo = null, redirigirSi401 = true } = {}) {
    const cabeceras = { 'Accept-Version': CONFIGURACION.version };
    if (cuerpo !== null) cabeceras['Content-Type'] = 'application/json';

    let respuesta;
    try {
        respuesta = await fetch(CONFIGURACION.api + ruta, {
            method: metodo,
            credentials: 'include',
            headers: cabeceras,
            body: cuerpo === null ? undefined : JSON.stringify(cuerpo)
        });
    } catch {
        throw new ErrorApi(0, 'SIN_CONEXION', 'No hay conexión con el servidor. Revisá tu red e intentá de nuevo.');
    }

    const versionServidor = respuesta.headers.get('X-API-Version');
    if (versionServidor) avisar(EVENTOS.VERSION_SERVIDOR, versionServidor);

    if (respuesta.status === 204) return null;
    const datos = await respuesta.json().catch(() => null);
    if (respuesta.ok) return datos;

    const error = datos?.error ?? {};
    const falla = new ErrorApi(
        respuesta.status,
        error.codigo ?? 'ERROR',
        error.mensaje ?? 'El servidor respondió con un error ' + respuesta.status,
        error.detalles ?? null
    );
    if (falla.estado === 401 && redirigirSi401) avisar(EVENTOS.NO_AUTENTICADO);
    if (falla.codigo === 'VERSION_NO_COMPATIBLE') avisar(EVENTOS.VERSION_INCOMPATIBLE, falla);
    throw falla;
}
