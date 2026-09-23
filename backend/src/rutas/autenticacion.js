import { Router } from 'express';
import { revisarValidaciones } from '../middlewares/validacion.js';
import { alRegistrar, alIniciarSesion } from './validadores/autenticacion.js';

export function rutasAutenticacion(controlador, autenticacion, limiteEstricto) {
    const rutas = Router();

    rutas.post('/registro', limiteEstricto, alRegistrar, revisarValidaciones, controlador.registrar);
    rutas.post('/inicio-sesion', limiteEstricto, alIniciarSesion, revisarValidaciones, controlador.iniciarSesion);
    rutas.post('/cierre-sesion', controlador.cerrarSesion);
    rutas.get('/perfil', autenticacion.requerido(), controlador.perfil);

    return rutas;
}
