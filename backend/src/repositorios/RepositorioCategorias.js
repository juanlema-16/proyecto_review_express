import { RepositorioBase } from './RepositorioBase.js';
import { CategoriaPrograma } from '../modelos/CategoriaPrograma.js';
import { COLECCIONES, COTEJO_ES } from '../config/colecciones.js';

export class RepositorioCategorias extends RepositorioBase {
    constructor(base) {
        super(base, COLECCIONES.CATEGORIAS, CategoriaPrograma);
    }

    async listarOrdenadas() {
        return this.listar({}, { sort: { nombre: 1 }, collation: COTEJO_ES });
    }

    async porNombre(nombre) {
        return this.uno({ nombre }, { collation: COTEJO_ES });
    }
}
