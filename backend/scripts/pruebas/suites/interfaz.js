import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { igual, verdadero } from '../afirmaciones.js';

const PUBLICO = fileURLToPath(new URL('../../../publico/', import.meta.url));

async function listar(carpeta) {
    const entradas = await readdir(carpeta, { withFileTypes: true });
    const archivos = await Promise.all(entradas.map((entrada) => {
        const ruta = path.join(carpeta, entrada.name);
        return entrada.isDirectory() ? listar(ruta) : [ruta];
    }));
    return archivos.flat();
}

// la interfaz mínima que sirve Express con express.static, desde el mismo origen que la API
export async function pruebasInterfaz(registro, contexto) {
    const archivos = (await listar(PUBLICO)).map((ruta) => '/' + path.relative(PUBLICO, ruta).split(path.sep).join('/'));
    const modulos = archivos.filter((archivo) => archivo.endsWith('.js'));

    await registro.prueba('Express sirve la interfaz en la raíz y cada archivo con su tipo', async () => {
        const tipos = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' };
        const indice = await fetch(contexto.raiz + '/');
        igual(indice.status, 200);
        verdadero(indice.headers.get('content-type').startsWith('text/html'), 'La raíz no devuelve HTML');
        for (const archivo of archivos) {
            const respuesta = await fetch(contexto.raiz + archivo);
            igual(respuesta.status, 200, archivo);
            verdadero(respuesta.headers.get('content-type').startsWith(tipos[path.extname(archivo)]), archivo + ' sale como ' + respuesta.headers.get('content-type'));
        }
    });

    await registro.prueba('ningún import de la interfaz queda roto', async () => {
        for (const archivo of modulos) {
            const codigo = await readFile(path.join(PUBLICO, archivo), 'utf8');
            for (const [, destino] of codigo.matchAll(/from\s+'(\.[^']+)'/g)) {
                const resuelto = path.posix.join(path.posix.dirname(archivo), destino);
                verdadero(archivos.includes(resuelto), archivo + ' importa ' + destino + ' y no existe');
            }
        }
    });

    await registro.prueba('solo api/api.js llama a fetch y todas las peticiones mandan Accept-Version', async () => {
        for (const archivo of modulos) {
            const codigo = await readFile(path.join(PUBLICO, archivo), 'utf8');
            const llama = /\bfetch\s*\(/.test(codigo);
            if (archivo === '/js/api/api.js') {
                verdadero(llama && /Accept-Version/.test(codigo) && /credentials: 'include'/.test(codigo), 'api.js no manda la versión o las credenciales');
            } else {
                verdadero(!llama, archivo + ' llama a fetch');
            }
        }
    });

    await registro.prueba('una ruta de /api que no existe no cae en la interfaz', async () => {
        const respuesta = await fetch(contexto.api + '/no-existe');
        igual(respuesta.status, 404);
        igual((await respuesta.json()).error.codigo, 'NO_ENCONTRADO');
    });
}
