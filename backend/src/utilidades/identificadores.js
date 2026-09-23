import { ObjectId } from 'mongodb';
import { ValidacionError } from '../errores/index.js';

export function esObjectIdValido(valor) {
    return typeof valor === 'string' && /^[0-9a-fA-F]{24}$/.test(valor);
}

export function aObjectId(valor, campo = 'identificador') {
    if (valor === null || valor === undefined || valor === '') return null;
    if (valor instanceof ObjectId) return valor;
    if (!esObjectIdValido(valor)) {
        throw new ValidacionError('El ' + campo + ' no es válido');
    }
    return new ObjectId(valor);
}

export function aTexto(identificador) {
    return identificador ? identificador.toString() : null;
}

export function mismoId(uno, otro) {
    return Boolean(uno && otro) && uno.toString() === otro.toString();
}
