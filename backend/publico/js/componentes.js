import { estado } from './estado.js';

const ENTIDADES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

// todo lo que venga de la API pasa por acá antes de entrar al HTML
export function escapar(valor) {
    return String(valor ?? '').replace(/[&<>"']/g, (caracter) => ENTIDADES[caracter]);
}

export function url(valor) {
    return /^https?:\/\//i.test(String(valor ?? '')) ? escapar(valor) : '#';
}

export function avisar(texto) {
    const aviso = document.getElementById('aviso');
    aviso.textContent = texto;
    aviso.hidden = false;
    clearTimeout(avisar.espera);
    avisar.espera = setTimeout(() => { aviso.hidden = true; }, 3500);
}

export function tarjeta(programa) {
    const marcado = estado.favoritos.has(programa.id);
    return `
        <article class="tarjeta">
            <a href="#/programa/${escapar(programa.id)}">
                <img src="${url(programa.poster)}" alt="" loading="lazy">
                <div>
                    <strong>${escapar(programa.titulo)}</strong>
                    <span class="suave">${escapar(programa.categoria?.nombre ?? '')}</span>
                </div>
            </a>
            <button class="estrella" type="button" data-favorito="${escapar(programa.id)}" aria-pressed="${marcado}"
                aria-label="${marcado ? 'Quitar de favoritos' : 'Agregar a favoritos'}">${marcado ? '★' : '☆'}</button>
        </article>`;
}

// carga, error con reintentar y lista vacía
export async function conEstados(contenedor, cargar, pintar, vacio = 'No hay nada para mostrar.') {
    contenedor.innerHTML = '<p class="estado" role="status">Cargando…</p>';
    try {
        const datos = await cargar();
        if (Array.isArray(datos) && datos.length === 0) {
            contenedor.innerHTML = `<p class="estado">${escapar(vacio)}</p>`;
            return;
        }
        pintar(datos);
    } catch (error) {
        if (error.estado === 401) return;
        contenedor.innerHTML = `
            <div class="estado estado-error" role="alert">
                <p>${escapar(error.message)}</p>
                <button class="boton boton-claro" type="button">Reintentar</button>
            </div>`;
        contenedor.querySelector('button').addEventListener('click', () => conEstados(contenedor, cargar, pintar, vacio));
    }
}

// los detalles por campo de la API se juntan en un solo mensaje
export function textoError(error) {
    const detalles = Array.isArray(error.detalles) ? error.detalles.map((detalle) => detalle.mensaje) : [];
    return [error.message, ...detalles].join(' · ');
}
