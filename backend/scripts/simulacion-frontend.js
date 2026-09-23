import net from 'node:net';
import { levantarEntornoPrueba } from './utilidades/entornoPrueba.js';
import { ClienteHttp } from './utilidades/ClienteHttp.js';
import { sembrar } from './semilla.js';
import { USUARIO_DEMO } from './datos/catalogo.js';

// recorre lo que hace la interfaz: mismas rutas, misma cabecera de versión, cookies de verdad

async function puertoLibre() {
    return new Promise((resolver) => {
        const servidor = net.createServer().listen(0, () => {
            const { port } = servidor.address();
            servidor.close(() => resolver(port));
        });
    });
}

const pausa = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

let fallos = 0;
function paso(descripcion, respuesta, esperado) {
    const ok = respuesta.estado === esperado;
    if (!ok) fallos += 1;
    const detalle = respuesta.datos?.error ? ' · ' + respuesta.datos.error.codigo + ': ' + respuesta.datos.error.mensaje : '';
    console.log((ok ? '  ✓ ' : '  ✗ ') + descripcion + ' → ' + respuesta.estado + (ok ? '' : ' (esperaba ' + esperado + ')') + detalle);
    return respuesta.datos;
}

// lo que haría la interfaz con cada respuesta: un 401 la manda al login
function reaccionDeLaInterfaz(respuesta) {
    if (respuesta.estado === 401) return 'redirige al login';
    if (respuesta.estado === 503) return 'muestra "el servicio no está disponible" con botón de reintentar';
    if (respuesta.estado === 409 && respuesta.datos?.error?.codigo === 'VERSION_NO_COMPATIBLE') return 'muestra la banda de versión';
    return 'sigue normal';
}

const entornoPrueba = await levantarEntornoPrueba({ puertoMongo: await puertoLibre(), esperaMs: 1500 });
await sembrar(entornoPrueba.base, { administrador: entornoPrueba.entorno.administrador });
const navegador = () => new ClienteHttp(entornoPrueba.api, '^1.0.0');

console.log('\n1. Visitante sin sesión');
const visitante = navegador();
const categorias = paso('carga las categorías del filtro', await visitante.get('/categorias'), 200);
const anime = categorias.find((categoria) => categoria.nombre === 'anime');
const catalogo = paso('filtra el catálogo por anime', await visitante.get('/programas?categoria=' + anime.id), 200);
console.log('    ' + catalogo.map((programa) => programa.titulo).join(', '));
const detalle = paso('abre el detalle de ' + catalogo[0].titulo, await visitante.get('/programas/' + catalogo[0].id), 200);
console.log('    ' + detalle.capitulos.length + ' capítulos, reparto: ' + detalle.reparto.map((personaje) => personaje.nombre + ' (' + personaje.actor.nombre + ')').join(', '));
const ficha = paso('abre la ficha de ' + detalle.reparto[0].actor.nombre, await visitante.get('/actores/' + detalle.reparto[0].actor.id), 200);
console.log('    interpreta a: ' + ficha.personajes.map((personaje) => personaje.nombre + ' en ' + personaje.programa.titulo).join(', '));
const sinSesion = await visitante.get('/favoritos');
paso('intenta ver favoritos', sinSesion, 401);
console.log('    la interfaz ' + reaccionDeLaInterfaz(sinSesion));

console.log('\n2. Usuario que se registra');
const usuario = navegador();
paso('se registra', await usuario.post('/autenticacion/registro', { nombreUsuario: 'maria', correo: 'maria@review.test', contrasena: 'Maria1234' }), 201);
paso('marca ' + catalogo[0].titulo + ' como favorito', await usuario.post('/favoritos/' + catalogo[0].id), 200);
paso('ve sus favoritos', await usuario.get('/favoritos'), 200);
paso('intenta entrar al panel de administración', await usuario.post('/categorias', { nombre: 'realities' }), 403);
paso('cierra sesión', await usuario.post('/autenticacion/cierre-sesion'), 204);
paso('ya no ve sus favoritos', await usuario.get('/favoritos'), 401);

