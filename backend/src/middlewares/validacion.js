import { validationResult, matchedData } from 'express-validator';
import { ValidacionError } from '../errores/index.js';

// además de cortar si algo falla, deja en el body solo los campos que se validaron:
// un "rol" o un "_id" colado por el cliente no llega nunca al servicio
export function revisarValidaciones(peticion, respuesta, siguiente) {
    const resultado = validationResult(peticion);
    if (!resultado.isEmpty()) {
        const detalles = resultado.array().map((fallo) => ({ campo: fallo.path, mensaje: fallo.msg }));
        return siguiente(new ValidacionError('Los datos enviados no son válidos', detalles));
    }
    if (peticion.body && typeof peticion.body === 'object') {
        peticion.body = matchedData(peticion, { locations: ['body'], includeOptionals: true });
    }
    siguiente();
}
