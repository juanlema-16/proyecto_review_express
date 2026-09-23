import { sesion } from './sesion.js';

const rutas = [];
let noEncontrada = null;
let contenedor = null;
let alCambiar = () => {};

// '/programa/:id' -> /^\/programa\/([^/]+)$/ con la lista de nombres
function compilar(patron) {
    const nombres = [];
    const expresion = patron.replace(/:([a-zA-Z]+)/g, (coincidencia, nombre) => {
        nombres.push(nombre);
        return '([^/]+)';
    });
    return { expresion: new RegExp('^' + expresion + '$'), nombres };
}

// acceso: 'todos', 'anonimo' (login, registro), 'sesion' o 'administrador'. El patrón '*' es la página 404
export function ruta(patron, vista, { acceso = 'todos', titulo = '' } = {}) {
    if (patron === '*') noEncontrada = { vista, acceso, titulo };
    else rutas.push({ ...compilar(patron), vista, acceso, titulo });
}

export function leerHash() {
    const [camino, textoConsulta = ''] = location.hash.slice(1).split('?');
    return { camino: camino || '/', consulta: Object.fromEntries(new URLSearchParams(textoConsulta)) };
}

export function navegar(destino) {
    if (location.hash.slice(1) === destino) resolver();
    else location.hash = destino;
}

export function rutaActual() {
    return location.hash.slice(1) || '/';
}

function buscar(camino) {
    for (const definicion of rutas) {
        const coincidencia = camino.match(definicion.expresion);
        if (!coincidencia) continue;
        const parametros = Object.fromEntries(definicion.nombres.map((nombre, posicion) => [nombre, decodeURIComponent(coincidencia[posicion + 1])]));
        return { definicion, parametros };
    }
    return noEncontrada ? { definicion: noEncontrada, parametros: {} } : null;
}

export async function resolver() {
    const { camino, consulta } = leerHash();
    const encontrada = buscar(camino);
    if (!encontrada) return;
    const { definicion, parametros } = encontrada;

    // guardas de la interfaz: solo evitan mostrar lo que no corresponde, el backend decide igual
    if ((definicion.acceso === 'sesion' || definicion.acceso === 'administrador') && !sesion.iniciada) {
        return navegar('/login?volver=' + encodeURIComponent(rutaActual()));
    }
    if (definicion.acceso === 'administrador' && !sesion.esAdministrador) return navegar('/');
    if (definicion.acceso === 'anonimo' && sesion.iniciada) return navegar('/');

    // un diálogo abierto no sobrevive al cambio de página (por ejemplo, cuando un 401 manda al login)
    document.querySelectorAll('dialog[open]').forEach((dialogo) => dialogo.close());
    document.title = (definicion.titulo ? definicion.titulo + ' · ' : '') + 'Proyecto Review';
    alCambiar(camino);
    contenedor.replaceChildren();
    contenedor.focus({ preventScroll: true });
    window.scrollTo(0, 0);
    await definicion.vista(contenedor, { parametros, consulta });
}

export function iniciarEnrutador(elemento, { alNavegar } = {}) {
    contenedor = elemento;
    if (alNavegar) alCambiar = alNavegar;
    window.addEventListener('hashchange', resolver);
    return resolver();
}
