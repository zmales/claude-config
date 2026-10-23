---
name: create-commits
description: Crea un commit siguiendo Conventional Commits. Úsala cuando el usuario quiera hacer un commit, guardar cambios, o registrar modificaciones en git.
triggers:
  - hacer commit
  - crear commit
  - commitear
  - registrar cambios
  - guardar cambios en git
---

# Crear Commit con Convenciones

Analiza los cambios staged (`git diff --cached`) y crea un commit siguiendo las convenciones establecidas.

## Instrucciones

1. Ejecuta `git diff --cached` para ver los cambios staged
2. Analiza los archivos modificados y el tipo de cambio
3. Sugiere un mensaje de commit siguiendo el formato obligatorio
4. Pide confirmación antes de ejecutar el commit

## Formato Obligatorio

```
<tipo>(<alcance>): <descripción>

[cuerpo opcional]

[footer opcional]
```

### Tipos Permitidos

| Tipo | Descripción |
|------|-------------|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `refactor` | Refactorización sin cambio funcional |
| `docs` | Cambios en documentación |
| `style` | Formato, punto y coma faltante, etc. |
| `test` | Agregar o corregir tests |
| `chore` | Tareas de mantenimiento (dependencies, build) |
| `perf` | Mejora de rendimiento |

### Reglas para la Descripción

- Usar **infinitivo** o **imperativo** en español
- Máximo **72 caracteres** en la primera línea
- Sin punto final
- Minúsculas (excepto nombres propios o siglas)

## Ejemplos Correctos ✅

```
feat(auth): agregar autenticación con JWT

fix(factura): corregir cálculo de IVA en facturas con descuento

refactor(usuario): extraer validación a servicio separado

docs(readme): actualizar instrucciones de instalación
```

## Ejemplos Incorrectos ❌

```
actualización        # Sin tipo ni alcance
fix bug              # Sin alcance ni descripción clara
WIP                  # No descriptivo
cambios varios       # Vago y sin formato
```

## Proceso a Seguir

1. Revisa los cambios con `git diff --cached`
2. Identifica el **tipo** según la naturaleza del cambio
3. Define el **alcance** basado en el módulo o componente afectado
4. Redacta una **descripción** clara y concisa
5. Si es necesario, agrega un **cuerpo** explicando el *por qué* del cambio
6. Confirma y ejecuta: `git commit -m "<mensaje>"`

> Si no hay cambios staged, sugiere ejecutar `git add <archivos>` primero.
