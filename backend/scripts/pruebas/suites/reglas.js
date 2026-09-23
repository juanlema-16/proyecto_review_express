import { igual, estado, codigoError } from '../afirmaciones.js';
import { POSTER, TRAILER, nuevaCategoria, nuevaProductora, nuevoActor, nuevoPrograma, nuevoCapitulo } from '../preparar.js';

export async function pruebasReglas(registro, contexto) {
    const administrador = await contexto.clienteAdministrador();

    await registro.prueba('el título es único sin importar mayúsculas', async () => {
        const programa = await nuevoPrograma(administrador, contexto);
        const respuesta = await administrador.post('/programas', {
            titulo: programa.titulo.toUpperCase(), sinopsis: 'Otra sinopsis suficientemente larga.', poster: POSTER, trailer: TRAILER,
            categoriaId: programa.categoriaId, productoraId: programa.productoraId
        });
        codigoError(respuesta, 409, 'DUPLICADO');
        igual(respuesta.datos.error.mensaje, 'Ya existe un programa con ese título');
    });

    await registro.prueba('renombrar un programa al título de otro también choca', async () => {
        const uno = await nuevoPrograma(administrador, contexto);
        const dos = await nuevoPrograma(administrador, contexto);
        codigoError(await administrador.put('/programas/' + dos.id, { titulo: uno.titulo }), 409, 'DUPLICADO');
    });

    await registro.prueba('el número de capítulo es único dentro de la temporada del programa', async () => {
        const programa = await nuevoPrograma(administrador, contexto);
        estado(await nuevoCapitulo(administrador, programa.id, 1, 1), 201);
        const repetido = await nuevoCapitulo(administrador, programa.id, 1, 1);
        codigoError(repetido, 409, 'DUPLICADO');
        igual(repetido.datos.error.mensaje, 'Ese número de capítulo ya existe en esa temporada');
        estado(await nuevoCapitulo(administrador, programa.id, 2, 1), 201, 'El mismo número en otra temporada debe poder');
        const otro = await nuevoPrograma(administrador, contexto);
        estado(await nuevoCapitulo(administrador, otro.id, 1, 1), 201, 'El mismo número en otro programa debe poder');
    });

    await registro.prueba('un actor no puede interpretar dos veces el mismo personaje', async () => {
        const programa = await nuevoPrograma(administrador, contexto);
        const actor = await nuevoActor(administrador, contexto);
        const otroActor = await nuevoActor(administrador, contexto);
        const personaje = { nombre: 'El Detective', programaId: programa.id, actorId: actor.id };
        estado(await administrador.post('/personajes', personaje), 201);
        const repetido = await administrador.post('/personajes', { ...personaje, nombre: 'el detective' });
        codigoError(repetido, 409, 'DUPLICADO');
        igual(repetido.datos.error.mensaje, 'Ese actor ya interpreta a ese personaje en ese programa');
        estado(await administrador.post('/personajes', { ...personaje, actorId: otroActor.id }), 201, 'Otro actor sí puede hacer el mismo papel');
    });

    await registro.prueba('editar un personaje hasta repetir la interpretación también choca', async () => {
        const programa = await nuevoPrograma(administrador, contexto);
        const actor = await nuevoActor(administrador, contexto);
        await administrador.post('/personajes', { nombre: 'Uno', programaId: programa.id, actorId: actor.id });
        const segundo = await administrador.post('/personajes', { nombre: 'Dos', programaId: programa.id, actorId: actor.id });
        codigoError(await administrador.put('/personajes/' + segundo.datos.id, { nombre: 'Uno' }), 409, 'DUPLICADO');
    });

    await registro.prueba('no se borra una categoría, productora o actor en uso', async () => {
        const categoria = await nuevaCategoria(administrador, contexto);
        const productora = await nuevaProductora(administrador, contexto);
        const programa = await nuevoPrograma(administrador, contexto, { categoriaId: categoria.id, productoraId: productora.id });
        const actor = await nuevoActor(administrador, contexto);
        await administrador.post('/personajes', { nombre: 'Alguien', programaId: programa.id, actorId: actor.id });

        codigoError(await administrador.borrar('/categorias/' + categoria.id), 409, 'EN_USO');
        codigoError(await administrador.borrar('/productoras/' + productora.id), 409, 'EN_USO');
        codigoError(await administrador.borrar('/actores/' + actor.id), 409, 'EN_USO');

        estado(await administrador.borrar('/programas/' + programa.id), 200);
        estado(await administrador.borrar('/categorias/' + categoria.id), 204, 'Sin programas la categoría ya se puede borrar');
        estado(await administrador.borrar('/productoras/' + productora.id), 204);
        estado(await administrador.borrar('/actores/' + actor.id), 204);
    });

    await registro.prueba('se validan rangos numéricos y fechas', async () => {
        const programa = await nuevoPrograma(administrador, contexto);
        const casos = [
            administrador.post('/capitulos', { programaId: programa.id, temporada: 0, numero: 1, titulo: 'x', duracionMinutos: 20 }),
            administrador.post('/capitulos', { programaId: programa.id, temporada: 1, numero: 1, titulo: 'x', duracionMinutos: 0 }),
            administrador.post('/capitulos', { programaId: programa.id, temporada: 1, numero: 'uno', titulo: 'x', duracionMinutos: 20 }),
            administrador.post('/productoras', { nombre: contexto.unico('vieja'), pais: 'Chile', anioFundacion: 1700 }),
            administrador.post('/productoras', { nombre: contexto.unico('futura'), pais: 'Chile', anioFundacion: new Date().getFullYear() + 1 }),
            administrador.post('/actores', { nombre: 'Del Futuro', nacionalidad: 'Marciana', fechaNacimiento: '2999-01-01' }),
            administrador.post('/actores', { nombre: 'Sin Fecha', nacionalidad: 'Chilena', fechaNacimiento: '31/12/1990' }),
            administrador.post('/programas', { titulo: 'x', sinopsis: 'corta', poster: POSTER, trailer: TRAILER, categoriaId: programa.categoriaId, productoraId: programa.productoraId })
        ];
        for (const respuesta of await Promise.all(casos)) codigoError(respuesta, 400, 'VALIDACION');
    });

    await registro.prueba('un capítulo de un programa inexistente responde 404', async () => {
        codigoError(await nuevoCapitulo(administrador, '65a1b2c3d4e5f60718293a4b', 1, 1), 404, 'NO_ENCONTRADO');
    });
}
