import { RepositorioBase } from './RepositorioBase.js';
import { Personaje } from '../modelos/Personaje.js';
import { COLECCIONES, COTEJO_ES } from '../config/colecciones.js';
import { aObjectId } from '../utilidades/identificadores.js';

export class RepositorioPersonajes extends RepositorioBase {
    constructor(base) {
        super(base, COLECCIONES.PERSONAJES, Personaje);
    }

    async listarTodos() {
        return this.listar({}, { sort: { nombre: 1 }, collation: COTEJO_ES });
    }

    async porPrograma(programaId) {
        return this.listar(
            { programaId: aObjectId(programaId, 'id del programa') },
            { sort: { nombre: 1 }, collation: COTEJO_ES }
        );
    }

    async porActor(actorId) {
        return this.listar(
            { actorId: aObjectId(actorId, 'id del actor') },
            { sort: { nombre: 1 }, collation: COTEJO_ES }
        );
    }

    // mismo actor, mismo personaje, mismo programa: la regla que protege el índice único
    async existeInterpretacion({ programaId, actorId, nombre }, excluirId = null) {
        const filtro = {
            programaId: aObjectId(programaId, 'id del programa'),
            actorId: aObjectId(actorId, 'id del actor'),
            nombre
        };
        if (excluirId) filtro._id = { $ne: aObjectId(excluirId, 'id del personaje') };
        return this.existe(filtro, { collation: COTEJO_ES });
    }

    async usaActor(actorId) {
        return this.existe({ actorId: aObjectId(actorId, 'id del actor') });
    }

    async borrarDelPrograma(programaId, sesion = null) {
        return this.borrarPorFiltro({ programaId: aObjectId(programaId, 'id del programa') }, sesion);
    }
}
