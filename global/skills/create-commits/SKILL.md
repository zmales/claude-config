---
name: create-commits
description: Crea un commit siguiendo Conventional Commits y las reglas de git de WebPOS. Úsala cuando el usuario pida hacer un commit, guardar cambios en git o registrar modificaciones.
triggers:
  - hacer commit
  - crear commit
  - commitear
  - registrar cambios
  - guardar cambios en git
---

# Crear commit con convenciones

Analiza los cambios staged (`git diff --cached`) y crea un commit siguiendo Conventional Commits.

## Reglas previas (no negociables)

- **Solo cuando el usuario lo pide.** Esta skill se ejecuta por petición explícita; nunca hagas
  commits por iniciativa propia.
- **Lee las reglas del proyecto** antes de redactar: `CLAUDE.md` del repo y la skill `*-contexto` del
  proyecto si existe. Lo que digan prevalece sobre esta skill.
- **Trailer `Co-Authored-By`:** respeta si el proyecto lo prohíbe (p. ej. WPApiPortalFeEc, ADR §13:
  "nunca un trailer `Co-Authored-By` en los commits"). Si el proyecto no dice nada, sigue la
  configuración de atribución de la sesión.
- **Nunca commitees directamente en `main`** ni en la rama de integración del proyecto (ver skill
  `*-contexto` o `CLAUDE.md`; por defecto `dev`). Si estás en una de ellas, avisa y propone crear una
  rama de trabajo antes de seguir.
- Nunca `--no-verify` ni saltar la firma salvo petición explícita. Si un hook falla, corrige la causa
  y crea un commit nuevo (no `--amend` sobre un commit ajeno o ya publicado).
- No incluyas secretos (`appsettings.*.json` con credenciales, `.env`, certificados).

## Pasos

1. Verifica la rama actual (`git rev-parse --abbrev-ref HEAD`) y las reglas anteriores.
2. Ejecuta `git diff --cached`. Si no hay nada staged, muestra `git status` y sugiere
   `git add <archivos>` (archivos concretos, no `git add -A` a ciegas).
3. Si el diff mezcla cambios no relacionados, propone dividirlo en varios commits atómicos (un commit
   por funcionalidad; en backend, junto con sus pruebas).
4. Identifica **tipo**, **alcance** (módulo o componente) y redacta la **descripción**.
5. Si el porqué no es obvio, añade un **cuerpo** explicándolo; referencia la tarea si existe
   (`TASK-102`).
6. Muestra el mensaje propuesto y **pide confirmación** antes de ejecutar.
7. Ejecuta el commit (mensaje multilínea con heredoc) y muestra `git log -1 --oneline`.

## Formato obligatorio

```
<tipo>(<alcance>): <descripción>

[cuerpo opcional: el porqué del cambio]

[footer opcional: BREAKING CHANGE, referencias a tareas]
```

### Tipos permitidos

| Tipo | Descripción |
|------|-------------|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `refactor` | Refactorización sin cambio funcional |
| `docs` | Cambios en documentación |
| `style` | Formato, punto y coma faltante, etc. (no CSS funcional) |
| `test` | Agregar o corregir tests |
| `chore` | Mantenimiento (dependencias, build, configuración) |
| `perf` | Mejora de rendimiento |

Cambio incompatible: `feat(api)!: …` y footer `BREAKING CHANGE: <qué cambia y cómo migrar>`.

### Reglas de la descripción

- En **español**, en **infinitivo** o imperativo.
- Máximo **72 caracteres** en la primera línea.
- Sin punto final.
- Minúsculas (excepto nombres propios o siglas).

## Ejemplos correctos

```
feat(auth): agregar autenticación con JWT
fix(factura): corregir cálculo de IVA en facturas con descuento
refactor(usuario): extraer validación a servicio separado
docs(readme): actualizar instrucciones de instalación
fix(responsive): ajustar barra superior y menú lateral en teléfono
```

## Ejemplos incorrectos

```
actualización        # Sin tipo ni alcance
fix bug              # Sin alcance ni descripción clara
WIP                  # No descriptivo
cambios varios       # Vago y sin formato
```

## Ramas (referencia)

Las ramas de trabajo salen de la rama de integración del proyecto (por defecto `dev`; `main` queda
congelada y solo recibe merges por PR):

| Prefijo | Uso |
|---|---|
| `feature/<nombre>` | Nueva funcionalidad |
| `fix/<nombre>` o `bugfix/<nombre>` | Corrección |
| `hotfix/<nombre>` | Urgencia en producción (sale de `main`, vuelve a `main` y a la integración) |

Nunca `git push` a `main` ni `git push --force` sobre ramas compartidas. Si hay que actualizar una
rama propia tras un rebase, usa `--force-with-lease` y solo con confirmación del usuario. Esta skill no
hace push: para publicar usa `/create-pull-request`.
