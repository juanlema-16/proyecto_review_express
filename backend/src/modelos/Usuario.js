import { aObjectId, aTexto, mismoId } from '../utilidades/identificadores.js';
import { texto } from '../utilidades/valores.js';
import { ValidacionError } from '../errores/index.js';

export class Usuario {
    static ROLES = { ADMINISTRADOR: 'administrador', USUARIO: 'usuario' };

    constructor({ id = null, nombreUsuario, correo, contrasena, rol = Usuario.ROLES.USUARIO, favoritos = [], creadoEn = null, actualizadoEn = null }) {
        this.id = aObjectId(id, 'id del usuario');
        this.nombreUsuario = texto(nombreUsuario);
        this.correo = texto(correo).toLowerCase();
        // siempre el hash de bcrypt, nunca la contraseña en claro
        this.contrasena = texto(contrasena);
        this.rol = texto(rol) || Usuario.ROLES.USUARIO;
        this.favoritos = (favoritos ?? []).map((favorito) => aObjectId(favorito, 'id del programa favorito'));
        this.creadoEn = creadoEn;
        this.actualizadoEn = actualizadoEn;
    }

    static desde(documento) {
        if (!documento) return null;
        return new Usuario({
            id: documento._id,
            nombreUsuario: documento.nombreUsuario,
            correo: documento.correo,
            contrasena: documento.contrasena,
            rol: documento.rol,
            favoritos: documento.favoritos,
            creadoEn: documento.creadoEn,
            actualizadoEn: documento.actualizadoEn
        });
    }

    static nuevo(datos) {
        const ahora = new Date();
        const usuario = new Usuario({ ...datos, id: null, favoritos: [], creadoEn: ahora, actualizadoEn: ahora });
        usuario.verificar();
        return usuario;
    }

    verificar() {
        if (this.nombreUsuario.length < 3) {
            throw new ValidacionError('El nombre de usuario necesita al menos 3 caracteres');
        }
        if (!this.correo.includes('@')) {
            throw new ValidacionError('El correo no tiene un formato válido');
        }
        // un hash de bcrypt siempre empieza con $2 y mide 60 caracteres
        if (!/^\$2[aby]\$/.test(this.contrasena) || this.contrasena.length !== 60) {
            throw new ValidacionError('La contraseña debe guardarse cifrada');
        }
        if (!Object.values(Usuario.ROLES).includes(this.rol)) {
            throw new ValidacionError('El rol del usuario no es válido');
        }
    }

    esAdministrador() {
        return this.rol === Usuario.ROLES.ADMINISTRADOR;
    }

    tieneFavorito(programaId) {
        return this.favoritos.some((favorito) => mismoId(favorito, programaId));
    }

    agregarFavorito(programaId) {
        if (!this.tieneFavorito(programaId)) {
            this.favoritos.push(aObjectId(programaId, 'id del programa'));
            this.actualizadoEn = new Date();
        }
        return this;
    }

    quitarFavorito(programaId) {
        const cantidad = this.favoritos.length;
        this.favoritos = this.favoritos.filter((favorito) => !mismoId(favorito, programaId));
        if (this.favoritos.length !== cantidad) this.actualizadoEn = new Date();
        return this;
    }

    aDocumento() {
        return {
            nombreUsuario: this.nombreUsuario,
            correo: this.correo,
            contrasena: this.contrasena,
            rol: this.rol,
            favoritos: this.favoritos,
            creadoEn: this.creadoEn,
            actualizadoEn: this.actualizadoEn
        };
    }

    // la contraseña no sale nunca
    aPublico() {
        return {
            id: aTexto(this.id),
            nombreUsuario: this.nombreUsuario,
            correo: this.correo,
            rol: this.rol,
            esAdministrador: this.esAdministrador(),
            favoritos: this.favoritos.map(aTexto),
            creadoEn: this.creadoEn,
            actualizadoEn: this.actualizadoEn
        };
    }
}
