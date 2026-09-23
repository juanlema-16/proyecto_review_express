import bcrypt from 'bcrypt';
import { pathToFileURL } from 'node:url';

import { COLECCIONES, COTEJO_ES } from '../src/config/colecciones.js';
import { crearIndices } from '../src/config/indices.js';
import { CategoriaPrograma } from '../src/modelos/CategoriaPrograma.js';
import { Productora } from '../src/modelos/Productora.js';
import { Programa } from '../src/modelos/Programa.js';
import { Capitulo } from '../src/modelos/Capitulo.js';
import { Actor } from '../src/modelos/Actor.js';
import { Personaje } from '../src/modelos/Personaje.js';
import { Usuario } from '../src/modelos/Usuario.js';
import { CATEGORIAS, PRODUCTORAS, PROGRAMAS, ACTORES, PERSONAJES, USUARIO_DEMO } from './datos/catalogo.js';

// inserta solo si no existe: correr la semilla dos veces no duplica nada ni pisa cambios
async function asegurar(base, coleccion, filtro, entidad, contador, conCotejo = true) {
    const resultado = await base.collection(coleccion).findOneAndUpdate(
        filtro,
        { $setOnInsert: entidad.aDocumento() },
        { upsert: true, returnDocument: 'after', includeResultMetadata: true, ...(conCotejo ? { collation: COTEJO_ES } : {}) }
    );
    contador[resultado.lastErrorObject.updatedExisting ? 'existentes' : 'insertados'] += 1;
    return resultado.value._id;
}

export async function sembrar(base, { reiniciar = false, administrador }) {
    if (reiniciar) {
        for (const coleccion of Object.values(COLECCIONES)) {
            await base.collection(coleccion).deleteMany({});
        }
    }
    await crearIndices(base);

    const contador = { insertados: 0, existentes: 0 };
    const ids = { categorias: new Map(), productoras: new Map(), programas: new Map(), actores: new Map() };

    for (const datos of CATEGORIAS) {
        ids.categorias.set(datos.nombre, await asegurar(base, COLECCIONES.CATEGORIAS, { nombre: datos.nombre }, CategoriaPrograma.nueva(datos), contador));
    }
    for (const datos of PRODUCTORAS) {
        ids.productoras.set(datos.nombre, await asegurar(base, COLECCIONES.PRODUCTORAS, { nombre: datos.nombre }, Productora.nueva(datos), contador));
    }
    for (const { categoria, productora, capitulos, ...datos } of PROGRAMAS) {
        const programa = Programa.nuevo({ ...datos, categoriaId: ids.categorias.get(categoria), productoraId: ids.productoras.get(productora) });
        const programaId = await asegurar(base, COLECCIONES.PROGRAMAS, { titulo: datos.titulo }, programa, contador);
        ids.programas.set(datos.titulo, programaId);

        for (const datosCapitulo of capitulos) {
            const capitulo = Capitulo.nuevo({ ...datosCapitulo, programaId });
            const filtro = { programaId, temporada: capitulo.temporada, numero: capitulo.numero };
            await asegurar(base, COLECCIONES.CAPITULOS, filtro, capitulo, contador, false);
        }
    }
    for (const datos of ACTORES) {
        ids.actores.set(datos.nombre, await asegurar(base, COLECCIONES.ACTORES, { nombre: datos.nombre }, Actor.nuevo(datos), contador));
    }
    for (const { nombre, programa, actor } of PERSONAJES) {
        const personaje = Personaje.nuevo({ nombre, programaId: ids.programas.get(programa), actorId: ids.actores.get(actor) });
        const filtro = { programaId: personaje.programaId, actorId: personaje.actorId, nombre };
        await asegurar(base, COLECCIONES.PERSONAJES, filtro, personaje, contador);
    }

    const usuarios = [
        { nombreUsuario: 'admin', correo: administrador.correo, contrasena: administrador.contrasena, rol: Usuario.ROLES.ADMINISTRADOR },
        { ...USUARIO_DEMO, rol: Usuario.ROLES.USUARIO }
    ];
    for (const { contrasena, ...datos } of usuarios) {
        const usuario = Usuario.nuevo({ ...datos, contrasena: await bcrypt.hash(contrasena, 10) });
        await asegurar(base, COLECCIONES.USUARIOS, { correo: usuario.correo }, usuario, contador, false);
    }

    return contador;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
    const { entorno, verificarEntorno } = await import('../src/config/entorno.js');
    const { Conexion } = await import('../src/config/db.js');
    const reiniciar = process.argv.includes('--reset');

    try {
        verificarEntorno();
        const conexion = Conexion.instancia();
        const base = await conexion.conectar();
        const { insertados, existentes } = await sembrar(base, { reiniciar, administrador: entorno.administrador });
        console.log((reiniciar ? 'Base vaciada y recargada. ' : '') + insertados + ' documentos nuevos, ' + existentes + ' ya existían.');
        await conexion.cerrar();
    } catch (error) {
        console.error('La semilla falló:', error.message);
        process.exit(1);
    }
}
