import { ControladorRecurso } from './ControladorRecurso.js';

export class ControladorProgramas extends ControladorRecurso {
    filtros({ categoria = null, productora = null, texto = '' }) {
        return { categoriaId: categoria, productoraId: productora, texto };
    }

    borrar = async (peticion, respuesta) => {
        respuesta.json(await this.servicio.borrar(peticion.params.id));
    };
}
