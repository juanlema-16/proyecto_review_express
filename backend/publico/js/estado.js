import { api } from './api/api.js';

// el usuario de la sesión; null si no entró
export const estado = {
    usuario: null,
    favoritos: new Set(),

    get esAdministrador() {
        return this.usuario?.rol === 'administrador';
    },

    fijar(usuario) {
        this.usuario = usuario;
        this.favoritos = new Set(usuario?.favoritos ?? []);
        window.dispatchEvent(new Event('sesion-cambio'));
    },

    async cargar() {
        this.fijar(await api.perfil().catch(() => null));
    }
};
