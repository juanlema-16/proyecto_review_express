import {
    MongoServerSelectionError,
    MongoNetworkError,
    MongoNotConnectedError,
    MongoTopologyClosedError,
    MongoExpiredSessionError,
    MongoClientClosedError,
    MongoServerClosedError
} from 'mongodb';
import {
    AppError,
    ErrorInterno,
    DuplicadoError,
    ValidacionError,
    BaseDeDatosError,
    NoAutenticadoError
} from '../errores/index.js';

const ERRORES_DE_MONGO = [
    MongoServerSelectionError,
    MongoNetworkError,
    MongoNotConnectedError,
    MongoTopologyClosedError,
    MongoExpiredSessionError,
    MongoClientClosedError,
    MongoServerClosedError
];

const ERRORES_DE_TOKEN = ['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'];

// el mensaje del 11000 trae el nombre del índice que chocó: los nombres salen de config/indices.js
const MENSAJES_POR_INDICE = {
    programa_titulo_unico: 'Ya existe un programa con ese título',
    capitulo_numero_unico_por_temporada: 'Ese número de capítulo ya existe en esa temporada',
    personaje_actor_unico: 'Ese actor ya interpreta a ese personaje en ese programa',
    categoria_nombre_unico: 'Ya existe una categoría con ese nombre',
    productora_nombre_unico: 'Ya existe una productora con ese nombre',
    usuario_correo_unico: 'Ese correo ya está registrado',
    usuario_nombre_unico: 'Ese nombre de usuario ya está tomado'
};

export class ManejadorErrores {
    constructor(registrar = console.error) {
        this.registrar = registrar;
    }

    // el índice único puede llegar suelto o dentro de un error de escritura masiva
    duplicado(error) {
        // writeErrors es un objeto si falló una escritura y una lista si fallaron varias
        const [escritura] = [].concat(error?.writeErrors ?? []);
        if ((error?.code ?? escritura?.code) !== 11000) return null;

        const texto = String(escritura?.errmsg ?? error.message ?? '');
        const indice = texto.match(/index: (\S+)/)?.[1];
        const mensaje = MENSAJES_POR_INDICE[indice] ?? 'Ya existe un registro con esos datos';
        return new DuplicadoError(mensaje, { indice: indice ?? null });
    }

    traducir(error) {
        if (error instanceof AppError) return error;

        const duplicado = this.duplicado(error);
        if (duplicado) return duplicado;
        if (error?.type === 'entity.parse.failed') {
            return new ValidacionError('El cuerpo de la petición no es un JSON válido');
        }
        if (error?.type === 'entity.too.large') {
            return new ValidacionError('El cuerpo de la petición es demasiado grande');
        }
        if (ERRORES_DE_MONGO.some((Clase) => error instanceof Clase)) {
            return new BaseDeDatosError('La base de datos no está disponible en este momento');
        }
        if (ERRORES_DE_TOKEN.includes(error?.name)) {
            return new NoAutenticadoError('La sesión no es válida o ya expiró');
        }
        return new ErrorInterno();
    }

    // única salida de errores de toda la API: traduce primero y responde una sola vez
    manejar = (error, peticion, respuesta, siguiente) => {
        if (respuesta.headersSent) return siguiente(error);

        const traducido = this.traducir(error);
        if (!traducido.operacional) this.registrar(error);
        respuesta.status(traducido.estado).json(traducido.aRespuesta());
    };
}
