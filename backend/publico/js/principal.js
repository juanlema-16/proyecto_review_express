import { api } from './api/api.js';
import { estado } from './estado.js';
import { leerHash, navegar } from './enrutador.js';
import { escapar, avisar } from './componentes.js';
import { vistaCatalogo } from './vistas/catalogo.js';
import { vistaPrograma, vistaActor } from './vistas/programa.js';
import { vistaLogin, vistaRegistro } from './vistas/acceso.js';
import { vistaFavoritos } from './vistas/favoritos.js';
import { vistaAdmin } from './vistas/admin.js';

// acceso: todos, sesion o administrador
const RUTAS = [
    [/^\/$/, vistaCatalogo, 'todos'],
    [/^\/programa\/([^/]+)$/, vistaPrograma, 'todos', ['id']],
    [/^\/actor\/([^/]+)$/, vistaActor, 'todos', ['id']],
    [/^\/login$/, vistaLogin, 'todos'],
    [/^\/registro$/, vistaRegistro, 'todos'],
    [/^\/favoritos$/, vistaFavoritos, 'sesion'],
    [/^\/admin(?:\/([^/]+))?$/, vistaAdmin, 'administrador', ['recurso']]
];

const vista = document.getElementById('vista');
const menu = document.getElementById('menu');

// el enlace de administración solo lo ve el administrador; la autorización real está en el backend
function pintarMenu() {
    const { usuario } = estado;
    menu.innerHTML = `
        <a href="#/">Catálogo</a>
        ${usuario ? '<a href="#/favoritos">Favoritos</a>' : ''}
        ${estado.esAdministrador ? '<a href="#/admin">Administración</a>' : ''}
        ${usuario
            ? `<span class="suave">${escapar(usuario.nombreUsuario)}</span> <button class="boton boton-claro" type="button" data-salir>Salir</button>`
            : '<a href="#/login">Entrar</a> <a href="#/registro">Crear cuenta</a>'}`;
}

async function resolver() {
    const { camino, consulta } = leerHash();
    const ruta = RUTAS.find(([patron]) => patron.test(camino));
    if (!ruta) {
        vista.innerHTML = '<p class="estado">Esa página no existe. <a href="#/">Volver al catálogo</a></p>';
        return;
    }
    const [patron, mostrar, acceso, nombres = []] = ruta;
    if (acceso !== 'todos' && !estado.usuario) return navegar('/login?volver=' + encodeURIComponent(camino));
    if (acceso === 'administrador' && !estado.esAdministrador) return navegar('/');

    const valores = camino.match(patron).slice(1);
    const parametros = Object.fromEntries(nombres.map((nombre, posicion) => [nombre, valores[posicion]]));
    for (const enlace of menu.querySelectorAll('a')) {
        enlace.toggleAttribute('aria-current', enlace.getAttribute('href') === '#' + camino);
    }
    vista.focus({ preventScroll: true });
    await mostrar(vista, { parametros, consulta });
}

menu.addEventListener('click', async (evento) => {
    if (!evento.target.closest('[data-salir]')) return;
    await api.cerrarSesion().catch(() => null);
    estado.fijar(null);
    navegar('/');
});

// un botón de favorito en cualquier vista
vista.addEventListener('click', async (evento) => {
    const boton = evento.target.closest('[data-favorito]');
    if (!boton) return;
    evento.preventDefault();
    if (!estado.usuario) return navegar('/login?volver=' + encodeURIComponent(leerHash().camino));
    const id = boton.dataset.favorito;
    try {
        const lista = estado.favoritos.has(id) ? await api.favoritos.quitar(id) : await api.favoritos.agregar(id);
        estado.favoritos = new Set(lista.map((programa) => programa.id));
        resolver();
    } catch (error) {
        if (error.estado !== 401) avisar(error.message);
    }
});

window.addEventListener('sesion-vencida', () => {
    estado.fijar(null);
    avisar('Tu sesión terminó. Iniciá sesión de nuevo.');
    const { camino } = leerHash();
    if (camino !== '/login') navegar('/login?volver=' + encodeURIComponent(camino));
});
window.addEventListener('sesion-cambio', pintarMenu);
window.addEventListener('hashchange', resolver);

await estado.cargar();
resolver();
