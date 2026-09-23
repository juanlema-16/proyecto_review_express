import { entorno, verificarEntorno } from './config/entorno.js';
import { Conexion } from './config/db.js';
import { crearIndices } from './config/indices.js';
import { crearApp } from './app.js';

async function arrancar() {
    verificarEntorno();

    const conexion = Conexion.instancia();
    const base = await conexion.conectar();
    await crearIndices(base);

    const app = crearApp(base, conexion.cliente());
    const servidor = app.listen(entorno.puerto, () => {
        console.log('Proyecto Review (' + entorno.nombre + ') escuchando en http://localhost:' + entorno.puerto);
        console.log('Documentación en http://localhost:' + entorno.puerto + '/api/docs');
    });

    const apagar = async (senal) => {
        console.log('\nApagando por ' + senal + '...');
        servidor.close();
        await conexion.cerrar();
        process.exit(0);
    };

    process.on('SIGINT', () => apagar('SIGINT'));
    process.on('SIGTERM', () => apagar('SIGTERM'));
}

arrancar().catch((error) => {
    console.error('No se pudo arrancar el servidor:', error.message);
    process.exit(1);
});
