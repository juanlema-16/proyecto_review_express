import { api } from '../api/api.js';
import { estado } from '../estado.js';
import { navegar } from '../enrutador.js';
import { avisar, textoError } from '../componentes.js';

function volverA(consulta) {
    const destino = consulta.volver ?? '/';
    return destino.startsWith('/') && !destino.startsWith('//') ? destino : '/';
}

function formularioAcceso(vista, { titulo, campos, boton, pie, enviar }) {
    vista.innerHTML = `
        <section class="acceso">
            <h1>${titulo}</h1>
            <form class="formulario">
                ${campos}
                <p class="error" role="alert"></p>
                <button class="boton" type="submit">${boton}</button>
            </form>
            <p class="suave">${pie}</p>
        </section>`;
    const formulario = vista.querySelector('form');
    formulario.querySelector('input').focus();
    formulario.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        const boton = formulario.querySelector('button');
        boton.disabled = true;
        formulario.querySelector('.error').textContent = '';
        try {
            await enviar(Object.fromEntries(new FormData(formulario)));
        } catch (error) {
            formulario.querySelector('.error').textContent = textoError(error);
        } finally {
            boton.disabled = false;
        }
    });
}

export function vistaLogin(vista, { consulta }) {
    formularioAcceso(vista, {
        titulo: 'Iniciar sesión',
        campos: `
            <label>Correo <input name="correo" type="email" required autocomplete="email"></label>
            <label>Contraseña <input name="contrasena" type="password" required autocomplete="current-password"></label>`,
        boton: 'Entrar',
        pie: '¿No tenés cuenta? <a href="#/registro">Registrate</a>',
        enviar: async (datos) => {
            estado.fijar(await api.iniciarSesion(datos));
            avisar('Hola, ' + estado.usuario.nombreUsuario);
            navegar(volverA(consulta));
        }
    });
}

export function vistaRegistro(vista, { consulta }) {
    formularioAcceso(vista, {
        titulo: 'Crear cuenta',
        campos: `
            <label>Nombre de usuario <input name="nombreUsuario" required minlength="3" maxlength="30" autocomplete="username"></label>
            <label>Correo <input name="correo" type="email" required autocomplete="email"></label>
            <label>Contraseña <input name="contrasena" type="password" required minlength="8" maxlength="72" autocomplete="new-password"></label>
            <span class="suave">Mínimo 8 caracteres, con al menos una letra y un número.</span>`,
        boton: 'Crear cuenta',
        pie: '¿Ya tenés cuenta? <a href="#/login">Iniciá sesión</a>',
        enviar: async (datos) => {
            estado.fijar(await api.registrar(datos));
            avisar('Cuenta creada');
            navegar(volverA(consulta));
        }
    });
}
