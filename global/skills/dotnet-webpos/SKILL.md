---
name: wp-backend
description: Estándares y patrones REALES de la API .NET 8 WPApiPortalFeEc (C:\webpos\ecuador\WPApiPortalFeEc) — capas numeradas 01-08, controllers api/v1 con autorización por atributos (ClaimAccess, DbRoleAccess, RequirePermission, RequireCompanyRoleFromBody), CrudService/TenantCrudService, DTOs Create/Update con DataAnnotations, EF Core 9 + MySQL (Pomelo) con PortalFeContext y TenantDbContext multi-empresa, migraciones, jerarquía de excepciones con ErrorMessages.json, logging por categorías (Portal., Sri., Events.) y tests xUnit v3 con SQLite en memoria. Úsala siempre que crees, modifiques o revises un endpoint, servicio, entidad, DTO, migración, excepción o test de esa API, aunque no se mencionen estas palabras.
---

# wp-backend — API WPApiPortalFeEc

Esta skill es un **índice**. No leas todas las referencias: lee solo las que toque la tarea.

## Regla de oro

**El código del repo manda sobre cualquier regla genérica.** Antes de escribir, abre la pieza vecina más
parecida y copia su forma. Referencias canónicas:
- CRUD simple por empresa: `Branch` (entidad, DTOs, `BranchService`, `BranchController`).
- CRUD con reglas de negocio y tests completos: `Carrier` (commit `bc27ffc`, buena receta de qué archivos toca una feature).
- Entidades por empresa en BD transaccional: `PosSequence` / `FiscalDoc` con `TenantCrudService`.

Documentos del repo que también mandan: `ARCHITECTURE_DECISIONS_V1.md` (ADRs y "No hacer"),
`ExceptionHandlingGuide.md`, `LoggingGuide.md`, `DEVELOPER_SETUP.md`, `deploy/CHECKLIST-DESPLIEGUE.md`.

## Qué leer según la tarea

| Si la tarea toca… | Lee |
|---|---|
| Dónde va cada cosa, entidad nueva de punta a punta | `references/arquitectura.md` |
| Controller, ruta, verbo HTTP, códigos de respuesta, Swagger | `references/api.md` |
| Quién puede llamar un endpoint (roles, permisos, empresa) | `references/seguridad.md` |
| Servicio, `CrudService`, reglas de negocio, DTOs, registro DI | `references/servicios.md` |
| Entidad, `DbContext`, configuración EF, migración, consultas, multi-empresa | `references/base-de-datos.md` |
| Excepciones, códigos de error, mensajes al usuario | `references/errores.md` |
| Logs, auditoría de acciones, configuración (`appsettings`, tabla `Config`) | `references/logging-config.md` |
| Tests | `references/testing.md` |

## Validación obligatoria antes de terminar

Desde la raíz del repo de la API:

```bash
node "$HOME/.claude/skills/wp-backend/scripts/check-backend.js" <archivos o carpetas tocados>
dotnet build WPApiPortalFeEc.sln
dotnet test 06-WPApiPortalFeEc.UnitTest/PortalFeEc.UnitTest.Services.Data --filter "FullyQualifiedName~<Clase>Test"
```

Si cambiaste entidades o configuración EF: `./scripts/check-pending-migrations.sh` (falla si falta una migración).

`check-backend.js` revisa: endpoints sin autorización explícita o sin `[RequirePermission]`, acciones async sin
`CancellationToken`, `throw new Exception`, `catch` vacíos, `.Result`/`.Wait()`, `async void`, SQL crudo con
interpolación, servicios/interfaces sin registrar en `ServiceDataRegistration` y entidades sin `DbSet`.
