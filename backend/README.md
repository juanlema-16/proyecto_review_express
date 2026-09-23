# Proyecto Review — API

API REST para gestionar información de programas de televisión: catálogo por categorías,
capítulos, reparto, productoras y favoritos por usuario.

Node.js con ESM, Express 5 y el driver nativo de MongoDB. Sin mongoose.

## Requisitos

- Node.js 20 o superior.
- MongoDB con replica set. Las transacciones no funcionan en un `mongod` suelto, por eso
  MongoDB Atlas (el plan gratuito ya viene con replica set).

## Instalación

```bash
npm install
cp .env.example .env     # y completá los valores
npm run indices          # crea los índices únicos
npm run semilla          # datos de ejemplo (idempotente)
npm run inicio
```

La API queda en `http://localhost:3000/api` y la documentación interactiva en
`http://localhost:3000/api/docs`.

Para probar sin Atlas: `npm run demo` levanta la API con MongoDB en memoria y los datos de
ejemplo ya cargados.

Usuarios que deja la semilla:

| rol | correo | contraseña |
|---|---|---|
| administrador | admin@review.test | Admin1234 (sale de `ADMIN_CORREO` y `ADMIN_CONTRASENA`) |
| usuario | demo@review.test | Demo1234 |

## Variables de entorno

| variable | por defecto | para qué |
|---|---|---|
| `PUERTO` | 3000 | puerto del servidor |
| `ENTORNO` | desarrollo | `produccion` activa la cookie `secure` |
| `MONGO_URI` | — | obligatoria, cadena de conexión de Atlas |
| `MONGO_BASE` | proyecto_review | nombre de la base |
| `JWT_SECRETO` | — | obligatoria, secreto para firmar los tokens |
| `JWT_EXPIRACION` | 2h | vida del token y de la cookie |
| `COOKIE_NOMBRE` | review_token | nombre de la cookie de sesión |
| `API_VERSION` | 1.0.0 | versión que se negocia con semver |
| `ORIGENES_PERMITIDOS` | vacío | orígenes extra con acceso CORS, separados por coma |
| `LIMITE_VENTANA_MINUTOS` | 15 | ventana del límite de peticiones |
| `LIMITE_GLOBAL` | 300 | peticiones por ventana e IP |
| `LIMITE_AUTENTICACION` | 10 | intentos de registro e inicio de sesión por ventana e IP |
| `ADMIN_CORREO` | admin@review.test | administrador que crea la semilla |
| `ADMIN_CONTRASENA` | Admin1234 | su contraseña |

## Scripts

| comando | qué hace |
|---|---|
| `npm run inicio` | levanta el servidor |
| `npm run desarrollo` | igual, recargando con `--watch` |
| `npm run demo` | API con MongoDB en memoria y datos de ejemplo, sin Atlas |
| `npm run indices` | crea o confirma los índices |
| `npm run semilla` | carga los datos de ejemplo sin duplicar nada |
| `npm run semilla:reset` | vacía las colecciones y vuelve a cargarlas |
| `npm run pruebas` | pruebas de integración contra un MongoMemoryReplSet, incluida la interfaz de `publico/` |
| `npm run simulacion` | recorre el consumo del frontend, incluida la caída de la base |

Las pruebas, la demo y la simulación levantan su propio MongoDB en memoria: no tocan la
base real. La primera vez descargan el binario de MongoDB (unos 100 MB).

## Endpoints

Todo cuelga de `/api`. Leer el catálogo es público, escribirlo es solo del administrador
y los favoritos piden sesión.

### Autenticación

| método | ruta | quién |
|---|---|---|
| POST | `/api/autenticacion/registro` | cualquiera (límite estricto) |
| POST | `/api/autenticacion/inicio-sesion` | cualquiera (límite estricto) |
| POST | `/api/autenticacion/cierre-sesion` | cualquiera |
| GET | `/api/autenticacion/perfil` | con sesión |

### Catálogo

| método | ruta | quién |
|---|---|---|
| GET | `/api/programas?categoria=&productora=&texto=` | público |
| GET | `/api/programas/:id` — con capítulos y reparto | público |
| GET | `/api/programas/:id/capitulos` | público |
| GET | `/api/programas/:id/personajes` | público |
| POST · PUT · DELETE | `/api/programas[/:id]` | administrador |
| GET · POST/PUT/DELETE | `/api/categorias` | público · administrador |
| GET · POST/PUT/DELETE | `/api/productoras` — el detalle trae sus programas | público · administrador |
| GET · POST/PUT/DELETE | `/api/actores?texto=` — el detalle trae sus personajes | público · administrador |
| GET · POST/PUT/DELETE | `/api/capitulos?programa=` | público · administrador |
| GET · POST/PUT/DELETE | `/api/personajes?programa=` | público · administrador |

