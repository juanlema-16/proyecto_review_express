import { Capitulo } from '../modelos/Capitulo.js';
import { NoEncontradoError } from '../errores/index.js';

export class ServicioCapitulos {
    constructor(repositorioCapitulos, repositorioProgramas) {
        this.capitulos = repositorioCapitulos;
        this.programas = repositorioProgramas;
    }

    async buscar(id) {
        const capitulo = await this.capitulos.porId(id);
        if (!capitulo) throw new NoEncontradoError('El capítulo no existe');
        return capitulo;
    }

    async verificarPrograma(programaId) {
        if (!(await this.programas.porId(programaId))) {
            throw new NoEncontradoError('El programa indicado no existe');
        }
    }

    async listar({ programaId = null } = {}) {
        if (programaId) return this.porPrograma(programaId);
        const capitulos = await this.capitulos.listarTodos();
        return capitulos.map((capitulo) => capitulo.aPublico());
    }

    async porPrograma(programaId) {
        await this.verificarPrograma(programaId);
        const capitulos = await this.capitulos.porPrograma(programaId);
        return capitulos.map((capitulo) => capitulo.aPublico());
    }

    async obtener(id) {
        return (await this.buscar(id)).aPublico();
    }

    async crear(datos) {
        await this.verificarPrograma(datos.programaId);
        const capitulo = Capitulo.nuevo(datos);
        await this.capitulos.crear(capitulo);
        return capitulo.aPublico();
    }

    // el capítulo no se muda de programa: se borra y se crea en el otro
    async actualizar(id, cambios) {
        const capitulo = await this.buscar(id);
        capitulo.actualizar(cambios);
        await this.capitulos.reemplazar(capitulo);
        return capitulo.aPublico();
    }

    async borrar(id) {
        const capitulo = await this.buscar(id);
        await this.capitulos.borrar(capitulo.id);
    }
}
