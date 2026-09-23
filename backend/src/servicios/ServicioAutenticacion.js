import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Usuario } from '../modelos/Usuario.js';
import { entorno } from '../config/entorno.js';
import { duracionAMilisegundos } from '../utilidades/valores.js';
import { NoAutenticadoError } from '../errores/index.js';

const VUELTAS = 10;
// si el correo no existe se compara igual contra este hash: la respuesta tarda lo mismo
const HASH_INEXISTENTE = bcrypt.hashSync('usuario-que-no-existe', VUELTAS);
const CREDENCIALES_INVALIDAS = 'El correo o la contraseña no son correctos';

export class ServicioAutenticacion {
    constructor(repositorioUsuarios) {
        this.usuarios = repositorioUsuarios;
    }

    static async cifrar(contrasena) {
        return bcrypt.hash(contrasena, VUELTAS);
    }

    // el rol nunca llega del cliente: quien se registra siempre es usuario
    async registrar({ nombreUsuario, correo, contrasena }) {
        const usuario = Usuario.nuevo({
            nombreUsuario,
            correo,
            contrasena: await ServicioAutenticacion.cifrar(contrasena),
            rol: Usuario.ROLES.USUARIO
        });
        await this.usuarios.crear(usuario);
        return this.credenciales(usuario);
    }

    async iniciarSesion({ correo, contrasena }) {
        const usuario = await this.usuarios.porCorreo(correo);
        const coincide = await bcrypt.compare(contrasena, usuario?.contrasena ?? HASH_INEXISTENTE);
        if (!usuario || !coincide) throw new NoAutenticadoError(CREDENCIALES_INVALIDAS);
        return this.credenciales(usuario);
    }

    credenciales(usuario) {
        const token = jwt.sign(
            { sub: usuario.id.toString(), rol: usuario.rol },
            entorno.jwt.secreto,
            { expiresIn: entorno.jwt.expiracion }
        );
        return {
            usuario: usuario.aPublico(),
            token,
            duracionMs: duracionAMilisegundos(entorno.jwt.expiracion)
        };
    }

    async porId(id) {
        return this.usuarios.porId(id);
    }
}
