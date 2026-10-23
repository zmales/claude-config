# <NombreRepo> — <una línea: qué es y para qué sirve>

Las normas globales (`~/.claude/CLAUDE.md`) aplican aquí. Este archivo solo añade lo propio del repo.

## Agentes de este repo

- Código: `<frontend-angular | backend-dotnet>`.
- Revisión: `code-review`.
- Documentación: `documentation`.
<!-- Si es Angular: - UX: `ux-review` para auditar, `design-fix` para aplicar. -->

<!-- Repos relacionados (API que consume, frontend que la usa) y qué agente toca cada uno. -->

## Reglas propias

<!-- Solo reglas que NO estén en las normas globales. Si no hay, borra esta sección. -->

## Contexto

Todo lo específico de este repo está en la skill `.claude/skills/<prefijo>-contexto/SKILL.md`. Los agentes la leen
en su paso 0.

## Esta carpeta

`.claude/` está en el `.gitignore` y no se sube a GitHub. Su fuente versionada es el repo `claude-config`
(`proyectos/<NombreRepo>/`): edita allí y ejecuta `install.ps1`.
