import { NoEncontradoError } from '../errores/index.js';

export function rutaNoEncontrada(peticion, respuesta, siguiente) {
    siguiente(new NoEncontradoError('No existe la ruta ' + peticion.method + ' ' + peticion.originalUrl));
}
