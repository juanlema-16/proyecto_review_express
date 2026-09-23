import { aObjectId } from '../utilidades/identificadores.js';

export class RepositorioBase {
    constructor(base, nombreColeccion, Modelo) {
        this.base = base;
        this.nombreColeccion = nombreColeccion;
        this.Modelo = Modelo;
    }

    get coleccion() {
        return this.base.collection(this.nombreColeccion);
    }

    conSesion(sesion, opciones = {}) {
        return sesion ? { ...opciones, session: sesion } : opciones;
    }

    hidratar(documento) {
        return this.Modelo.desde(documento);
    }

    hidratarVarios(documentos) {
        return documentos.map((documento) => this.Modelo.desde(documento));
    }

    async crear(entidad, sesion = null) {
        const { insertedId } = await this.coleccion.insertOne(entidad.aDocumento(), this.conSesion(sesion));
        entidad.id = insertedId;
        return entidad;
    }

    async crearVarios(entidades, sesion = null) {
        if (entidades.length === 0) return [];
        const documentos = entidades.map((entidad) => entidad.aDocumento());
        const { insertedIds } = await this.coleccion.insertMany(documentos, this.conSesion(sesion));
        entidades.forEach((entidad, posicion) => { entidad.id = insertedIds[posicion]; });
        return entidades;
    }

    async porId(id, sesion = null) {
        const identificador = aObjectId(id, 'identificador');
        if (!identificador) return null;
        return this.hidratar(await this.coleccion.findOne({ _id: identificador }, this.conSesion(sesion)));
    }

    async porIds(ids, opciones = {}, sesion = null) {
        const unicos = [...new Set(ids.map(String))].map((id) => aObjectId(id, 'identificador'));
        if (unicos.length === 0) return [];
        return this.listar({ _id: { $in: unicos } }, opciones, sesion);
    }

    async uno(filtro, opciones = {}, sesion = null) {
        return this.hidratar(await this.coleccion.findOne(filtro, this.conSesion(sesion, opciones)));
    }

    async listar(filtro = {}, opciones = {}, sesion = null) {
        const documentos = await this.coleccion.find(filtro, this.conSesion(sesion, opciones)).toArray();
        return this.hidratarVarios(documentos);
    }

    async reemplazar(entidad, sesion = null) {
        await this.coleccion.replaceOne({ _id: entidad.id }, entidad.aDocumento(), this.conSesion(sesion));
        return entidad;
    }

    async borrar(id, sesion = null) {
        const { deletedCount } = await this.coleccion.deleteOne(
            { _id: aObjectId(id, 'identificador') },
            this.conSesion(sesion)
        );
        return deletedCount === 1;
    }

    async borrarPorFiltro(filtro, sesion = null) {
        const { deletedCount } = await this.coleccion.deleteMany(filtro, this.conSesion(sesion));
        return deletedCount;
    }

    async contar(filtro = {}, opciones = {}, sesion = null) {
        return this.coleccion.countDocuments(filtro, this.conSesion(sesion, opciones));
    }

    async existe(filtro, opciones = {}, sesion = null) {
        const documento = await this.coleccion.findOne(
            filtro,
            this.conSesion(sesion, { ...opciones, projection: { _id: 1 } })
        );
        return documento !== null;
    }
}
