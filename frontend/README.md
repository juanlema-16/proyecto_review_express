# Proyecto Review — interfaz web

Interfaz gráfica de la API de [Proyecto Review](../backend). HTML, CSS y JavaScript puros:
sin React, sin Vue, sin jQuery, sin Bootstrap, sin proceso de build y **sin una sola
dependencia** en `package.json`. Módulos ES nativos en el navegador y `fetch` con
`credentials: 'include'`.

## Cómo levantarla

Hacen falta dos terminales. En la primera, la API:

```bash
cd ../backend
npm run demo      # MongoDB en memoria y datos de ejemplo, sin configurar nada
```

En la segunda, la interfaz:

```bash
npm run inicio    # http://localhost:4000
```

| variable | por defecto | para qué |
|---|---|---|
| `PUERTO` | 4000 | puerto de la interfaz |
| `API_DESTINO` | http://127.0.0.1:3000 | a dónde se reenvía `/api` |

Usuarios de la semilla: `admin@review.test / Admin1234` (administrador) y
`demo@review.test / Demo1234` (usuario).

## Por qué hay un servidor y no archivos sueltos

La sesión viaja en una cookie `httpOnly` con `sameSite: 'strict'`, que el navegador no
manda a otro origen. Si la interfaz se abriera con `file://` o desde otro puerto contra la
API, la cookie no viajaría y no habría forma de iniciar sesión.

`servidor.js` sirve los estáticos y reenvía todo lo que empieza con `/api` a la API. Para
el navegador hay un solo origen, así que la cookie viaja sola y no hace falta CORS. Usa
solo los módulos `http` y `fs` de Node.

## Estructura

```
frontend/
├── servidor.js               estáticos + proxy de /api, sin dependencias
├── scripts/pruebas.js        levanta API e interfaz de verdad y prueba contra ellas
└── src/
    ├── index.html
    ├── css/
    │   ├── base.css          variables, modo oscuro, cabecera y pie
    │   ├── componentes.css   botones, campos, estados, avisos, diálogos, tablas
    │   └── vistas.css        tarjetas, fichas, capítulos, reparto, panel, responsive
    └── js/
        ├── principal.js      rutas, menú según el rol y reacciones globales (401, versión)
        ├── nucleo/
        │   ├── peticiones.js único módulo que llama a fetch
        │   ├── api.js        los endpoints, agrupados por recurso
        │   ├── plantilla.js  html`` con escapado automático
        │   ├── enrutador.js  rutas por hash con parámetros y guardas por rol
        │   ├── sesion.js     el usuario actual y sus favoritos
        │   ├── formato.js    fechas, duraciones y plurales
        │   ├── avisos.js     mensajes flotantes
        │   └── configuracion.js
        ├── componentes/      estados, tarjetas, formularios, diálogos
        └── vistas/           una por pantalla, más el panel de administración
```

## Reglas que sigue el código

- **Solo `peticiones.js` llama a `fetch`.** Las vistas usan `api.js` y nunca ven una URL.
- **Nada entra al HTML sin escapar.** Todo se arma con la plantilla `html` de
  `plantilla.js`, que escapa cada valor interpolado. Las URL de poster, trailer y foto
  pasan además por `urlSegura()`, que descarta todo lo que no sea http o https.
- **Carga, error y vacío en un solo lugar.** `conEstados()` resuelve los tres estados y el
  botón de reintentar para cualquier vista.
- **Un 401 lleva al login** sin perder a dónde se iba: `?volver=` guarda la ruta.
- **El menú reacciona al rol, pero es cosmético.** La autorización real la hace el backend
  en cada endpoint; la interfaz solo evita mostrar lo que no corresponde.
- **Los errores de la API van debajo de su campo.** Los `detalles` que devuelve
  express-validator se pintan en el formulario, campo por campo.

## Vistas

| ruta | qué muestra | quién |
|---|---|---|
| `#/` | catálogo con filtro por categoría y búsqueda por título | todos |
| `#/programa/:id` | detalle con trailer, capítulos por temporada y reparto | todos |
| `#/actores` · `#/actor/:id` | actores y la ficha con los personajes que interpreta | todos |
| `#/productoras` · `#/productora/:id` | productoras y sus programas | todos |
| `#/login` · `#/registro` | acceso | sin sesión |
| `#/favoritos` · `#/perfil` | favoritos del usuario y su cuenta | con sesión |
| `#/admin/:recurso` | CRUD de programas, categorías, productoras, actores, capítulos y personajes | administrador |

El alta de programa permite agregar **capítulos iniciales**: el backend los crea junto con
el programa en una transacción, así que si uno choca no queda nada a medias.

La cabecera `Accept-Version` va en todas las peticiones. Si la API contesta 409 por
versión incompatible aparece una banda roja arriba; el pie muestra siempre qué versión pide
el cliente y cuál anuncia el servidor.

## Pruebas

```bash
cd ../backend && npm install   # una sola vez: las pruebas usan su MongoDB en memoria
cd ../frontend && npm run pruebas
```

Levantan la API de verdad y esta interfaz con su proxy, y prueban:

- que cada archivo se sirva con su tipo y que ningún import quede roto;
- que ninguna vista llame a `fetch` y que el HTML no cargue nada de afuera;
- que la cookie atraviese el proxy con `httpOnly` y `strict`;
- que el `api.js` real haga el recorrido completo: catálogo, detalle, favoritos, errores
  por campo, 403 del usuario, CRUD del administrador y alta con capítulos iniciales;
- que con la base caída la API dé 503 y la interfaz se siga sirviendo, y que con la API
  caída el proxy conteste 502.
