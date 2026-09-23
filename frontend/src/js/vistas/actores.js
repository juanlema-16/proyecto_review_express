import { api } from '../nucleo/api.js';
import { html, montar } from '../nucleo/plantilla.js';
import { navegar } from '../nucleo/enrutador.js';
import { fecha, plural } from '../nucleo/formato.js';
import { conEstados, estadoVacio } from '../componentes/estados.js';
import { tarjetaActor, avatar } from '../componentes/tarjetas.js';

export async function vistaActores(contenedor, { consulta }) {
    const texto = consulta.texto ?? '';
    montar(contenedor, html`
        <section class="encabezado-vista">
            <div>
                <h1>Actores</h1>
                <p class="subtitulo">Quién interpreta a quién, en todos los programas.</p>
            </div>
            <form class="buscador" role="search" data-buscador>
                <label class="solo-lectores" for="buscar-actor">Buscar por nombre</label>
                <input id="buscar-actor" type="search" name="texto" placeholder="Buscar por nombre…" value="${texto}" maxlength="100">
            </form>
        </section>
        <div data-actores></div>`);

    contenedor.querySelector('[data-buscador]').addEventListener('submit', (evento) => {
        evento.preventDefault();
        const valor = evento.target.texto.value.trim();
        navegar('/actores' + (valor ? '?texto=' + encodeURIComponent(valor) : ''));
    });

    await conEstados(contenedor.querySelector('[data-actores]'), {
        cargar: () => api.actores.listar({ texto }),
        vacio: texto ? 'Ningún actor coincide con "' + texto + '".' : 'Todavía no hay actores cargados.',
        pintar: (elemento, lista) => montar(elemento, html`<div class="rejilla-personas">${lista.map(tarjetaActor)}</div>`)
    });
}

export async function vistaActor(contenedor, { parametros }) {
    await conEstados(contenedor, {
        cargar: () => api.actores.obtener(parametros.id),
        esVacio: () => false,
        pintar: (elemento, actor) => {
            document.title = actor.nombre + ' · Proyecto Review';
            montar(elemento, html`
                <a class="volver" href="#/actores">← Actores</a>
                <article class="ficha ficha-persona">
                    ${avatar(actor, 'avatar-grande')}
                    <div class="ficha-datos">
                        <h1>${actor.nombre}</h1>
                        <dl class="datos">
                            <div><dt>Nacionalidad</dt><dd>${actor.nacionalidad}</dd></div>
                            <div><dt>Nacimiento</dt><dd>${fecha(actor.fechaNacimiento)} (${actor.edad} años)</dd></div>
                            <div><dt>Personajes</dt><dd>${actor.personajes.length}</dd></div>
                        </dl>
                    </div>
                </article>
                <h2>Personajes que interpreta</h2>
                ${actor.personajes.length === 0
                    ? estadoVacio('Todavía no interpreta ningún personaje.')
                    : html`
                        <ul class="lista-personajes">
                            ${actor.personajes.map((personaje) => html`
                                <li>
                                    <strong>${personaje.nombre}</strong>
                                    <span class="tarjeta-detalle">en</span>
                                    <a href="#/programa/${personaje.programa?.id}">${personaje.programa?.titulo ?? 'programa borrado'}</a>
                                </li>`)}
                        </ul>
                        <p class="tarjeta-detalle">${plural(new Set(actor.personajes.map((personaje) => personaje.programaId)).size, 'programa distinto', 'programas distintos')}.</p>`}`);
        }
    });
}
