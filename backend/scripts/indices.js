import { verificarEntorno } from '../src/config/entorno.js';
import { Conexion } from '../src/config/db.js';
import { crearIndices } from '../src/config/indices.js';

try {
    verificarEntorno();
    const conexion = Conexion.instancia();
    const cantidad = await crearIndices(await conexion.conectar());
    console.log(cantidad + ' índices creados o confirmados.');
    await conexion.cerrar();
} catch (error) {
    console.error('No se pudieron crear los índices:', error.message);
    process.exit(1);
}
