// html`` escapa cada valor interpolado: lo que viene de la API nunca entra como HTML
class Seguro {
    constructor(texto) {
        this.texto = texto;
    }

    toString() {
        return this.texto;
    }
}

const ENTIDADES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapar(valor) {
    return String(valor ?? '').replace(/[&<>"']/g, (caracter) => ENTIDADES[caracter]);
}

function convertir(valor) {
    if (valor instanceof Seguro) return valor.texto;
    if (Array.isArray(valor)) return valor.map(convertir).join('');
    if (valor === null || valor === undefined || valor === false) return '';
    return escapar(valor);
}

export function html(partes, ...valores) {
    let resultado = partes[0];
    valores.forEach((valor, posicion) => {
        resultado += convertir(valor) + partes[posicion + 1];
    });
    return new Seguro(resultado);
}

// un href o src con javascript: se neutraliza aunque venga escapado
export function urlSegura(url) {
    return /^https?:\/\//i.test(String(url ?? '')) ? url : '#';
}

export function montar(elemento, plantilla) {
    elemento.innerHTML = String(plantilla);
    return elemento;
}
