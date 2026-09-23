import { html, urlSegura } from '../nucleo/plantilla.js';
import { iniciales } from '../nucleo/formato.js';
import { sesion } from '../nucleo/sesion.js';
import { navegar, rutaActual } from '../nucleo/enrutador.js';
import { avisar } from '../nucleo/avisos.js';

export function botonFavorito(programaId, { grande = false } = {}) {
    const marcado = sesion.esFavorito(programaId);
    const texto = marcado ? 'Quitar de favoritos' : 'Agregar a favoritos';
    return html`
        <button class="favorito ${grande ? 'favorito-grande' : ''}" type="button" data-favorito="${programaId}"
            aria-pressed="${marcado}" aria-label="${texto}" title="${texto}">
            <span aria-hidden="true">${marcado ? '★' : '☆'}</span>${grande ? html`<span data-texto>${marcado ? 'En favoritos' : 'Favorito'}</span>` : ''}
        </button>`;
}

export function tarjetaPrograma(programa) {
    return html`
        <article class="tarjeta">
            <a class="tarjeta-enlace" href="#/programa/${programa.id}">
                <img class="tarjeta-poster" src="${urlSegura(programa.poster)}" alt="Poster de ${programa.titulo}" loading="lazy">
                <div class="tarjeta-cuerpo">
                    <span class="etiqueta">${programa.categoria?.nombre ?? 'Sin categoría'}</span>
                    <h3 class="tarjeta-titulo">${programa.titulo}</h3>
                    <p class="tarjeta-detalle">${programa.productora?.nombre ?? ''}</p>
                </div>
            </a>
            ${botonFavorito(programa.id)}
        </article>`;
}

export function avatar(persona, clase = '') {
    return persona.foto
        ? html`<img class="avatar ${clase}" src="${urlSegura(persona.foto)}" alt="" loading="lazy">`
        : html`<span class="avatar avatar-iniciales ${clase}" aria-hidden="true">${iniciales(persona.nombre)}</span>`;
}

export function tarjetaActor(actor) {
    return html`
        <a class="tarjeta-persona" href="#/actor/${actor.id}">
            ${avatar(actor)}
            <span>
                <strong>${actor.nombre}</strong>
                <span class="tarjeta-detalle">${actor.nacionalidad} · ${actor.edad} años</span>
            </span>
        </a>`;
}

// un solo oyente por contenedor atiende todos los botones de favorito que tenga adentro
export function activarFavoritos(contenedor, { alCambiar } = {}) {
    contenedor.addEventListener('click', async (evento) => {
        const boton = evento.target.closest('[data-favorito]');
        if (!boton) return;
        evento.preventDefault();
        if (!sesion.iniciada) {
            avisar('Iniciá sesión para guardar favoritos', 'info');
            return navegar('/login?volver=' + encodeURIComponent(rutaActual()));
        }
        boton.disabled = true;
        try {
            const marcado = await sesion.alternarFavorito(boton.dataset.favorito);
            boton.setAttribute('aria-pressed', String(marcado));
            boton.querySelector('[aria-hidden]').textContent = marcado ? '★' : '☆';
            const texto = boton.querySelector('[data-texto]');
            if (texto) texto.textContent = marcado ? 'En favoritos' : 'Favorito';
            const etiqueta = marcado ? 'Quitar de favoritos' : 'Agregar a favoritos';
            boton.setAttribute('aria-label', etiqueta);
            boton.title = etiqueta;
            alCambiar?.(boton.dataset.favorito, marcado);
        } catch (error) {
            if (error.estado !== 401) avisar(error.message, 'error');
        } finally {
            boton.disabled = false;
        }
    });
}
