import { pedir } from './peticiones.js';

function consulta(parametros = {}) {
    const limpios = Object.entries(parametros).filter(([, valor]) => valor !== undefined && valor !== null && valor !== '');
    return limpios.length ? '?' + new URLSearchParams(limpios).toString() : '';
}

// las cinco operaciones que comparten todos los recursos del catálogo
function recurso(base) {
    return {
        listar: (filtros) => pedir('GET', base + consulta(filtros)),
        obtener: (id) => pedir('GET', base + '/' + id),
        crear: (datos) => pedir('POST', base, { cuerpo: datos }),
        actualizar: (id, datos) => pedir('PUT', base + '/' + id, { cuerpo: datos }),
        borrar: (id) => pedir('DELETE', base + '/' + id)
    };
}

export const api = {
    autenticacion: {
        registrar: (datos) => pedir('POST', '/autenticacion/registro', { cuerpo: datos, redirigirSi401: false }),
        iniciarSesion: (datos) => pedir('POST', '/autenticacion/inicio-sesion', { cuerpo: datos, redirigirSi401: false }),
        cerrarSesion: () => pedir('POST', '/autenticacion/cierre-sesion', { redirigirSi401: false }),
        // al arrancar se pregunta si hay sesión: un 401 acá es normal, no una expulsión
        perfil: () => pedir('GET', '/autenticacion/perfil', { redirigirSi401: false })
    },
    programas: {
        ...recurso('/programas'),
        capitulos: (id) => pedir('GET', '/programas/' + id + '/capitulos'),
        personajes: (id) => pedir('GET', '/programas/' + id + '/personajes')
    },
    categorias: recurso('/categorias'),
    productoras: recurso('/productoras'),
    actores: recurso('/actores'),
    capitulos: recurso('/capitulos'),
    personajes: recurso('/personajes'),
    favoritos: {
        listar: () => pedir('GET', '/favoritos'),
        agregar: (programaId) => pedir('POST', '/favoritos/' + programaId),
        quitar: (programaId) => pedir('DELETE', '/favoritos/' + programaId)
    }
};
