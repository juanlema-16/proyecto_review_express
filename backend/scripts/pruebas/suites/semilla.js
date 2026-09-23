import { igual, verdadero } from '../afirmaciones.js';
import { sembrar } from '../../semilla.js';
import { PROGRAMAS, PERSONAJES } from '../../datos/catalogo.js';

export async function pruebasSemilla(registro, contexto) {
    const { base, entorno } = contexto;
    const opciones = { administrador: entorno.administrador };

    await registro.prueba('correrla otra vez no inserta nada', async () => {
        const antes = await base.collection('programas').countDocuments();
        const { insertados } = await sembrar(base, opciones);
        igual(insertados, 0);
        igual(await base.collection('programas').countDocuments(), antes);
    });

    await registro.prueba('--reset vacía y vuelve a cargar solo los datos de ejemplo', async () => {
        const { insertados, existentes } = await sembrar(base, { ...opciones, reiniciar: true });
        igual(existentes, 0);
        verdadero(insertados > 0);
        igual(await base.collection('programas').countDocuments(), PROGRAMAS.length);
        igual(await base.collection('personajes').countDocuments(), PERSONAJES.length);
        igual(await base.collection('usuarios').countDocuments(), 2);
    });

    await registro.prueba('después de --reset el administrador sigue entrando', async () => {
        const administrador = await contexto.clienteAdministrador();
        igual((await administrador.get('/autenticacion/perfil')).datos.rol, 'administrador');
    });
}
