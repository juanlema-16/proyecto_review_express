import { api } from '../../nucleo/api.js';
import { html, montar } from '../../nucleo/plantilla.js';
import { navegar } from '../../nucleo/enrutador.js';
import { avisar } from '../../nucleo/avisos.js';
import { plural } from '../../nucleo/formato.js';
import { conEstados } from '../../componentes/estados.js';
import { formulario, campoFormulario, alEnviar } from '../../componentes/formulario.js';
import { abrirDialogo, confirmar } from '../../componentes/dialogo.js';
import { RECURSOS, CAMPOS_CAPITULO } from './recursos.js';

// ---- capítulos iniciales: filas que se agregan y quitan dentro del alta de un programa ----

function camposFila(posicion) {
    return CAMPOS_CAPITULO.map((campo) => ({ ...campo, nombre: 'capitulos[' + posicion + '].' + campo.nombre }));
}

function leerCapitulos(formularioElemento) {
    return [...formularioElemento.querySelectorAll('[data-fila]')].map((fila, posicion) => {
        const capitulo = {};
        for (const campo of CAMPOS_CAPITULO) {
            const valor = fila.querySelector('[name="capitulos[' + posicion + '].' + campo.nombre + '"]').value.trim();
            if (valor !== '') capitulo[campo.nombre] = campo.tipo === 'number' ? Number(valor) : valor;
        }
        return capitulo;
    });
}

function activarCapitulos(formularioElemento) {
    const filas = formularioElemento.querySelector('[data-filas]');
    const pintar = (capitulos) => montar(filas, html`${capitulos.map((capitulo, posicion) => html`
        <div class="fila-capitulo" data-fila>
            ${camposFila(posicion).map((campo, indice) => campoFormulario(campo, capitulo[CAMPOS_CAPITULO[indice].nombre]))}
            <button class="boton-icono" type="button" data-quitar="${posicion}" aria-label="Quitar capítulo ${posicion + 1}">✕</button>
        </div>`)}`);

    formularioElemento.querySelector('[data-agregar-capitulo]').addEventListener('click', () => {
        const capitulos = leerCapitulos(formularioElemento);
        const ultimo = capitulos.at(-1);
        capitulos.push({ temporada: ultimo?.temporada ?? 1, numero: (ultimo?.numero ?? 0) + 1 });
        pintar(capitulos);
        filas.querySelector('[data-fila]:last-child input[name$=".titulo"]').focus();
    });
    filas.addEventListener('click', (evento) => {
        const boton = evento.target.closest('[data-quitar]');
        if (!boton) return;
        const capitulos = leerCapitulos(formularioElemento);
        capitulos.splice(Number(boton.dataset.quitar), 1);
        pintar(capitulos);
    });
}

const BLOQUE_CAPITULOS = html`
    <fieldset class="capitulos-iniciales">
        <legend>Capítulos iniciales <span class="tarjeta-detalle">(opcional)</span></legend>
        <p class="campo-ayuda">Se guardan junto con el programa: si uno falla, no se guarda nada.</p>
        <div data-filas></div>
        <button class="boton boton-secundario" type="button" data-agregar-capitulo>+ Agregar capítulo</button>
    </fieldset>`;

// ---- panel ----

