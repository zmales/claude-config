---
name: wpapi-contexto
description: Contexto exclusivo de la API WPApiPortalFeEc (facturación electrónica Ecuador / SRI) — dominio, hosts 01 Portal / 07 B2B / 08 SOAP, contextos EF, documentos que mandan, rama de integración, comandos de build/test/migraciones, entidades de referencia y deuda conocida que no se debe copiar. Uso interno de los agentes backend-dotnet y code-review junto a la skill global dotnet-webpos.
user-invocable: false
---

# wpapi-contexto — WPApiPortalFeEc

Complementa a `dotnet-webpos` (norma de empresa). Si algo de aquí choca con el código, manda el código: avisa para corregir esta skill.

## Dominio

API .NET 8 de **facturación electrónica para Ecuador**: emite y recibe comprobantes ante el **SRI** (facturas, retenciones,
guías de remisión…), genera el RIDE (PDF) y administra empresas, sucursales, puntos de emisión, contrapartes, usuarios y planes.
La consume el portal Angular `WPPORTALFEEC`.

## Proyectos

| Carpeta | Qué es |
|---|---|
| `01-WPApiPortalFeEc.API` | API del **Portal** (OIDC/JWT, atributos de rol y permiso). Prefijo de log `Portal.` |
| `07-WPApiFeEc.Api` | API **B2B** para integradores: se autentica **solo por API Key** (`ApiKeyMiddleware`). Logs `B2BApi.` |
| `08-WPApiFeEc.Soap` | Servicio **SOAP** legado (`Auth/` propio); su tabla de requests es `ApiSoapRequestLog` |
| `02-…Services.Data` | Servicios de catálogo. **Los tres hosts llaman a `AddServicesData()`**: una firma cambiada rompe los tres |
| `02-…Services.SRI` / `02-…Services.Ride` | Pipeline de emisión/recepción SRI (jobs Hangfire) / RIDE |
| `Shared/appsettings.Shared.json` | Constantes de plataforma comunes a los 3 hosts |

No se crea una API nueva: se extiende Portal o B2B (ADR §13). Nunca se llama al SRI de forma síncrona desde un endpoint:
todo pasa por `IFiscalDocEmissionPipeline` y sus jobs.

## Contextos EF (los 9 que verifica `scripts/check-pending-migrations.sh`)

| Contexto | Ubicación | Migraciones |
|---|---|---|
| `PortalFeContext` (catálogo) | `03-…/Context/` | `Migrations/` |
| `TenantDbContext` (transaccional por empresa: `FiscalDoc`, `PosSequence`, recepción…) | `03-…/MultiTenant/` | `Migrations/Tenant/` |
| `PortalActionLogContext`, `TechnicalLogContext`, `SystemEventLogContext`, `SriTraceabilityLogContext`, `ApiB2BRequestLogContext`, `ApiSoapRequestLogContext`, `AuthFailureLogContext` | `03-…/Context/` | `Migrations/AuditLogs/<Tabla>/` |

- Multi-empresa: `TenantDbContextFactory` elige la BD por alias (`DbAliases.Default = "@feec1"`; empresas con BD propia vía
  `Company.UseAltFiscaDocDB`).
- Configuración EF: `PortalFeMySqlModelConfiguration.cs` y `TenantMySqlModelConfiguration.cs`.
- Factories de diseño: `03-…/Factory/*ContextFactory.cs` y `MultiTenant/TenantDbContextDesignTimeFactory.cs`, con credencial
  MySQL local: ajústala en tu máquina si hace falta, **nunca la commitees**.
- Configuración de emisión por punto de emisión (`AgentCfg`, ADR-011): solo con `IAgentCfgResolver`. Ajustes de empresa:
  endpoint unificado `Company/{licCod}/settings` (`ICompanySettingsService`).

## Documentos del repo que mandan

`ARCHITECTURE_DECISIONS_V1.md` (ADRs, §13 convenciones y "No hacer"), `ExceptionHandlingGuide.md`, `LoggingGuide.md`,
`DEVELOPER_SETUP.md`, `deploy/CHECKLIST-DESPLIEGUE.md` (scripts `deploy/sql/` para BD por empresa ya existentes).

