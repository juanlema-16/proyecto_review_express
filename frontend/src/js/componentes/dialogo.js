import { html, montar } from '../nucleo/plantilla.js';

// <dialog> nativo: atrapa el foco, cierra con Escape y devuelve el foco al abrir
export function abrirDialogo({ titulo, contenido, ancho = false, alMontar }) {
    const dialogo = document.createElement('dialog');
    dialogo.className = 'dialogo' + (ancho ? ' dialogo-ancho' : '');
    dialogo.setAttribute('aria-labelledby', 'dialogo-titulo');
    montar(dialogo, html`
        <div class="dialogo-cabecera">
            <h2 id="dialogo-titulo">${titulo}</h2>
            <button class="boton-icono" type="button" data-cerrar aria-label="Cerrar">✕</button>
        </div>
        <div class="dialogo-cuerpo">${contenido}</div>`);
    document.body.append(dialogo);

    return new Promise((resolver) => {
        let resultado = null;
        const cerrar = (valor = null) => {
            resultado = valor;
            dialogo.close();
        };
        dialogo.addEventListener('close', () => {
            dialogo.remove();
            resolver(resultado);
        });
        dialogo.querySelector('[data-cerrar]').addEventListener('click', () => cerrar());
        dialogo.showModal();
        alMontar?.(dialogo, cerrar);
    });
}

export async function confirmar({ titulo = '¿Seguro?', mensaje, textoAceptar = 'Borrar' }) {
    const respuesta = await abrirDialogo({
        titulo,
        contenido: html`
            <p>${mensaje}</p>
            <div class="formulario-acciones">
                <button class="boton boton-secundario" type="button" data-no>Cancelar</button>
                <button class="boton boton-peligro" type="button" data-si>${textoAceptar}</button>
            </div>`,
        alMontar: (dialogo, cerrar) => {
            dialogo.querySelector('[data-no]').addEventListener('click', () => cerrar(false));
            dialogo.querySelector('[data-si]').addEventListener('click', () => cerrar(true));
            dialogo.querySelector('[data-no]').focus();
        }
    });
    return respuesta === true;
}
