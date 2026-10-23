# Servicios y DTOs

Ubicación: `02-<Api>.Services/<Api>.Services.Data/` (`Interfaces/`, `Services/`). Plantilla: `assets/plantilla-entidad/`.

## Base `CrudService<TEntity, TDto, TCreateDto, TUpdateDto, TKey>` (catálogo)

Ya implementa (no lo reescribas):

| Método | Comportamiento |
|---|---|
| `CreateAsync(dto, ct)` | `ValidateDto` (DataAnnotations) → mapea con `DeepCloneObject` → `InsertAsync` → `SaveChangesAsync` → log de auditoría → devuelve el `Id` |
| `GetByIdAsync(id)` | Proyección + `NotDeletedFilter` → `EntityNotFoundException` si no existe → verifica propiedad de empresa. **Sin CT.** |
| `GetAllAsync(filter?)` | Proyección + `NotDeletedFilter` + alcance por empresas visibles. **Sin CT.** |
| `GetEntityByFilter(filter)` | Primer DTO que cumple el filtro o `EntityNotFoundException`. **Sin CT.** |
| `UpdateAsync(id, dto, ct)` | Valida → carga → `EntityNotFoundException` si no existe → verifica propiedad → copia el DTO sobre la entidad → `Update` → `SaveChanges` → log con diff. Devuelve `SaveChanges > 0`. |
| `DeleteAsync(id, ct)` | Carga → `EntityNotFoundException` si no existe → verifica propiedad → `Remove` (lógico si `ISoftDeleted`) → log. Devuelve `SaveChanges > 0`. |

Puntos de extensión: `ProjectionExpression` (obligatorio), `NotDeletedFilter`, `OwnershipRoles`, `GetAuditExcludedProperties`,
`AuditPortalActions`, y `override` de cualquier método `virtual`.

**`NotDeletedFilter`** se combina (AND) en `GetByIdAsync`/`GetAllAsync`. Úsalo también para acotar por **rol o tipo** cuando
varias "pantallas" comparten tabla, así ningún listado puede olvidarlo: `protected override Expression<Func<Client, bool>>?
NotDeletedFilter => c => c.IsCarrier && !c.IsDeleted;`. (`GetEntityByFilter` **no** lo aplica: inclúyelo en tu filtro.)

Constructor (primario) de un servicio de catálogo:

```csharp
public class ItemService(
    IUnitOfwork<CatalogContext> unitOfWork,
    ICurrentUserAccessor currentUserAccessor,
    ILoggerFactory loggerFactory,
    ICompanyRoleVerifier companyRoleVerifier,
    ICallerCompanyScope? callerCompanyScope = null) :
    CrudService<Item, ItemDto, CreateItemDto, UpdateItemDto, int>(
        unitOfWork, uow => uow.Repository<Item, int>(), currentUserAccessor, loggerFactory, companyRoleVerifier, callerCompanyScope),
    IItemService<Item, int, ItemDto, CreateItemDto, UpdateItemDto>
```

Mantén `ICallerCompanyScope? callerCompanyScope = null` como **último** parámetro (los tests y otros hosts lo omiten).
Dependencias extra (p. ej. un servicio de plan) van antes de él.

## Base `TenantCrudService<…>` (BD transaccional por empresa)

```csharp
public class ItemTxService(
    TenantDbContextFactory tenantDbContextFactory,
    IUnitOfwork<CatalogContext> catalogUnitOfWork,     // solo para resolver Company
    ICurrentUserAccessor currentUserAccessor,
    ILoggerFactory loggerFactory) :
    TenantCrudService<ItemTx, ItemTxDto, CreateItemTxDto, UpdateItemTxDto, int>(
        tenantDbContextFactory, catalogUnitOfWork, dto => dto.CompanyLicCod, currentUserAccessor, loggerFactory),
    IItemTxService<ItemTx, int, ItemTxDto, CreateItemTxDto, UpdateItemTxDto>
```

