import { api } from '../api/api.js';
import { escapar, avisar, conEstados, textoError } from '../componentes.js';

const fechaCampo = (valor) => (valor ? String(valor).slice(0, 10) : '');

// tipo: texto, numero, fecha, url, area o una función que arma las opciones de un select
const RECURSOS = {
    programas: {
        titulo: 'Programas',
        columnas: (fila) => [fila.titulo, fila.categoria?.nombre, fila.productora?.nombre],
        campos: {
            titulo: 'texto', sinopsis: 'area', poster: 'url', trailer: 'url',
            categoriaId: () => api.categorias.listar().then((lista) => lista.map((c) => [c.id, c.nombre])),
            productoraId: () => api.productoras.listar().then((lista) => lista.map((p) => [p.id, p.nombre]))
        }
    },
    categorias: { titulo: 'Categorías', columnas: (fila) => [fila.nombre, fila.descripcion], campos: { nombre: 'texto', descripcion: 'area' } },
    productoras: { titulo: 'Productoras', columnas: (fila) => [fila.nombre, fila.pais, fila.anioFundacion], campos: { nombre: 'texto', pais: 'texto', anioFundacion: 'numero' } },
    actores: {
        titulo: 'Actores',
        columnas: (fila) => [fila.nombre, fila.nacionalidad, fechaCampo(fila.fechaNacimiento)],
        campos: { nombre: 'texto', nacionalidad: 'texto', fechaNacimiento: 'fecha', foto: 'url' }
    },
    capitulos: {
        titulo: 'Capítulos',
        columnas: (fila) => [fila.etiqueta, fila.titulo, fila.duracionMinutos + ' min'],
        campos: {
            programaId: () => api.programas.listar().then((lista) => lista.map((p) => [p.id, p.titulo])),
            temporada: 'numero', numero: 'numero', titulo: 'texto', duracionMinutos: 'numero', fechaEstreno: 'fecha'
        },
        // el programa de un capítulo no se cambia
        soloAlCrear: ['programaId']
    },
    personajes: {
        titulo: 'Personajes',
        columnas: (fila) => [fila.nombre, fila.actor?.nombre],
        campos: {
            nombre: 'texto',
            programaId: () => api.programas.listar().then((lista) => lista.map((p) => [p.id, p.titulo])),
            actorId: () => api.actores.listar().then((lista) => lista.map((a) => [a.id, a.nombre]))
        }
    }
};

const ETIQUETAS = {
    titulo: 'Título', sinopsis: 'Sinopsis', poster: 'Poster (URL de imagen)', trailer: 'Trailer (URL de video)',
    categoriaId: 'Categoría', productoraId: 'Productora', programaId: 'Programa', actorId: 'Actor',
    nombre: 'Nombre', descripcion: 'Descripción', pais: 'País', anioFundacion: 'Año de fundación',
    nacionalidad: 'Nacionalidad', fechaNacimiento: 'Fecha de nacimiento', foto: 'Foto (URL)',
    temporada: 'Temporada', numero: 'Número', duracionMinutos: 'Duración (min)', fechaEstreno: 'Estreno'
};

const OPCIONALES = new Set(['descripcion', 'foto', 'fechaEstreno']);
const TIPOS = { texto: 'text', numero: 'number', fecha: 'date', url: 'url' };

async function control(nombre, tipo, valor) {
    const requerido = OPCIONALES.has(nombre) ? '' : 'required';
    if (typeof tipo === 'function') {
        const opciones = await tipo();
        return `<select name="${nombre}" ${requerido}><option value="">Elegí…</option>${opciones.map(([id, texto]) => `
            <option value="${escapar(id)}" ${id === valor ? 'selected' : ''}>${escapar(texto)}</option>`).join('')}</select>`;
    }
    if (tipo === 'area') return `<textarea name="${nombre}" rows="3" ${requerido}>${escapar(valor)}</textarea>`;
    const mostrado = tipo === 'fecha' ? fechaCampo(valor) : valor;
    return `<input name="${nombre}" type="${TIPOS[tipo]}" value="${escapar(mostrado)}" ${requerido}>`;
}

