export class GestorTransacciones {
    constructor(cliente) {
        this.cliente = cliente;
    }

    // withTransaction puede reintentar la operación, por eso el resultado se reasigna
    async ejecutar(operacion) {
        const sesion = this.cliente.startSession();
        try {
            let resultado = null;
            await sesion.withTransaction(async () => {
                resultado = await operacion(sesion);
            });
            return resultado;
        } finally {
            await sesion.endSession();
        }
    }
}
