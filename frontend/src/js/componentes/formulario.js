import { html } from '../nucleo/plantilla.js';

// campo: { nombre, etiqueta, tipo, requerido, min, max, largoMin, largoMax, opciones, ayuda, vaciable }
function control(campo, valor) {
    const id = 'campo-' + campo.nombre;
    const comunes = html`id="${id}" name="${campo.nombre}" aria-describedby="${id}-error" ${campo.requerido ? html`required` : ''}`;

    if (campo.tipo === 'textarea') {
        return html`<textarea ${comunes} rows="${campo.filas ?? 4}" ${campo.largoMin ? html`minlength="${campo.largoMin}"` : ''} ${campo.largoMax ? html`maxlength="${campo.largoMax}"` : ''}>${valor ?? ''}</textarea>`;
    }
    if (campo.tipo === 'select') {
        return html`
            <select ${comunes}>
                <option value="">Elegí una opción</option>
                ${(campo.opciones ?? []).map((opcion) => html`<option value="${opcion.valor}" ${String(opcion.valor) === String(valor ?? '') ? html`selected` : ''}>${opcion.texto}</option>`)}
            </select>`;
    }
    return html`
        <input ${comunes} type="${campo.tipo ?? 'text'}" value="${valor ?? ''}"
            ${campo.min !== undefined ? html`min="${campo.min}"` : ''} ${campo.max !== undefined ? html`max="${campo.max}"` : ''}
            ${campo.largoMin ? html`minlength="${campo.largoMin}"` : ''} ${campo.largoMax ? html`maxlength="${campo.largoMax}"` : ''}
            ${campo.autocompletar ? html`autocomplete="${campo.autocompletar}"` : ''}>`;
}

export function campoFormulario(campo, valor) {
    return html`
        <div class="campo ${campo.ancho ? 'campo-ancho' : ''}" data-campo="${campo.nombre}">
            <label for="campo-${campo.nombre}">${campo.etiqueta}${campo.requerido ? html` <span class="obligatorio" aria-hidden="true">*</span>` : ''}</label>
            ${control(campo, valor)}
            ${campo.ayuda ? html`<small class="campo-ayuda">${campo.ayuda}</small>` : ''}
            <small class="campo-error" id="campo-${campo.nombre}-error"></small>
        </div>`;
}

export function formulario({ campos, valores = {}, textoBoton = 'Guardar', extra = '' }) {
    return html`
        <form class="formulario" novalidate>
            <div class="formulario-error" data-error-general role="alert" hidden></div>
            <div class="formulario-campos">
                ${campos.map((campo) => campoFormulario(campo, valores[campo.nombre]))}
            </div>
            ${extra}
            <div class="formulario-acciones">
                <button class="boton" type="submit">${textoBoton}</button>
            </div>
        </form>`;
}

// convierte lo escrito al tipo que espera la API; lo vacío no viaja, salvo que se pueda vaciar
export function leerFormulario(elemento, campos) {
    const datos = {};
    for (const campo of campos) {
        const control = elemento.querySelector('[name="' + campo.nombre + '"]');
        if (!control) continue;
        const valor = control.value.trim();
        if (valor === '') {
            if (campo.vaciable) datos[campo.nombre] = '';
            continue;
        }
        datos[campo.nombre] = campo.tipo === 'number' ? Number(valor) : valor;
    }
    return datos;
}

export function limpiarErrores(elemento) {
    elemento.querySelectorAll('.campo-error').forEach((error) => { error.textContent = ''; });
    elemento.querySelectorAll('[aria-invalid]').forEach((control) => control.removeAttribute('aria-invalid'));
    const general = elemento.querySelector('[data-error-general]');
    if (general) general.hidden = true;
}

function marcar(elemento, nombre, mensaje) {
    const contenedor = elemento.querySelector('[data-campo="' + nombre + '"]');
    if (!contenedor) return false;
    contenedor.querySelector('.campo-error').textContent = mensaje;
    contenedor.querySelector('input, select, textarea')?.setAttribute('aria-invalid', 'true');
    return true;
}

// primero lo que el navegador ya sabe (required, min, type=url); así no viaja un formulario roto
export function validarEnNavegador(elemento) {
    limpiarErrores(elemento);
    let valido = true;
    for (const control of elemento.querySelectorAll('input, select, textarea')) {
        if (control.checkValidity()) continue;
        valido = false;
        marcar(elemento, control.name, control.validationMessage);
    }
    elemento.querySelector('[aria-invalid="true"]')?.focus();
    return valido;
}

// los detalles de la API vienen por campo: cada mensaje va debajo de su campo
export function mostrarErrores(elemento, error) {
    limpiarErrores(elemento);
    const sueltos = [];
    for (const detalle of Array.isArray(error.detalles) ? error.detalles : []) {
        if (!marcar(elemento, detalle.campo, detalle.mensaje)) sueltos.push(detalle.mensaje);
    }
    const general = elemento.querySelector('[data-error-general]');
    if (general) {
        general.textContent = [error.message, ...sueltos].join(' · ');
        general.hidden = false;
    }
    elemento.querySelector('[aria-invalid="true"]')?.focus();
}

// envía con el botón deshabilitado y muestra los errores donde corresponden
export function alEnviar(elemento, campos, accion) {
    elemento.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        if (!validarEnNavegador(elemento)) return;
        const boton = elemento.querySelector('[type="submit"]');
        boton.disabled = true;
        try {
            await accion(leerFormulario(elemento, campos));
        } catch (error) {
            mostrarErrores(elemento, error);
        } finally {
            if (boton.isConnected) boton.disabled = false;
        }
    });
}
