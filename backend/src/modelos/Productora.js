import { aObjectId, aTexto } from '../utilidades/identificadores.js';
import { texto, entero } from '../utilidades/valores.js';
import { ValidacionError } from '../errores/index.js';

export class Productora {
    // el primer estudio de cine del que hay registro
    static ANIO_MINIMO = 1888;

    constructor({ id = null, nombre, pais, anioFundacion, creadoEn = null, actualizadoEn = null }) {
        this.id = aObjectId(id, 'id de la productora');
        this.nombre = texto(nombre);
        this.pais = texto(pais);
        this.anioFundacion = entero(anioFundacion);
        this.creadoEn = creadoEn;
        this.actualizadoEn = actualizadoEn;
    }

    static desde(documento) {
        if (!documento) return null;
        return new Productora({
            id: documento._id,
            nombre: documento.nombre,
            pais: documento.pais,
            anioFundacion: documento.anioFundacion,
            creadoEn: documento.creadoEn,
            actualizadoEn: documento.actualizadoEn
        });
    }

    static nueva(datos) {
        const ahora = new Date();
        const productora = new Productora({ ...datos, id: null, creadoEn: ahora, actualizadoEn: ahora });
        productora.verificar();
        return productora;
    }

    verificar() {
        if (this.nombre.length < 2) {
            throw new ValidacionError('El nombre de la productora necesita al menos 2 caracteres');
        }
        if (this.pais.length < 2) {
            throw new ValidacionError('El país de la productora es obligatorio');
        }
        const anioActual = new Date().getFullYear();
        if (this.anioFundacion === null || this.anioFundacion < Productora.ANIO_MINIMO || this.anioFundacion > anioActual) {
            throw new ValidacionError('El año de fundación debe estar entre ' + Productora.ANIO_MINIMO + ' y ' + anioActual);
        }
    }

    actualizar({ nombre, pais, anioFundacion }) {
        if (nombre !== undefined) this.nombre = texto(nombre);
        if (pais !== undefined) this.pais = texto(pais);
        if (anioFundacion !== undefined) this.anioFundacion = entero(anioFundacion);
        this.actualizadoEn = new Date();
        this.verificar();
        return this;
    }

    aniosDeTrayectoria(hoy = new Date()) {
        return hoy.getFullYear() - this.anioFundacion;
    }

    aDocumento() {
        return {
            nombre: this.nombre,
            pais: this.pais,
            anioFundacion: this.anioFundacion,
            creadoEn: this.creadoEn,
            actualizadoEn: this.actualizadoEn
        };
    }

    aPublico() {
        return {
            id: aTexto(this.id),
            nombre: this.nombre,
            pais: this.pais,
            anioFundacion: this.anioFundacion,
            aniosDeTrayectoria: this.aniosDeTrayectoria(),
            creadoEn: this.creadoEn,
            actualizadoEn: this.actualizadoEn
        };
    }
}
