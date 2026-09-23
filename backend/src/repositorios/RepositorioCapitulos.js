import { RepositorioBase } from './RepositorioBase.js';
import { Capitulo } from '../modelos/Capitulo.js';
import { COLECCIONES } from '../config/colecciones.js';
import { aObjectId } from '../utilidades/identificadores.js';

export class RepositorioCapitulos extends RepositorioBase {
    constructor(base) {
        super(base, COLECCIONES.CAPITULOS, Capitulo);
    }

    async porPrograma(programaId) {
        return this.listar(
            { programaId: aObjectId(programaId, 'id del programa') },
            { sort: { temporada: 1, numero: 1 } }
        );
    }

    async listarTodos() {
        return this.listar({}, { sort: { programaId: 1, temporada: 1, numero: 1 } });
    }

    async borrarDelPrograma(programaId, sesion = null) {
        return this.borrarPorFiltro({ programaId: aObjectId(programaId, 'id del programa') }, sesion);
    }
}
