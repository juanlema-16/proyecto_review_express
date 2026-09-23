import { ObjectId } from 'mongodb';
import { igual, verdadero, estado, codigoError } from '../afirmaciones.js';
import { POSTER, TRAILER, nuevaCategoria, nuevaProductora, nuevoActor, nuevoPrograma, nuevoCapitulo } from '../preparar.js';
import { GestorTransacciones } from '../../../src/repositorios/GestorTransacciones.js';

export async function pruebasTransacciones(registro, contexto) {
    const administrador = await contexto.clienteAdministrador();
    const capitulos = contexto.base.collection('capitulos');
    const personajes = contexto.base.collection('personajes');
    const programas = contexto.base.collection('programas');

    async function datosPrograma(iniciales) {
        const categoria = await nuevaCategoria(administrador, contexto);
        const productora = await nuevaProductora(administrador, contexto);
        return {
            titulo: contexto.unico('con capítulos'), sinopsis: 'Una sinopsis suficientemente larga.', poster: POSTER, trailer: TRAILER,
            categoriaId: categoria.id, productoraId: productora.id, capitulos: iniciales
        };
    }

    await registro.prueba('el programa se crea junto con sus capítulos iniciales', async () => {
        const respuesta = await administrador.post('/programas', await datosPrograma([
            { temporada: 1, numero: 1, titulo: 'Piloto', duracionMinutos: 45, fechaEstreno: '2024-01-10' },
            { temporada: 1, numero: 2, titulo: 'Segundo', duracionMinutos: 44 }
        ]));
        estado(respuesta, 201);
        igual(respuesta.datos.capitulos.length, 2);
        igual(await capitulos.countDocuments({ programaId: new ObjectId(respuesta.datos.id) }), 2);
    });

    await registro.prueba('si un capítulo inicial choca no queda ni el programa ni ningún capítulo', async () => {
        const datos = await datosPrograma([
            { temporada: 1, numero: 1, titulo: 'Uno', duracionMinutos: 30 },
            { temporada: 1, numero: 1, titulo: 'Repetido', duracionMinutos: 30 }
        ]);
        const antes = await capitulos.countDocuments();
        const respuesta = await administrador.post('/programas', datos);
        codigoError(respuesta, 409, 'DUPLICADO');
        igual(await programas.countDocuments({ titulo: datos.titulo }), 0, 'El programa quedó a medias');
        igual(await capitulos.countDocuments(), antes, 'Quedaron capítulos sueltos');
    });

    await registro.prueba('un capítulo inicial inválido se rechaza antes de tocar la base', async () => {
        const datos = await datosPrograma([{ temporada: 1, numero: 1, titulo: '', duracionMinutos: 30 }]);
        codigoError(await administrador.post('/programas', datos), 400, 'VALIDACION');
        igual(await programas.countDocuments({ titulo: datos.titulo }), 0);
    });

    await registro.prueba('borrar un programa arrastra capítulos, personajes y favoritos', async () => {
        const programa = await nuevoPrograma(administrador, contexto);
        const actor = await nuevoActor(administrador, contexto);
        await nuevoCapitulo(administrador, programa.id, 1, 1);
        await nuevoCapitulo(administrador, programa.id, 1, 2);
        await administrador.post('/personajes', { nombre: 'Único', programaId: programa.id, actorId: actor.id });
        const { cliente } = await contexto.clienteUsuario();
        await cliente.post('/favoritos/' + programa.id);

        const respuesta = await administrador.borrar('/programas/' + programa.id);
        estado(respuesta, 200);
        igual(respuesta.datos.capitulosBorrados, 2);
        igual(respuesta.datos.personajesBorrados, 1);
        igual(respuesta.datos.favoritosQuitados, 1);

        const id = new ObjectId(programa.id);
        igual(await capitulos.countDocuments({ programaId: id }), 0);
        igual(await personajes.countDocuments({ programaId: id }), 0);
        igual((await cliente.get('/favoritos')).datos.length, 0, 'El favorito quedó apuntando a la nada');
        estado(await administrador.get('/actores/' + actor.id), 200, 'El actor no se borra con el programa');
    });

    await registro.prueba('si la transacción falla a mitad de camino, se deshace todo', async () => {
        const programa = await nuevoPrograma(administrador, contexto);
        await nuevoCapitulo(administrador, programa.id, 1, 1);
        const id = new ObjectId(programa.id);
        const transacciones = new GestorTransacciones(contexto.clienteMongo);

        let fallo = null;
        try {
            await transacciones.ejecutar(async (sesion) => {
                await capitulos.deleteMany({ programaId: id }, { session: sesion });
                throw new Error('corte a mitad');
            });
        } catch (error) {
            fallo = error;
        }
        igual(fallo?.message, 'corte a mitad');
        igual(await capitulos.countDocuments({ programaId: id }), 1, 'El borrado parcial no se revirtió');
        verdadero(await programas.findOne({ _id: id }), 'El programa desapareció');
    });
}
