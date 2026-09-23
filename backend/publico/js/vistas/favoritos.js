import { api } from '../api/api.js';
import { tarjeta, conEstados } from '../componentes.js';

export async function vistaFavoritos(vista) {
    vista.innerHTML = '<h1>Mis favoritos</h1><div data-lista></div>';
    const lista = vista.querySelector('[data-lista]');
    await conEstados(
        lista,
        () => api.favoritos.listar(),
        (programas) => { lista.innerHTML = `<div class="rejilla">${programas.map(tarjeta).join('')}</div>`; },
        'Todavía no marcaste ningún programa. Tocá la estrella en el catálogo.'
    );
}
