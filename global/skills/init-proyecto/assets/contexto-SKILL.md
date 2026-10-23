---
name: <prefijo>-contexto
description: Contexto exclusivo del repo <NombreRepo> (<dominio en pocas palabras>) — rama de integración, comandos, estructura, deuda conocida que no se copia y desviaciones permitidas. Uso interno: la leen los agentes globales en su paso 0.
user-invocable: false
---

# <prefijo>-contexto — <NombreRepo>

Complementa las normas globales (`angular-webpos` / `dotnet-webpos`). Aquí va **solo** lo que es único de este repo.

## Dominio

<!-- 2-5 líneas: qué hace el sistema, quién lo usa, módulos o features principales. -->

## Estructura

<!-- Carpetas principales y para qué sirven; repos relacionados. -->

## Git

- Rama de integración: `<dev>` (las ramas de trabajo salen de aquí y los PR van aquí).
<!-- Reglas de commit propias (p. ej. sin trailer Co-Authored-By). -->

## Comandos

```bash
# build
# tests
# validadores de la skill global (ver su SKILL.md)
```

## Documentos que mandan

<!-- ADRs, guías y checklists del repo que tienen prioridad sobre las normas globales. -->

## Deuda conocida — no copiar

<!-- Patrones presentes en el código que NO deben replicarse. Uno por línea, con archivo de ejemplo. -->

## Desviaciones permitidas

<!-- Diferencias aceptadas respecto a las normas globales, y por qué. Si no hay, escribe "Ninguna". -->
