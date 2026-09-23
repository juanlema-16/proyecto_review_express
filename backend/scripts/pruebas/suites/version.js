import { igual, estado, codigoError } from '../afirmaciones.js';
import { ClienteHttp } from '../../utilidades/ClienteHttp.js';

export async function pruebasVersion(registro, contexto) {
    const cliente = new ClienteHttp(contexto.api);

    await registro.prueba('sin cabecera se asume la versión actual y se anuncia en X-API-Version', async () => {
        const respuesta = await cliente.get('/categorias');
        estado(respuesta, 200);
        igual(respuesta.cabeceras.get('x-api-version'), '1.0.0');
    });

    await registro.prueba('los rangos compatibles pasan', async () => {
        for (const rango of ['1.x', '^1.0.0', '~1.0', '>=1.0.0 <2.0.0', '1.0.0']) {
            estado(await cliente.get('/categorias', { 'Accept-Version': rango }), 200, 'Con ' + rango);
        }
    });

    await registro.prueba('una versión incompatible responde 409 con un mensaje claro', async () => {
        const respuesta = await cliente.get('/categorias', { 'Accept-Version': '^2.0.0' });
        codigoError(respuesta, 409, 'VERSION_NO_COMPATIBLE');
        igual(respuesta.datos.error.detalles.versionApi, '1.0.0');
        igual(respuesta.datos.error.mensaje, 'Esta API es la 1.0.0 y el cliente pide ^2.0.0. Actualizá el cliente.');
    });

    await registro.prueba('una cabecera que no es un rango semver responde 400', async () => {
        codigoError(await cliente.get('/categorias', { 'Accept-Version': 'la última' }), 400, 'VALIDACION');
    });

    await registro.prueba('la versión se revisa antes que la sesión', async () => {
        codigoError(await cliente.post('/categorias', { nombre: 'x' }, { 'Accept-Version': '2.x' }), 409, 'VERSION_NO_COMPATIBLE');
    });

    await registro.prueba('la documentación responde en /api/docs', async () => {
        const respuesta = await new ClienteHttp(contexto.raiz).get('/api/docs/');
        estado(respuesta, 200);
        igual(/swagger/i.test(respuesta.texto), true, 'No parece Swagger UI');
    });
}
