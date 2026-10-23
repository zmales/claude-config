# Arquitectura

Solución `WPApiPortalFeEc.sln`, .NET 8 (`net8.0`), C# `latest`, `Nullable` habilitado (`Directory.Build.props`).

## Proyectos

| Carpeta | Contiene |
|---|---|
| `01-WPApiPortalFeEc.API` | API del portal (Angular). `Controllers/v1/`, `Controllers/Internal/`, `Code/` (atributos de autorización, `AppRoles`, `AppClaims`, guards), `Extensions/`, `Logging/`, `Program.cs` |
| `02-WPApiPortalFeEc.Services/…Services.Data` | Lógica de negocio: `Interfaces/`, `Services/`, `ServiceDataRegistration.cs`, `Middleware/`, `Helpers/` |
| `02-…/…Services.SRI` | Emisión/recepción con el SRI (pipeline, jobs Hangfire, parsing, delivery). `ServiceSriRegistration.cs` |
| `02-…/…Services.Ride` | Generación del RIDE (PDF). `ServiceRideRegistration.cs` |
| `03-WPApiPortalFeEc.Infraestructure` | `Context/` (DbContexts), `ModelConfiguration/`, `Migrations/` (+ `Migrations/Tenant`, `Migrations/AuditLogs`), `MultiTenant/`, `Authorization/` (verificadores), `Factory/`, `InfraestructureServiceRegistration.cs` |
| `04-WPApiPortalFeEc.Data` | Entidades EF (`Entities/`) |
| `05-WPApiPortalFeEc.Common` | `Dto/<Entidad>/`, `Exceptions/`, `Resources/ErrorMessages.json`, `Config/` (options y `ConfigTypes`), `Constants/`, `Helpers/`, `Enums/` |
| `06-WPApiPortalFeEc.UnitTest` | Tests xUnit por proyecto (`PortalFeEc.UnitTest.Services.Data`, `.Services.SRI`, `.Infraestructure`, `.Soap`, `.WPApiFeEc.Api`) |
| `07-WPApiFeEc.Api` | API B2B (clientes que integran por REST con API Key) |
| `08-WPApiFeEc.Soap` | Servicio SOAP para integraciones legadas |
| `Shared/appsettings.Shared.json` | Constantes de plataforma comunes a las 3 APIs |

Dependencias: `API → Services.* → Infraestructure → Data`; `Common` lo usan todos. Data y Domain viven juntos
(Clean Architecture simplificada). Nunca hagas que una capa inferior referencie a una superior.

**No crees una API nueva**: extiende Portal (01) o B2B (07) (`ARCHITECTURE_DECISIONS_V1.md`, sección 13).
Los servicios de `Services.Data` se comparten entre 01, 07 y 08: cambiar una firma impacta a las tres.

## Receta: entidad CRUD nueva

Archivos que toca una feature completa (ver `git show --stat bc27ffc`):

1. `04-…Data/Entities/<Entidad>.cs` — hereda `AuditEntity`, implementa `IHasKeyId<int>` y, si aplica, `ISoftDeleted` → `base-de-datos.md`.
2. `03-…Infraestructure/Context/PortalFeContext.cs` — `public DbSet<Entidad> Entidad { get; set; }`.
3. `03-…Infraestructure/ModelConfiguration/PortalFeMySqlModelConfiguration.cs` — tabla, claves, índices únicos, longitudes, `ApplyAuditConfiguration(DbTypes.MySql)`.
   (`PortalFeSqlServerModelConfiguration.cs.cs` está abandonada desde 2025: no la actualices.)
4. Migración con `dotnet ef migrations add` → `base-de-datos.md`.
5. `05-…Common/Dto/<Entidad>/` — `<Entidad>Dto`, `Create<Entidad>Dto`, `Update<Entidad>Dto` → `servicios.md`.
6. `05-…Common/Resources/ErrorMessages.json` — sección de la pantalla con sus códigos de error → `errores.md`.
7. `02-…Services.Data/Interfaces/I<Entidad>Service.cs` (si añade métodos) y `Services/<Entidad>Service.cs` → `servicios.md`.
8. `02-…Services.Data/ServiceDataRegistration.cs` — `services.AddScoped<…>()`.
9. `01-…API/Controllers/v1/<Entidad>Controller.cs` → `api.md` y `seguridad.md`.
10. `06-…UnitTest/PortalFeEc.UnitTest.Services.Data/Test.Service/<Entidad>ServiceTest.cs` → `testing.md`.

Si la entidad vive en la BD transaccional por empresa (documentos fiscales, secuencias), va en `TenantDbContext`,
`TenantMySqlModelConfiguration` y `Migrations/Tenant`, con `TenantCrudService` → `base-de-datos.md`.

## Convenciones del equipo (ADR, sección 13)

- Un commit por funcionalidad, siempre con pruebas unitarias. El documento indica **no** usar trailer `Co-Authored-By`.
- No llamar al SRI de forma síncrona desde un endpoint: todo pasa por `IFiscalDocEmissionPipeline`.
- Nada de estado `static` para lógica de negocio (el despliegue puede tener más de un nodo).
- Nada de "SELECT existente + INSERT si no existe" sin un `UNIQUE` real en BD.
- Nunca secretos ni certificados en texto plano.

## Estilo C#

- Constructores primarios en servicios (`public class BranchService(IUnitOfwork<PortalFeContext> unitOfWork, …)`),
  campos `private readonly _x = x;`. Controllers con constructor clásico y campo `_service`.
- `#region` para agrupar (`Methods`, `Private properties`, `Helpers`).
- **XML docs (`///`) en español** en clases públicas, métodos y propiedades de entidades/DTOs. Explica el *porqué*
  (regla de negocio, TASK/ADR de origen) en `<remarks>`; mira `CarrierController` y `TenantCrudService`.
- Nombres en inglés, `PascalCase` para tipos/miembros, `_camelCase` para campos privados, sin abreviaturas ni notación húngara.
- `async` de punta a punta: sin `.Result`, `.Wait()` ni `async void`.
