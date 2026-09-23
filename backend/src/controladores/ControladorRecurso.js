// Express 5 manda solo los rechazos de un async al manejador de errores
export class ControladorRecurso {
    constructor(servicio) {
        this.servicio = servicio;
    }

    // cada recurso declara qué filtros acepta en la query
    filtros() {
        return {};
    }

    listar = async (peticion, respuesta) => {
        respuesta.json(await this.servicio.listar(this.filtros(peticion.query)));
    };

    obtener = async (peticion, respuesta) => {
        respuesta.json(await this.servicio.obtener(peticion.params.id));
    };

    crear = async (peticion, respuesta) => {
        respuesta.status(201).json(await this.servicio.crear(peticion.body));
    };

    actualizar = async (peticion, respuesta) => {
        respuesta.json(await this.servicio.actualizar(peticion.params.id, peticion.body));
    };

    borrar = async (peticion, respuesta) => {
        await this.servicio.borrar(peticion.params.id);
        respuesta.status(204).end();
    };
}
