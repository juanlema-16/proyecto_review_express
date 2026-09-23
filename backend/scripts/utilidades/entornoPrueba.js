import { MongoMemoryReplSet } from 'mongodb-memory-server';

// levanta un replica set en memoria (las transacciones lo necesitan) y la app real encima.
// El entorno se fija antes de importar src/: esos módulos lo leen al cargarse.
export async function levantarEntornoPrueba({ puerto = 0, variables = {}, puertoMongo = undefined, esperaMs = 8000 } = {}) {
    // con puerto fijo el replica set se puede apagar y volver a levantar en la misma dirección
    const replica = await MongoMemoryReplSet.create({
        replSet: { count: 1, storageEngine: 'wiredTiger' },
        instanceOpts: puertoMongo ? [{ port: puertoMongo }] : []
    });

    Object.assign(process.env, {
        ENTORNO: 'prueba',
        MONGO_URI: replica.getUri(),
        MONGO_BASE: 'proyecto_review_pruebas',
        JWT_SECRETO: 'secreto-solo-para-pruebas-0123456789abcdef',
        JWT_EXPIRACION: '1h',
        API_VERSION: '1.0.0',
        LIMITE_GLOBAL: '100000',
        LIMITE_AUTENTICACION: '1000',
        ADMIN_CORREO: 'admin@review.test',
        ADMIN_CONTRASENA: 'Admin1234',
        ...variables
    });

    const { entorno } = await import('../../src/config/entorno.js');
    const { Conexion } = await import('../../src/config/db.js');
    const { crearIndices } = await import('../../src/config/indices.js');
    const { crearApp } = await import('../../src/app.js');

    const conexion = Conexion.instancia();
    const base = await conexion.conectar({ esperaMs });
    await crearIndices(base);

    const app = crearApp(base, conexion.cliente());
    const servidor = app.listen(puerto);
    await new Promise((listo) => servidor.once('listening', listo));
    const raiz = 'http://127.0.0.1:' + servidor.address().port;

    return {
        entorno,
        replica,
        base,
        clienteMongo: conexion.cliente(),
        raiz,
        api: raiz + '/api',
        crearApp,
        async cerrar() {
            servidor.close();
            await conexion.cerrar();
            await replica.stop();
        }
    };
}
