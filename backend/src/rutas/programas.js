import { rutasRecurso } from './recurso.js';
import { idEnRuta } from './validadores/comunes.js';
import { revisarValidaciones } from '../middlewares/validacion.js';
import { alListarProgramas, alCrearPrograma, alActualizarPrograma } from './validadores/programas.js';

export function rutasProgramas({ programas, capitulos, personajes }, autenticacion) {
    const rutas = rutasRecurso({
        controlador: programas,
        autenticacion,
        etiqueta: 'id del programa',
        alListar: alListarProgramas,
        alCrear: alCrearPrograma,
        alActualizar: alActualizarPrograma
    });
    const identificador = [idEnRuta('id', 'id del programa'), revisarValidaciones];

    rutas.get('/:id/capitulos', identificador, capitulos.porPrograma);
    rutas.get('/:id/personajes', identificador, personajes.porPrograma);

    return rutas;
}
