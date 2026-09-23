import { COLECCIONES, COTEJO_ES } from './colecciones.js';

const { CATEGORIAS, PRODUCTORAS, PROGRAMAS, CAPITULOS, ACTORES, PERSONAJES, USUARIOS } = COLECCIONES;

export const INDICES = [
    { coleccion: CATEGORIAS, clave: { nombre: 1 }, opciones: { unique: true, collation: COTEJO_ES, name: 'categoria_nombre_unico' } },
    { coleccion: PRODUCTORAS, clave: { nombre: 1 }, opciones: { unique: true, collation: COTEJO_ES, name: 'productora_nombre_unico' } },
    { coleccion: PROGRAMAS, clave: { titulo: 1 }, opciones: { unique: true, collation: COTEJO_ES, name: 'programa_titulo_unico' } },
    { coleccion: PROGRAMAS, clave: { categoriaId: 1 }, opciones: { name: 'programa_categoria' } },
    { coleccion: PROGRAMAS, clave: { productoraId: 1 }, opciones: { name: 'programa_productora' } },
    {
        coleccion: CAPITULOS,
        clave: { programaId: 1, temporada: 1, numero: 1 },
        opciones: { unique: true, name: 'capitulo_numero_unico_por_temporada' }
    },
    {
        coleccion: PERSONAJES,
        clave: { programaId: 1, nombre: 1, actorId: 1 },
        opciones: { unique: true, collation: COTEJO_ES, name: 'personaje_actor_unico' }
    },
    { coleccion: PERSONAJES, clave: { actorId: 1 }, opciones: { name: 'personaje_actor' } },
    { coleccion: ACTORES, clave: { nombre: 1 }, opciones: { collation: COTEJO_ES, name: 'actor_nombre' } },
    { coleccion: USUARIOS, clave: { correo: 1 }, opciones: { unique: true, name: 'usuario_correo_unico' } },
    { coleccion: USUARIOS, clave: { nombreUsuario: 1 }, opciones: { unique: true, collation: COTEJO_ES, name: 'usuario_nombre_unico' } },
    { coleccion: USUARIOS, clave: { favoritos: 1 }, opciones: { name: 'usuario_favoritos' } }
];

export async function crearIndices(base) {
    for (const { coleccion, clave, opciones } of INDICES) {
        await base.collection(coleccion).createIndex(clave, opciones);
    }
    return INDICES.length;
}
