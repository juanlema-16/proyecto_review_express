const FECHA = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export function fecha(valor) {
    if (!valor) return 'Sin fecha';
    const convertida = new Date(valor);
    return Number.isNaN(convertida.getTime()) ? 'Sin fecha' : FECHA.format(convertida);
}

// para un <input type="date">: siempre AAAA-MM-DD
export function fechaCampo(valor) {
    if (!valor) return '';
    const convertida = new Date(valor);
    return Number.isNaN(convertida.getTime()) ? '' : convertida.toISOString().slice(0, 10);
}

export function duracion(minutos) {
    if (!minutos) return '';
    const horas = Math.floor(minutos / 60);
    const resto = minutos % 60;
    if (horas === 0) return resto + ' min';
    return horas + ' h' + (resto ? ' ' + resto + ' min' : '');
}

export function plural(cantidad, singular, pluralTexto = singular + 's') {
    return cantidad + ' ' + (cantidad === 1 ? singular : pluralTexto);
}

export function iniciales(nombre) {
    return String(nombre ?? '?')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((parte) => parte[0].toUpperCase())
        .join('');
}
