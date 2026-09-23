export function leerHash() {
    const [camino, texto = ''] = location.hash.slice(1).split('?');
    return { camino: camino || '/', consulta: Object.fromEntries(new URLSearchParams(texto)) };
}

export function navegar(destino) {
    if (location.hash.slice(1) === destino) window.dispatchEvent(new HashChangeEvent('hashchange'));
    else location.hash = destino;
}
