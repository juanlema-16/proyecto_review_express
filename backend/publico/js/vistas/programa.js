import { api } from '../api/api.js';
import { estado } from '../estado.js';
import { escapar, url, conEstados } from '../componentes.js';

const fecha = (valor) => valor ? new Date(valor).toLocaleDateString('es', { timeZone: 'UTC' }) : '';

export async function vistaPrograma(vista, { parametros }) {
    await conEstados(vista, () => api.programas.obtener(parametros.id), (programa) => {
        const marcado = estado.favoritos.has(programa.id);
        vista.innerHTML = `
            <p><a href="#/">← Catálogo</a></p>
            <article class="ficha">
                <img src="${url(programa.poster)}" alt="Poster de ${escapar(programa.titulo)}">
                <div>
                    <p class="suave">${escapar(programa.categoria?.nombre)} · ${escapar(programa.productora?.nombre)}</p>
                    <h1>${escapar(programa.titulo)}</h1>
                    <p>${escapar(programa.sinopsis)}</p>
                    <p>
                        <a class="boton boton-claro" href="${url(programa.trailer)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none">▶ Trailer</a>
                        <button class="boton" type="button" data-favorito="${escapar(programa.id)}" aria-pressed="${marcado}">${marcado ? '★ En favoritos' : '☆ Favorito'}</button>
                    </p>
                </div>
            </article>

            <h2>Capítulos</h2>
            ${programa.capitulos.length === 0 ? '<p class="estado">Todavía no hay capítulos.</p>' : `
                <ul class="lista">
                    ${programa.capitulos.map((capitulo) => `
                        <li><strong>${escapar(capitulo.etiqueta)}</strong> ${escapar(capitulo.titulo)}
                            <span class="suave">· ${escapar(capitulo.duracionMinutos)} min ${capitulo.fechaEstreno ? '· ' + escapar(fecha(capitulo.fechaEstreno)) : ''}</span></li>`).join('')}
                </ul>`}

            <h2>Reparto</h2>
            ${programa.reparto.length === 0 ? '<p class="estado">Todavía no hay reparto.</p>' : `
                <ul class="lista">
                    ${programa.reparto.map((personaje) => `
                        <li><strong>${escapar(personaje.nombre)}</strong>
                            <span class="suave">interpretado por</span>
                            <a href="#/actor/${escapar(personaje.actor?.id)}">${escapar(personaje.actor?.nombre ?? '—')}</a></li>`).join('')}
                </ul>`}`;
    });
}

export async function vistaActor(vista, { parametros }) {
    await conEstados(vista, () => api.actores.obtener(parametros.id), (actor) => {
        vista.innerHTML = `
            <p><a href="#/">← Catálogo</a></p>
            <h1>${escapar(actor.nombre)}</h1>
            <p class="suave">${escapar(actor.nacionalidad)} · nació el ${escapar(fecha(actor.fechaNacimiento))} · ${escapar(actor.edad)} años</p>
            <h2>Personajes que interpreta</h2>
            ${actor.personajes.length === 0 ? '<p class="estado">Todavía no interpreta ningún personaje.</p>' : `
                <ul class="lista">
                    ${actor.personajes.map((personaje) => `
                        <li><strong>${escapar(personaje.nombre)}</strong> <span class="suave">en</span>
                            <a href="#/programa/${escapar(personaje.programa?.id)}">${escapar(personaje.programa?.titulo ?? '—')}</a></li>`).join('')}
                </ul>`}`;
    });
}
