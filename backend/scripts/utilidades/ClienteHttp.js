// hace de navegador: guarda las cookies que manda el servidor y las devuelve en cada petición
export class ClienteHttp {
    constructor(base, version = null) {
        this.base = base;
        this.version = version;
        this.cookies = new Map();
        this.ultimasCookies = [];
    }

    guardarCookies(respuesta) {
        this.ultimasCookies = respuesta.headers.getSetCookie();
        for (const cruda of this.ultimasCookies) {
            const [par, ...atributos] = cruda.split(';');
            const corte = par.indexOf('=');
            const nombre = par.slice(0, corte).trim();
            const valor = par.slice(corte + 1).trim();
            const vencida = atributos.some((atributo) => /expires=Thu, 01 Jan 1970/i.test(atributo));
            if (valor === '' || vencida) this.cookies.delete(nombre);
            else this.cookies.set(nombre, valor);
        }
    }

    async peticion(metodo, ruta, cuerpo = null, cabeceras = {}) {
        const opciones = { method: metodo, headers: { ...cabeceras } };
        if (this.version && !('Accept-Version' in opciones.headers)) {
            opciones.headers['Accept-Version'] = this.version;
        }
        if (cuerpo !== null) {
            opciones.headers['Content-Type'] = 'application/json';
            opciones.body = typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo);
        }
        const cookies = [...this.cookies].map(([nombre, valor]) => nombre + '=' + valor).join('; ');
        if (cookies && !('Cookie' in opciones.headers)) opciones.headers.Cookie = cookies;

        const respuesta = await fetch(this.base + ruta, opciones);
        this.guardarCookies(respuesta);

        const texto = await respuesta.text();
        let datos = null;
        if (texto) {
            try { datos = JSON.parse(texto); } catch { datos = texto; }
        }
        return { estado: respuesta.status, datos, texto, cabeceras: respuesta.headers };
    }

    get(ruta, cabeceras) { return this.peticion('GET', ruta, null, cabeceras); }
    post(ruta, cuerpo = {}, cabeceras) { return this.peticion('POST', ruta, cuerpo, cabeceras); }
    put(ruta, cuerpo, cabeceras) { return this.peticion('PUT', ruta, cuerpo, cabeceras); }
    borrar(ruta, cabeceras) { return this.peticion('DELETE', ruta, null, cabeceras); }
}
