import { NoEncontradoError } from '../errores/index.js';

export class ServicioFavoritos {
    constructor(repositorioUsuarios, servicioProgramas) {
        this.usuarios = repositorioUsuarios;
        this.programas = servicioProgramas;
    }

    // se relee el usuario: el de la petición puede estar desactualizado
    async listar(usuarioId) {
        const usuario = await this.usuarios.porId(usuarioId);
        if (!usuario) throw new NoEncontradoError('El usuario no existe');
        return this.programas.listarPorIds(usuario.favoritos);
    }

    async agregar(usuarioId, programaId) {
        await this.programas.buscar(programaId);
        await this.usuarios.agregarFavorito(usuarioId, programaId);
        return this.listar(usuarioId);
    }

    async quitar(usuarioId, programaId) {
        await this.usuarios.quitarFavorito(usuarioId, programaId);
        return this.listar(usuarioId);
    }
}
