export class AppError extends Error {
    static estado = 500;
    static codigo = 'ERROR_INTERNO';

    constructor(mensaje, detalles = null) {
        super(mensaje);
        this.name = new.target.name;
        this.estado = new.target.estado;
        this.codigo = new.target.codigo;
        this.detalles = detalles;
        // distingue los errores previstos de los que se escaparon
        this.operacional = true;
        Error.captureStackTrace(this, new.target);
    }

    aRespuesta() {
        const cuerpo = { error: { codigo: this.codigo, mensaje: this.message } };
        if (this.detalles) cuerpo.error.detalles = this.detalles;
        return cuerpo;
    }
}
