import { textoEnCuerpo, enteroEnCuerpo, fechaEnCuerpo, idEnCuerpo, idEnConsulta } from './comunes.js';
import { Capitulo } from '../../modelos/Capitulo.js';

// el prefijo permite reusarlas para los capítulos iniciales de un programa
export function reglasCapitulo(opcional, prefijo = '') {
    return [
        enteroEnCuerpo(prefijo + 'temporada', 'La temporada', { min: 1, max: 100, opcional }),
        enteroEnCuerpo(prefijo + 'numero', 'El número de capítulo', { min: 1, max: 2000, opcional }),
        textoEnCuerpo(prefijo + 'titulo', 'El título del capítulo', { min: 1, max: 120, opcional }),
        enteroEnCuerpo(prefijo + 'duracionMinutos', 'La duración', { min: 1, max: Capitulo.DURACION_MAXIMA, opcional }),
        fechaEnCuerpo(prefijo + 'fechaEstreno', 'La fecha de estreno', { vacio: true })
    ];
}

export const alListarCapitulos = [idEnConsulta('programa', 'id del programa')];
export const alCrearCapitulo = [idEnCuerpo('programaId', 'id del programa'), ...reglasCapitulo(false)];
export const alActualizarCapitulo = reglasCapitulo(true);
