import dotenv from 'dotenv';

dotenv.config({ quiet: true });

function leer(nombre, porDefecto = null) {
    const valor = process.env[nombre];
    return valor === undefined || valor === '' ? porDefecto : valor;
}

function numero(nombre, porDefecto) {
    const valor = Number(leer(nombre, porDefecto));
    return Number.isFinite(valor) ? valor : porDefecto;
}

function lista(nombre) {
    return (leer(nombre, '') ?? '')
        .split(',')
        .map((elemento) => elemento.trim())
        .filter(Boolean);
}

const nombreEntorno = leer('ENTORNO', 'desarrollo');

export const entorno = {
    nombre: nombreEntorno,
    esProduccion: nombreEntorno === 'produccion',
    esPrueba: nombreEntorno === 'prueba',
    puerto: numero('PUERTO', 3000),
    mongo: {
        uri: leer('MONGO_URI'),
        base: leer('MONGO_BASE', 'proyecto_review')
    },
    jwt: {
        secreto: leer('JWT_SECRETO'),
        expiracion: leer('JWT_EXPIRACION', '2h')
    },
    cookie: {
        nombre: leer('COOKIE_NOMBRE', 'review_token')
    },
    version: leer('API_VERSION', '1.0.0'),
    origenesPermitidos: lista('ORIGENES_PERMITIDOS'),
    limites: {
        ventanaMinutos: numero('LIMITE_VENTANA_MINUTOS', 15),
        global: numero('LIMITE_GLOBAL', 300),
        autenticacion: numero('LIMITE_AUTENTICACION', 10)
    },
    administrador: {
        correo: leer('ADMIN_CORREO', 'admin@review.test'),
        contrasena: leer('ADMIN_CONTRASENA', 'Admin1234')
    }
};

export function verificarEntorno() {
    const faltantes = [];
    if (!entorno.mongo.uri) faltantes.push('MONGO_URI');
    if (!entorno.jwt.secreto) faltantes.push('JWT_SECRETO');
    if (faltantes.length > 0) {
        throw new Error('Faltan variables de entorno obligatorias: ' + faltantes.join(', '));
    }
    return entorno;
}
