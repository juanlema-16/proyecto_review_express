# Estructura de carpetas

```
backend/
├── package.json
├── .env.example
├── src/
│   ├── servidor.js              arranque: entorno, conexión, índices, escucha
│   ├── app.js                   arma Express: CORS, JSON, cookies, límites, rutas, estáticos
│   ├── config/
│   │   ├── entorno.js           lee y valida process.env
│   │   ├── db.js                Singleton de la conexión a Mongo
│   │   ├── colecciones.js       nombres de colección y cotejo
│   │   ├── indices.js           definición de los índices
│   │   └── swagger.js           documento OpenAPI
│   ├── modelos/                 clases entidad (7)
│   ├── repositorios/            RepositorioBase + una subclase por colección + GestorTransacciones
│   ├── servicios/               reglas de negocio, transacciones
│   ├── controladores/           traducen HTTP, nada más
│   ├── rutas/
│   │   ├── index.js             composition root: el único lugar con `new`
│   │   ├── recurso.js           las cinco rutas CRUD que comparten los recursos
│   │   └── validadores/         express-validator por recurso
│   ├── middlewares/             autenticación, autorización, versión, límites, errores
│   ├── errores/                 AppError y su jerarquía
│   └── utilidades/              identificadores y conversión de valores
├── publico/                     interfaz gráfica que sirve este servidor
├── scripts/
│   ├── indices.js               crea los índices
│   ├── semilla.js               datos de ejemplo, idempotente, --reset
│   ├── demo.js                  API con MongoDB en memoria
│   ├── simulacion-frontend.js   recorre el consumo real, incluida la caída de la base
│   ├── datos/                   el catálogo de ejemplo
│   ├── utilidades/              entorno de prueba y cliente HTTP con cookies
│   └── pruebas/                 pruebas contra MongoMemoryReplSet
└── documentacion/
```

`config/` y `scripts/` conservan su nombre porque así aparecen en la especificación
(`config/db.js`, `/scripts`). El resto va en español, igual que el código.

## El flujo va en un solo sentido

```
rutas -> controladores -> servicios -> repositorios -> MongoDB
  │
  └── validadores/ (express-validator)
```

- Una capa solo conoce a la de abajo. Un servicio no sabe qué es `req`, un repositorio
  no sabe qué es un servicio.
- `modelos/` y `errores/` los usa cualquier capa: son el vocabulario común.
- `rutas/index.js` construye todo y lo inyecta hacia abajo. En el resto del código no
  aparece ningún `new` de repositorio, servicio ni controlador. Los `new` que quedan son
  los propios de cada patrón: el Singleton dentro de `db.js`, las factories de los
  modelos y los `throw new ...Error()`.

## Patrones

| patrón | dónde |
|---|---|
| Repository | `repositorios/RepositorioBase.js` y sus subclases |
| DTO | `aPublico()` en cada modelo: lo único que sale por HTTP |
| Factory | `static nuevo()` / `nueva()` para crear y `static desde()` para hidratar |
| Singleton | `Conexion` en `config/db.js`, con instancia estática privada |
