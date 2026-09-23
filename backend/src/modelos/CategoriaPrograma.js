import { aObjectId, aTexto } from '../utilidades/identificadores.js';
import { texto } from '../utilidades/valores.js';
import { ValidacionError } from '../errores/index.js';

export class CategoriaPrograma {
    constructor({ id = null, nombre, descripcion = '', creadoEn = null, actualizadoEn = null }) {
        this.id = aObjectId(id, 'id de la categoría');
        this.nombre = texto(nombre);
        this.descripcion = texto(descripcion);
        this.creadoEn = creadoEn;
        this.actualizadoEn = actualizadoEn;
    }

    static desde(documento) {
        if (!documento) return null;
        return new CategoriaPrograma({
            id: documento._id,
            nombre: documento.nombre,
            descripcion: documento.descripcion,
            creadoEn: documento.creadoEn,
            actualizadoEn: documento.actualizadoEn
        });
    }

    static nueva(datos) {
        const ahora = new Date();
        const categoria = new CategoriaPrograma({ ...datos, id: null, creadoEn: ahora, actualizadoEn: ahora });
        categoria.verificar();
        return categoria;
    }

    verificar() {
        if (this.nombre.length < 2) {
            throw new ValidacionError('El nombre de la categoría necesita al menos 2 caracteres');
        }
    }

    actualizar({ nombre, descripcion }) {
        if (nombre !== undefined) this.nombre = texto(nombre);
        if (descripcion !== undefined) this.descripcion = texto(descripcion);
        this.actualizadoEn = new Date();
        this.verificar();
        return this;
    }

    aDocumento() {
        return {
            nombre: this.nombre,
            descripcion: this.descripcion,
            creadoEn: this.creadoEn,
            actualizadoEn: this.actualizadoEn
        };
    }

    aPublico() {
        return {
            id: aTexto(this.id),
            nombre: this.nombre,
            descripcion: this.descripcion,
            creadoEn: this.creadoEn,
            actualizadoEn: this.actualizadoEn
        };
    }
}
