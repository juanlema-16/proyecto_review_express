import { aObjectId, aTexto, mismoId } from '../utilidades/identificadores.js';
import { texto } from '../utilidades/valores.js';
import { ValidacionError } from '../errores/index.js';

// puente entre Actor y Programa: por acá pasa la relación muchos a muchos
export class Personaje {
    constructor({ id = null, nombre, programaId, actorId, creadoEn = null, actualizadoEn = null }) {
        this.id = aObjectId(id, 'id del personaje');
        this.nombre = texto(nombre);
        this.programaId = aObjectId(programaId, 'id del programa');
        this.actorId = aObjectId(actorId, 'id del actor');
        this.creadoEn = creadoEn;
        this.actualizadoEn = actualizadoEn;
    }

    static desde(documento) {
        if (!documento) return null;
        return new Personaje({
            id: documento._id,
            nombre: documento.nombre,
            programaId: documento.programaId,
            actorId: documento.actorId,
            creadoEn: documento.creadoEn,
            actualizadoEn: documento.actualizadoEn
        });
    }

    static nuevo(datos) {
        const ahora = new Date();
        const personaje = new Personaje({ ...datos, id: null, creadoEn: ahora, actualizadoEn: ahora });
        personaje.verificar();
        return personaje;
    }

    verificar() {
        if (this.nombre.length < 1) {
            throw new ValidacionError('El nombre del personaje es obligatorio');
        }
        if (!this.programaId) {
            throw new ValidacionError('El personaje debe pertenecer a un programa');
        }
        if (!this.actorId) {
            throw new ValidacionError('El personaje debe tener un actor que lo interprete');
        }
    }

    actualizar({ nombre, programaId, actorId }) {
        if (nombre !== undefined) this.nombre = texto(nombre);
        if (programaId !== undefined) this.programaId = aObjectId(programaId, 'id del programa');
        if (actorId !== undefined) this.actorId = aObjectId(actorId, 'id del actor');
        this.actualizadoEn = new Date();
        this.verificar();
        return this;
    }

    interpretadoPor(actorId) {
        return mismoId(this.actorId, actorId);
    }

    aDocumento() {
        return {
            nombre: this.nombre,
            programaId: this.programaId,
            actorId: this.actorId,
            creadoEn: this.creadoEn,
            actualizadoEn: this.actualizadoEn
        };
    }

    aPublico() {
        return {
            id: aTexto(this.id),
            nombre: this.nombre,
            programaId: aTexto(this.programaId),
            actorId: aTexto(this.actorId),
            creadoEn: this.creadoEn,
            actualizadoEn: this.actualizadoEn
        };
    }
}