export async function vistaAdmin(vista, { parametros }) {
    const clave = RECURSOS[parametros.recurso] ? parametros.recurso : 'programas';
    const recurso = RECURSOS[clave];
    const servicio = api[clave];

    vista.innerHTML = `
        <h1>Administración</h1>
        <nav class="chips">${Object.entries(RECURSOS).map(([otra, definicion]) => `
            <a class="chip" href="#/admin/${otra}" aria-current="${otra === clave ? 'page' : 'false'}">${definicion.titulo}</a>`).join('')}</nav>
        <p><button class="boton" type="button" data-nuevo>+ Agregar</button></p>
        <div data-edicion></div>
        <div data-tabla></div>`;

    const tabla = vista.querySelector('[data-tabla]');
    const edicion = vista.querySelector('[data-edicion]');
    const filas = new Map();

    const cargar = () => conEstados(tabla, () => servicio.listar(), (lista) => {
        filas.clear();
        lista.forEach((fila) => filas.set(fila.id, fila));
        tabla.innerHTML = `
            <div class="tabla-caja"><table>
                <tbody>${lista.map((fila) => `
                    <tr>
                        ${recurso.columnas(fila).map((valor) => `<td>${escapar(valor ?? '—')}</td>`).join('')}
                        <td>
                            <button class="boton boton-claro" type="button" data-editar="${escapar(fila.id)}">Editar</button>
                            <button class="boton boton-peligro" type="button" data-borrar="${escapar(fila.id)}">Borrar</button>
                        </td>
                    </tr>`).join('')}
                </tbody>
            </table></div>`;
    }, 'Todavía no hay registros.');

    async function editar(fila = null) {
        const campos = Object.entries(recurso.campos).filter(([nombre]) => !(fila && recurso.soloAlCrear?.includes(nombre)));
        const controles = await Promise.all(campos.map(async ([nombre, tipo]) => `
            <label>${ETIQUETAS[nombre]} ${await control(nombre, tipo, fila?.[nombre] ?? '')}</label>`));
        edicion.innerHTML = `
            <form class="formulario panel-edicion">
                <strong>${fila ? 'Editar' : 'Agregar'}</strong>
                ${controles.join('')}
                <p class="error" role="alert"></p>
                <p>
                    <button class="boton" type="submit">Guardar</button>
                    <button class="boton boton-claro" type="button" data-cancelar>Cancelar</button>
                </p>
            </form>`;
        const formulario = edicion.querySelector('form');
        formulario.querySelector('input, select, textarea').focus();
        formulario.querySelector('[data-cancelar]').addEventListener('click', () => { edicion.innerHTML = ''; });
        formulario.addEventListener('submit', async (evento) => {
            evento.preventDefault();
            const datos = {};
            for (const [nombre, tipo] of campos) {
                const valor = formulario.elements[nombre].value.trim();
                if (valor === '' && !OPCIONALES.has(nombre)) continue;
                datos[nombre] = tipo === 'numero' ? Number(valor) : valor;
            }
            try {
                if (fila) await servicio.actualizar(fila.id, datos);
                else await servicio.crear(datos);
                edicion.innerHTML = '';
                avisar('Guardado');
                cargar();
            } catch (error) {
                formulario.querySelector('.error').textContent = textoError(error);
            }
        });
    }

    vista.querySelector('[data-nuevo]').addEventListener('click', () => editar());
    tabla.addEventListener('click', async (evento) => {
        const aEditar = evento.target.closest('[data-editar]');
        const aBorrar = evento.target.closest('[data-borrar]');
        if (aEditar) editar(filas.get(aEditar.dataset.editar));
        if (aBorrar && confirm('¿Borrar este registro? No se puede deshacer.')) {
            try {
                await servicio.borrar(aBorrar.dataset.borrar);
                avisar('Borrado');
                cargar();
            } catch (error) {
                if (error.estado !== 401) avisar(error.message);
            }
        }
    });

    await cargar();
}
