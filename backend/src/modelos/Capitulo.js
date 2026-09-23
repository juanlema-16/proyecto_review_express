import { aObjectId, aTexto } from '../utilidades/identificadores.js';
import { texto, entero, fecha } from '../utilidades/valores.js';
import { ValidacionError } from '../errores/index.js';

export class Capitulo {
    static DURACION_MAXIMA = 600;

    constructor({ id = null, programaId, temporada, numero, titulo, duracionMinutos, fechaEstreno = null, creadoEn = null, actualizadoEn = null }) {
        this.id = aObjectId(id, 'id del capítulo');
        this.programaId = aObjectId(programaId, 'id del programa');
        this.temporada = entero(temporada);
        this.numero = entero(numero);
        this.titulo = texto(titulo);
        this.duracionMinutos = entero(duracionMinutos);
        this.fechaEstreno = fecha(fechaEstreno);
        this.creadoEn = creadoEn;
        this.actualizadoEn = actualizadoEn;
    }

    static desde(documento) {
        if (!documento) return null;
        return new Capitulo({
            id: documento._id,
            programaId: documento.programaId,
            temporada: documento.temporada,
            numero: documento.numero,
            titulo: documento.titulo,
            duracionMinutos: documento.duracionMinutos,
            fechaEstreno: documento.fechaEstreno,
            creadoEn: documento.creadoEn,
            actualizadoEn: documento.actualizadoEn
        });
    }

    static nuevo(datos) {
        const ahora = new Date();
        const capitulo = new Capitulo({ ...datos, id: null, creadoEn: ahora, actualizadoEn: ahora });
        capitulo.verificar();
        return capitulo;
    }

    verificar() {
        if (!this.programaId) {
            throw new ValidacionError('El capítulo debe pertenecer a un programa');
        }
        if (this.temporada === null || this.temporada < 1) {
            throw new ValidacionError('La temporada debe ser un entero mayor o igual a 1');
        }
        if (this.numero === null || this.numero < 1) {
            throw new ValidacionError('El número de capítulo debe ser un entero mayor o igual a 1');
        }
        if (this.titulo.length < 1) {
            throw new ValidacionError('El título del capítulo es obligatorio');
        }
        if (this.duracionMinutos === null || this.duracionMinutos < 1 || this.duracionMinutos > Capitulo.DURACION_MAXIMA) {
            throw new ValidacionError('La duración debe estar entre 1 y ' + Capitulo.DURACION_MAXIMA + ' minutos');
        }
    }

    actualizar({ temporada, numero, titulo, duracionMinutos, fechaEstreno }) {
        if (temporada !== undefined) this.temporada = entero(temporada);
        if (numero !== undefined) this.numero = entero(numero);
        if (titulo !== undefined) this.titulo = texto(titulo);
        if (duracionMinutos !== undefined) this.duracionMinutos = entero(duracionMinutos);
        if (fechaEstreno !== undefined) this.fechaEstreno = fecha(fechaEstreno);
        this.actualizadoEn = new Date();
        this.verificar();
        return this;
    }

    // "T1E03": como se suele citar un capítulo
    etiqueta() {
        return 'T' + this.temporada + 'E' + String(this.numero).padStart(2, '0');
    }

    yaSeEstreno(hoy = new Date()) {
        return this.fechaEstreno !== null && this.fechaEstreno <= hoy;
    }

    aDocumento() {
        return {
            programaId: this.programaId,
            temporada: this.temporada,
            numero: this.numero,
            titulo: this.titulo,
            duracionMinutos: this.duracionMinutos,
            fechaEstreno: this.fechaEstreno,
            creadoEn: this.creadoEn,
            actualizadoEn: this.actualizadoEn
        };
    }

    aPublico() {
        return {
            id: aTexto(this.id),
            programaId: aTexto(this.programaId),
            temporada: this.temporada,
            numero: this.numero,
            etiqueta: this.etiqueta(),
            titulo: this.titulo,
            duracionMinutos: this.duracionMinutos,
            fechaEstreno: this.fechaEstreno,
            estrenado: this.yaSeEstreno(),
            creadoEn: this.creadoEn,
            actualizadoEn: this.actualizadoEn
        };
    }
}
