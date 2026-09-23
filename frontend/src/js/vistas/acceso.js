import { api } from '../nucleo/api.js';
import { html, montar } from '../nucleo/plantilla.js';
import { navegar } from '../nucleo/enrutador.js';
import { sesion } from '../nucleo/sesion.js';
import { avisar } from '../nucleo/avisos.js';
import { formulario, alEnviar } from '../componentes/formulario.js';

const CAMPOS_INGRESO = [
    { nombre: 'correo', etiqueta: 'Correo', tipo: 'email', requerido: true, autocompletar: 'email' },
    { nombre: 'contrasena', etiqueta: 'Contraseña', tipo: 'password', requerido: true, autocompletar: 'current-password' }
];

const CAMPOS_REGISTRO = [
    { nombre: 'nombreUsuario', etiqueta: 'Nombre de usuario', requerido: true, largoMin: 3, largoMax: 30, autocompletar: 'username', ayuda: 'Letras, números, punto, guion o guion bajo.' },
    { nombre: 'correo', etiqueta: 'Correo', tipo: 'email', requerido: true, autocompletar: 'email' },
    { nombre: 'contrasena', etiqueta: 'Contraseña', tipo: 'password', requerido: true, largoMin: 8, largoMax: 72, autocompletar: 'new-password', ayuda: 'Mínimo 8 caracteres, con al menos una letra y un número.' }
];

// después de entrar vuelve a donde estaba, pero solo a rutas internas
function volverA(consulta) {
    const destino = consulta.volver ?? '/';
    return destino.startsWith('/') && !destino.startsWith('//') ? destino : '/';
}

function tarjetaAcceso(titulo, subtitulo, contenido, pie) {
    return html`
        <section class="acceso">
            <h1>${titulo}</h1>
            <p class="subtitulo">${subtitulo}</p>
            ${contenido}
            <p class="acceso-pie">${pie}</p>
        </section>`;
}

export function vistaLogin(contenedor, { consulta }) {
    montar(contenedor, tarjetaAcceso(
        'Iniciar sesión',
        'Entrá para guardar tus programas favoritos.',
        formulario({ campos: CAMPOS_INGRESO, textoBoton: 'Entrar' }),
        html`¿No tenés cuenta? <a href="#/registro${consulta.volver ? '?volver=' + encodeURIComponent(consulta.volver) : ''}">Registrate</a>`
    ));
    const elemento = contenedor.querySelector('form');
    elemento.querySelector('input').focus();
    alEnviar(elemento, CAMPOS_INGRESO, async (datos) => {
        const usuario = await api.autenticacion.iniciarSesion(datos);
        sesion.establecer(usuario);
        avisar('Hola, ' + usuario.nombreUsuario, 'exito');
        navegar(volverA(consulta));
    });
}

export function vistaRegistro(contenedor, { consulta }) {
    montar(contenedor, tarjetaAcceso(
        'Crear cuenta',
        'Registrate para marcar programas como favoritos.',
        formulario({ campos: CAMPOS_REGISTRO, textoBoton: 'Crear cuenta' }),
        html`¿Ya tenés cuenta? <a href="#/login">Iniciá sesión</a>`
    ));
    const elemento = contenedor.querySelector('form');
    elemento.querySelector('input').focus();
    alEnviar(elemento, CAMPOS_REGISTRO, async (datos) => {
        const usuario = await api.autenticacion.registrar(datos);
        sesion.establecer(usuario);
        avisar('Cuenta creada. ¡Bienvenido, ' + usuario.nombreUsuario + '!', 'exito');
        navegar(volverA(consulta));
    });
}

export function vistaPerfil(contenedor) {
    const { usuario } = sesion;
    montar(contenedor, html`
        <section class="acceso">
            <h1>Mi cuenta</h1>
            <dl class="datos">
                <div><dt>Usuario</dt><dd>${usuario.nombreUsuario}</dd></div>
                <div><dt>Correo</dt><dd>${usuario.correo}</dd></div>
                <div><dt>Rol</dt><dd>${usuario.rol}</dd></div>
                <div><dt>Favoritos</dt><dd><a href="#/favoritos">${usuario.favoritos.length} guardados al entrar</a></dd></div>
            </dl>
            <div class="formulario-acciones">
                <button class="boton boton-secundario" type="button" data-salir>Cerrar sesión</button>
            </div>
        </section>`);
    contenedor.querySelector('[data-salir]').addEventListener('click', async () => {
        await sesion.cerrar();
        avisar('Sesión cerrada', 'info');
        navegar('/');
    });
}
