import { igual, verdadero, estado, codigoError } from '../afirmaciones.js';
import { nuevoPrograma } from '../preparar.js';

export async function pruebasFavoritos(registro, contexto) {
    const administrador = await contexto.clienteAdministrador();
    const programa = await nuevoPrograma(administrador, contexto);

    await registro.prueba('los favoritos piden sesión', async () => {
        const anonimo = contexto.cliente();
        codigoError(await anonimo.get('/favoritos'), 401, 'NO_AUTENTICADO');
        codigoError(await anonimo.post('/favoritos/' + programa.id), 401, 'NO_AUTENTICADO');
    });

    await registro.prueba('marcar dos veces el mismo programa no lo duplica', async () => {
        const { cliente } = await contexto.clienteUsuario();
        estado(await cliente.post('/favoritos/' + programa.id), 200);
        const respuesta = await cliente.post('/favoritos/' + programa.id);
        igual(respuesta.datos.length, 1);
        igual(respuesta.datos[0].id, programa.id);
        verdadero(respuesta.datos[0].categoria?.nombre, 'El favorito sale sin su categoría');
        igual((await cliente.get('/autenticacion/perfil')).datos.favoritos.length, 1);
    });

    await registro.prueba('se quita de favoritos', async () => {
        const { cliente } = await contexto.clienteUsuario();
        await cliente.post('/favoritos/' + programa.id);
        const respuesta = await cliente.borrar('/favoritos/' + programa.id);
        estado(respuesta, 200);
        igual(respuesta.datos.length, 0);
    });

    await registro.prueba('no se marca un programa que no existe', async () => {
        const { cliente } = await contexto.clienteUsuario();
        codigoError(await cliente.post('/favoritos/65a1b2c3d4e5f60718293a4b'), 404, 'NO_ENCONTRADO');
        codigoError(await cliente.post('/favoritos/no-es-un-id'), 400, 'VALIDACION');
    });

    await registro.prueba('los favoritos de cada usuario son suyos', async () => {
        const { cliente: uno } = await contexto.clienteUsuario();
        const { cliente: dos } = await contexto.clienteUsuario();
        await uno.post('/favoritos/' + programa.id);
        igual((await dos.get('/favoritos')).datos.length, 0);
    });
}
