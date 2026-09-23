import { igual, verdadero, estado, codigoError } from '../afirmaciones.js';
import { ClienteHttp } from '../../utilidades/ClienteHttp.js';

// cada prueba levanta su propia app con límites chicos: el contador empieza de cero
async function conLimites(contexto, limites, prueba) {
    const app = contexto.crearApp(contexto.base, contexto.clienteMongo, { limites: { ventanaMinutos: 1, ...limites } });
    const servidor = app.listen(0);
    await new Promise((listo) => servidor.once('listening', listo));
    try {
        await prueba(new ClienteHttp('http://127.0.0.1:' + servidor.address().port + '/api'));
    } finally {
        servidor.close();
    }
}

export async function pruebasLimites(registro, contexto) {
    await registro.prueba('el inicio de sesión se corta antes que el resto', async () => {
        await conLimites(contexto, { global: 100, autenticacion: 3 }, async (cliente) => {
            const credenciales = { correo: 'nadie@review.test', contrasena: 'NoEsEsta1' };
            for (let intento = 0; intento < 3; intento += 1) {
                estado(await cliente.post('/autenticacion/inicio-sesion', credenciales), 401);
            }
            const cortado = await cliente.post('/autenticacion/inicio-sesion', credenciales);
            codigoError(cortado, 429, 'DEMASIADAS_PETICIONES');
            verdadero(cortado.cabeceras.get('ratelimit'), 'Falta la cabecera RateLimit');
            estado(await cliente.get('/categorias'), 200, 'El resto de la API tiene que seguir andando');
        });
    });

    await registro.prueba('el registro comparte el límite estricto', async () => {
        await conLimites(contexto, { global: 100, autenticacion: 1 }, async (cliente) => {
            await cliente.post('/autenticacion/registro', { nombreUsuario: 'x', correo: 'x', contrasena: 'x' });
            codigoError(await cliente.post('/autenticacion/registro', { nombreUsuario: 'x', correo: 'x', contrasena: 'x' }), 429, 'DEMASIADAS_PETICIONES');
        });
    });

    await registro.prueba('el límite global corta cualquier ruta', async () => {
        await conLimites(contexto, { global: 5, autenticacion: 5 }, async (cliente) => {
            for (let pedido = 0; pedido < 5; pedido += 1) estado(await cliente.get('/categorias'), 200);
            const cortado = await cliente.get('/programas');
            codigoError(cortado, 429, 'DEMASIADAS_PETICIONES');
            igual(typeof cortado.datos.error.mensaje, 'string');
        });
    });
}
