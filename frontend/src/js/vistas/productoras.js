import { api } from '../nucleo/api.js';
import { html, montar } from '../nucleo/plantilla.js';
import { plural } from '../nucleo/formato.js';
import { conEstados, estadoVacio } from '../componentes/estados.js';
import { tarjetaPrograma, activarFavoritos } from '../componentes/tarjetas.js';

export async function vistaProductoras(contenedor) {
    montar(contenedor, html`
        <section class="encabezado-vista">
            <div>
                <h1>Productoras</h1>
                <p class="subtitulo">Los estudios detrás de cada programa.</p>
            </div>
        </section>
        <div data-productoras></div>`);

    await conEstados(contenedor.querySelector('[data-productoras]'), {
        cargar: () => api.productoras.listar(),
        vacio: 'Todavía no hay productoras cargadas.',
        pintar: (elemento, lista) => montar(elemento, html`
            <ul class="lista-tarjetas">
                ${lista.map((productora) => html`
                    <li>
                        <a class="tarjeta-fila" href="#/productora/${productora.id}">
                            <strong>${productora.nombre}</strong>
                            <span class="tarjeta-detalle">${productora.pais} · desde ${productora.anioFundacion} (${productora.aniosDeTrayectoria} años)</span>
                        </a>
                    </li>`)}
            </ul>`)
    });
}

export async function vistaProductora(contenedor, { parametros }) {
    await conEstados(contenedor, {
        cargar: () => api.productoras.obtener(parametros.id),
        esVacio: () => false,
        pintar: (elemento, productora) => {
            document.title = productora.nombre + ' · Proyecto Review';
            montar(elemento, html`
                <a class="volver" href="#/productoras">← Productoras</a>
                <section class="encabezado-vista">
                    <div>
                        <h1>${productora.nombre}</h1>
                        <p class="subtitulo">${productora.pais} · fundada en ${productora.anioFundacion} · ${plural(productora.programas.length, 'programa')}</p>
                    </div>
                </section>
                <div data-programas>
                    ${productora.programas.length === 0
                        ? estadoVacio('Esta productora todavía no tiene programas.')
                        : html`<div class="rejilla">${productora.programas.map((programa) => tarjetaPrograma({ ...programa, productora }))}</div>`}
                </div>`);
            activarFavoritos(elemento.querySelector('[data-programas]'));
        }
    });
}
