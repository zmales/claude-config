# WPApiPortalFeEc — API .NET 8 de facturación electrónica (Ecuador / SRI)

Las normas globales (`~/.claude/CLAUDE.md`) aplican aquí. Este archivo solo añade lo propio del repo.

## Agentes de este repo

- Código: `backend-dotnet`.
- Revisión: `code-review`.
- Documentación: `documentation`.

El frontend que consume esta API es el portal `WPPORTALFEEC` (`C:\webpos\ecuador\WPPORTALFEEC`). Si un cambio de
contrato afecta al portal, avísalo en el reporte; ese cambio lo hace `frontend-angular` en ese repo.

## Reglas propias

- Los commits de este repo **no** llevan el trailer `Co-Authored-By` (ADR §13 de `ARCHITECTURE_DECISIONS_V1.md`).
- `ARCHITECTURE_DECISIONS_V1.md` manda sobre cualquier norma genérica: léelo si tocas emisión SRI, multi-empresa,
  jobs o configuración.

## Contexto

Todo lo específico de este repo (dominio, proyectos 01/07/08, contextos EF, rama de integración, comandos y deuda
conocida que no se copia) está en la skill `.claude/skills/wpapi-contexto/SKILL.md`. Los agentes la leen en su paso 0.

## Esta carpeta

`.claude/` está en el `.gitignore` y no se sube a GitHub. Su fuente versionada es el repo `claude-config`
(`proyectos/WPApiPortalFeEc/`): edita allí y ejecuta `install.ps1`.
