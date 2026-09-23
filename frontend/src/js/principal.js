import { CONFIGURACION } from './nucleo/configuracion.js';
import { EVENTOS } from './nucleo/peticiones.js';
import { html, montar } from './nucleo/plantilla.js';
import { sesion } from './nucleo/sesion.js';
import { ruta, iniciarEnrutador, navegar, rutaActual } from './nucleo/enrutador.js';
import { avisar } from './nucleo/avisos.js';
import { estadoVacio } from './componentes/estados.js';

import { vistaCatalogo } from './vistas/catalogo.js';
import { vistaPrograma } from './vistas/programa.js';
import { vistaActores, vistaActor } from './vistas/actores.js';
import { vistaProductoras, vistaProductora } from './vistas/productoras.js';
import { vistaFavoritos } from './vistas/favoritos.js';
import { vistaLogin, vistaRegistro, vistaPerfil } from './vistas/acceso.js';
import { vistaAdmin } from './vistas/admin/panel.js';

ruta('/', vistaCatalogo, { titulo: 'Catálogo' });
ruta('/programa/:id', vistaPrograma, { titulo: 'Programa' });
ruta('/actores', vistaActores, { titulo: 'Actores' });
ruta('/actor/:id', vistaActor, { titulo: 'Actor' });
ruta('/productoras', vistaProductoras, { titulo: 'Productoras' });
ruta('/productora/:id', vistaProductora, { titulo: 'Productora' });
ruta('/favoritos', vistaFavoritos, { acceso: 'sesion', titulo: 'Favoritos' });
ruta('/perfil', vistaPerfil, { acceso: 'sesion', titulo: 'Mi cuenta' });
ruta('/login', vistaLogin, { acceso: 'anonimo', titulo: 'Iniciar sesión' });
ruta('/registro', vistaRegistro, { acceso: 'anonimo', titulo: 'Crear cuenta' });
ruta('/admin', vistaAdmin, { acceso: 'administrador', titulo: 'Administración' });
ruta('/admin/:recurso', vistaAdmin, { acceso: 'administrador', titulo: 'Administración' });
ruta('*', (contenedor) => montar(contenedor, estadoVacio('Esa página no existe.', html`<a class="boton" href="#/">Volver al catálogo</a>`)), { titulo: 'No encontrada' });

const menu = document.getElementById('menu');
const menuBoton = document.getElementById('menu-boton');

// el panel de administración solo se muestra al administrador: es cosmético, el backend decide
function pintarMenu() {
    const { usuario } = sesion;
    montar(menu, html`
        <a href="#/" data-seccion="/">Catálogo</a>
        <a href="#/actores" data-seccion="/actor">Actores</a>
        <a href="#/productoras" data-seccion="/productora">Productoras</a>
        ${usuario ? html`<a href="#/favoritos" data-seccion="/favoritos">Favoritos</a>` : ''}
        ${sesion.esAdministrador ? html`<a href="#/admin" data-seccion="/admin">Administración</a>` : ''}
        ${usuario
            ? html`<a class="menu-usuario" href="#/perfil" data-seccion="/perfil">${usuario.nombreUsuario}</a>
                   <button class="boton boton-chico boton-secundario" type="button" data-salir>Salir</button>`
            : html`<a href="#/login" data-seccion="/login">Entrar</a>
                   <a class="boton boton-chico" href="#/registro">Crear cuenta</a>`}`);
    marcarSeccion(rutaActual());
}

function marcarSeccion(camino) {
    for (const enlace of menu.querySelectorAll('[data-seccion]')) {
        const seccion = enlace.dataset.seccion;
        const activa = seccion === '/' ? camino === '/' || camino.startsWith('/?') || camino.startsWith('/programa') : camino.startsWith(seccion);
        if (activa) enlace.setAttribute('aria-current', 'page');
        else enlace.removeAttribute('aria-current');
    }
}

menu.addEventListener('click', async (evento) => {
    if (evento.target.closest('[data-salir]')) {
        await sesion.cerrar();
        avisar('Sesión cerrada', 'info');
        navegar('/');
    }
    if (evento.target.closest('a, button')) {
        menu.classList.remove('menu-abierto');
        menuBoton.setAttribute('aria-expanded', 'false');
    }
});
menuBoton.addEventListener('click', () => {
    const abierto = menu.classList.toggle('menu-abierto');
    menuBoton.setAttribute('aria-expanded', String(abierto));
});

// cualquier 401 fuera del login limpia la sesión y manda a entrar, sin perder a dónde iba
window.addEventListener(EVENTOS.NO_AUTENTICADO, () => {
    sesion.limpiar();
    const actual = rutaActual();
    if (actual.startsWith('/login')) return;
    avisar('Tu sesión terminó. Iniciá sesión de nuevo.', 'info');
    navegar('/login?volver=' + encodeURIComponent(actual));
});

const banda = document.getElementById('banda-version');
window.addEventListener(EVENTOS.VERSION_INCOMPATIBLE, (evento) => {
    banda.textContent = 'Esta interfaz pide la API ' + CONFIGURACION.version + ' pero el servidor es otra versión. ' + evento.detail.message;
    banda.hidden = false;
});

const pieVersion = document.getElementById('pie-version');
window.addEventListener(EVENTOS.VERSION_SERVIDOR, (evento) => {
    pieVersion.textContent = 'cliente pide ' + CONFIGURACION.version + ' · API ' + evento.detail;
});

// un poster o una foto que no carga se reemplaza por una imagen neutra en vez de quedar rota
const SIN_IMAGEN = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300"><rect width="200" height="300" fill="#8884"/><path d="M70 125h60v40H70z" fill="none" stroke="#8888" stroke-width="6"/><path d="M92 136l16 9-16 9z" fill="#8888"/></svg>');
document.addEventListener('error', (evento) => {
    const imagen = evento.target;
    if (imagen.tagName === 'IMG' && imagen.src !== SIN_IMAGEN) imagen.src = SIN_IMAGEN;
}, true);

sesion.escuchar(pintarMenu);
await sesion.cargar();
iniciarEnrutador(document.getElementById('vista'), { alNavegar: marcarSeccion });
