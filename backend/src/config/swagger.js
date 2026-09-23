import { entorno } from './entorno.js';

const referencia = (nombre) => ({ $ref: '#/components/schemas/' + nombre });
const json = (esquema) => ({ content: { 'application/json': { schema: esquema } } });
const lista = (nombre) => json({ type: 'array', items: referencia(nombre) });

const RESPUESTAS = {
    400: { description: 'Datos inválidos', ...json(referencia('Error')) },
    401: { description: 'Sin sesión o sesión vencida', ...json(referencia('Error')) },
    403: { description: 'Hace falta ser administrador', ...json(referencia('Error')) },
    404: { description: 'No existe', ...json(referencia('Error')) },
    409: { description: 'Duplicado, en uso o versión incompatible', ...json(referencia('Error')) }
};

const parametroId = (descripcion) => ({ name: 'id', in: 'path', required: true, description: descripcion, schema: { type: 'string' } });
const sesion = [{ cookieSesion: [] }];

// el CRUD de los recursos del catálogo es siempre igual: se genera en lugar de repetirlo
function crud({ ruta, etiqueta, esquema, entrada, singular, filtros = [], detalle = esquema }) {
    const id = parametroId('id ' + singular);
    return {
        [ruta]: {
            get: { tags: [etiqueta], summary: 'Listar', parameters: filtros, responses: { 200: { description: 'Lista', ...lista(esquema) }, 400: RESPUESTAS[400] } },
            post: {
                tags: [etiqueta], summary: 'Crear (administrador)', security: sesion,
                requestBody: { required: true, ...json(referencia(entrada)) },
                responses: { 201: { description: 'Creado', ...json(referencia(detalle)) }, 400: RESPUESTAS[400], 401: RESPUESTAS[401], 403: RESPUESTAS[403], 409: RESPUESTAS[409] }
            }
        },
        [ruta + '/{id}']: {
            get: { tags: [etiqueta], summary: 'Obtener', parameters: [id], responses: { 200: { description: 'Encontrado', ...json(referencia(detalle)) }, 404: RESPUESTAS[404] } },
            put: {
                tags: [etiqueta], summary: 'Actualizar (administrador)', security: sesion, parameters: [id],
                requestBody: { required: true, ...json(referencia(entrada)) },
                responses: { 200: { description: 'Actualizado', ...json(referencia(esquema)) }, 400: RESPUESTAS[400], 401: RESPUESTAS[401], 403: RESPUESTAS[403], 404: RESPUESTAS[404], 409: RESPUESTAS[409] }
            },
            delete: {
                tags: [etiqueta], summary: 'Borrar (administrador)', security: sesion, parameters: [id],
                responses: { 204: { description: 'Borrado' }, 401: RESPUESTAS[401], 403: RESPUESTAS[403], 404: RESPUESTAS[404], 409: RESPUESTAS[409] }
            }
        }
    };
}

const consulta = (name, description) => ({ name, in: 'query', required: false, description, schema: { type: 'string' } });
const texto = { type: 'string' };
const entero = { type: 'integer' };
const fecha = { type: 'string', format: 'date' };
const url = { type: 'string', format: 'uri' };
const identificador = { type: 'string', example: '65a1b2c3d4e5f60718293a4b' };
const marcas = { creadoEn: { type: 'string', format: 'date-time' }, actualizadoEn: { type: 'string', format: 'date-time' } };

