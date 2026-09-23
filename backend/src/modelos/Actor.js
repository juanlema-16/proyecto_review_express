import { aObjectId, aTexto } from '../utilidades/identificadores.js';
import { texto, fecha } from '../utilidades/valores.js';
import { ValidacionError } from '../errores/index.js';

export class Actor {
    constructor({ id = null, nombre, nacionalidad, fechaNacimiento, foto = '', creadoEn = null, actualizadoEn = null }) {
        this.id = aObjectId(id, 'id del actor');
        this.nombre = texto(nombre);
        this.nacionalidad = texto(nacionalidad);
        this.fechaNacimiento = fecha(fechaNacimiento);
        this.foto = texto(foto);
        this.creadoEn = creadoEn;
        this.actualizadoEn = actualizadoEn;
    }

    static desde(documento) {
        if (!documento) return null;
        return new Actor({
            id: documento._id,
            nombre: documento.nombre,
            nacionalidad: documento.nacionalidad,
            fechaNacimiento: documento.fechaNacimiento,
            foto: documento.foto,
            creadoEn: documento.creadoEn,
            actualizadoEn: documento.actualizadoEn
        });
    }

    static nuevo(datos) {
        const ahora = new Date();
        const actor = new Actor({ ...datos, id: null, creadoEn: ahora, actualizadoEn: ahora });
        actor.verificar();
        return actor;
    }

    verificar() {
        if (this.nombre.length < 2) {
            throw new ValidacionError('El nombre del actor necesita al menos 2 caracteres');
        }
        if (this.nacionalidad.length < 2) {
            throw new ValidacionError('La nacionalidad del actor es obligatoria');
        }
        if (!this.fechaNacimiento) {
            throw new ValidacionError('La fecha de nacimiento es obligatoria');
        }
        if (this.fechaNacimiento > new Date()) {
            throw new ValidacionError('La fecha de nacimiento no puede ser futura');
        }
    }

    actualizar({ nombre, nacionalidad, fechaNacimiento, foto }) {
        if (nombre !== undefined) this.nombre = texto(nombre);
        if (nacionalidad !== undefined) this.nacionalidad = texto(nacionalidad);
        if (fechaNacimiento !== undefined) this.fechaNacimiento = fecha(fechaNacimiento);
        if (foto !== undefined) this.foto = texto(foto);
        this.actualizadoEn = new Date();
        this.verificar();
        return this;
    }

    // la edad no se guarda: cambia sola con el tiempo
    edad(hoy = new Date()) {
        const nacimiento = this.fechaNacimiento;
        let anios = hoy.getUTCFullYear() - nacimiento.getUTCFullYear();
        const cumpleEsteAnio = hoy.getUTCMonth() > nacimiento.getUTCMonth()
            || (hoy.getUTCMonth() === nacimiento.getUTCMonth() && hoy.getUTCDate() >= nacimiento.getUTCDate());
        if (!cumpleEsteAnio) anios -= 1;
        return anios;
    }

    aDocumento() {
        return {
            nombre: this.nombre,
            nacionalidad: this.nacionalidad,
            fechaNacimiento: this.fechaNacimiento,
            foto: this.foto,
            creadoEn: this.creadoEn,
            actualizadoEn: this.actualizadoEn
        };
    }

    aPublico() {
        return {
            id: aTexto(this.id),
            nombre: this.nombre,
            nacionalidad: this.nacionalidad,
            fechaNacimiento: this.fechaNacimiento,
            edad: this.edad(),
            foto: this.foto,
            creadoEn: this.creadoEn,
            actualizadoEn: this.actualizadoEn
        };
    }
}