console.log('\n3. Administrador');
const administrador = navegador();
const { correo, contrasena } = entornoPrueba.entorno.administrador;
paso('inicia sesión', await administrador.post('/autenticacion/inicio-sesion', { correo, contrasena }), 200);
const productoras = paso('carga las productoras del formulario', await administrador.get('/productoras'), 200);
const nuevo = paso('crea un programa con dos capítulos iniciales', await administrador.post('/programas', {
    titulo: 'Death Note',
    sinopsis: 'Un estudiante encuentra un cuaderno que mata a quien tenga su nombre escrito.',
    poster: 'https://placehold.co/300x450?text=Death%20Note',
    trailer: 'https://www.youtube.com/results?search_query=Death+Note+trailer',
    categoriaId: anime.id,
    productoraId: productoras[0].id,
    capitulos: [
        { temporada: 1, numero: 1, titulo: 'Renacimiento', duracionMinutos: 23 },
        { temporada: 1, numero: 2, titulo: 'Confrontación', duracionMinutos: 23 }
    ]
}), 201);
paso('lo repite y choca con el título', await administrador.post('/programas', { ...nuevo, titulo: 'death note', capitulos: [] }), 409);
paso('edita la sinopsis', await administrador.put('/programas/' + nuevo.id, { sinopsis: 'Light Yagami encuentra el cuaderno de un shinigami.' }), 200);
paso('intenta borrar una productora en uso', await administrador.borrar('/productoras/' + productoras[0].id), 409);
const borrado = paso('borra el programa', await administrador.borrar('/programas/' + nuevo.id), 200);
console.log('    arrastró ' + borrado.capitulosBorrados + ' capítulos y ' + borrado.personajesBorrados + ' personajes');

console.log('\n4. Cliente viejo');
const viejo = new ClienteHttp(entornoPrueba.api, '^2.0.0');
const incompatible = await viejo.get('/programas');
paso('pide la versión 2 de la API', incompatible, 409);
console.log('    la interfaz ' + reaccionDeLaInterfaz(incompatible));

console.log('\n5. Se cae la base de datos');
const demo = navegador();
paso('el usuario demo inicia sesión antes de la caída', await demo.post('/autenticacion/inicio-sesion', { correo: USUARIO_DEMO.correo, contrasena: USUARIO_DEMO.contrasena }), 200);
await entornoPrueba.replica.stop({ doCleanup: false });
console.log('    (replica set detenido)');
const caido = await visitante.get('/programas');
paso('el catálogo', caido, 503);
console.log('    la interfaz ' + reaccionDeLaInterfaz(caido));
paso('el inicio de sesión', await navegador().post('/autenticacion/inicio-sesion', { correo, contrasena }), 503);
paso('el perfil con una cookie válida (no se confunde con sesión vencida)', await demo.get('/autenticacion/perfil'), 503);
paso('la versión se sigue negociando sin la base', await viejo.get('/programas'), 409);
paso('la documentación se sigue sirviendo', await new ClienteHttp(entornoPrueba.raiz).get('/api/docs/'), 200);

console.log('\n6. Vuelve la base');
await entornoPrueba.replica.start();
let recuperado = null;
for (let intento = 0; intento < 20; intento += 1) {
    recuperado = await visitante.get('/programas');
    if (recuperado.estado === 200) break;
    await pausa(1000);
}
paso('el catálogo vuelve sin reiniciar la API', recuperado, 200);
paso('la cookie de antes de la caída sigue sirviendo', await demo.get('/autenticacion/perfil'), 200);

console.log('\n' + (fallos === 0 ? 'Simulación completa sin fallos.' : fallos + ' pasos no dieron lo esperado.'));
await entornoPrueba.cerrar();
process.exit(fallos === 0 ? 0 : 1);
