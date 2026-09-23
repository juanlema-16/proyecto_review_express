import { api } from '../api/api.js';
import { escapar, tarjeta, conEstados } from '../componentes.js';

export async function vistaCatalogo(vista, { consulta }) {
    const categoria = consulta.categoria ?? '';
    const texto = consulta.texto ?? '';
    const enlace = (id) => '#/' + (id || texto ? '?' + new URLSearchParams({ ...(id ? { categoria: id } : {}), ...(texto ? { texto } : {}) }) : '');

    vista.innerHTML = `
        <h1>Catálogo</h1>
        <form data-buscar class="chips">
            <input name="texto" type="search" placeholder="Buscar por título…" value="${escapar(texto)}" aria-label="Buscar por título" style="max-width:320px">
        </form>
        <nav class="chips" data-categorias aria-label="Categorías"></nav>
        <div data-lista></div>`;

    vista.querySelector('[data-buscar]').addEventListener('submit', (evento) => {
        evento.preventDefault();
        const valor = evento.target.texto.value.trim();
        location.hash = '/' + (categoria || valor ? '?' + new URLSearchParams({ ...(categoria ? { categoria } : {}), ...(valor ? { texto: valor } : {}) }) : '');
    });

    api.categorias.listar().then((categorias) => {
        vista.querySelector('[data-categorias]').innerHTML = `
            <a class="chip" href="${enlace('')}" aria-current="${categoria ? 'false' : 'page'}">Todas</a>
            ${categorias.map((opcion) => `
                <a class="chip" href="${enlace(opcion.id)}" aria-current="${opcion.id === categoria ? 'page' : 'false'}">${escapar(opcion.nombre)}</a>`).join('')}`;
    }).catch(() => null);

    const lista = vista.querySelector('[data-lista]');
    await conEstados(
        lista,
        () => api.programas.listar({ categoria, texto }),
        (programas) => { lista.innerHTML = `<div class="rejilla">${programas.map(tarjeta).join('')}</div>`; },
        texto ? 'Ningún programa coincide con la búsqueda.' : 'No hay programas en esta categoría.'
    );
}