export const documentoSwagger = {
    openapi: '3.0.3',
    info: {
        title: 'Proyecto Review API',
        version: entorno.version,
        description: 'Catálogo de programas de televisión: categorías, productoras, programas, capítulos, actores y personajes.\n\n'
            + 'La sesión viaja en una cookie httpOnly: iniciá sesión con `POST /autenticacion/inicio-sesion` y el navegador la manda solo.\n\n'
            + 'La versión se negocia con la cabecera `Accept-Version` (rango semver). Si no es compatible, 409.'
    },
    servers: [{ url: '/api' }],
    components: {
        securitySchemes: {
            cookieSesion: { type: 'apiKey', in: 'cookie', name: entorno.cookie.nombre }
        },
        parameters: {
            version: { name: 'Accept-Version', in: 'header', required: false, schema: { type: 'string', example: '^1.0.0' } }
        },
        schemas: {
            Error: {
                type: 'object',
                properties: {
                    error: {
                        type: 'object',
                        properties: {
                            codigo: { type: 'string', example: 'DUPLICADO' },
                            mensaje: { type: 'string', example: 'Ya existe un programa con ese título' },
                            detalles: { type: 'array', items: { type: 'object', properties: { campo: texto, mensaje: texto } } }
                        }
                    }
                }
            },
            Categoria: { type: 'object', properties: { id: identificador, nombre: texto, descripcion: texto, ...marcas } },
            CategoriaEntrada: { type: 'object', required: ['nombre'], properties: { nombre: { type: 'string', example: 'anime' }, descripcion: texto } },
            Productora: { type: 'object', properties: { id: identificador, nombre: texto, pais: texto, anioFundacion: entero, aniosDeTrayectoria: entero, ...marcas } },
            ProductoraDetalle: { allOf: [referencia('Productora'), { type: 'object', properties: { programas: { type: 'array', items: referencia('Programa') } } }] },
            ProductoraEntrada: {
                type: 'object', required: ['nombre', 'pais', 'anioFundacion'],
                properties: { nombre: { type: 'string', example: 'Toei Animation' }, pais: { type: 'string', example: 'Japón' }, anioFundacion: { type: 'integer', example: 1948 } }
            },
            Programa: {
                type: 'object',
                properties: {
                    id: identificador, titulo: texto, sinopsis: texto, poster: url, trailer: url,
                    categoriaId: identificador, productoraId: identificador,
                    categoria: referencia('Categoria'), productora: referencia('Productora'), ...marcas
                }
            },
            ProgramaDetalle: {
                allOf: [referencia('Programa'), {
                    type: 'object',
                    properties: {
                        capitulos: { type: 'array', items: referencia('Capitulo') },
                        reparto: { type: 'array', items: referencia('Personaje') }
                    }
                }]
            },
            ProgramaEntrada: {
                type: 'object', required: ['titulo', 'sinopsis', 'poster', 'trailer', 'categoriaId', 'productoraId'],
                properties: {
                    titulo: { type: 'string', example: 'Dragon Ball' },
                    sinopsis: { type: 'string', example: 'Goku busca las esferas del dragón.' },
                    poster: { type: 'string', example: 'https://ejemplo.com/poster.jpg' },
                    trailer: { type: 'string', example: 'https://www.youtube.com/watch?v=abc' },
                    categoriaId: identificador,
                    productoraId: identificador,
                    capitulos: { type: 'array', description: 'Solo al crear. Entran en la misma transacción.', items: referencia('CapituloInicial') }
                }
            },
            ResultadoBorrado: { type: 'object', properties: { capitulosBorrados: entero, personajesBorrados: entero, favoritosQuitados: entero } },
            Capitulo: {
                type: 'object',
                properties: {
                    id: identificador, programaId: identificador, temporada: entero, numero: entero, etiqueta: { type: 'string', example: 'T1E03' },
                    titulo: texto, duracionMinutos: entero, fechaEstreno: fecha, estrenado: { type: 'boolean' }, ...marcas
                }
            },
            CapituloInicial: {
                type: 'object', required: ['temporada', 'numero', 'titulo', 'duracionMinutos'],
                properties: { temporada: entero, numero: entero, titulo: texto, duracionMinutos: entero, fechaEstreno: fecha }
            },
            CapituloEntrada: {
                allOf: [referencia('CapituloInicial'), { type: 'object', required: ['programaId'], properties: { programaId: identificador } }]
            },
            Actor: { type: 'object', properties: { id: identificador, nombre: texto, nacionalidad: texto, fechaNacimiento: fecha, edad: entero, foto: url, ...marcas } },
            ActorDetalle: {
                allOf: [referencia('Actor'), {
                    type: 'object',
                    properties: { personajes: { type: 'array', items: { allOf: [referencia('Personaje'), { type: 'object', properties: { programa: referencia('Programa') } }] } } }
                }]
            },
            ActorEntrada: {
                type: 'object', required: ['nombre', 'nacionalidad', 'fechaNacimiento'],
                properties: { nombre: texto, nacionalidad: texto, fechaNacimiento: fecha, foto: url }
            },
            Personaje: {
                type: 'object',
                properties: { id: identificador, nombre: texto, programaId: identificador, actorId: identificador, actor: referencia('Actor'), ...marcas }
            },
            PersonajeEntrada: {
                type: 'object', required: ['nombre', 'programaId', 'actorId'],
                properties: { nombre: texto, programaId: identificador, actorId: identificador }
            },
            Usuario: {
                type: 'object',
                properties: {
                    id: identificador, nombreUsuario: texto, correo: texto,
                    rol: { type: 'string', enum: ['administrador', 'usuario'] },
                    esAdministrador: { type: 'boolean' },
                    favoritos: { type: 'array', items: identificador }, ...marcas
                }
            },
            Registro: {
                type: 'object', required: ['nombreUsuario', 'correo', 'contrasena'],
                properties: { nombreUsuario: { type: 'string', example: 'juan' }, correo: { type: 'string', example: 'juan@review.test' }, contrasena: { type: 'string', example: 'Secreta123' } }
            },
            InicioSesion: {
                type: 'object', required: ['correo', 'contrasena'],
                properties: { correo: { type: 'string', example: 'admin@review.test' }, contrasena: { type: 'string', example: 'Admin1234' } }
            }
        }
    },
    paths: {
        '/autenticacion/registro': {
            post: {
                tags: ['Autenticación'], summary: 'Crear cuenta de usuario y abrir sesión',
                requestBody: { required: true, ...json(referencia('Registro')) },
                responses: { 201: { description: 'Registrado; deja la cookie de sesión', ...json(referencia('Usuario')) }, 400: RESPUESTAS[400], 409: RESPUESTAS[409], 429: { description: 'Demasiados intentos' } }
            }
        },
        '/autenticacion/inicio-sesion': {
            post: {
                tags: ['Autenticación'], summary: 'Iniciar sesión',
                requestBody: { required: true, ...json(referencia('InicioSesion')) },
                responses: { 200: { description: 'Sesión abierta; deja la cookie', ...json(referencia('Usuario')) }, 400: RESPUESTAS[400], 401: RESPUESTAS[401], 429: { description: 'Demasiados intentos' } }
            }
        },
        '/autenticacion/cierre-sesion': {
            post: { tags: ['Autenticación'], summary: 'Cerrar sesión y borrar la cookie', responses: { 204: { description: 'Sesión cerrada' } } }
        },
        '/autenticacion/perfil': {
            get: { tags: ['Autenticación'], summary: 'Usuario de la sesión actual', security: sesion, responses: { 200: { description: 'Perfil', ...json(referencia('Usuario')) }, 401: RESPUESTAS[401] } }
        },
        ...crud({
            ruta: '/programas', etiqueta: 'Programas', singular: 'del programa',
            esquema: 'Programa', entrada: 'ProgramaEntrada', detalle: 'ProgramaDetalle',
            filtros: [consulta('categoria', 'id de la categoría'), consulta('productora', 'id de la productora'), consulta('texto', 'parte del título')]
        }),
        '/programas/{id}/capitulos': {
            get: { tags: ['Programas'], summary: 'Capítulos del programa', parameters: [parametroId('id del programa')], responses: { 200: { description: 'Capítulos', ...lista('Capitulo') }, 404: RESPUESTAS[404] } }
        },
        '/programas/{id}/personajes': {
            get: { tags: ['Programas'], summary: 'Reparto del programa', parameters: [parametroId('id del programa')], responses: { 200: { description: 'Personajes con su actor', ...lista('Personaje') }, 404: RESPUESTAS[404] } }
        },
        ...crud({ ruta: '/categorias', etiqueta: 'Categorías', singular: 'de la categoría', esquema: 'Categoria', entrada: 'CategoriaEntrada' }),
        ...crud({ ruta: '/productoras', etiqueta: 'Productoras', singular: 'de la productora', esquema: 'Productora', entrada: 'ProductoraEntrada', detalle: 'ProductoraDetalle' }),
        ...crud({ ruta: '/actores', etiqueta: 'Actores', singular: 'del actor', esquema: 'Actor', entrada: 'ActorEntrada', detalle: 'ActorDetalle', filtros: [consulta('texto', 'parte del nombre')] }),
        ...crud({ ruta: '/capitulos', etiqueta: 'Capítulos', singular: 'del capítulo', esquema: 'Capitulo', entrada: 'CapituloEntrada', filtros: [consulta('programa', 'id del programa')] }),
        ...crud({ ruta: '/personajes', etiqueta: 'Personajes', singular: 'del personaje', esquema: 'Personaje', entrada: 'PersonajeEntrada', filtros: [consulta('programa', 'id del programa')] }),
        '/favoritos': {
            get: { tags: ['Favoritos'], summary: 'Mis programas favoritos', security: sesion, responses: { 200: { description: 'Favoritos', ...lista('Programa') }, 401: RESPUESTAS[401] } }
        },
        '/favoritos/{programaId}': {
            post: {
                tags: ['Favoritos'], summary: 'Marcar como favorito', security: sesion,
                parameters: [{ name: 'programaId', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Favoritos actualizados', ...lista('Programa') }, 401: RESPUESTAS[401], 404: RESPUESTAS[404] }
            },
            delete: {
                tags: ['Favoritos'], summary: 'Quitar de favoritos', security: sesion,
                parameters: [{ name: 'programaId', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Favoritos actualizados', ...lista('Programa') }, 401: RESPUESTAS[401] }
            }
        }
    }
};

// el borrado de un programa informa cuánto arrastró la transacción
documentoSwagger.paths['/programas/{id}'].delete.responses = {
    200: { description: 'Borrado junto con sus capítulos, personajes y favoritos', ...json(referencia('ResultadoBorrado')) },
    401: RESPUESTAS[401], 403: RESPUESTAS[403], 404: RESPUESTAS[404]
};

// la cabecera de versión vale para todas las operaciones
for (const operaciones of Object.values(documentoSwagger.paths)) {
    for (const operacion of Object.values(operaciones)) {
        operacion.parameters = [{ $ref: '#/components/parameters/version' }, ...(operacion.parameters ?? [])];
    }
}
