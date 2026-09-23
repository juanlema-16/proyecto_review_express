import { textoEnCuerpo } from './comunes.js';

function reglas(opcional) {
    return [
        textoEnCuerpo('nombre', 'El nombre', { min: 2, max: 40, opcional }),
        textoEnCuerpo('descripcion', 'La descripción', { min: 0, max: 300, opcional: true })
    ];
}

export const alCrearCategoria = reglas(false);
export const alActualizarCategoria = reglas(true);
