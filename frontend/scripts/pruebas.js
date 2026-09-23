import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { crearServidor } from '../servidor.js';

// levanta la API de verdad (MongoDB en memoria, del backend) y esta interfaz con su proxy,
// y prueba contra las dos. Necesita haber corrido npm install en ../backend

const RAIZ = fileURLToPath(new URL('../', import.meta.url));
const BACKEND = path.join(RAIZ, '../backend/');
const importarBackend = (ruta) => import(pathToFileURL(path.join(BACKEND, ruta)).href);

const { levantarEntornoPrueba } = await importarBackend('scripts/utilidades/entornoPrueba.js');
const { sembrar } = await importarBackend('scripts/semilla.js');
const { USUARIO_DEMO } = await importarBackend('scripts/datos/catalogo.js');

const backend = await levantarEntornoPrueba({ esperaMs: 1500 });
await sembrar(backend.base, { administrador: backend.entorno.administrador });

const escuchar = (servidor) => new Promise((listo) => servidor.listen(0, '127.0.0.1', () => listo('http://127.0.0.1:' + servidor.address().port)));
const servidor = crearServidor({ destino: backend.raiz });
const interfaz = await escuchar(servidor);

// ---- mini registro de pruebas ----

const resultados = [];
async function prueba(nombre, funcion) {
    try {
        await funcion();
        resultados.push({ nombre, ok: true });
        console.log('  ok    ' + nombre);
    } catch (error) {
        resultados.push({ nombre, ok: false, error });
        console.log('  FALLA ' + nombre + '\n        ' + error.message);
    }
}
function igual(obtenido, esperado, mensaje = 'Valor inesperado') {
    if (obtenido !== esperado) throw new Error(mensaje + ': esperaba ' + JSON.stringify(esperado) + ' y llegó ' + JSON.stringify(obtenido));
}
function verdadero(condicion, mensaje) {
    if (!condicion) throw new Error(mensaje);
}

// ---- el api.js real corriendo en Node: window y fetch hacen de navegador ----

const cookies = new Map();
globalThis.window = new EventTarget();
const fetchOriginal = globalThis.fetch;
globalThis.fetch = async (ruta, opciones = {}) => {
    const cabeceras = { ...opciones.headers };
    if (cookies.size) cabeceras.Cookie = [...cookies].map(([nombre, valor]) => nombre + '=' + valor).join('; ');
    const respuesta = await fetchOriginal(interfaz + ruta, { ...opciones, headers: cabeceras });
    for (const cruda of respuesta.headers.getSetCookie()) {
        const [par] = cruda.split(';');
        const [nombre, valor] = [par.slice(0, par.indexOf('=')), par.slice(par.indexOf('=') + 1)];
        if (!valor || /Expires=Thu, 01 Jan 1970/i.test(cruda)) cookies.delete(nombre);
        else cookies.set(nombre, valor);
    }
    return respuesta;
};
const eventos = [];
for (const nombre of ['api:no-autenticado', 'api:version-incompatible']) {
    window.addEventListener(nombre, () => eventos.push(nombre));
}

const { api } = await import('../src/js/nucleo/api.js');
const { CONFIGURACION } = await import('../src/js/nucleo/configuracion.js');
const { html, urlSegura } = await import('../src/js/nucleo/plantilla.js');

// ---- archivos ----

async function listar(carpeta) {
    const entradas = await readdir(carpeta, { withFileTypes: true });
    const archivos = await Promise.all(entradas.map((entrada) => {
        const ruta = path.join(carpeta, entrada.name);
        return entrada.isDirectory() ? listar(ruta) : [ruta];
    }));
    return archivos.flat();
}

const SRC = path.join(RAIZ, 'src');
const archivos = (await listar(SRC)).map((ruta) => '/' + path.relative(SRC, ruta).split(path.sep).join('/'));

console.log('\nEstáticos y módulos');

await prueba('cada archivo se sirve con su tipo', async () => {
    const tipos = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' };
    for (const archivo of archivos) {
        const respuesta = await fetchOriginal(interfaz + archivo);
        igual(respuesta.status, 200, archivo);
        verdadero(respuesta.headers.get('content-type').startsWith(tipos[path.extname(archivo)]), archivo + ' sale como ' + respuesta.headers.get('content-type'));
    }
});

