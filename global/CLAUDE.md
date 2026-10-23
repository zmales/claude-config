# Normas globales de trabajo — WebPOS

Estas reglas aplican en cualquier proyecto. Si el repo tiene `.claude/CLAUDE.md`, sus reglas se suman a estas
y mandan en caso de conflicto.

## Los cambios de código se delegan a agentes

La sesión principal **no edita código de producto**. Entiende el pedido, delega al agente que corresponde y
revisa lo que devuelve:

| Trabajo | Agente |
|---|---|
| Crear, modificar o refactorizar código Angular | `frontend-angular` |
| Crear, modificar o refactorizar código .NET | `backend-dotnet` |
| Revisar un cambio, una rama o un PR (solo lectura) | `code-review` |
| Auditar UX y accesibilidad de una vista (solo lectura) | `ux-review` |
| Aplicar correcciones visuales o de UX en HTML/SCSS | `design-fix` |
| Documentar código, features, decisiones o procedimientos | `documentation` |

- Tras un cambio de `frontend-angular` o `backend-dotnet`, pasa el resultado por `code-review`.
- Si un pedido toca frontend y backend, delega cada parte a su agente; primero el backend si el frontend depende del contrato.
- La sesión principal sí puede: leer y buscar código, responder preguntas, planificar, ejecutar comandos de solo
  lectura, y editar archivos que no son código de producto (notas, configuración local) cuando se le pida.

## Normas de la empresa

Las normas de arquitectura, componentes y sistema de diseño (colores, tipografía, espaciado) son las mismas en
todos los proyectos y viven en las skills `angular-webpos`, `dotnet-webpos`, `ux-review` y `documentacion-webpos`.
Los agentes las precargan; no las cargues en la sesión principal salvo para responder una pregunta sobre ellas.

El conocimiento propio de cada repo vive en `<repo>/.claude/skills/<prefijo>-contexto/`, que está ignorado por git
y se versiona en el repo `claude-config` (`proyectos/<repo>/`). Para un proyecto nuevo: `/init-proyecto`.

## Git

- Commits, push y PRs solo cuando el usuario lo pida, con `/create-commits` y `/create-pull-request`.
- Nunca push a `main`/`master`, nunca `--force`. La rama de integración la indica el contexto del proyecto.
- La carpeta `.claude/` de los proyectos nunca se sube a GitHub.

## Comunicación

- Responde en español.
- Reporta resultados tal como son: si una validación falla o no se ejecutó, dilo.
