import { igual, verdadero, estado, codigoError, sinContrasena } from '../afirmaciones.js';
import { POSTER, TRAILER, nuevaCategoria, nuevaProductora, nuevoActor, nuevoPrograma } from '../preparar.js';

export async function pruebasCatalogo(registro, contexto) {
    const administrador = await contexto.clienteAdministrador();
    const { cliente: usuario } = await contexto.clienteUsuario();
    const anonimo = contexto.cliente();

    await registro.prueba('leer el catálogo es público', async () => {
        for (const ruta of ['/programas', '/categorias', '/productoras', '/actores', '/capitulos', '/personajes']) {
            const respuesta = await anonimo.get(ruta);
            estado(respuesta, 200, 'GET ' + ruta);
            verdadero(Array.isArray(respuesta.datos), ruta + ' no devolvió una lista');
        }
    });

    await registro.prueba('escribir sin sesión responde 401 y como usuario 403', async () => {
        codigoError(await anonimo.post('/categorias', { nombre: 'sin sesión' }), 401, 'NO_AUTENTICADO');
        codigoError(await usuario.post('/categorias', { nombre: 'sin permiso' }), 403, 'NO_AUTORIZADO');
        const categoria = (await anonimo.get('/categorias')).datos[0];
        codigoError(await usuario.put('/categorias/' + categoria.id, { nombre: 'x' }), 403, 'NO_AUTORIZADO');
        codigoError(await usuario.borrar('/categorias/' + categoria.id), 403, 'NO_AUTORIZADO');
    });

    await registro.prueba('el administrador hace el CRUD completo de una categoría', async () => {
        const creada = await administrador.post('/categorias', { nombre: 'documentales', descripcion: 'No ficción' });
        estado(creada, 201);
        const id = creada.datos.id;
        igual((await anonimo.get('/categorias/' + id)).datos.nombre, 'documentales');
        const editada = await administrador.put('/categorias/' + id, { descripcion: 'Series de no ficción' });
        estado(editada, 200);
        igual(editada.datos.nombre, 'documentales', 'La actualización parcial pisó el nombre');
        igual(editada.datos.descripcion, 'Series de no ficción');
        estado(await administrador.borrar('/categorias/' + id), 204);
        codigoError(await anonimo.get('/categorias/' + id), 404, 'NO_ENCONTRADO');
    });

    await registro.prueba('los campos que no se validan no llegan a la base', async () => {
        const respuesta = await administrador.post('/categorias', { nombre: contexto.unico('limpia'), _id: 'x', creadoEn: '1900-01-01', extra: 1 });
        estado(respuesta, 201);
        const documento = await contexto.base.collection('categorias').findOne({ nombre: respuesta.datos.nombre });
        verdadero(!('extra' in documento), 'Se coló un campo no validado');
        verdadero(documento.creadoEn.getFullYear() > 2000, 'El cliente pudo fijar creadoEn');
    });

    await registro.prueba('un id mal formado responde 400 y uno inexistente 404', async () => {
        codigoError(await anonimo.get('/programas/123'), 400, 'VALIDACION');
        codigoError(await anonimo.get('/programas/65a1b2c3d4e5f60718293a4b'), 404, 'NO_ENCONTRADO');
        codigoError(await anonimo.get('/programas?categoria=nada'), 400, 'VALIDACION');
    });

    await registro.prueba('poster y trailer tienen que ser URL http o https', async () => {
        const categoria = await nuevaCategoria(administrador, contexto);
        const productora = await nuevaProductora(administrador, contexto);
        const respuesta = await administrador.post('/programas', {
            titulo: contexto.unico('sin url'), sinopsis: 'Una sinopsis suficientemente larga.',
            poster: 'no-es-una-url', trailer: 'ftp://ejemplo.com/video.mp4',
            categoriaId: categoria.id, productoraId: productora.id
        });
        codigoError(respuesta, 400, 'VALIDACION');
        const campos = respuesta.datos.error.detalles.map((detalle) => detalle.campo);
        verdadero(campos.includes('poster') && campos.includes('trailer'), 'Faltan detalles: ' + campos.join(', '));
    });

    await registro.prueba('un programa con categoría o productora inexistente responde 404', async () => {
        const productora = await nuevaProductora(administrador, contexto);
        const respuesta = await administrador.post('/programas', {
            titulo: contexto.unico('huérfano'), sinopsis: 'Una sinopsis suficientemente larga.', poster: POSTER, trailer: TRAILER,
            categoriaId: '65a1b2c3d4e5f60718293a4b', productoraId: productora.id
        });
        codigoError(respuesta, 404, 'NO_ENCONTRADO');
    });

    await registro.prueba('el detalle del programa trae categoría, productora, capítulos y reparto', async () => {
        const programa = await nuevoPrograma(administrador, contexto);
        const actor = await nuevoActor(administrador, contexto);
        estado(await administrador.post('/capitulos', { programaId: programa.id, temporada: 1, numero: 1, titulo: 'Piloto', duracionMinutos: 30 }), 201);
        estado(await administrador.post('/personajes', { nombre: 'Protagonista', programaId: programa.id, actorId: actor.id }), 201);

        const detalle = (await anonimo.get('/programas/' + programa.id)).datos;
        verdadero(detalle.categoria?.nombre && detalle.productora?.nombre, 'Faltan categoría o productora');
        igual(detalle.capitulos.length, 1);
        igual(detalle.capitulos[0].etiqueta, 'T1E01');
        igual(detalle.reparto[0].actor.nombre, actor.nombre);
        igual((await anonimo.get('/programas/' + programa.id + '/capitulos')).datos.length, 1);
        igual((await anonimo.get('/programas/' + programa.id + '/personajes')).datos[0].actor.id, actor.id);
    });

    await registro.prueba('el catálogo se filtra por categoría y se busca por título', async () => {
        const categoria = await nuevaCategoria(administrador, contexto);
        const programa = await nuevoPrograma(administrador, contexto, { categoriaId: categoria.id });
        const filtrados = (await anonimo.get('/programas?categoria=' + categoria.id)).datos;
        igual(filtrados.length, 1);
        igual(filtrados[0].id, programa.id);
        const buscados = (await anonimo.get('/programas?texto=' + encodeURIComponent(programa.titulo.toUpperCase()))).datos;
        verdadero(buscados.some((encontrado) => encontrado.id === programa.id), 'La búsqueda no ignora mayúsculas');
    });

    await registro.prueba('la búsqueda escapa la expresión regular', async () => {
        for (const texto of ['(', '.*', '[a-', '\\']) {
            const respuesta = await anonimo.get('/programas?texto=' + encodeURIComponent(texto));
            estado(respuesta, 200, 'Buscar ' + texto);
            igual(respuesta.datos.length, 0, 'El texto "' + texto + '" se interpretó como expresión');
        }
    });

    await registro.prueba('la ficha del actor trae sus personajes en programas distintos', async () => {
        const actor = await nuevoActor(administrador, contexto);
        const [uno, dos] = [await nuevoPrograma(administrador, contexto), await nuevoPrograma(administrador, contexto)];
        await administrador.post('/personajes', { nombre: 'Villano', programaId: uno.id, actorId: actor.id });
        await administrador.post('/personajes', { nombre: 'Héroe', programaId: dos.id, actorId: actor.id });
        const ficha = (await anonimo.get('/actores/' + actor.id)).datos;
        igual(ficha.personajes.length, 2);
        igual(new Set(ficha.personajes.map((personaje) => personaje.programa.id)).size, 2);
        verdadero(Number.isInteger(ficha.edad), 'La ficha no calcula la edad');
    });

    await registro.prueba('la productora trae los programas que produjo', async () => {
        const productora = await nuevaProductora(administrador, contexto);
        const programa = await nuevoPrograma(administrador, contexto, { productoraId: productora.id });
        const detalle = (await anonimo.get('/productoras/' + productora.id)).datos;
        igual(detalle.programas.length, 1);
        igual(detalle.programas[0].id, programa.id);
    });

    await registro.prueba('ninguna respuesta de usuarios filtra la contraseña', async () => {
        const { cliente } = await contexto.clienteUsuario();
        sinContrasena(await cliente.get('/autenticacion/perfil'));
        sinContrasena(await administrador.get('/autenticacion/perfil'));
        sinContrasena(await cliente.post('/autenticacion/inicio-sesion', { correo: contexto.entorno.administrador.correo, contrasena: contexto.entorno.administrador.contrasena }));
    });
}
