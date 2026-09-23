import { Router } from 'express';
import { idEnRuta } from './validadores/comunes.js';
import { revisarValidaciones } from '../middlewares/validacion.js';

export function rutasFavoritos(controlador, autenticacion) {
    const rutas = Router();
    const programa = [idEnRuta('programaId', 'id del programa'), revisarValidaciones];

    rutas.use(autenticacion.requerido());
    rutas.get('/', controlador.listar);
    rutas.post('/:programaId', programa, controlador.agregar);
    rutas.delete('/:programaId', programa, controlador.quitar);

    return rutas;
}
