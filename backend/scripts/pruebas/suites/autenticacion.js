import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { igual, verdadero, estado, codigoError, sinContrasena } from '../afirmaciones.js';

export async function pruebasAutenticacion(registro, contexto) {
    const nombreCookie = contexto.entorno.cookie.nombre;

    await registro.prueba('el registro deja una cookie httpOnly, strict y con la vida del token', async () => {
        const cliente = contexto.cliente();
        const respuesta = await cliente.post('/autenticacion/registro', {
            nombreUsuario: 'nuevo.usuario', correo: 'Nuevo@Review.test', contrasena: 'Secreta123'
        });
        estado(respuesta, 201);
        const cookie = cliente.ultimasCookies.find((cruda) => cruda.startsWith(nombreCookie + '='));
        verdadero(cookie, 'No llegó la cookie de sesión');
        verdadero(/HttpOnly/i.test(cookie), 'La cookie no es httpOnly');
        verdadero(/SameSite=Strict/i.test(cookie), 'La cookie no es SameSite=Strict');
        verdadero(/Max-Age=3600/i.test(cookie), 'El maxAge no coincide con la expiración del token: ' + cookie);
        igual(respuesta.datos.correo, 'nuevo@review.test', 'El correo no se guardó en minúsculas');
        sinContrasena(respuesta);
    });

    await registro.prueba('el rol que manda el cliente se ignora: quien se registra es usuario', async () => {
        const cliente = contexto.cliente();
        const respuesta = await cliente.post('/autenticacion/registro', {
            nombreUsuario: 'colado', correo: 'colado@review.test', contrasena: 'Secreta123', rol: 'administrador'
        });
        estado(respuesta, 201);
        igual(respuesta.datos.rol, 'usuario');
        codigoError(await cliente.post('/categorias', { nombre: 'intento' }), 403, 'NO_AUTORIZADO');
    });

    await registro.prueba('un correo repetido responde 409 DUPLICADO', async () => {
        const respuesta = await contexto.cliente().post('/autenticacion/registro', {
            nombreUsuario: 'otro.nombre', correo: 'NUEVO@review.test', contrasena: 'Secreta123'
        });
        codigoError(respuesta, 409, 'DUPLICADO');
        igual(respuesta.datos.error.mensaje, 'Ese correo ya está registrado');
    });

    await registro.prueba('una contraseña débil devuelve el detalle por campo', async () => {
        const respuesta = await contexto.cliente().post('/autenticacion/registro', {
            nombreUsuario: 'debil', correo: 'debil@review.test', contrasena: 'corta'
        });
        codigoError(respuesta, 400, 'VALIDACION');
        verdadero(respuesta.datos.error.detalles.some((detalle) => detalle.campo === 'contrasena'), 'Falta el detalle de contrasena');
    });

    await registro.prueba('con credenciales malas responde 401 y el mismo mensaje exista o no el correo', async () => {
        const malaClave = await contexto.cliente().post('/autenticacion/inicio-sesion', { correo: contexto.entorno.administrador.correo, contrasena: 'NoEsEsta1' });
        const sinCuenta = await contexto.cliente().post('/autenticacion/inicio-sesion', { correo: 'nadie@review.test', contrasena: 'NoEsEsta1' });
        codigoError(malaClave, 401, 'NO_AUTENTICADO');
        codigoError(sinCuenta, 401, 'NO_AUTENTICADO');
        igual(malaClave.datos.error.mensaje, sinCuenta.datos.error.mensaje, 'El mensaje delata si el correo existe');
    });

    await registro.prueba('el perfil sale con la cookie y nunca trae la contraseña', async () => {
        const administrador = await contexto.clienteAdministrador();
        const respuesta = await administrador.get('/autenticacion/perfil');
        estado(respuesta, 200);
        igual(respuesta.datos.rol, 'administrador');
        sinContrasena(respuesta);
    });

    await registro.prueba('sin cookie el perfil responde 401', async () => {
        codigoError(await contexto.cliente().get('/autenticacion/perfil'), 401, 'NO_AUTENTICADO');
    });

    await registro.prueba('el token en la cabecera Authorization no sirve: solo vale la cookie', async () => {
        const administrador = await contexto.clienteAdministrador();
        const token = administrador.cookies.get(nombreCookie);
        const respuesta = await contexto.cliente().get('/autenticacion/perfil', { Authorization: 'Bearer ' + token });
        codigoError(respuesta, 401, 'NO_AUTENTICADO');
    });

    await registro.prueba('un token firmado con otro secreto o vencido se rechaza', async () => {
        const ajeno = jwt.sign({ sub: new ObjectId().toString() }, 'otro-secreto');
        const vencido = jwt.sign({ sub: new ObjectId().toString() }, contexto.entorno.jwt.secreto, { expiresIn: -10 });
        for (const token of [ajeno, vencido, 'basura']) {
            const respuesta = await contexto.cliente().get('/autenticacion/perfil', { Cookie: nombreCookie + '=' + token });
            codigoError(respuesta, 401, 'NO_AUTENTICADO');
        }
    });

    await registro.prueba('el cierre de sesión borra la cookie', async () => {
        const { cliente } = await contexto.clienteUsuario();
        estado(await cliente.get('/autenticacion/perfil'), 200);
        estado(await cliente.post('/autenticacion/cierre-sesion'), 204);
        verdadero(!cliente.cookies.has(nombreCookie), 'La cookie sigue en el cliente');
        codigoError(await cliente.get('/autenticacion/perfil'), 401, 'NO_AUTENTICADO');
    });

    await registro.prueba('si el usuario ya no existe, su token deja de servir', async () => {
        const { cliente, credenciales } = await contexto.clienteUsuario();
        await contexto.base.collection('usuarios').deleteOne({ correo: credenciales.correo });
        codigoError(await cliente.get('/autenticacion/perfil'), 401, 'NO_AUTENTICADO');
    });
}
