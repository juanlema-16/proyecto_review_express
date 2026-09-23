import { aObjectId, aTexto, mismoId } from '../utilidades/identificadores.js';
import { texto } from '../utilidades/valores.js';
import { ValidacionError } from '../errores/index.js';

export class Programa {
    constructor({ id = null, titulo, sinopsis, poster, trailer, categoriaId, productoraId, creadoEn = null, actualizadoEn = null }) {
        this.id = aObjectId(id, 'id del programa');
        this.titulo = texto(titulo);
        this.sinopsis = texto(sinopsis);
        this.poster = texto(poster);
        this.trailer = texto(trailer);
        this.categoriaId = aObjectId(categoriaId, 'id de la categoría');
        this.productoraId = aObjectId(productoraId, 'id de la productora');
        this.creadoEn = creadoEn;
        this.actualizadoEn = actualizadoEn;
    }

    static desde(documento) {
        if (!documento) return null;
        return new Programa({
            id: documento._id,
            titulo: documento.titulo,
            sinopsis: documento.sinopsis,
            poster: documento.poster,
            trailer: documento.trailer,
            categoriaId: documento.categoriaId,
            productoraId: documento.productoraId,
            creadoEn: documento.creadoEn,
            actualizadoEn: documento.actualizadoEn
        });
    }

    static nuevo(datos) {
        const ahora = new Date();
        const programa = new Programa({ ...datos, id: null, creadoEn: ahora, actualizadoEn: ahora });
        programa.verificar();
        return programa;
    }

    verificar() {
        if (this.titulo.length < 1) {
            throw new ValidacionError('El título del programa es obligatorio');
        }
        if (this.sinopsis.length < 10) {
            throw new ValidacionError('La sinopsis necesita al menos 10 caracteres');
        }
        if (!this.poster || !this.trailer) {
            throw new ValidacionError('El programa necesita poster y trailer');
        }
        if (!this.categoriaId) {
            throw new ValidacionError('El programa debe pertenecer a una categoría');
        }
        if (!this.productoraId) {
            throw new ValidacionError('El programa debe tener una productora');
        }
    }

    actualizar({ titulo, sinopsis, poster, trailer, categoriaId, productoraId }) {
        if (titulo !== undefined) this.titulo = texto(titulo);
        if (sinopsis !== undefined) this.sinopsis = texto(sinopsis);
        if (poster !== undefined) this.poster = texto(poster);
        if (trailer !== undefined) this.trailer = texto(trailer);
        if (categoriaId !== undefined) this.categoriaId = aObjectId(categoriaId, 'id de la categoría');
        if (productoraId !== undefined) this.productoraId = aObjectId(productoraId, 'id de la productora');
        this.actualizadoEn = new Date();
        this.verificar();
        return this;
    }

    esDeCategoria(categoriaId) {
        return mismoId(this.categoriaId, categoriaId);
    }

    aDocumento() {
        return {
            titulo: this.titulo,
            sinopsis: this.sinopsis,
            poster: this.poster,
            trailer: this.trailer,
            categoriaId: this.categoriaId,
            productoraId: this.productoraId,
            creadoEn: this.creadoEn,
            actualizadoEn: this.actualizadoEn
        };
    }

    aPublico() {
        return {
            id: aTexto(this.id),
            titulo: this.titulo,
            sinopsis: this.sinopsis,
            poster: this.poster,
            trailer: this.trailer,
            categoriaId: aTexto(this.categoriaId),
            productoraId: aTexto(this.productoraId),
            creadoEn: this.creadoEn,
            actualizadoEn: this.actualizadoEn
        };
    }
}
