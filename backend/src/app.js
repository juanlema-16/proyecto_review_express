import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { fileURLToPath } from 'node:url';

import { entorno } from './config/entorno.js';
import { documentoSwagger } from './config/swagger.js';
import { construirApi } from './rutas/index.js';
import { verificarVersion, CABECERA_ACTUAL } from './middlewares/version.js';
import { limiteGlobal } from './middlewares/limites.js';
import { rutaNoEncontrada } from './middlewares/noEncontrado.js';

const CARPETA_PUBLICA = fileURLToPath(new URL('../publico/', import.meta.url));

export function crearApp(base, cliente, { limites = entorno.limites, version = entorno.version } = {}) {
    const app = express();
    const { rutas, manejadorErrores } = construirApi(base, cliente, { limites });

    app.disable('x-powered-by');
    // la interfaz sale de este mismo servidor; CORS solo se abre a los orígenes del .env
    app.use('/api', cors({
        origin: entorno.origenesPermitidos.length > 0 ? entorno.origenesPermitidos : false,
        credentials: true,
        exposedHeaders: [CABECERA_ACTUAL]
    }));
    app.use(express.json({ limit: '100kb' }));
    app.use(cookieParser());
    app.use(limiteGlobal(limites));

    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(documentoSwagger));
    app.use('/api', verificarVersion(version), rutas);
    app.use('/api', rutaNoEncontrada);

    app.use(express.static(CARPETA_PUBLICA));

    app.use(manejadorErrores.manejar);

    return app;
}
