import { AppError } from './AppError.js';

export class ValidacionError extends AppError {
    static estado = 400;
    static codigo = 'VALIDACION';
}

export class NoAutenticadoError extends AppError {
    static estado = 401;
    static codigo = 'NO_AUTENTICADO';
}

export class NoAutorizadoError extends AppError {
    static estado = 403;
    static codigo = 'NO_AUTORIZADO';
}

export class NoEncontradoError extends AppError {
    static estado = 404;
    static codigo = 'NO_ENCONTRADO';
}

export class ConflictoError extends AppError {
    static estado = 409;
    static codigo = 'CONFLICTO';
}

export class DuplicadoError extends ConflictoError {
    static codigo = 'DUPLICADO';
}

export class EnUsoError extends ConflictoError {
    static codigo = 'EN_USO';
}

export class VersionNoCompatibleError extends ConflictoError {
    static codigo = 'VERSION_NO_COMPATIBLE';
}

export class DemasiadasPeticionesError extends AppError {
    static estado = 429;
    static codigo = 'DEMASIADAS_PETICIONES';
}

export class BaseDeDatosError extends AppError {
    static estado = 503;
    static codigo = 'BASE_DE_DATOS';
}

export class ErrorInterno extends AppError {
    static estado = 500;
    static codigo = 'ERROR_INTERNO';

    constructor(mensaje = 'Ocurrió un error inesperado', detalles = null) {
        super(mensaje, detalles);
        // no es un error previsto: se registra completo en el servidor
        this.operacional = false;
    }
}

export { AppError };
