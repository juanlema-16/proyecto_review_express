import { NoAutenticadoError, NoAutorizadoError } from '../errores/index.js';

export function soloAdministrador(peticion, respuesta, siguiente) {
    if (!peticion.usuario) {
        return siguiente(new NoAutenticadoError('Iniciá sesión para continuar'));
    }
    if (!peticion.usuario.esAdministrador()) {
        return siguiente(new NoAutorizadoError('Hace falta ser administrador para esta operación'));
    }
    siguiente();
}