`POST /api/programas` acepta un arreglo `capitulos` opcional: el programa y sus capítulos
iniciales se crean en la misma transacción. `DELETE /api/programas/:id` borra en una
transacción el programa, sus capítulos, sus personajes y las marcas de favorito, y
responde cuántos documentos arrastró.

### Favoritos

| método | ruta | quién |
|---|---|---|
| GET | `/api/favoritos` | con sesión |
| POST | `/api/favoritos/:programaId` | con sesión |
| DELETE | `/api/favoritos/:programaId` | con sesión |

### Errores

Todos salen con la misma forma y el código HTTP fijo de su clase:

```json
{ "error": { "codigo": "DUPLICADO", "mensaje": "Ya existe un programa con ese título" } }
```

| código | HTTP | cuándo |
|---|---|---|
| `VALIDACION` | 400 | datos mal formados, con `detalles` por campo |
| `NO_AUTENTICADO` | 401 | falta la cookie o el token no sirve |
| `NO_AUTORIZADO` | 403 | hay sesión pero no alcanza el rol |
| `NO_ENCONTRADO` | 404 | el recurso o la ruta no existen |
| `DUPLICADO` | 409 | chocó contra un índice único |
| `EN_USO` | 409 | se quiso borrar algo que otro recurso usa |
| `VERSION_NO_COMPATIBLE` | 409 | el cliente pide una versión que la API no habla |
| `DEMASIADAS_PETICIONES` | 429 | se pasó del límite |
| `BASE_DE_DATOS` | 503 | la base no responde |

### Versionado

El cliente manda la versión que acepta en la cabecera `Accept-Version`, con cualquier
rango que entienda semver (`1.x`, `^1.0.0`, `~1.0`). Si la versión de la API no lo
satisface, la respuesta es 409. Si la cabecera no es un rango válido, 400. Sin cabecera
se asume la versión actual, que siempre viaja de vuelta en `X-API-Version`.

## Interfaz

Hay dos interfaces sobre esta misma API, las dos en HTML, CSS y JavaScript puros, sin
frameworks ni proceso de build:

- **`publico/`**, mínima, la sirve este mismo servidor con `express.static` en
  `http://localhost:3000`. Tiene login, registro, catálogo con filtro por categoría,
  detalle con capítulos y reparto, ficha de actor, favoritos y el panel de administración.
  `publico/js/api/api.js` es el único módulo que llama a `fetch`.
- **[frontend/](../frontend)**, completa, con su propio servidor que reenvía `/api` a esta
  API para quedar en el mismo origen.

En las dos, un 401 lleva al login y el menú de administración solo se le muestra al
administrador. Eso es cosmético: la autorización real la hace el backend en cada endpoint.

## Arquitectura

```
rutas -> controladores -> servicios -> repositorios -> MongoDB
```

Cada capa solo conoce a la de abajo. Los servicios no saben qué es `req` y los
repositorios son el único lugar que toca la base. `src/rutas/index.js` es el composition
root: ahí se construyen repositorios, servicios y controladores, y todo lo demás recibe
sus dependencias ya armadas.

Patrones: **Repository**, **DTO** (`aPublico()`), **Factory** (`nuevo()` / `nueva()` /
`desde()`) y **Singleton** (la conexión en `src/config/db.js`). MVC es la arquitectura
general, no un patrón más.

## Decisiones

- **La sesión vive en una cookie httpOnly**, no en `localStorage` ni en la cabecera
  `Authorization`. Con `sameSite: 'strict'` el CSRF queda cubierto sin token extra.
- **CORS cerrado por defecto.** La interfaz sale del mismo servidor, así que no hace
  falta; solo se abre a los orígenes de `ORIGENES_PERMITIDOS`.
- **Solo entran los campos validados.** Después de express-validator el body se reemplaza
  por `matchedData()`: un `rol` o un `_id` colado por el cliente no llega al servicio.
- **La búsqueda escapa la expresión regular** antes de usarla en `$regex`.
- **Los índices únicos usan cotejo** `{ locale: 'es', strength: 2 }` en vez de guardar
  un campo normalizado. El manejador de errores traduce el 11000 de Mongo a un 409 con
  un mensaje en español según el índice que chocó.
- **Express 5** manda solos los rechazos de los controladores `async` al manejador de
  errores, así que no hace falta envolverlos.
- **El cierre de sesión borra la cookie**, pero el JWT es sin estado: un token copiado a
  mano sigue valiendo hasta que vence. Para este alcance alcanza con una vida corta.
