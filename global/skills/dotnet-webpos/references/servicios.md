# Servicios y DTOs

Ubicación: `02-WPApiPortalFeEc.Services/WPApiPortalFeEc.Services.Data/` (`Interfaces/`, `Services/`).
Referencias: `BranchService` (simple), `CarrierService` (reglas de negocio), `PosSequenceService` (multi-empresa).

## Base `CrudService<TEntity, TDto, TCreateDto, TUpdateDto, TKey>`

Ya implementa (no lo reescribas):

| Método | Comportamiento |
|---|---|
| `CreateAsync(dto, ct)` | `ValidateDto` (DataAnnotations) → mapea con `DeepCloneObject` → `InsertAsync` → `SaveChangesAsync` → log de auditoría → devuelve el `Id` |
| `GetByIdAsync(id)` | Proyección a DTO + `NotDeletedFilter` → `EntityNotFoundException` si no existe → verifica propiedad de empresa |
| `GetAllAsync(filter?)` | Proyección + `NotDeletedFilter` + alcance por empresas visibles del usuario |
| `GetEntityByFilter(filter)` | Primer DTO que cumple el filtro o `EntityNotFoundException` |
| `UpdateAsync(id, dto, ct)` | Valida → carga → verifica propiedad → copia el DTO sobre la entidad → `Update` → `SaveChanges` → log con diff |
| `DeleteAsync(id, ct)` | Carga → verifica propiedad → `Remove` (el interceptor lo convierte en borrado lógico si es `ISoftDeleted`) → log |

Puntos de extensión: `ProjectionExpression` (obligatorio), `NotDeletedFilter`, `OwnershipRoles`,
`GetAuditExcludedProperties`, `AuditPortalActions`, y `override` de cualquier método `virtual`.

## Plantilla

```csharp
/// <summary>Servicio de sucursales.</summary>
public class BranchService(
    IUnitOfwork<PortalFeContext> unitOfWork,
    ICompanyPlanService companyPlanService,
    ILogger<BranchService> logger,
    ICurrentUserAccessor currentUserAccessor,
    ILoggerFactory loggerFactory,
    ICompanyRoleVerifier companyRoleVerifier,
    ICallerCompanyScope? callerCompanyScope = null) :
    CrudService<Branch, BranchDto, CreateBranchDto, UpdateBranchDto, int>(
        unitOfWork, uow => uow.Repository<Branch, int>(), currentUserAccessor, loggerFactory, companyRoleVerifier, callerCompanyScope),
    IBranchService<Branch, int, BranchDto, CreateBranchDto, UpdateBranchDto>
{
    private readonly ICompanyPlanService _companyPlanService = companyPlanService;

    protected override Expression<Func<Branch, BranchDto>> ProjectionExpression =>
        entity => new BranchDto { Id = entity.Id, GuidId = entity.GuidId, CompanyLicCod = entity.CompanyLicCod, /* … */ };

    /// <summary>Crea la sucursal tras validar el límite del plan.</summary>
    public override async Task<int> CreateAsync(CreateBranchDto dto, CancellationToken cancellationToken = default)
    {
        await _companyPlanService.CheckBranchLimitAsync(dto.CompanyLicCod, cancellationToken);
        return await base.CreateAsync(dto, cancellationToken);
    }
}
```

- Interfaz: si solo usa CRUD, regístralo como `ICrudService<…>`; si añade métodos, crea
  `I<Entidad>Service<TEntity, TKey, TDto, TCreateDto, TUpdateDto> : ICrudService<…>` con los métodos extra.
- Mantén `ICallerCompanyScope? callerCompanyScope = null` como último parámetro (lo usan los tests y la API B2B).
- **Registro**: en `ServiceDataRegistration.AddServicesData()` con `services.AddScoped<IInterfaz<…>, Servicio>();`.
  Nunca registres servicios en `Program.cs`.

## Reglas de negocio

- Viven en el servicio, nunca en el controller.
- **Unicidad**: valida con `AnyAsync` y lanza `DuplicateEntityException`, **y además** ten el índice `UNIQUE` en BD
  (el ADR prohíbe "SELECT + INSERT" sin constraint real). Los índices únicos incluyen `IsDeleted` para permitir recrear tras borrar.
- Consultas complejas (joins, cascadas, varias tablas): `var context = _unitOfWork.GetContext();` y LINQ sobre los
  `DbSet` (ver `BranchService.DeleteWithCascadeAsync`). Siempre a través del unit of work, nunca inyectando el `DbContext`.
- Lecturas: `FindProjected(where, selector)` o `AsQueryable()` (sin tracking por defecto). Para modificar, carga con
  `Repository.GetById(id)` o con `GetContext()` y tracking.
- Termina toda escritura con `await _unitOfWork.SaveChangesAsync(cancellationToken)` (el repositorio no guarda).
- Varias escrituras que deben ser atómicas: un único `SaveChangesAsync` al final o una transacción explícita.
- Nunca devuelvas `null` cuando se espera una entidad: `EntityNotFoundException`. Errores → `errores.md`.
- `CancellationToken` en todo método async público y propágalo a EF.

## DTOs (`05-WPApiPortalFeEc.Common/Dto/<Entidad>/`)

- Tres clases: `<Entidad>Dto` (lectura, incluye `Id`, `GuidId`, `CompanyLicCod`), `Create<Entidad>Dto`, `Update<Entidad>Dto`.
- Validación con **DataAnnotations** y mensajes en español: `[Required(ErrorMessage = "El código es obligatorio.")]`,
  `[StringLength(n)]` igual a la longitud de la columna, `[EmailAddress]`, `[RegularExpression]`. `CrudService.ValidateDto`
  las ejecuta y lanza `ValidationException` (400).
- Los nombres de propiedades deben coincidir con la entidad: el mapeo es por nombre (`DeepCloneObject`).
- `Update<Entidad>Dto` no incluye campos inmutables (`Id`, `CompanyLicCod`, `GuidId`).
- `string` no anulables inicializados (`= string.Empty`); opcionales como `string?`.
- XML doc en cada propiedad (sale en Swagger).
- Si el frontend necesita un campo nuevo, añádelo al DTO y a `ProjectionExpression`; nunca expongas la entidad.

## Entidades por empresa (BD transaccional)

`TenantCrudService<…>` / `ITenantCrudService<…>`: misma idea, pero cada operación recibe `companyLicCod`
y resuelve el `TenantDbContext` de esa empresa → `base-de-datos.md`.
