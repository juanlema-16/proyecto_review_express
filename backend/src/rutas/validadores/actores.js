import { textoEnCuerpo, fechaEnCuerpo, urlEnCuerpo, textoEnConsulta } from './comunes.js';

function reglas(opcional) {
    return [
        textoEnCuerpo('nombre', 'El nombre', { min: 2, max: 80, opcional }),
        textoEnCuerpo('nacionalidad', 'La nacionalidad', { min: 2, max: 60, opcional }),
        fechaEnCuerpo('fechaNacimiento', 'La fecha de nacimiento', { opcional, noFutura: true }),
        urlEnCuerpo('foto', 'foto', { vacio: true })
    ];
}

export const alListarActores = [textoEnConsulta('texto')];
export const alCrearActor = reglas(false);
export const alActualizarActor = reglas(true);
