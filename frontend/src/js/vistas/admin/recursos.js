import { api } from '../../nucleo/api.js';
import { fecha, fechaCampo, duracion } from '../../nucleo/formato.js';

const HOY = () => new Date().toISOString().slice(0, 10);
const opciones = (lista, texto) => lista.map((elemento) => ({ valor: elemento.id, texto: elemento[texto] }));

// cada recurso del panel se describe acá; panel.js arma tablas, formularios y borrados a partir de esto
export const RECURSOS = [
    {
        clave: 'programas',
        titulo: 'Programas',
        singular: 'programa',
        servicio: api.programas,
        necesita: ['categorias', 'productoras'],
        columnas: [
            { titulo: 'Título', valor: (fila) => fila.titulo },
            { titulo: 'Categoría', valor: (fila) => fila.categoria?.nombre ?? '—' },
            { titulo: 'Productora', valor: (fila) => fila.productora?.nombre ?? '—' }
        ],
        campos: (contexto) => [
            { nombre: 'titulo', etiqueta: 'Título', requerido: true, largoMax: 120 },
            { nombre: 'categoriaId', etiqueta: 'Categoría', tipo: 'select', requerido: true, opciones: opciones(contexto.categorias, 'nombre') },
            { nombre: 'productoraId', etiqueta: 'Productora', tipo: 'select', requerido: true, opciones: opciones(contexto.productoras, 'nombre') },
            { nombre: 'poster', etiqueta: 'Poster (URL de imagen)', tipo: 'url', requerido: true, ancho: true },
            { nombre: 'trailer', etiqueta: 'Trailer (URL de video)', tipo: 'url', requerido: true, ancho: true },
            { nombre: 'sinopsis', etiqueta: 'Sinopsis', tipo: 'textarea', requerido: true, largoMin: 10, largoMax: 2000, ancho: true }
        ],
        // solo al crear: van en la misma transacción que el programa
        capitulosIniciales: true,
        mensajeBorrado: (fila) => 'Se van a borrar también sus capítulos, su reparto y las marcas de favorito de "' + fila.titulo + '".',
        resultadoBorrado: (resultado) => resultado
            ? 'Programa borrado junto con ' + resultado.capitulosBorrados + ' capítulos y ' + resultado.personajesBorrados + ' personajes'
            : 'Programa borrado'
    },
    {
        clave: 'categorias',
        titulo: 'Categorías',
        singular: 'categoría',
        servicio: api.categorias,
        columnas: [
            { titulo: 'Nombre', valor: (fila) => fila.nombre },
            { titulo: 'Descripción', valor: (fila) => fila.descripcion || '—' }
        ],
        campos: () => [
            { nombre: 'nombre', etiqueta: 'Nombre', requerido: true, largoMin: 2, largoMax: 40 },
            { nombre: 'descripcion', etiqueta: 'Descripción', tipo: 'textarea', largoMax: 300, vaciable: true, ancho: true }
        ]
    },
    {
        clave: 'productoras',
        titulo: 'Productoras',
        singular: 'productora',
        servicio: api.productoras,
        columnas: [
            { titulo: 'Nombre', valor: (fila) => fila.nombre },
            { titulo: 'País', valor: (fila) => fila.pais },
            { titulo: 'Fundación', valor: (fila) => fila.anioFundacion }
        ],
        campos: () => [
            { nombre: 'nombre', etiqueta: 'Nombre', requerido: true, largoMin: 2, largoMax: 80 },
            { nombre: 'pais', etiqueta: 'País', requerido: true, largoMin: 2, largoMax: 60 },
            { nombre: 'anioFundacion', etiqueta: 'Año de fundación', tipo: 'number', requerido: true, min: 1888, max: new Date().getFullYear() }
        ]
    },
    {
        clave: 'actores',
        titulo: 'Actores',
        singular: 'actor',
        servicio: api.actores,
        columnas: [
            { titulo: 'Nombre', valor: (fila) => fila.nombre },
            { titulo: 'Nacionalidad', valor: (fila) => fila.nacionalidad },
            { titulo: 'Nacimiento', valor: (fila) => fecha(fila.fechaNacimiento) }
        ],
        campos: () => [
            { nombre: 'nombre', etiqueta: 'Nombre', requerido: true, largoMin: 2, largoMax: 80 },
            { nombre: 'nacionalidad', etiqueta: 'Nacionalidad', requerido: true, largoMin: 2, largoMax: 60 },
            { nombre: 'fechaNacimiento', etiqueta: 'Fecha de nacimiento', tipo: 'date', requerido: true, max: HOY() },
            { nombre: 'foto', etiqueta: 'Foto (URL de imagen)', tipo: 'url', vaciable: true, ancho: true }
        ],
        valores: (fila) => ({ ...fila, fechaNacimiento: fechaCampo(fila.fechaNacimiento) })
    },
    {
        clave: 'capitulos',
        titulo: 'Capítulos',
        singular: 'capítulo',
        servicio: api.capitulos,
        necesita: ['programas'],
        filtroPorPrograma: true,
        columnas: [
            { titulo: 'Programa', valor: (fila, contexto) => contexto.porId.programas.get(fila.programaId)?.titulo ?? '—' },
            { titulo: 'Capítulo', valor: (fila) => fila.etiqueta },
            { titulo: 'Título', valor: (fila) => fila.titulo },
            { titulo: 'Duración', valor: (fila) => duracion(fila.duracionMinutos) }
        ],
        // un capítulo no se muda de programa: el programa solo se elige al crear
        campos: (contexto, { editando }) => [
            ...(editando ? [] : [{ nombre: 'programaId', etiqueta: 'Programa', tipo: 'select', requerido: true, opciones: opciones(contexto.programas, 'titulo'), ancho: true }]),
            ...CAMPOS_CAPITULO
        ],
        valores: (fila) => ({ ...fila, fechaEstreno: fechaCampo(fila.fechaEstreno) })
    },
    {
        clave: 'personajes',
        titulo: 'Personajes',
        singular: 'personaje',
        servicio: api.personajes,
        necesita: ['programas', 'actores'],
        filtroPorPrograma: true,
        columnas: [
            { titulo: 'Personaje', valor: (fila) => fila.nombre },
            { titulo: 'Programa', valor: (fila, contexto) => contexto.porId.programas.get(fila.programaId)?.titulo ?? '—' },
            { titulo: 'Actor', valor: (fila) => fila.actor?.nombre ?? '—' }
        ],
        campos: (contexto) => [
            { nombre: 'nombre', etiqueta: 'Nombre del personaje', requerido: true, largoMax: 80, ancho: true },
            { nombre: 'programaId', etiqueta: 'Programa', tipo: 'select', requerido: true, opciones: opciones(contexto.programas, 'titulo') },
            { nombre: 'actorId', etiqueta: 'Lo interpreta', tipo: 'select', requerido: true, opciones: opciones(contexto.actores, 'nombre') }
        ]
    }
];

export const CAMPOS_CAPITULO = [
    { nombre: 'temporada', etiqueta: 'Temporada', tipo: 'number', requerido: true, min: 1, max: 100 },
    { nombre: 'numero', etiqueta: 'Número', tipo: 'number', requerido: true, min: 1, max: 2000 },
    { nombre: 'titulo', etiqueta: 'Título', requerido: true, largoMax: 120, ancho: true },
    { nombre: 'duracionMinutos', etiqueta: 'Minutos', tipo: 'number', requerido: true, min: 1, max: 600 },
    { nombre: 'fechaEstreno', etiqueta: 'Estreno', tipo: 'date', vaciable: true }
];
