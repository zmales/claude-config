---
name: init-proyecto
description: Crea la capa de proyecto de Claude Code en un repo WebPOS nuevo o existente — .claude/CLAUDE.md y la skill <prefijo>-contexto — y su copia versionada en el repo claude-config. Úsala cuando el usuario escriba /init-proyecto o pida preparar un repo para trabajar con los agentes.
disable-model-invocation: true
---

# /init-proyecto

Prepara el repo actual para trabajar con los agentes globales (`frontend-angular`, `backend-dotnet`, `code-review`,
`ux-review`, `design-fix`, `documentation`).

La capa de proyecto vive en `<repo>/.claude/` (ignorada por git, nunca se sube a GitHub) y su fuente versionada vive
en el repo `claude-config`, en `proyectos/<NombreRepo>/`. La ruta de `claude-config` está en `~/.claude/claude-config.ruta`.

## Pasos

1. **Identifica el repo.** Nombre de la carpeta raíz (`NombreRepo`) y stack:
   - `angular.json` → Angular (agente `frontend-angular`).
   - `*.sln` / `*.csproj` → .NET (agente `backend-dotnet`).
   - Ambos o ninguno: pregunta.
2. **Comprueba `.gitignore`.** Ejecuta `git check-ignore -q .claude/CLAUDE.md`. Si `.claude/` no está ignorado,
   **detente** y propón al usuario añadir la línea `.claude/` al `.gitignore` (es un cambio al repo: pide confirmación
   antes de hacerlo).
3. **Comprueba que no exista ya.** Si existen `.claude/CLAUDE.md`, `.claude/skills/*-contexto/` o
   `<claude-config>/proyectos/<NombreRepo>/`, muéstralos y pregunta si se actualizan en vez de crear.
4. **Reúne el contexto** leyendo el repo (no inventes): propósito y dominio, carpetas principales, rama de integración
   (`git branch -a`; por defecto `dev`), comandos de build/test, documentos que mandan (ADRs, guías) y deuda visible
   que no debe copiarse (ejecuta los validadores de la skill del stack sobre `src/` para tener una cifra).
   Pregunta solo lo que no puedas deducir.
5. **Crea los archivos en `claude-config`** (fuente versionada), a partir de las plantillas de esta skill:
   - `proyectos/<NombreRepo>/CLAUDE.md` ← `assets/CLAUDE.md`
   - `proyectos/<NombreRepo>/skills/<prefijo>-contexto/SKILL.md` ← `assets/contexto-SKILL.md`
     (`<prefijo>`: nombre corto en minúsculas, p. ej. `wpportal`, `wpapi`)
   - `proyectos/<NombreRepo>/retirado.txt` vacío (solo comentarios)
   - añade `"<NombreRepo>": "<ruta absoluta del repo>"` a `proyectos/proyectos.json`
6. **Si es Angular y el repo no tiene el sistema de diseño**, ofrece copiar `_tokens.scss` y `_design-system.scss`
   desde `~/.claude/skills/angular-webpos/assets/estilos/` a `src/styles/` (cambio al repo: pide confirmación).
7. **Instala** ejecutando desde `claude-config`:
   `.\install.ps1 -Solo Proyectos -Proyecto <NombreRepo>`
8. **Reporta**: archivos creados en `claude-config` y en `<repo>/.claude/`, datos que quedaron como `TODO`, y recuerda
   que los cambios en `claude-config` hay que commitearlos allí (con `/create-commits` si el usuario lo pide).

## No hagas

- No escribas la capa de proyecto solo en `<repo>/.claude/`: se perdería; la fuente es `claude-config`.
- No modifiques archivos versionados del repo (`.gitignore`, `src/`) sin confirmación.
- No copies normas globales al contexto: el contexto solo lleva lo que es único del repo.
