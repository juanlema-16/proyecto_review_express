import { RepositorioBase } from './RepositorioBase.js';
import { Actor } from '../modelos/Actor.js';
import { COLECCIONES, COTEJO_ES } from '../config/colecciones.js';
import { escaparRegex } from '../utilidades/valores.js';

export class RepositorioActores extends RepositorioBase {
    constructor(base) {
        super(base, COLECCIONES.ACTORES, Actor);
    }

    async listarOrdenados(texto = '') {
        const filtro = texto ? { nombre: { $regex: escaparRegex(texto), $options: 'i' } } : {};
        return this.listar(filtro, { sort: { nombre: 1 }, collation: COTEJO_ES });
    }
}
