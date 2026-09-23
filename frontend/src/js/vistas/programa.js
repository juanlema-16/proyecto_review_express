import { api } from '../nucleo/api.js';
import { html, montar, urlSegura } from '../nucleo/plantilla.js';
import { fecha, duracion, plural } from '../nucleo/formato.js';
import { conEstados, estadoVacio } from '../componentes/estados.js';
import { botonFavorito, activarFavoritos, avatar } from '../componentes/tarjetas.js';

// un .mp4 o .webm se reproduce acá; cualquier otra URL (YouTube, Vimeo) se abre aparte
function trailer(url) {
    if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(url)) {
        return html`<video class="trailer" src="${urlSegura(url)}" controls preload="none"></video>`;
    }
    return html`<a class="boton boton-secundario" href="${urlSegura(url)}" target="_blank" rel="noopener noreferrer">▶ Ver trailer</a>`;
}

function capitulos(lista) {
    if (lista.length === 0) return estadoVacio('Este programa todavía no tiene capítulos cargados.');
    const porTemporada = new Map();
    for (const capitulo of lista) {
        if (!porTemporada.has(capitulo.temporada)) porTemporada.set(capitulo.temporada, []);
        porTemporada.get(capitulo.temporada).push(capitulo);
    }
    return html`${[...porTemporada].map(([temporada, deLaTemporada]) => html`
        <section class="temporada">
            <h3>Temporada ${temporada} <span class="tarjeta-detalle">· ${plural(deLaTemporada.length, 'capítulo')}</span></h3>
            <ol class="capitulos">
                ${deLaTemporada.map((capitulo) => html`
                    <li class="capitulo">
                        <span class="capitulo-etiqueta">${capitulo.etiqueta}</span>
                        <span class="capitulo-titulo">${capitulo.titulo}</span>
                        <span class="tarjeta-detalle">${duracion(capitulo.duracionMinutos)}${capitulo.fechaEstreno ? ' · ' + fecha(capitulo.fechaEstreno) : ''}</span>
                    </li>`)}
            </ol>
        </section>`)}`;
}

function reparto(lista) {
    if (lista.length === 0) return estadoVacio('Todavía no hay reparto cargado.');
    return html`
        <ul class="reparto">
            ${lista.map((personaje) => html`
                <li>
                    <a class="tarjeta-persona" href="#/actor/${personaje.actor?.id}">
                        ${avatar(personaje.actor ?? { nombre: '?' })}
                        <span>
                            <strong>${personaje.nombre}</strong>
                            <span class="tarjeta-detalle">${personaje.actor?.nombre ?? 'Actor desconocido'}</span>
                        </span>
                    </a>
                </li>`)}
        </ul>`;
}

function pintar(contenedor, programa) {
    montar(contenedor, html`
        <a class="volver" href="#/">← Catálogo</a>
        <article class="ficha">
            <img class="ficha-poster" src="${urlSegura(programa.poster)}" alt="Poster de ${programa.titulo}">
            <div class="ficha-datos">
                <a class="etiqueta" href="#/?categoria=${programa.categoria?.id ?? ''}">${programa.categoria?.nombre ?? 'Sin categoría'}</a>
                <h1>${programa.titulo}</h1>
                <p class="subtitulo">
                    Producido por <a href="#/productora/${programa.productora?.id}">${programa.productora?.nombre ?? '—'}</a>
                    · ${plural(programa.capitulos.length, 'capítulo')}
                </p>
                <p class="sinopsis">${programa.sinopsis}</p>
                <div class="ficha-acciones">
                    ${trailer(programa.trailer)}
                    ${botonFavorito(programa.id, { grande: true })}
                </div>
            </div>
        </article>

        <div class="pestanas" role="tablist" aria-label="Contenido del programa">
            <button role="tab" id="pestana-capitulos" aria-controls="panel-capitulos" aria-selected="true">Capítulos</button>
            <button role="tab" id="pestana-reparto" aria-controls="panel-reparto" aria-selected="false" tabindex="-1">Reparto (${programa.reparto.length})</button>
        </div>
        <section class="panel" role="tabpanel" id="panel-capitulos" aria-labelledby="pestana-capitulos">${capitulos(programa.capitulos)}</section>
        <section class="panel" role="tabpanel" id="panel-reparto" aria-labelledby="pestana-reparto" hidden>${reparto(programa.reparto)}</section>`);

    activarFavoritos(contenedor.querySelector('.ficha-acciones'));
    activarPestanas(contenedor.querySelector('.pestanas'));
}

export function activarPestanas(lista) {
    const pestanas = [...lista.querySelectorAll('[role="tab"]')];
    const elegir = (elegida) => {
        for (const pestana of pestanas) {
            const activa = pestana === elegida;
            pestana.setAttribute('aria-selected', String(activa));
            pestana.tabIndex = activa ? 0 : -1;
            document.getElementById(pestana.getAttribute('aria-controls')).hidden = !activa;
        }
        elegida.focus();
    };
    lista.addEventListener('click', (evento) => {
        const pestana = evento.target.closest('[role="tab"]');
        if (pestana) elegir(pestana);
    });
    lista.addEventListener('keydown', (evento) => {
        const actual = pestanas.indexOf(document.activeElement);
        if (actual === -1) return;
        if (evento.key === 'ArrowRight') elegir(pestanas[(actual + 1) % pestanas.length]);
        if (evento.key === 'ArrowLeft') elegir(pestanas[(actual - 1 + pestanas.length) % pestanas.length]);
    });
}

export async function vistaPrograma(contenedor, { parametros }) {
    await conEstados(contenedor, {
        cargar: () => api.programas.obtener(parametros.id),
        esVacio: () => false,
        pintar: (elemento, programa) => {
            document.title = programa.titulo + ' · Proyecto Review';
            pintar(elemento, programa);
        }
    });
}
