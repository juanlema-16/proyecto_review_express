import { Actor } from '../modelos/Actor.js';
import { NoEncontradoError, EnUsoError } from '../errores/index.js';

export class ServicioActores {
    constructor(repositorioActores, repositorioPersonajes, repositorioProgramas) {
        this.actores = repositorioActores;
        this.personajes = repositorioPersonajes;
        this.programas = repositorioProgramas;
    }

    async buscar(id) {
        const actor = await this.actores.porId(id);
        if (!actor) throw new NoEncontradoError('El actor no existe');
        return actor;
    }

    async listar({ texto = '' } = {}) {
        const actores = await this.actores.listarOrdenados(texto);
        return actores.map((actor) => actor.aPublico());
    }

    // ficha completa: el actor con los personajes que interpreta y en qué programa
    async obtener(id) {
        const actor = await this.buscar(id);
        const personajes = await this.personajes.porActor(actor.id);
        const programas = await this.programas.porIds(personajes.map((personaje) => personaje.programaId));
        const porPrograma = new Map(programas.map((programa) => [programa.id.toString(), programa.aPublico()]));

        return {
            ...actor.aPublico(),
            personajes: personajes.map((personaje) => ({
                ...personaje.aPublico(),
                programa: porPrograma.get(personaje.programaId.toString()) ?? null
            }))
        };
    }

    async crear(datos) {
        const actor = Actor.nuevo(datos);
        await this.actores.crear(actor);
        return actor.aPublico();
    }

    async actualizar(id, cambios) {
        const actor = await this.buscar(id);
        actor.actualizar(cambios);
        await this.actores.reemplazar(actor);
        return actor.aPublico();
    }

    async borrar(id) {
        const actor = await this.buscar(id);
        if (await this.personajes.usaActor(actor.id)) {
            throw new EnUsoError('No se puede borrar un actor que interpreta personajes');
        }
        await this.actores.borrar(actor.id);
    }
}