- `CreateAsync(dto, ct)` obtiene la empresa con el **selector** (`dto => dto.CompanyLicCod`) y resuelve su `TenantDbContext`.
- El resto recibe `companyLicCod` como primer parámetro: `GetByIdAsync(companyLicCod, id)`, `GetAllAsync(companyLicCod, filter?)`,
  `GetEntityByFilter(companyLicCod, filter)` (los tres **sin CT**), `UpdateAsync(companyLicCod, id, dto, ct)`, `DeleteAsync(companyLicCod, id, ct)`.
- **No** aplica `NotDeletedFilter`, ni alcance por empresas visibles, ni verificación de propiedad: filtra `!IsDeleted` y
  `CompanyLicCod` tú mismo (override de `GetByIdAsync`, filtros explícitos).
- Para consultas propias usa `ResolveTenantAsync(companyLicCod, ct)` → `(Repository, UnitOfWork)`; nunca abras conexiones a mano.

## Interfaz y registro

- Solo CRUD: regístralo como `ICrudService<…>`. Con métodos extra: `I<Entidad>Service<TEntity, TKey, TDto, TCreateDto, TUpdateDto>
  : ICrudService<…>` (o `ITenantCrudService<…>`). Los métodos nuevos aceptan `CancellationToken cancellationToken = default`.
- **Registro**: `ServiceDataRegistration.AddServicesData()` con `services.AddScoped<IInterfaz<…>, Servicio>();`.
  Nunca en `Program.cs` (todos los hosts llaman a `AddServicesData`).

## Reglas de negocio

- Viven en el servicio, nunca en el controller.
- **Unicidad**: `AnyAsync` + `DuplicateEntityException` **y además** índice `UNIQUE` en BD (incluye `IsDeleted`).
- Consultas complejas (joins, varias tablas): `var context = _unitOfWork.GetContext();` y LINQ sobre los `DbSet`. Siempre vía
  el unit of work, nunca inyectando el `DbContext`.
- Lecturas: `FindProjected(where, selector)` o `AsQueryable()` (sin tracking por defecto). `Repository.GetById(id)` también es
  sin tracking por defecto; `Repository.Update(entity)` la adjunta para guardar.
- Toda escritura termina en `await _unitOfWork.SaveChangesAsync(cancellationToken)` (el repositorio no guarda).
- Varias escrituras atómicas: un único `SaveChangesAsync` al final o `BeginTransactionAsync`/`CommitTransactionAsync`.
- Masivas (> ~100 filas): `BulkInsertAsync`/`BulkUpdateAsync`/`BulkDeleteAsync`, no bucles de `InsertAsync`.
- Si modificas una entidad fuera de `UpdateAsync`, audita: `var snap = CaptureAuditSnapshot(e); …; LogPortalAction("Update", e, snap);`.
- Nunca devuelvas `null` cuando se espera una entidad: `EntityNotFoundException`. Errores → `errores.md`.

## DTOs (`05-<Api>.Common/Dto/<Entidad>/`)

- Tres clases: `<Entidad>Dto` (lectura: `Id`, `GuidId`, `CompanyLicCod`…), `Create<Entidad>Dto`, `Update<Entidad>Dto`.
- DataAnnotations con el formato de mensajes del repo: `[Required(ErrorMessage = "El campo Code es requerido")]`,
  `[StringLength(50, ErrorMessage = "Code no puede superar los 50 caracteres")]` (longitud = la de la columna),
  `[EmailAddress]`, `[RegularExpression]`. `CrudService.ValidateDto` las ejecuta y lanza `ValidationException` (400) con el
  primer mensaje.
- Nombres de propiedades iguales a los de la entidad: el mapeo es por nombre (`DeepCloneObject`).
- `Update<Entidad>Dto` sin campos inmutables (`Id`, `GuidId`, **`CompanyLicCod`**) ni banderas que el servicio controla
  (una bandera presente con su valor por defecto la pisaría en cada update).
- `string` no anulables inicializados (`= string.Empty`); opcionales como `string?`. XML doc en cada propiedad.
- Si el frontend necesita un campo nuevo, añádelo al DTO y a `ProjectionExpression`; nunca expongas la entidad.
