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

// el orden importa: el índice de personajes también tiene "nombre"
const MENSAJES_DUPLICADO = [
    { campo: 'temporada', mensaje: 'Ese número de capítulo ya existe en esa temporada' },
    { campo: 'actorId', mensaje: 'Ese actor ya interpreta a ese personaje en ese programa' },
    { campo: 'titulo', mensaje: 'Ya existe un programa con ese título' },
    { campo: 'correo', mensaje: 'Ese correo ya está registrado' },
    { campo: 'nombreUsuario', mensaje: 'Ese nombre de usuario ya está tomado' },
    { campo: 'nombre', mensaje: 'Ya existe un registro con ese nombre' }
];

export class ManejadorErrores {
    constructor(registrar = console.error) {
        this.registrar = registrar;
    }

    // el índice único puede llegar suelto o dentro de un error de escritura masiva
    patronDuplicado(error) {
        // writeErrors es un objeto si falló una escritura y una lista si fallaron varias
        const [escritura] = [].concat(error?.writeErrors ?? []);
        const codigo = error?.code ?? escritura?.code;
        if (codigo !== 11000) return null;
        return error?.keyPattern ?? escritura?.err?.keyPattern ?? {};
    }

    mensajeDuplicado(patron) {
        const campos = Object.keys(patron);
        const conocido = MENSAJES_DUPLICADO.find((opcion) => campos.includes(opcion.campo));
        return conocido ? conocido.mensaje : 'Ya existe un registro con esos datos';
    }

    traducir(error) {
        if (error instanceof AppError) return error;

        const patron = this.patronDuplicado(error);
        if (patron) {
            return new DuplicadoError(this.mensajeDuplicado(patron), { campos: Object.keys(patron) });
        }
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
