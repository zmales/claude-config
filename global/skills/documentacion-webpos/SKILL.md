---
name: documentacion-webpos
description: Estándares de documentación de WebPOS — XML docs en C#, JSDoc en TypeScript, comentarios en código, README, ADRs y guías .md del repositorio, siempre en español. Uso interno del agente documentation; referencia también para los agentes de frontend y backend cuando documentan lo que escriben.
user-invocable: false
---

# documentacion-webpos

Esta skill es un **índice**. Lee solo la referencia que toque la tarea.

| Tarea | Referencia |
|---|---|
| Documentar código: `///` en C#, `/** */` en TS, comentarios en línea, TODO/HACK | [references/codigo.md](references/codigo.md) |
| Escribir o actualizar README, ADR, guía técnica (`*Guide.md`, `documentacion/*.md`), CHANGELOG | [references/documentos.md](references/documentos.md) |

## Reglas que aplican siempre

1. **Español.** Toda la documentación (XML docs, JSDoc, comentarios, `.md`) se escribe en español
   neutro. Los identificadores, comandos y nombres de tipos se dejan tal cual, entre backticks.
2. **El repo manda.** Antes de escribir, abre un documento o archivo vecino del mismo tipo y copia su
   estilo (encabezados, nivel de detalle, referencias a TASK/ADR). Si contradice esta skill, sigue al
   repo y menciónalo.
3. **Explicar el porqué, no el qué.** El código ya dice qué hace; la documentación aporta la regla de
   negocio, la restricción, la decisión o el riesgo que no se ve leyendo el código.
4. **Trazabilidad.** Cuando un cambio responde a una tarea o decisión, cítala: `TASK-102`, `ADR-011`,
   `(ver sección 5.1)`, fecha del hallazgo. Es la convención real de los repos WebPOS.
5. **No inventar.** Documenta solo lo que verificaste en el código o te confirmó el usuario. Si algo
   no está claro, pregunta o márcalo como pendiente; nunca rellenes con texto genérico.
6. **Actualizar, no duplicar.** Si ya existe una guía sobre el tema (p. ej.
   `ARCHITECTURE_DECISIONS_V1.md`, `LoggingGuide.md`), amplía esa sección en lugar de crear otro
   archivo. Crea `.md` nuevos solo si el usuario lo pide.
7. **Documentación desactualizada es un bug.** Si cambias comportamiento documentado, actualiza el
   comentario o la guía en el mismo cambio.