export async function vistaAdmin(contenedor, { parametros, consulta }) {
    const recurso = RECURSOS.find((opcion) => opcion.clave === parametros.recurso) ?? RECURSOS[0];
    const programaFiltro = recurso.filtroPorPrograma ? consulta.programa ?? '' : '';
    const contexto = { porId: {} };
    const filas = new Map();

    montar(contenedor, html`
        <section class="encabezado-vista">
            <div>
                <h1>Administración</h1>
                <p class="subtitulo">Alta, edición y baja de todo el catálogo.</p>
            </div>
        </section>
        <nav class="filtros" aria-label="Recursos">
            ${RECURSOS.map((opcion) => html`
                <a class="chip" href="#/admin/${opcion.clave}" aria-current="${opcion === recurso ? 'page' : 'false'}">${opcion.titulo}</a>`)}
        </nav>
        <div class="barra-admin">
            <div data-filtro></div>
            <button class="boton" type="button" data-nuevo>+ Agregar ${recurso.singular}</button>
        </div>
        <div data-tabla></div>`);

    const tabla = contenedor.querySelector('[data-tabla]');
    const filtro = contenedor.querySelector('[data-filtro]');

    async function cargarContexto() {
        for (const nombre of recurso.necesita ?? []) {
            contexto[nombre] = await api[nombre].listar();
            contexto.porId[nombre] = new Map(contexto[nombre].map((elemento) => [elemento.id, elemento]));
        }
    }

    function pintarFiltro() {
        if (!recurso.filtroPorPrograma) return;
        montar(filtro, html`
            <label class="filtro-programa">
                <span>Programa</span>
                <select data-programa>
                    <option value="">Todos</option>
                    ${contexto.programas.map((programa) => html`
                        <option value="${programa.id}" ${programa.id === programaFiltro ? html`selected` : ''}>${programa.titulo}</option>`)}
                </select>
            </label>`);
        filtro.querySelector('[data-programa]').addEventListener('change', (evento) => {
            navegar('/admin/' + recurso.clave + (evento.target.value ? '?programa=' + evento.target.value : ''));
        });
    }

    function pintarTabla(elemento, lista) {
        filas.clear();
        lista.forEach((fila) => filas.set(fila.id, fila));
        montar(elemento, html`
            <p class="resumen">${plural(lista.length, recurso.singular, recurso.singular === 'actor' ? 'actores' : undefined)}</p>
            <div class="tabla-contenedor">
                <table class="tabla">
                    <thead>
                        <tr>
                            ${recurso.columnas.map((columna) => html`<th scope="col">${columna.titulo}</th>`)}
                            <th scope="col"><span class="solo-lectores">Acciones</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${lista.map((fila) => html`
                            <tr>
                                ${recurso.columnas.map((columna) => html`<td data-titulo="${columna.titulo}">${columna.valor(fila, contexto)}</td>`)}
                                <td class="tabla-acciones">
                                    <button class="boton boton-chico boton-secundario" type="button" data-editar="${fila.id}">Editar</button>
                                    <button class="boton boton-chico boton-peligro" type="button" data-borrar="${fila.id}">Borrar</button>
                                </td>
                            </tr>`)}
                    </tbody>
                </table>
            </div>`);
    }

    const recargar = () => conEstados(tabla, {
        cargar: async () => {
            await cargarContexto();
            pintarFiltro();
            return recurso.servicio.listar(programaFiltro ? { programa: programaFiltro } : undefined);
        },
        vacio: 'Todavía no hay nada cargado en ' + recurso.titulo.toLowerCase() + '.',
        pintar: pintarTabla
    });

    async function abrirFormulario(fila = null) {
        const editando = fila !== null;
        const campos = recurso.campos(contexto, { editando });
        const valores = editando ? recurso.valores?.(fila) ?? fila : { programaId: programaFiltro };
        const conCapitulos = !editando && recurso.capitulosIniciales;

        const guardado = await abrirDialogo({
            titulo: (editando ? 'Editar ' : 'Agregar ') + recurso.singular,
            ancho: true,
            contenido: formulario({ campos, valores, textoBoton: editando ? 'Guardar cambios' : 'Crear', extra: conCapitulos ? BLOQUE_CAPITULOS : '' }),
            alMontar: (dialogo, cerrar) => {
                const elemento = dialogo.querySelector('form');
                if (conCapitulos) activarCapitulos(elemento);
                elemento.querySelector('input, select, textarea')?.focus();
                alEnviar(elemento, campos, async (datos) => {
                    if (conCapitulos) datos.capitulos = leerCapitulos(elemento);
                    if (editando) await recurso.servicio.actualizar(fila.id, datos);
                    else await recurso.servicio.crear(datos);
                    cerrar(true);
                });
            }
        });
        if (!guardado) return;
        avisar(editando ? 'Cambios guardados' : 'Alta registrada', 'exito');
        recargar();
    }

    async function borrar(fila) {
        const nombre = fila.titulo ?? fila.nombre;
        const seguro = await confirmar({
            titulo: 'Borrar ' + recurso.singular,
            mensaje: recurso.mensajeBorrado?.(fila) ?? '¿Borrar "' + nombre + '"? No se puede deshacer.'
        });
        if (!seguro) return;
        try {
            const resultado = await recurso.servicio.borrar(fila.id);
            avisar(recurso.resultadoBorrado?.(resultado) ?? 'Borrado', 'exito');
            recargar();
        } catch (error) {
            // un 409 EN_USO explica qué lo está usando
            if (error.estado !== 401) avisar(error.message, 'error');
        }
    }

    contenedor.querySelector('[data-nuevo]').addEventListener('click', async () => {
        try {
            await cargarContexto();
            await abrirFormulario();
        } catch (error) {
            if (error.estado !== 401) avisar(error.message, 'error');
        }
    });
    tabla.addEventListener('click', (evento) => {
        const editar = evento.target.closest('[data-editar]');
        const quitar = evento.target.closest('[data-borrar]');
        if (editar) abrirFormulario(filas.get(editar.dataset.editar));
        if (quitar) borrar(filas.get(quitar.dataset.borrar));
    });

    await recargar();
}