await prueba('ningún import apunta a un archivo que no existe', async () => {
    for (const archivo of archivos.filter((ruta) => ruta.endsWith('.js'))) {
        const codigo = await readFile(path.join(SRC, archivo), 'utf8');
        for (const [, destino] of codigo.matchAll(/from\s+'(\.[^']+)'/g)) {
            const resuelto = path.posix.join(path.posix.dirname(archivo), destino);
            verdadero(archivos.includes(resuelto), archivo + ' importa ' + destino + ' y no existe');
        }
    }
});

await prueba('ninguna vista llama a fetch: solo peticiones.js', async () => {
    for (const archivo of archivos.filter((ruta) => ruta.endsWith('.js') && ruta !== '/js/nucleo/peticiones.js')) {
        const codigo = await readFile(path.join(SRC, archivo), 'utf8');
        verdadero(!/\bfetch\s*\(/.test(codigo), archivo + ' llama a fetch');
    }
});

await prueba('sin frameworks ni CDN en el HTML', async () => {
    const indice = await readFile(path.join(SRC, 'index.html'), 'utf8');
    verdadero(!/https?:\/\//.test(indice.replace(/http:\/\/www\.w3\.org\/2000\/svg/g, '')), 'El index.html carga algo de afuera');
    verdadero(/<script type="module"/.test(indice), 'El script principal no es un módulo ES');
});

await prueba('un ../ en la URL no sale de src/', async () => {
    const respuesta = await fetchOriginal(interfaz + '/..%2Fservidor.js');
    verdadero(respuesta.status === 403 || respuesta.status === 404, 'Respondió ' + respuesta.status);
});

await prueba('la plantilla escapa lo que viene de la API', async () => {
    igual(String(html`<p>${'<img src=x onerror=alert(1)>'}</p>`), '<p>&lt;img src=x onerror=alert(1)&gt;</p>');
    igual(urlSegura('javascript:alert(1)'), '#');
    igual(urlSegura('https://ejemplo.com/a.jpg'), 'https://ejemplo.com/a.jpg');
});

console.log('\nCookie a través del proxy');

await prueba('el inicio de sesión deja la cookie httpOnly y strict en el origen de la interfaz', async () => {
    const respuesta = await fetchOriginal(interfaz + '/api/autenticacion/inicio-sesion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: USUARIO_DEMO.correo, contrasena: USUARIO_DEMO.contrasena })
    });
    igual(respuesta.status, 200);
    const [cookie] = respuesta.headers.getSetCookie();
    verdadero(/HttpOnly/i.test(cookie) && /SameSite=Strict/i.test(cookie), 'Cookie sin httpOnly o strict: ' + cookie);
    verdadero(!/Domain=/i.test(cookie), 'La cookie fija un dominio: no quedaría en el origen de la interfaz');
});

await prueba('cada petición manda Accept-Version y la API contesta su versión', async () => {
    igual(CONFIGURACION.version, '^1.0.0');
    const respuesta = await fetchOriginal(interfaz + '/api/categorias', { headers: { 'Accept-Version': CONFIGURACION.version } });
    igual(respuesta.headers.get('x-api-version'), '1.0.0');
});

console.log('\nEl api.js real');

await prueba('el catálogo se lee sin sesión y se filtra por categoría', async () => {
    const categorias = await api.categorias.listar();
    const anime = categorias.find((categoria) => categoria.nombre === 'anime');
    const programas = await api.programas.listar({ categoria: anime.id });
    verdadero(programas.length > 0, 'No hay anime');
    verdadero(programas.every((programa) => programa.categoria.nombre === 'anime'), 'El filtro deja pasar otras categorías');
});

await prueba('el detalle trae capítulos y reparto, y la ficha del actor sus personajes', async () => {
    const [programa] = await api.programas.listar({ texto: 'naruto' });
    const detalle = await api.programas.obtener(programa.id);
    verdadero(detalle.capitulos.length > 0 && detalle.reparto.length > 0, 'Detalle incompleto');
    const actor = await api.actores.obtener(detalle.reparto[0].actor.id);
    verdadero(actor.personajes.some((personaje) => personaje.programa.id === programa.id), 'La ficha no trae el programa');
});

await prueba('sin sesión, favoritos responde 401 y avisa a la interfaz', async () => {
    eventos.length = 0;
    const error = await api.favoritos.listar().catch((falla) => falla);
    igual(error.estado, 401);
    igual(eventos[0], 'api:no-autenticado', 'No salió el evento que manda al login');
});

await prueba('el perfil sin sesión no dispara la redirección', async () => {
    eventos.length = 0;
    await api.autenticacion.perfil().catch(() => null);
    igual(eventos.length, 0);
});

await prueba('registro, favoritos y cierre de sesión', async () => {
    const usuario = await api.autenticacion.registrar({ nombreUsuario: 'desde.la.web', correo: 'web@review.test', contrasena: 'Web12345' });
    igual(usuario.rol, 'usuario');
    const [programa] = await api.programas.listar();
    const favoritos = await api.favoritos.agregar(programa.id);
    igual(favoritos[0].id, programa.id);
    igual((await api.favoritos.quitar(programa.id)).length, 0);
    await api.autenticacion.cerrarSesion();
    igual((await api.favoritos.listar().catch((falla) => falla)).estado, 401);
});

await prueba('los errores llegan con su detalle por campo', async () => {
    const error = await api.autenticacion.registrar({ nombreUsuario: 'x', correo: 'no-es-correo', contrasena: '1' }).catch((falla) => falla);
    igual(error.codigo, 'VALIDACION');
    const campos = error.detalles.map((detalle) => detalle.campo);
    verdadero(['nombreUsuario', 'correo', 'contrasena'].every((campo) => campos.includes(campo)), 'Faltan campos: ' + campos);
});

await prueba('un usuario no puede escribir el catálogo: 403', async () => {
    await api.autenticacion.iniciarSesion({ correo: USUARIO_DEMO.correo, contrasena: USUARIO_DEMO.contrasena });
    igual((await api.categorias.crear({ nombre: 'intento' }).catch((falla) => falla)).estado, 403);
    await api.autenticacion.cerrarSesion();
});

await prueba('el administrador hace el CRUD y el alta con capítulos iniciales', async () => {
    const { correo, contrasena } = backend.entorno.administrador;
    await api.autenticacion.iniciarSesion({ correo, contrasena });
    const [categoria] = await api.categorias.listar();
    const [productora] = await api.productoras.listar();
    const programa = await api.programas.crear({
        titulo: 'Creado desde la interfaz',
        sinopsis: 'Un programa que crea la prueba del frontend.',
        poster: 'https://ejemplo.com/poster.jpg',
        trailer: 'https://ejemplo.com/trailer.mp4',
        categoriaId: categoria.id,
        productoraId: productora.id,
        capitulos: [
            { temporada: 1, numero: 1, titulo: 'Uno', duracionMinutos: 20 },
            { temporada: 1, numero: 2, titulo: 'Dos', duracionMinutos: 20 }
        ]
    });
    igual(programa.capitulos.length, 2);
    const editado = await api.programas.actualizar(programa.id, { titulo: 'Editado desde la interfaz' });
    igual(editado.titulo, 'Editado desde la interfaz');
    const borrado = await api.programas.borrar(programa.id);
    igual(borrado.capitulosBorrados, 2);
});

await prueba('borrar una categoría en uso llega como EN_USO', async () => {
    const [categoria] = await api.categorias.listar();
    const error = await api.categorias.borrar(categoria.id).catch((falla) => falla);
    igual(error.codigo, 'EN_USO');
});

console.log('\nFallas');

await prueba('con la base caída la interfaz se sigue sirviendo y la API da 503', async () => {
    await backend.replica.stop({ doCleanup: false });
    const error = await api.programas.listar().catch((falla) => falla);
    igual(error.estado, 503);
    igual((await fetchOriginal(interfaz + '/')).status, 200);
});

await prueba('con la API caída el proxy responde 502 y la interfaz se sigue sirviendo', async () => {
    const apagado = crearServidor({ destino: 'http://127.0.0.1:9' });
    const direccion = await escuchar(apagado);
    try {
        const respuesta = await fetchOriginal(direccion + '/api/programas');
        igual(respuesta.status, 502);
        igual((await respuesta.json()).error.codigo, 'API_NO_DISPONIBLE');
        igual((await fetchOriginal(direccion + '/js/principal.js')).status, 200);
    } finally {
        apagado.close();
    }
});

const fallidas = resultados.filter((resultado) => !resultado.ok);
console.log('\n' + '-'.repeat(50));
console.log((resultados.length - fallidas.length) + ' pasadas, ' + fallidas.length + ' fallidas');

servidor.close();
await backend.cerrar().catch(() => null);
process.exit(fallidas.length > 0 ? 1 : 0);
