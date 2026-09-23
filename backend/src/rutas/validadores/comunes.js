import { param, body, query } from 'express-validator';
import { esObjectIdValido } from '../../utilidades/identificadores.js';

export function idEnRuta(nombre = 'id', etiqueta = 'identificador') {
    return param(nombre)
        .custom(esObjectIdValido)
        .withMessage('El ' + etiqueta + ' no es un ObjectId válido');
}

export function idEnConsulta(nombre, etiqueta) {
    return query(nombre)
        .optional({ values: 'falsy' })
        .custom(esObjectIdValido)
        .withMessage('El ' + etiqueta + ' no es un ObjectId válido');
}

export function textoEnConsulta(nombre = 'texto') {
    return query(nombre)
        .optional()
        .isString()
        .isLength({ max: 100 })
        .withMessage('La búsqueda admite hasta 100 caracteres');
}

// opcional: puede faltar (actualización), pero si viene tiene que ser válido.
// vacio: además acepta "" o null, para campos que se pueden dejar en blanco
function campo(nombre, opcional, vacio = false) {
    const validador = body(nombre);
    if (vacio) validador.optional({ values: 'falsy' });
    else if (opcional) validador.optional();
    else validador.exists({ values: 'null' }).withMessage('El campo ' + nombre + ' es obligatorio').bail();
    return validador;
}

export function idEnCuerpo(nombre, etiqueta, opcional = false) {
    return campo(nombre, opcional)
        .custom(esObjectIdValido)
        .withMessage('El ' + etiqueta + ' no es un ObjectId válido');
}

export function textoEnCuerpo(nombre, etiqueta, { min = 1, max = 120, opcional = false } = {}) {
    return campo(nombre, opcional)
        .isString().withMessage(etiqueta + ' debe ser texto').bail()
        .trim()
        .isLength({ min, max })
        .withMessage(etiqueta + ' debe tener entre ' + min + ' y ' + max + ' caracteres');
}

export function urlEnCuerpo(nombre, etiqueta, { opcional = false, vacio = false } = {}) {
    return campo(nombre, opcional, vacio)
        .isString().withMessage('El ' + etiqueta + ' debe ser texto').bail()
        .trim()
        .isURL({ protocols: ['http', 'https'], require_protocol: true })
        .withMessage('El ' + etiqueta + ' debe ser una URL http o https');
}

export function enteroEnCuerpo(nombre, etiqueta, { min, max, opcional = false }) {
    const rango = max === undefined ? { min } : { min, max };
    const mensaje = max === undefined
        ? etiqueta + ' debe ser un entero mayor o igual a ' + min
        : etiqueta + ' debe ser un entero entre ' + min + ' y ' + max;
    return campo(nombre, opcional).isInt(rango).withMessage(mensaje).toInt();
}

export function fechaEnCuerpo(nombre, etiqueta, { opcional = false, vacio = false, noFutura = false } = {}) {
    const validador = campo(nombre, opcional, vacio)
        .isISO8601({ strict: true })
        .withMessage(etiqueta + ' debe ser una fecha válida (AAAA-MM-DD)');
    if (noFutura) {
        validador.bail().custom((valor) => new Date(valor) <= new Date()).withMessage(etiqueta + ' no puede ser futura');
    }
    return validador;
}
