export function texto(valor) {
    return valor === null || valor === undefined ? '' : String(valor).trim();
}

export function fecha(valor) {
    if (!valor) return null;
    const convertida = valor instanceof Date ? valor : new Date(valor);
    return Number.isNaN(convertida.getTime()) ? null : convertida;
}

export function entero(valor) {
    if (valor === null || valor === undefined || valor === '') return null;
    const convertido = Number(valor);
    return Number.isInteger(convertido) ? convertido : null;
}

// el texto del usuario entra a un $regex: sin escapar se podría inyectar una expresión
export function escaparRegex(valor) {
    return texto(valor).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// "2h" -> 7200000. Acepta s, m, h, d o un número de segundos.
export function duracionAMilisegundos(duracion) {
    const coincidencia = String(duracion).trim().match(/^(\d+)\s*([smhd])?$/);
    if (!coincidencia) return null;
    const unidades = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return Number(coincidencia[1]) * unidades[coincidencia[2] ?? 's'];
}
