import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// sirve los estáticos y reenvía /api a la API: para el navegador hay un solo origen,
// así la cookie httpOnly y sameSite strict viaja sin tocar CORS

const CARPETA = fileURLToPath(new URL('./src/', import.meta.url));

const TIPOS = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.ico': 'image/x-icon'
};

function responderJson(respuesta, estado, cuerpo) {
    respuesta.writeHead(estado, { 'Content-Type': 'application/json; charset=utf-8' });
    respuesta.end(JSON.stringify(cuerpo));
}

function reenviar(peticion, respuesta, destino) {
    const url = new URL(peticion.url, destino);
    const cabeceras = { ...peticion.headers, host: url.host };

    const salida = http.request(url, { method: peticion.method, headers: cabeceras }, (respuestaApi) => {
        respuesta.writeHead(respuestaApi.statusCode, respuestaApi.headers);
        respuestaApi.pipe(respuesta);
    });
    salida.on('error', () => {
        if (respuesta.headersSent) return respuesta.destroy();
        responderJson(respuesta, 502, {
            error: { codigo: 'API_NO_DISPONIBLE', mensaje: 'No se pudo conectar con la API. ¿Está corriendo?' }
        });
    });
    peticion.pipe(salida);
}

async function servirEstatico(peticion, respuesta) {
    const ruta = decodeURIComponent(new URL(peticion.url, 'http://local').pathname);
    const archivo = path.join(CARPETA, ruta === '/' ? 'index.html' : ruta);

    // nada fuera de src/: un ../ en la URL no sale de la carpeta
    if (!archivo.startsWith(CARPETA)) return responderJson(respuesta, 403, { error: { codigo: 'PROHIBIDO', mensaje: 'Ruta no permitida' } });

    try {
        const contenido = await readFile(archivo);
        respuesta.writeHead(200, {
            'Content-Type': TIPOS[path.extname(archivo)] ?? 'application/octet-stream',
            'Cache-Control': 'no-cache',
            'X-Content-Type-Options': 'nosniff'
        });
        respuesta.end(contenido);
    } catch {
        respuesta.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        respuesta.end('No existe ' + ruta);
    }
}

export function crearServidor({ destino = 'http://127.0.0.1:3000' } = {}) {
    return http.createServer((peticion, respuesta) => {
        if (peticion.url === '/api' || peticion.url.startsWith('/api/')) return reenviar(peticion, respuesta, destino);
        if (peticion.method !== 'GET' && peticion.method !== 'HEAD') {
            return responderJson(respuesta, 405, { error: { codigo: 'METODO_NO_PERMITIDO', mensaje: 'Solo se sirven archivos' } });
        }
        servirEstatico(peticion, respuesta);
    });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
    const puerto = Number(process.env.PUERTO ?? 4000);
    const destino = process.env.API_DESTINO ?? 'http://127.0.0.1:3000';
    crearServidor({ destino }).listen(puerto, () => {
        console.log('Interfaz en http://localhost:' + puerto + ' (API en ' + destino + ')');
    });
}
