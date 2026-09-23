# Modelo de datos

Siete colecciones. Nada de actores embebidos dentro del programa: `personajes` es el
puente entre `programas` y `actores`.

## Relaciones

```
categorias 1 ──< programas >── 1 productoras
                  │
                  ├──< capitulos
                  │
                  └──< personajes >── actores
                         (puente)

usuarios.favoritos ──> programas
```

- Un programa tiene muchos capítulos y muchos personajes.
- Un actor interpreta muchos personajes, en programas distintos.
- La relación actor ↔ programa siempre pasa por `personajes`.

## Colecciones

### categorias
| campo | tipo | notas |
|---|---|---|
| `_id` | ObjectId | |
| `nombre` | string | único, sin distinguir mayúsculas |
| `descripcion` | string | opcional |
| `creadoEn` / `actualizadoEn` | Date | |

### productoras
| campo | tipo | notas |
|---|---|---|
| `_id` | ObjectId | |
| `nombre` | string | único |
| `pais` | string | |
| `anioFundacion` | int | entre 1888 y el año actual |
| `creadoEn` / `actualizadoEn` | Date | |

`aniosDeTrayectoria` no se guarda: lo calcula el modelo.

### programas
| campo | tipo | notas |
|---|---|---|
| `_id` | ObjectId | |
| `titulo` | string | único, sin distinguir mayúsculas |
| `sinopsis` | string | 10 a 2000 caracteres |
| `poster` | string | URL http/https de imagen |
| `trailer` | string | URL http/https de video |
| `categoriaId` | ObjectId | → `categorias` |
| `productoraId` | ObjectId | → `productoras` |
| `creadoEn` / `actualizadoEn` | Date | |

### capitulos
| campo | tipo | notas |
|---|---|---|
| `_id` | ObjectId | |
| `programaId` | ObjectId | → `programas` |
| `temporada` | int | ≥ 1 |
| `numero` | int | ≥ 1, único dentro de la temporada del programa |
| `titulo` | string | |
| `duracionMinutos` | int | 1 a 600 |
| `fechaEstreno` | Date | opcional |
| `creadoEn` / `actualizadoEn` | Date | |

`etiqueta` (`T1E03`) y `estrenado` no se guardan: salen de `aPublico()`.

### actores
| campo | tipo | notas |
|---|---|---|
| `_id` | ObjectId | |
| `nombre` | string | |
| `nacionalidad` | string | |
| `fechaNacimiento` | Date | no puede ser futura |
| `foto` | string | URL de imagen, opcional |
| `creadoEn` / `actualizadoEn` | Date | |

La edad no se guarda: cambia sola con el tiempo, la calcula el modelo.

### personajes
| campo | tipo | notas |
|---|---|---|
| `_id` | ObjectId | |
| `nombre` | string | nombre del personaje |
| `programaId` | ObjectId | → `programas` |
| `actorId` | ObjectId | → `actores` |
| `creadoEn` / `actualizadoEn` | Date | |

### usuarios
| campo | tipo | notas |
|---|---|---|
| `_id` | ObjectId | |
| `nombreUsuario` | string | único |
| `correo` | string | único, se guarda en minúsculas |
| `contrasena` | string | hash de bcrypt, nunca sale en ninguna respuesta |
| `rol` | string | `administrador` o `usuario` |
| `favoritos` | ObjectId[] | → `programas` |
| `creadoEn` / `actualizadoEn` | Date | |

## Índices

Definidos en `src/config/indices.js`. Se crean al arrancar y con `npm run indices`.

| colección | índice | nombre | tipo |
|---|---|---|---|
| categorias | `nombre` | categoria_nombre_unico | único, cotejo |
| productoras | `nombre` | productora_nombre_unico | único, cotejo |
| programas | `titulo` | programa_titulo_unico | único, cotejo |
| programas | `categoriaId` / `productoraId` | programa_categoria / programa_productora | búsqueda y "en uso" |
| capitulos | `programaId + temporada + numero` | capitulo_numero_unico_por_temporada | único |
| personajes | `programaId + nombre + actorId` | personaje_actor_unico | único, cotejo |
| personajes | `actorId` | personaje_actor | ficha del actor y "en uso" |
| actores | `nombre` | actor_nombre | búsqueda |
| usuarios | `correo` / `nombreUsuario` | usuario_correo_unico / usuario_nombre_unico | únicos |
| usuarios | `favoritos` | usuario_favoritos | quitar un programa borrado |

El cotejo `{ locale: 'es', strength: 2 }` ignora mayúsculas pero respeta los acentos. Así
no hace falta guardar un campo normalizado aparte.

El índice de personajes deja que dos actores hagan el mismo papel (el personaje de joven
y de adulto) pero impide que un actor lo interprete dos veces, que es la regla pedida.

## Reglas que no cubre un índice

- Crear un programa con sus capítulos iniciales: transacción.
- Borrar un programa borra sus capítulos, sus personajes y lo quita de los favoritos:
  transacción.
- No se puede borrar una categoría, productora o actor en uso: lo revisa el servicio
  antes de borrar y responde 409 `EN_USO`.

## Dónde vive cada validación

| nivel | qué revisa |
|---|---|
| express-validator (rutas) | formato de URL, tipos, longitudes, rangos, ObjectId válido |
| modelo (`verificar()`) | invariantes del dominio: obligatorios, rangos, fecha no futura, hash de contraseña |
| índice único (Mongo) | unicidad, con carrera incluida |
| servicio | existencia de las referencias, uso previo, transacciones |

El validador mira la forma del dato, el modelo mira que la entidad tenga sentido y el
índice es la última palabra.
