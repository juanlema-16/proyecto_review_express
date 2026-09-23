import { ControladorRecurso } from './ControladorRecurso.js';

export class ControladorActores extends ControladorRecurso {
    filtros({ texto = '' }) {
        return { texto };
    }
}
