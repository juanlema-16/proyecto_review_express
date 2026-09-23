import { textoEnCuerpo, idEnCuerpo, idEnConsulta } from './comunes.js';

function reglas(opcional) {
    return [
        textoEnCuerpo('nombre', 'El nombre del personaje', { min: 1, max: 80, opcional }),
        idEnCuerpo('programaId', 'id del programa', opcional),
        idEnCuerpo('actorId', 'id del actor', opcional)
    ];
}

export const alListarPersonajes = [idEnConsulta('programa', 'id del programa')];
export const alCrearPersonaje = reglas(false);
export const alActualizarPersonaje = reglas(true);
