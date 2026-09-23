import { body } from 'express-validator';
import { textoEnCuerpo, urlEnCuerpo, idEnCuerpo, idEnConsulta, textoEnConsulta } from './comunes.js';
import { reglasCapitulo } from './capitulos.js';

function reglas(opcional) {
    return [
        textoEnCuerpo('titulo', 'El título', { min: 1, max: 120, opcional }),
        textoEnCuerpo('sinopsis', 'La sinopsis', { min: 10, max: 2000, opcional }),
        urlEnCuerpo('poster', 'poster', { opcional }),
        urlEnCuerpo('trailer', 'trailer', { opcional }),
        idEnCuerpo('categoriaId', 'id de la categoría', opcional),
        idEnCuerpo('productoraId', 'id de la productora', opcional)
    ];
}

// capítulos iniciales opcionales: si vienen, el alta entra en una transacción
const capitulosIniciales = [
    body('capitulos').optional().isArray({ max: 50 }).withMessage('Los capítulos deben venir en una lista de hasta 50'),
    ...reglasCapitulo(false, 'capitulos.*.')
];

export const alListarProgramas = [
    idEnConsulta('categoria', 'id de la categoría'),
    idEnConsulta('productora', 'id de la productora'),
    textoEnConsulta('texto')
];
export const alCrearPrograma = [...reglas(false), ...capitulosIniciales];
export const alActualizarPrograma = reglas(true);
