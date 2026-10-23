# Arquitectura

.NET 8 (`net8.0`), C# `latest`, `Nullable` habilitado (normalmente en `Directory.Build.props`).
Clean Architecture simplificada: Data y Domain viven juntos en el proyecto `04`.

## Proyectos (numerados por capa)

| Carpeta | Contiene |
|---|---|
| `01-<Api>.API` | Host HTTP. `Controllers/v1/`, `Controllers/Internal/`, `Code/` (atributos de autorización, `AppRoles`, `AppClaims`, guards, textos de validación de consulta), `Extensions/`, `Program.cs` |
| `02-<Api>.Services/<Api>.Services.Data` | Lógica de negocio: `Interfaces/`, `Services/` (`CrudService`, `TenantCrudService` y los servicios), `ServiceDataRegistration.cs` |
| `02-<Api>.Services/<Api>.Services.<Otro>` | Servicios especializados (integraciones, documentos), cada uno con su `Service<Otro>Registration.cs` |
| `03-<Api>.Infraestructure` | `Context/` (DbContexts de catálogo y de log), `MultiTenant/` (`TenantDbContext`, su factory y su factory de diseño), `ModelConfiguration/`, `Migrations/` (+ subcarpetas por contexto), `Authorization/` (verificadores, `PermissionAction`), `Factory/` (factories de diseño para migraciones), `InfraestructureServiceRegistration.cs` |
| `04-<Api>.Data` | Entidades EF (`Entities/`) |
| `05-<Api>.Common` | `Dto/<Entidad>/`, `Exceptions/`, `Resources/ErrorMessages.json`, `Helpers/` (`ErrorMessageCatalog`), `Config/`, `Constants/`, `Enums/` |
| `06-<Api>.UnitTest` | Un proyecto xUnit por proyecto probado (`…UnitTest.Services.Data`, `…Infraestructure`…) |
| `07-…`, `08-…` | Otros hosts que reutilizan `Services.Data` (API B2B, SOAP…). Ver la skill de contexto. |

Si varios hosts comparten `Services.Data`, **cambiar una firma pública impacta a todos**: compila la solución entera.

## Dónde viven las piezas que más se importan

| Pieza | Namespace / carpeta |
|---|---|
| `[RequirePermission]`, `[RequireCompanyRoleFromBody]`, `[GlobalAdminOnly]`, `AppRoles`, `AppClaims` | `<Api>.API.Code` (`01-…/Code/`) |
| `PermissionAction`, `ICompanyRoleVerifier`, `ICallerCompanyScope` | `<Api>.Infraestructure.Authorization` |
| `[ClaimAccess]`, `[DbRoleAccess]` | `WebPOS.Toolkit.Web.Filters` (NuGet) |
| `AuditEntity`, `IHasKeyId<T>`, `ISoftDeleted` | `WebPOS.Infrastructure.Base.Audit` |
| `IUnitOfwork<T>`, `IRepository<T,K>` | `WebPOS.Infrastructure.Base.UnitOfWork` / `.Repository` |
| `ICurrentUserAccessor` | `WebPOS.Infrastructure.Base.Security` |
| Excepciones | `<Api>.Common.Exceptions.DomainExceptions` / `.ValidationExceptions` / `.InfrastructureExceptions` |

## Receta: entidad CRUD nueva

Parte de `assets/plantilla-entidad/` (su `README.md` lista destino y renombres). Archivos que toca una feature completa:

1. `04-…Data/Entities/<Entidad>.cs` — `AuditEntity`, `IHasKeyId<int>`, `ISoftDeleted` → `base-de-datos.md`.
2. `03-…/Context/<Catalogo>Context.cs` — `public DbSet<Entidad> Entidad { get; set; }`.
3. `03-…/ModelConfiguration/<Catalogo>MySqlModelConfiguration.cs` — tabla, clave, índice `UX_…`, longitudes, auditoría.
4. Migración (`dotnet ef migrations add …`) → `base-de-datos.md`.
5. `05-…Common/Dto/<Entidad>/` — `<Entidad>Dto`, `Create<Entidad>Dto`, `Update<Entidad>Dto` → `servicios.md`.
6. `05-…Common/Resources/ErrorMessages.json` — sección de la entidad con al menos `<ENTIDAD>_NOT_FOUND` → `errores.md`.
7. `02-…Services.Data/Interfaces/I<Entidad>Service.cs` (si añade métodos) y `Services/<Entidad>Service.cs`.
8. `02-…Services.Data/ServiceDataRegistration.cs` — `services.AddScoped<…>()`.
9. `01-…API/Controllers/v1/<Entidad>Controller.cs` → `api.md` y `seguridad.md`.
10. `06-…UnitTest/…Services.Data/Test.Service/<Entidad>ServiceTest.cs` y el `Update<Entidad>Dto` en el test guardián → `testing.md`.

Si la entidad vive en la BD transaccional por empresa, va en `TenantDbContext` (`MultiTenant/`), su configuración Tenant
y su carpeta de migraciones, con `TenantCrudService` → `servicios.md`.

## Decisiones de arquitectura (válidas para todas las APIs)

- Nada de estado `static` para lógica de negocio (el despliegue puede tener más de un nodo).
- Nada de "SELECT existente + INSERT si no existe" sin un `UNIQUE` real en BD.
- Nunca secretos ni certificados en texto plano (repo, `appsettings*.json` versionado, BD).
- Trabajo largo o integraciones externas lentas: por job en segundo plano, nunca bloqueando un endpoint.
- Un commit por funcionalidad, siempre con pruebas unitarias.

## Estilo C#

- Servicios con **constructor primario** y campos `private readonly _x = x;`. Controllers con constructor clásico y `_service`.
- `#region` para agrupar (`Methods`, `Private properties`, `Helpers`).
- **XML docs (`///`) en español** en clases públicas, métodos, y propiedades de entidades/DTOs. El *porqué* (regla de
  negocio, ticket/ADR de origen) va en `<remarks>`.
- Nombres en inglés, `PascalCase` para tipos/miembros, `_camelCase` para campos privados; sin abreviaturas ni notación húngara.
- `async` de punta a punta: sin `.Result`, `.Wait()` ni `async void`. Sin `Console.WriteLine` en código de producción.
