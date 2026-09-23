# Proyecto Review

Aplicación completa para gestionar información de programas de televisión: novelas, anime
y cartoons, con sus capítulos, su reparto y sus productoras.

| carpeta | qué es |
|---|---|
| [backend/](backend) | API REST en Node con Express y el driver nativo de MongoDB |
| [frontend/](frontend) | interfaz web completa en HTML, CSS y JavaScript puros, sin dependencias |

## Arrancar

```bash
cd backend
npm install
npm run demo        # MongoDB en memoria, datos de ejemplo, sin configurar nada
```

Eso ya deja la interfaz mínima en `http://localhost:3000`. Para la interfaz completa, en
otra terminal:

```bash
cd frontend
npm run inicio      # http://localhost:4000, reenvía /api al puerto 3000
```

Para usar MongoDB Atlas: copiá `backend/.env.example` a `backend/.env`, completalo y usá
`npm run inicio`. La documentación interactiva queda en `http://localhost:3000/api/docs`.

| rol | correo | contraseña |
|---|---|---|
| administrador | admin@review.test | Admin1234 |
| usuario | demo@review.test | Demo1234 |

## Pruebas

```bash
cd backend
npm run pruebas      # integración contra un MongoMemoryReplSet
npm run simulacion   # el recorrido del frontend, incluida la caída de la base

cd ../frontend
npm run pruebas      # la interfaz completa contra la API real
```

## Arquitectura

```
rutas -> controladores -> servicios -> repositorios -> MongoDB
```

Patrones: Repository, DTO, Factory y Singleton, sobre MVC. El detalle está en
[backend/README.md](backend/README.md).

## Flujo de trabajo

GitFlow: `main` recibe solo lo que pasa por pull request desde `develop`; el trabajo va en
ramas `feature/` y `fix/` que se integran a `develop` con `--no-ff`. Commits con
Conventional Commits en español.
