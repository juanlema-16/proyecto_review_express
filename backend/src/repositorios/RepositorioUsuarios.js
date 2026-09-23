import { RepositorioBase } from './RepositorioBase.js';
import { Usuario } from '../modelos/Usuario.js';
import { COLECCIONES } from '../config/colecciones.js';
import { aObjectId } from '../utilidades/identificadores.js';
import { texto } from '../utilidades/valores.js';

export class RepositorioUsuarios extends RepositorioBase {
    constructor(base) {
        super(base, COLECCIONES.USUARIOS, Usuario);
    }

    async porCorreo(correo) {
        return this.uno({ correo: texto(correo).toLowerCase() });
    }

    // $addToSet y $pull son atómicos: dos pestañas marcando a la vez no pisan la lista
    async agregarFavorito(usuarioId, programaId) {
        await this.coleccion.updateOne(
            { _id: aObjectId(usuarioId, 'id del usuario') },
            { $addToSet: { favoritos: aObjectId(programaId, 'id del programa') }, $set: { actualizadoEn: new Date() } }
        );
    }

    async quitarFavorito(usuarioId, programaId) {
        await this.coleccion.updateOne(
            { _id: aObjectId(usuarioId, 'id del usuario') },
            { $pull: { favoritos: aObjectId(programaId, 'id del programa') }, $set: { actualizadoEn: new Date() } }
        );
    }

    async quitarProgramaDeTodos(programaId, sesion = null) {
        const identificador = aObjectId(programaId, 'id del programa');
        const { modifiedCount } = await this.coleccion.updateMany(
            { favoritos: identificador },
            { $pull: { favoritos: identificador } },
            this.conSesion(sesion)
        );
        return modifiedCount;
    }
}
