import { Router } from 'express';
import { idEnRuta } from './validadores/comunes.js';
import { revisarValidaciones } from '../middlewares/validacion.js';
import { soloAdministrador } from '../middlewares/autorizacion.js';

// las cinco rutas que comparten todos los recursos del catálogo:
// leer es público, escribir es solo del administrador
export function rutasRecurso({ controlador, autenticacion, etiqueta, alListar = [], alCrear, alActualizar }) {
    const rutas = Router();
    const soloAdmin = [autenticacion.requerido(), soloAdministrador];
    const identificador = idEnRuta('id', etiqueta);

    rutas.get('/', alListar, revisarValidaciones, controlador.listar);
    rutas.get('/:id', identificador, revisarValidaciones, controlador.obtener);
    rutas.post('/', soloAdmin, alCrear, revisarValidaciones, controlador.crear);
    rutas.put('/:id', soloAdmin, identificador, alActualizar, revisarValidaciones, controlador.actualizar);
    rutas.delete('/:id', soloAdmin, identificador, revisarValidaciones, controlador.borrar);

    return rutas;
}
