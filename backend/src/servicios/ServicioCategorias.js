import { CategoriaPrograma } from '../modelos/CategoriaPrograma.js';
import { NoEncontradoError, EnUsoError } from '../errores/index.js';

export class ServicioCategorias {
    constructor(repositorioCategorias, repositorioProgramas) {
        this.categorias = repositorioCategorias;
        this.programas = repositorioProgramas;
    }

    async buscar(id) {
        const categoria = await this.categorias.porId(id);
        if (!categoria) throw new NoEncontradoError('La categoría no existe');
        return categoria;
    }

    async listar() {
        const categorias = await this.categorias.listarOrdenadas();
        return categorias.map((categoria) => categoria.aPublico());
    }

    async obtener(id) {
        return (await this.buscar(id)).aPublico();
    }

    async crear(datos) {
        const categoria = CategoriaPrograma.nueva(datos);
        await this.categorias.crear(categoria);
        return categoria.aPublico();
    }

    async actualizar(id, cambios) {
        const categoria = await this.buscar(id);
        categoria.actualizar(cambios);
        await this.categorias.reemplazar(categoria);
        return categoria.aPublico();
    }

    async borrar(id) {
        const categoria = await this.buscar(id);
        if (await this.programas.usaCategoria(categoria.id)) {
            throw new EnUsoError('No se puede borrar una categoría que tiene programas');
        }
        await this.categorias.borrar(categoria.id);
    }
}
