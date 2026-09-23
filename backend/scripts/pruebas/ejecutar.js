import { levantarEntornoPrueba } from '../utilidades/entornoPrueba.js';
import { ClienteHttp } from '../utilidades/ClienteHttp.js';
import { crearRegistro } from './afirmaciones.js';
import { sembrar } from '../semilla.js';

import { pruebasAutenticacion } from './suites/autenticacion.js';
import { pruebasCatalogo } from './suites/catalogo.js';
import { pruebasReglas } from './suites/reglas.js';
import { pruebasTransacciones } from './suites/transacciones.js';
import { pruebasFavoritos } from './suites/favoritos.js';
import { pruebasVersion } from './suites/version.js';
import { pruebasLimites } from './suites/limites.js';
import { pruebasSemilla } from './suites/semilla.js';
import { pruebasInterfaz } from './suites/interfaz.js';

const entornoPrueba = await levantarEntornoPrueba();
const { base, api, entorno } = entornoPrueba;

// el administrador no se puede registrar por la API: lo deja la semilla
await sembrar(base, { administrador: entorno.administrador });

let contador = 0;
const contexto = {
    ...entornoPrueba,
    cliente: () => new ClienteHttp(api, '1.x'),

    async clienteAdministrador() {
        const cliente = contexto.cliente();
        await cliente.post('/autenticacion/inicio-sesion', { correo: entorno.administrador.correo, contrasena: entorno.administrador.contrasena });
        return cliente;
    },

    async clienteUsuario() {
        contador += 1;
        const credenciales = {
            nombreUsuario: 'espectador' + contador,
            correo: 'espectador' + contador + '@review.test',
            contrasena: 'Secreta123'
        };
        const cliente = contexto.cliente();
        await cliente.post('/autenticacion/registro', credenciales);
        return { cliente, credenciales };
    },

    // un nombre distinto por llamada para que las pruebas no choquen entre sí
    unico(prefijo) {
        contador += 1;
        return prefijo + ' ' + contador;
    }
};

const registro = crearRegistro();
const suites = [
    ['Autenticación y cookies', pruebasAutenticacion],
    ['Catálogo, permisos y DTO', pruebasCatalogo],
    ['Reglas de negocio', pruebasReglas],
    ['Transacciones', pruebasTransacciones],
    ['Favoritos', pruebasFavoritos],
    ['Versionado con semver', pruebasVersion],
    ['Interfaz servida por Express', pruebasInterfaz],
    ['Límite de peticiones', pruebasLimites],
    ['Semilla idempotente', pruebasSemilla]
];

for (const [nombre, suite] of suites) {
    registro.grupo(nombre);
    await suite(registro, contexto);
}

const fallidas = registro.resultados.filter((resultado) => !resultado.ok);
console.log('\n' + '-'.repeat(50));
console.log((registro.resultados.length - fallidas.length) + ' pasadas, ' + fallidas.length + ' fallidas');
if (fallidas.length > 0) {
    console.log('\nFallaron:');
    for (const fallo of fallidas) console.log('  - ' + fallo.nombre + ': ' + fallo.error.message);
}

await entornoPrueba.cerrar();
process.exit(fallidas.length > 0 ? 1 : 0);
