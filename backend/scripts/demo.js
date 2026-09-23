import { levantarEntornoPrueba } from './utilidades/entornoPrueba.js';
import { sembrar } from './semilla.js';
import { USUARIO_DEMO } from './datos/catalogo.js';

// la API con MongoDB en memoria y datos de ejemplo: sin Atlas ni .env
const puerto = Number(process.env.PUERTO ?? 3000);
const demo = await levantarEntornoPrueba({
    puerto,
    variables: { ENTORNO: 'desarrollo', MONGO_BASE: 'proyecto_review_demo', LIMITE_GLOBAL: '300', LIMITE_AUTENTICACION: '10' }
});
await sembrar(demo.base, { administrador: demo.entorno.administrador });

console.log('Demo escuchando en ' + demo.raiz + ' (MongoDB en memoria, los datos se pierden al cerrar)');
console.log('Documentación en ' + demo.raiz + '/api/docs');
console.log('Administrador: ' + demo.entorno.administrador.correo + ' / ' + demo.entorno.administrador.contrasena);
console.log('Usuario:       ' + USUARIO_DEMO.correo + ' / ' + USUARIO_DEMO.contrasena);

const apagar = async () => {
    await demo.cerrar();
    process.exit(0);
};
process.on('SIGINT', apagar);
process.on('SIGTERM', apagar);
