import passport from 'passport';
import { Strategy as EstrategiaJwt } from 'passport-jwt';
import { entorno } from '../config/entorno.js';
import { NoAutenticadoError } from '../errores/index.js';

export class Autenticacion {
    constructor(servicioAutenticacion) {
        this.servicio = servicioAutenticacion;
        // instancia propia en lugar del passport global: no se pisa entre aplicaciones
        this.passport = new passport.Passport();
        this.registrarEstrategia();
    }

    // el token viaja en la cookie httpOnly, nunca en la cabecera Authorization
    static extraerDeCookie(peticion) {
        return peticion?.cookies?.[entorno.cookie.nombre] ?? null;
    }

    registrarEstrategia() {
        const opciones = {
            jwtFromRequest: Autenticacion.extraerDeCookie,
            secretOrKey: entorno.jwt.secreto,
            algorithms: ['HS256']
        };
        this.passport.use(new EstrategiaJwt(opciones, async (carga, listo) => {
            try {
                const usuario = await this.servicio.porId(carga.sub);
                listo(null, usuario ?? false);
            } catch (error) {
                listo(error);
            }
        }));
    }

    inicializar() {
        return this.passport.initialize();
    }

    requerido() {
        return (peticion, respuesta, siguiente) => {
            this.passport.authenticate('jwt', { session: false }, (error, usuario) => {
                if (error) return siguiente(error);
                if (!usuario) return siguiente(new NoAutenticadoError('Iniciá sesión para continuar'));
                peticion.usuario = usuario;
                siguiente();
            })(peticion, respuesta, siguiente);
        };
    }
}
