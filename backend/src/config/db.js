import { MongoClient } from 'mongodb';
import { entorno } from './entorno.js';
import { BaseDeDatosError } from '../errores/index.js';

export class Conexion {
    static #instancia = null;

    #cliente = null;
    #base = null;

    constructor() {
        if (Conexion.#instancia) {
            throw new Error('Conexion es un Singleton: usá Conexion.instancia()');
        }
    }

    static instancia() {
        if (!Conexion.#instancia) Conexion.#instancia = new Conexion();
        return Conexion.#instancia;
    }

    // esperaMs: cuánto espera el driver a un servidor antes de rendirse y dar 503
    async conectar({ uri = entorno.mongo.uri, base = entorno.mongo.base, esperaMs = 8000 } = {}) {
        if (this.#base) return this.#base;
        try {
            this.#cliente = new MongoClient(uri, { serverSelectionTimeoutMS: esperaMs });
            await this.#cliente.connect();
            this.#base = this.#cliente.db(base);
            return this.#base;
        } catch (error) {
            this.#cliente = null;
            this.#base = null;
            throw new BaseDeDatosError('No se pudo conectar con la base de datos: ' + error.message);
        }
    }

    conectada() {
        return this.#base !== null;
    }

    base() {
        if (!this.#base) throw new BaseDeDatosError('La base de datos no está conectada');
        return this.#base;
    }

    cliente() {
        if (!this.#cliente) throw new BaseDeDatosError('La base de datos no está conectada');
        return this.#cliente;
    }

    async cerrar() {
        if (this.#cliente) await this.#cliente.close();
        this.#cliente = null;
        this.#base = null;
    }
}
