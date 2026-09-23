import { Productora } from '../modelos/Productora.js';
import { NoEncontradoError, EnUsoError } from '../errores/index.js';

export class ServicioProductoras {
    constructor(repositorioProductoras, repositorioProgramas) {
        this.productoras = repositorioProductoras;
        this.programas = repositorioProgramas;
    }

    async buscar(id) {
        const productora = await this.productoras.porId(id);
        if (!productora) throw new NoEncontradoError('La productora no existe');
        return productora;
    }

    async listar() {
        const productoras = await this.productoras.listarOrdenadas();
        return productoras.map((productora) => productora.aPublico());
    }

    // la productora con los programas que produjo
    async obtener(id) {
        const productora = await this.buscar(id);
        const programas = await this.programas.buscar({ productoraId: productora.id });
        return {
            ...productora.aPublico(),
            programas: programas.map((programa) => programa.aPublico())
        };
    }

    async crear(datos) {
        const productora = Productora.nueva(datos);
        await this.productoras.crear(productora);
        return productora.aPublico();
    }

    async actualizar(id, cambios) {
        const productora = await this.buscar(id);
        productora.actualizar(cambios);
        await this.productoras.reemplazar(productora);
        return productora.aPublico();
    }

    async borrar(id) {
        const productora = await this.buscar(id);
        if (await this.programas.usaProductora(productora.id)) {
            throw new EnUsoError('No se puede borrar una productora que tiene programas');
        }
        await this.productoras.borrar(productora.id);
    }
}
