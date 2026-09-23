import { api } from './api.js';

// el usuario de la sesión y sus favoritos; el menú y las tarjetas se enteran por escuchar()
class Sesion {
    #usuario = null;
    #favoritos = new Set();
    #oyentes = new Set();

    get usuario() {
        return this.#usuario;
    }

    get iniciada() {
        return this.#usuario !== null;
    }

    get esAdministrador() {
        return this.#usuario?.rol === 'administrador';
    }

    escuchar(oyente) {
        this.#oyentes.add(oyente);
        return () => this.#oyentes.delete(oyente);
    }

    #avisar() {
        for (const oyente of this.#oyentes) oyente(this.#usuario);
    }

    establecer(usuario) {
        this.#usuario = usuario;
        this.#favoritos = new Set(usuario?.favoritos ?? []);
        this.#avisar();
    }

    limpiar() {
        if (this.#usuario === null) return;
        this.establecer(null);
    }

    async cargar() {
        try {
            this.establecer(await api.autenticacion.perfil());
        } catch {
            this.establecer(null);
        }
    }

    async cerrar() {
        try {
            await api.autenticacion.cerrarSesion();
        } finally {
            this.limpiar();
        }
    }

    esFavorito(programaId) {
        return this.#favoritos.has(programaId);
    }

    // devuelve el nuevo estado: true si quedó marcado
    async alternarFavorito(programaId) {
        const lista = this.esFavorito(programaId)
            ? await api.favoritos.quitar(programaId)
            : await api.favoritos.agregar(programaId);
        this.#favoritos = new Set(lista.map((programa) => programa.id));
        return this.esFavorito(programaId);
    }
}

export const sesion = new Sesion();
