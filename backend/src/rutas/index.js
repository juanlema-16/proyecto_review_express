import { Router } from 'express';

import { GestorTransacciones } from '../repositorios/GestorTransacciones.js';
import { RepositorioCategorias } from '../repositorios/RepositorioCategorias.js';
import { RepositorioProductoras } from '../repositorios/RepositorioProductoras.js';
import { RepositorioProgramas } from '../repositorios/RepositorioProgramas.js';
import { RepositorioCapitulos } from '../repositorios/RepositorioCapitulos.js';
import { RepositorioActores } from '../repositorios/RepositorioActores.js';
import { RepositorioPersonajes } from '../repositorios/RepositorioPersonajes.js';
import { RepositorioUsuarios } from '../repositorios/RepositorioUsuarios.js';

import { ServicioCategorias } from '../servicios/ServicioCategorias.js';
import { ServicioProductoras } from '../servicios/ServicioProductoras.js';
import { ServicioProgramas } from '../servicios/ServicioProgramas.js';
import { ServicioCapitulos } from '../servicios/ServicioCapitulos.js';
import { ServicioActores } from '../servicios/ServicioActores.js';
import { ServicioPersonajes } from '../servicios/ServicioPersonajes.js';
import { ServicioAutenticacion } from '../servicios/ServicioAutenticacion.js';
import { ServicioFavoritos } from '../servicios/ServicioFavoritos.js';

import { ControladorRecurso } from '../controladores/ControladorRecurso.js';
import { ControladorProgramas } from '../controladores/ControladorProgramas.js';
import { ControladorDelPrograma } from '../controladores/ControladorDelPrograma.js';
import { ControladorActores } from '../controladores/ControladorActores.js';
import { ControladorAutenticacion } from '../controladores/ControladorAutenticacion.js';
import { ControladorFavoritos } from '../controladores/ControladorFavoritos.js';

import { Autenticacion } from '../middlewares/Autenticacion.js';
import { ManejadorErrores } from '../middlewares/ManejadorErrores.js';
import { limiteAutenticacion } from '../middlewares/limites.js';

import { rutasRecurso } from './recurso.js';
import { rutasProgramas } from './programas.js';
import { rutasAutenticacion } from './autenticacion.js';
import { rutasFavoritos } from './favoritos.js';
import { alCrearCategoria, alActualizarCategoria } from './validadores/categorias.js';
import { alCrearProductora, alActualizarProductora } from './validadores/productoras.js';
import { alListarActores, alCrearActor, alActualizarActor } from './validadores/actores.js';
import { alListarCapitulos, alCrearCapitulo, alActualizarCapitulo } from './validadores/capitulos.js';
import { alListarPersonajes, alCrearPersonaje, alActualizarPersonaje } from './validadores/personajes.js';

// composition root: el único lugar donde se construyen repositorios, servicios y controladores
export function construirApi(base, cliente, { limites }) {
    const transacciones = new GestorTransacciones(cliente);

    const repositorios = {
        categorias: new RepositorioCategorias(base),
        productoras: new RepositorioProductoras(base),
        programas: new RepositorioProgramas(base),
        capitulos: new RepositorioCapitulos(base),
        actores: new RepositorioActores(base),
        personajes: new RepositorioPersonajes(base),
        usuarios: new RepositorioUsuarios(base)
    };

    const programas = new ServicioProgramas({ ...repositorios, transacciones });
    const servicios = {
        programas,
        categorias: new ServicioCategorias(repositorios.categorias, repositorios.programas),
        productoras: new ServicioProductoras(repositorios.productoras, repositorios.programas),
        capitulos: new ServicioCapitulos(repositorios.capitulos, repositorios.programas),
        actores: new ServicioActores(repositorios.actores, repositorios.personajes, repositorios.programas),
        personajes: new ServicioPersonajes(repositorios.personajes, repositorios.programas, repositorios.actores),
        autenticacion: new ServicioAutenticacion(repositorios.usuarios),
        favoritos: new ServicioFavoritos(repositorios.usuarios, programas)
    };

    const controladores = {
        categorias: new ControladorRecurso(servicios.categorias),
        productoras: new ControladorRecurso(servicios.productoras),
        programas: new ControladorProgramas(servicios.programas),
        capitulos: new ControladorDelPrograma(servicios.capitulos),
        personajes: new ControladorDelPrograma(servicios.personajes),
        actores: new ControladorActores(servicios.actores),
        autenticacion: new ControladorAutenticacion(servicios.autenticacion),
        favoritos: new ControladorFavoritos(servicios.favoritos)
    };

    const autenticacion = new Autenticacion(servicios.autenticacion);
    const manejadorErrores = new ManejadorErrores();

    const rutas = Router();
    rutas.use(autenticacion.inicializar());
    rutas.use('/autenticacion', rutasAutenticacion(controladores.autenticacion, autenticacion, limiteAutenticacion(limites)));
    rutas.use('/favoritos', rutasFavoritos(controladores.favoritos, autenticacion));
    rutas.use('/programas', rutasProgramas(controladores, autenticacion));
    rutas.use('/categorias', rutasRecurso({
        controlador: controladores.categorias,
        autenticacion,
        etiqueta: 'id de la categoría',
        alCrear: alCrearCategoria,
        alActualizar: alActualizarCategoria
    }));
    rutas.use('/productoras', rutasRecurso({
        controlador: controladores.productoras,
        autenticacion,
        etiqueta: 'id de la productora',
        alCrear: alCrearProductora,
        alActualizar: alActualizarProductora
    }));
    rutas.use('/actores', rutasRecurso({
        controlador: controladores.actores,
        autenticacion,
        etiqueta: 'id del actor',
        alListar: alListarActores,
        alCrear: alCrearActor,
        alActualizar: alActualizarActor
    }));
    rutas.use('/capitulos', rutasRecurso({
        controlador: controladores.capitulos,
        autenticacion,
        etiqueta: 'id del capítulo',
        alListar: alListarCapitulos,
        alCrear: alCrearCapitulo,
        alActualizar: alActualizarCapitulo
    }));
    rutas.use('/personajes', rutasRecurso({
        controlador: controladores.personajes,
        autenticacion,
        etiqueta: 'id del personaje',
        alListar: alListarPersonajes,
        alCrear: alCrearPersonaje,
        alActualizar: alActualizarPersonaje
    }));

    return { rutas, manejadorErrores };
}
