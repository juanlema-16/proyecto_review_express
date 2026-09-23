import { api } from '../nucleo/api.js';
import { html, montar } from '../nucleo/plantilla.js';
import { plural } from '../nucleo/formato.js';
import { conEstados } from '../componentes/estados.js';
import { tarjetaPrograma, activarFavoritos } from '../componentes/tarjetas.js';

const ESPERA_BUSQUEDA_MS = 300;

// el filtro vive en la URL: se puede compartir y el botón atrás funciona
function destino(categoria, texto) {
    const parametros = new URLSearchParams();
    if (categoria) parametros.set('categoria', categoria);
    if (texto) parametros.set('texto', texto);
    const consulta = parametros.toString();
    return '/' + (consulta ? '?' + consulta : '');
}

export async function vistaCatalogo(contenedor, { consulta }) {
    const categoria = consulta.categoria ?? '';
    let texto = consulta.texto ?? '';

    montar(contenedor, html`
        <section class="encabezado-vista">
            <div>
                <h1>Catálogo</h1>
                <p class="subtitulo">Novelas, anime y cartoons con sus capítulos y su reparto.</p>
            </div>
            <form class="buscador" role="search" data-buscador>
                <label class="solo-lectores" for="buscar">Buscar por título</label>
                <input id="buscar" type="search" name="texto" placeholder="Buscar por título…" value="${texto}" maxlength="100" autocomplete="off">
            </form>
        </section>
        <nav class="filtros" aria-label="Categorías" data-filtros></nav>
        <p class="resumen" data-resumen aria-live="polite"></p>
        <div data-programas></div>`);

    const filtros = contenedor.querySelector('[data-filtros]');
    const resumen = contenedor.querySelector('[data-resumen]');
    const programas = contenedor.querySelector('[data-programas]');
    const entrada = contenedor.querySelector('#buscar');
    let categorias = [];

    const pintarFiltros = () => montar(filtros, html`
        <a class="chip" href="#${destino('', texto)}" aria-current="${categoria ? 'false' : 'page'}">Todas</a>
        ${categorias.map((opcion) => html`
            <a class="chip" href="#${destino(opcion.id, texto)}" aria-current="${opcion.id === categoria ? 'page' : 'false'}">${opcion.nombre}</a>`)}`);

    const cargarProgramas = () => {
        resumen.textContent = '';
        return conEstados(programas, {
            cargar: () => api.programas.listar({ categoria, texto }),
            vacio: texto ? 'Ningún programa coincide con "' + texto + '".' : 'Todavía no hay programas en esta categoría.',
            pintar: (elemento, lista) => {
                resumen.textContent = plural(lista.length, 'programa');
                montar(elemento, html`<div class="rejilla">${lista.map(tarjetaPrograma)}</div>`);
            }
        });
    };

    // buscar no recarga la vista: cambia la URL sin navegar y repinta solo la lista
    const buscar = () => {
        texto = entrada.value.trim();
        history.replaceState(null, '', '#' + destino(categoria, texto));
        pintarFiltros();
        cargarProgramas();
    };
    let espera = null;
    entrada.addEventListener('input', () => {
        clearTimeout(espera);
        espera = setTimeout(buscar, ESPERA_BUSQUEDA_MS);
    });
    contenedor.querySelector('[data-buscador]').addEventListener('submit', (evento) => {
        evento.preventDefault();
        clearTimeout(espera);
        buscar();
    });

    // si las categorías fallan, el catálogo igual se muestra sin filtros
    api.categorias.listar().then((lista) => {
        categorias = lista;
        pintarFiltros();
    }).catch(() => filtros.replaceChildren());

    activarFavoritos(programas);
    await cargarProgramas();
}
