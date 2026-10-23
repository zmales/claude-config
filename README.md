# claude-config

Configuración de Claude Code de WebPOS: **agentes**, **skills** y **reglas** con las que se trabaja en todos los
proyectos. Este repo es la única fuente de verdad; lo instalado en `~/.claude` y en `<repo>/.claude` es una copia.

## Cómo está organizado

```
claude-config/
├── install.ps1                 instala todo (global + proyectos)
├── global/                     → ~/.claude   (normas de la empresa, todos los proyectos)
│   ├── CLAUDE.md               regla: los cambios de código se delegan a agentes
│   ├── agents/                 frontend-angular · backend-dotnet · code-review · ux-review · design-fix · documentation
│   ├── skills/
│   │   ├── angular-webpos/     normas Angular: arquitectura, componentes, sistema de diseño, scripts, plantillas
│   │   ├── dotnet-webpos/      normas .NET: capas, servicios, EF, errores, seguridad, scripts, plantillas
│   │   ├── ux-review/          criterios WCAG 2.1 + Nielsen
│   │   ├── documentacion-webpos/
│   │   ├── create-commits/     /create-commits
│   │   ├── create-pull-request/ /create-pull-request
│   │   └── init-proyecto/      /init-proyecto: prepara un repo nuevo
│   └── retirado.txt            lo que install.ps1 elimina de ~/.claude
└── proyectos/                  → <repo>/.claude   (solo lo único de cada repo; ignorado por git en el repo)
    ├── proyectos.json          nombre del repo → ruta en el equipo
    ├── WPPORTALFEEC/           CLAUDE.md · skills/wpportal-contexto · retirado.txt
    └── WPApiPortalFeEc/        CLAUDE.md · skills/wpapi-contexto · retirado.txt
```

**Regla de reparto:** si aplica a cualquier proyecto WebPOS (colores, arquitectura, componentes) va en `global/`.
Si menciona rutas, deuda o decisiones de un solo repo, va en `proyectos/<repo>/`.

**Quién manda:** código del repo → contexto del proyecto → normas globales → conocimiento general.

## Instalar

Requiere PowerShell (5.1 o 7) y git.

```powershell
cd C:\webpos\otros\claude-config
.\install.ps1 -WhatIf     # muestra qué haría, sin cambiar nada
.\install.ps1             # instala global + los proyectos de proyectos.json presentes en este equipo
```

Opciones:

| Comando | Qué hace |
|---|---|
| `.\install.ps1 -Solo Global` | Solo `~/.claude` |
| `.\install.ps1 -Solo Proyectos -Proyecto WPPORTALFEEC` | Solo la capa de un proyecto |
| `.\install.ps1 -Solo Proyectos -Proyecto WPPORTALFEEC -Ruta D:\repos\WPPORTALFEEC` | Proyecto en otra ruta |
| `.\install.ps1 -Forzar` | Reemplaza un `CLAUDE.md` existente que no instaló el script |

Si tus repos están en otras rutas, crea `proyectos/proyectos.local.json` (ignorado por git) con el mismo formato que
`proyectos.json`.

Qué hace el script:

1. Crea un respaldo zip en `~/.claude-respaldos/` antes de cambiar nada.
2. Elimina solo lo listado en `retirado.txt`. Nunca toca `skills/synced`, `plugins`, `settings*.json` ni `projects`.
3. Copia agentes, skills y `CLAUDE.md`.
4. En cada proyecto, **se niega a instalar si `.claude/` no está en el `.gitignore`**: la capa de proyecto nunca se sube a GitHub.

Después de instalar, abre una sesión nueva de Claude Code para que cargue los cambios.

## Cambiar algo

1. Edita aquí, nunca directamente en `~/.claude` ni en `<repo>/.claude` (el instalador lo sobrescribe).
2. Commit y PR en este repo.
3. `.\install.ps1`.

Para un proyecto nuevo, abre Claude Code en ese repo y escribe `/init-proyecto`.

## Cómo se usa en el día a día

Pide el trabajo normalmente; la sesión principal lo delega al agente que corresponde. También puedes nombrarlo:
"usa frontend-angular para…", "pasa code-review a esta rama".

| Agente | Para qué | Modifica archivos |
|---|---|---|
| `frontend-angular` | Implementar en Angular | Sí |
| `backend-dotnet` | Implementar en .NET | Sí |
| `code-review` | Revisar cambios, ramas o PR | No |
| `ux-review` | Auditar UX y accesibilidad | No |
| `design-fix` | Aplicar correcciones visuales | Sí (HTML/SCSS) |
| `documentation` | Documentar código y procesos | Sí (docs) |

Las skills de normas (`angular-webpos`, `dotnet-webpos`, `ux-review`, `documentacion-webpos` y las `*-contexto`) son
de uso interno: las cargan los agentes y no aparecen en el menú `/`.
