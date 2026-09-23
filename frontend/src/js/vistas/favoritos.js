import { api } from '../nucleo/api.js';
import { html, montar } from '../nucleo/plantilla.js';
import { plural } from '../nucleo/formato.js';
import { conEstados } from '../componentes/estados.js';
import { tarjetaPrograma, activarFavoritos } from '../componentes/tarjetas.js';

export async function vistaFavoritos(contenedor) {
    montar(contenedor, html`
        <section class="encabezado-vista">
            <div>
                <h1>Mis favoritos</h1>
                <p class="subtitulo" data-resumen></p>
            </div>
        </section>
        <div data-favoritos></div>`);

    const lista = contenedor.querySelector('[data-favoritos]');
    const resumen = contenedor.querySelector('[data-resumen]');
    const cargar = () => conEstados(lista, {
        cargar: () => api.favoritos.listar(),
        vacio: 'Todavía no marcaste ningún programa. Tocá la estrella en cualquier tarjeta del catálogo.',
        accionVacio: html`<a class="boton" href="#/">Ir al catálogo</a>`,
        pintar: (elemento, programas) => {
            resumen.textContent = plural(programas.length, 'programa') + ' guardados';
            montar(elemento, html`<div class="rejilla">${programas.map(tarjetaPrograma)}</div>`);
        }
    });

    // al desmarcar, la tarjeta se va de la lista
    activarFavoritos(lista, { alCambiar: (programaId, marcado) => { if (!marcado) cargar(); } });
    await cargar();
}
