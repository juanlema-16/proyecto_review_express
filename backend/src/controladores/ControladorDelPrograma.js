import { ControladorRecurso } from './ControladorRecurso.js';

// capítulos y personajes: los dos cuelgan de un programa
export class ControladorDelPrograma extends ControladorRecurso {
    filtros({ programa = null }) {
        return { programaId: programa };
    }

    porPrograma = async (peticion, respuesta) => {
        respuesta.json(await this.servicio.porPrograma(peticion.params.id));
    };
}