## Git

- Rama de integración: **`dev`** (los PR van ahí). `main` está congelada desde el 2026-04-01: no la uses de base.
- **Commits sin trailer `Co-Authored-By`** (ADR §13, `ARCHITECTURE_DECISIONS_V1.md` ~l.769). Hay commits recientes que lo
  llevan (p. ej. `bc27ffc`): son la excepción, no la norma.

## Comandos (desde la raíz del repo)

```bash
node "$HOME/.claude/skills/dotnet-webpos/scripts/check-backend.js" <rutas tocadas>
dotnet build WPApiPortalFeEc.sln
dotnet test 06-WPApiPortalFeEc.UnitTest/PortalFeEc.UnitTest.Services.Data --filter "FullyQualifiedName~<Clase>Test"
dotnet ef migrations add <Nombre> --context PortalFeContext --project 03-WPApiPortalFeEc.Infraestructure --startup-project 01-WPApiPortalFeEc.API
dotnet ef migrations add <Nombre> --context TenantDbContext --project 03-WPApiPortalFeEc.Infraestructure --startup-project 01-WPApiPortalFeEc.API --output-dir Migrations/Tenant
./scripts/check-pending-migrations.sh   # falla si algún contexto tiene cambios sin migración
```

Otros proyectos de tests: `PortalFeEc.UnitTest.Services.SRI`, `.Infraestructure`, `.Soap`, `.WPApiFeEc.Api`.

## Entidades de referencia para encajar

- `Branch` — CRUD simple por empresa (entidad, DTOs, `BranchService` con límite de plan, `BranchController`).
- `Carrier` — rol (`IsCarrier`) sobre la tabla compartida `Customer` (entidad `Client`) con `NotDeletedFilter` por rol;
  commit `bc27ffc` muestra qué archivos toca una feature. **No copies sus códigos de error** (ver deuda).
- `PosSequence` — `TenantCrudService` en BD por empresa (`PosSequenceService`, constructor con selector `dto => dto.CompanyLicCod`).

Para una entidad nueva parte de `~/.claude/skills/dotnet-webpos/assets/plantilla-entidad/` y contrasta con estas.

## Skills de este proyecto

Ninguna además de esta. Las skills propias de este repo se crean en `claude-config/proyectos/WPApiPortalFeEc/skills/`, se
listan en esta tabla con cuándo aplican y se instalan con `install.ps1 -Solo Proyectos -Proyecto WPApiPortalFeEc`.

| Skill | Cuándo aplica |
|---|---|

## Deuda conocida — no copiar

- `UpdateApiKeyDto` expone `CompanyLicCod` (único ERROR de `check-backend.js` en la solución).
- `ApiKeyController` sin atributos de rol (tampoco `ApplicationRolController`, `EnrollmentController`, `ExportLogController`).
- 7 controllers sin ningún `[RequirePermission]`: ApiKey, ApplicationRol, Enrollment, ExportLog, Menu, Plan, RetentionEcCodes.
- Controllers con `if (!result) return NotFound();` tras `UpdateAsync`/`DeleteAsync` (el 404 ya lo lanza la base).
- `CarrierService` mezcla `"Carrier"` y `nameof(Client)` como `entityName`: los 404 salen con la sección `CLIENT` y en
  `CARRIER` solo existe `CARRIER_DUPLICATE_IDNUMBER`.
- `UpdateDtoNoExponeCompanyLicCodTest` no incluye varios `Update*Dto` recientes (p. ej. `UpdateCarrierDto`).
- Entidad `User_Company_Role` sin `DbSet` en ningún contexto.
- `PortalFeSqlServerModelConfiguration.cs.cs` abandonada (último cambio 2025-12-19): no la actualices.
- Bloqueos síncronos (`.GetAwaiter().GetResult()`) en `ServiceSriRegistration.cs` durante el arranque (7 avisos).
- Índices legados `uq_user_company`, `uq_menu_slug`, `uq_menu_guid_id` y `UX_` sin prefijo de tabla: no los imites.
