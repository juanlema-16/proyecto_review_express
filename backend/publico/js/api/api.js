// el único módulo de esta interfaz que llama a fetch
const VERSION = '^1.0.0';

export class ErrorApi extends Error {
    constructor(estado, codigo, mensaje, detalles) {
        super(mensaje);
        this.estado = estado;
        this.codigo = codigo;
        this.detalles = detalles;
    }
}

async function pedir(metodo, ruta, cuerpo, { avisar401 = true } = {}) {
    let respuesta;
    try {
        respuesta = await fetch('/api' + ruta, {
            method: metodo,
            credentials: 'include',
            headers: { 'Accept-Version': VERSION, ...(cuerpo ? { 'Content-Type': 'application/json' } : {}) },
            body: cuerpo ? JSON.stringify(cuerpo) : undefined
        });
    } catch {
        throw new ErrorApi(0, 'SIN_CONEXION', 'No hay conexión con el servidor');
    }
    if (respuesta.status === 204) return null;
    const datos = await respuesta.json().catch(() => null);
    if (respuesta.ok) return datos;

    const { codigo = 'ERROR', mensaje = 'Error ' + respuesta.status, detalles = null } = datos?.error ?? {};
    if (respuesta.status === 401 && avisar401) window.dispatchEvent(new Event('sesion-vencida'));
    throw new ErrorApi(respuesta.status, codigo, mensaje, detalles);
}

const consulta = (filtros = {}) => {
    const pares = Object.entries(filtros).filter(([, valor]) => valor);
    return pares.length ? '?' + new URLSearchParams(pares) : '';
};

function recurso(base) {
    return {
        listar: (filtros) => pedir('GET', base + consulta(filtros)),
        obtener: (id) => pedir('GET', base + '/' + id),
        crear: (datos) => pedir('POST', base, datos),
        actualizar: (id, datos) => pedir('PUT', base + '/' + id, datos),
        borrar: (id) => pedir('DELETE', base + '/' + id)
    };
}

export const api = {
    perfil: () => pedir('GET', '/autenticacion/perfil', null, { avisar401: false }),
    iniciarSesion: (datos) => pedir('POST', '/autenticacion/inicio-sesion', datos, { avisar401: false }),
    registrar: (datos) => pedir('POST', '/autenticacion/registro', datos, { avisar401: false }),
    cerrarSesion: () => pedir('POST', '/autenticacion/cierre-sesion'),
    programas: recurso('/programas'),
    categorias: recurso('/categorias'),
    productoras: recurso('/productoras'),
    actores: recurso('/actores'),
    capitulos: recurso('/capitulos'),
    personajes: recurso('/personajes'),
    favoritos: {
        listar: () => pedir('GET', '/favoritos'),
        agregar: (id) => pedir('POST', '/favoritos/' + id),
        quitar: (id) => pedir('DELETE', '/favoritos/' + id)
    }
};
