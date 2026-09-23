import { estado } from './afirmaciones.js';

export const POSTER = 'https://ejemplo.com/poster.jpg';
export const TRAILER = 'https://ejemplo.com/trailer.mp4';

async function crear(administrador, ruta, cuerpo) {
    const respuesta = await administrador.post(ruta, cuerpo);
    estado(respuesta, 201, 'No se pudo preparar ' + ruta);
    return respuesta.datos;
}

export function nuevaCategoria(administrador, contexto) {
    return crear(administrador, '/categorias', { nombre: contexto.unico('categoria') });
}

export function nuevaProductora(administrador, contexto) {
    return crear(administrador, '/productoras', { nombre: contexto.unico('productora'), pais: 'Guatemala', anioFundacion: 2000 });
}

export function nuevoActor(administrador, contexto) {
    return crear(administrador, '/actores', { nombre: contexto.unico('actor'), nacionalidad: 'Guatemalteca', fechaNacimiento: '1990-05-20' });
}

export async function nuevoPrograma(administrador, contexto, extra = {}) {
    const categoria = extra.categoriaId ? null : await nuevaCategoria(administrador, contexto);
    const productora = extra.productoraId ? null : await nuevaProductora(administrador, contexto);
    return crear(administrador, '/programas', {
        titulo: contexto.unico('programa'),
        sinopsis: 'Una sinopsis lo bastante larga para pasar.',
        poster: POSTER,
        trailer: TRAILER,
        categoriaId: categoria?.id,
        productoraId: productora?.id,
        ...extra
    });
}

export function nuevoCapitulo(administrador, programaId, temporada, numero) {
    return administrador.post('/capitulos', { programaId, temporada, numero, titulo: 'Capítulo ' + numero, duracionMinutos: 24 });
}
