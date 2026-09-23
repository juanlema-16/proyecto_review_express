export class ControladorFavoritos {
    constructor(servicio) {
        this.servicio = servicio;
    }

    listar = async (peticion, respuesta) => {
        respuesta.json(await this.servicio.listar(peticion.usuario.id));
    };

    agregar = async (peticion, respuesta) => {
        respuesta.json(await this.servicio.agregar(peticion.usuario.id, peticion.params.programaId));
    };

    quitar = async (peticion, respuesta) => {
        respuesta.json(await this.servicio.quitar(peticion.usuario.id, peticion.params.programaId));
    };
}
