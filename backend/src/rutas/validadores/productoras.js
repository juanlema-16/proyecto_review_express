import { textoEnCuerpo, enteroEnCuerpo } from './comunes.js';
import { Productora } from '../../modelos/Productora.js';

function reglas(opcional) {
    return [
        textoEnCuerpo('nombre', 'El nombre', { min: 2, max: 80, opcional }),
        textoEnCuerpo('pais', 'El país', { min: 2, max: 60, opcional }),
        enteroEnCuerpo('anioFundacion', 'El año de fundación', {
            min: Productora.ANIO_MINIMO,
            max: new Date().getFullYear(),
            opcional
        })
    ];
}

export const alCrearProductora = reglas(false);
export const alActualizarProductora = reglas(true);
