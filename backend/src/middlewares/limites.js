import rateLimit from 'express-rate-limit';
import { DemasiadasPeticionesError } from '../errores/index.js';

function crearLimite({ maximo, minutos, mensaje }) {
    return rateLimit({
        windowMs: minutos * 60 * 1000,
        limit: maximo,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        handler: (peticion, respuesta, siguiente) => siguiente(new DemasiadasPeticionesError(mensaje))
    });
}

export function limiteGlobal(limites) {
    return crearLimite({
        maximo: limites.global,
        minutos: limites.ventanaMinutos,
        mensaje: 'Demasiadas peticiones. Probá de nuevo en unos minutos.'
    });
}

// más estricto: registro e inicio de sesión son los que se atacan a fuerza bruta
export function limiteAutenticacion(limites) {
    return crearLimite({
        maximo: limites.autenticacion,
        minutos: limites.ventanaMinutos,
        mensaje: 'Demasiados intentos de autenticación. Esperá unos minutos.'
    });
}
