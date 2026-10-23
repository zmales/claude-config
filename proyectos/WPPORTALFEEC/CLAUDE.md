# WPPORTALFEEC — portal Angular de facturación electrónica (Ecuador)

Las normas globales (`~/.claude/CLAUDE.md`) aplican aquí. Este archivo solo añade lo propio del repo.

## Agentes de este repo

- Código: `frontend-angular`.
- Revisión: `code-review`.
- UX: `ux-review` para auditar, `design-fix` para aplicar.
- Documentación: `documentation`.

El backend de este portal es la API `WPApiPortalFeEc` (`C:\webpos\ecuador\WPApiPortalFeEc`). Si un pedido
necesita cambios de contrato, delega esa parte a `backend-dotnet` en ese repo.

## Contexto

Todo lo específico de este repo (dominio, rama de integración, comandos, deuda conocida que no se copia y
desviaciones permitidas) está en la skill `.claude/skills/wpportal-contexto/SKILL.md`. Los agentes la leen en su
paso 0.

## Esta carpeta

`.claude/` está en el `.gitignore` y no se sube a GitHub. Su fuente versionada es el repo `claude-config`
(`proyectos/WPPORTALFEEC/`): edita allí y ejecuta `install.ps1`.
