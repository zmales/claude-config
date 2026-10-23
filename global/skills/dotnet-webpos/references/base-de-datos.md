# Base de datos

EF Core 9 + MySQL (Pomelo). Librería base **`WebPOS.Infrastructure.Base`** (NuGet; fuente en
`C:\webpos\otros\WebPOS-EC\WebPOS.Infraestructure.Base`).

## Lo que da la librería

| Pieza | Uso |
|---|---|
| `AuditEntity` | Base de toda entidad: `GuidId`, `CreatedAt/By`, `UpdatedAt/By`, `DeletedAt/By`, `RowVersion`. **No los asignes a mano** (los llena `AuditSaveChangesInterceptor`). |
| `IHasKeyId<TKey>` | `Id` de la entidad (requisito de `Repository<TEntity,TKey>()`). |
| `ISoftDeleted` | `IsDeleted`. `Remove()` se convierte en `IsDeleted = true` (`SoftDeleteSaveChangesInterceptor`) y `BaseDbContext` aplica un **filtro global** `!IsDeleted`. Nunca borres físicamente una entidad `ISoftDeleted`. |
| `BaseDbContext<T>` | Contextos de catálogo y tenant heredan de él (aplica el filtro global y la configuración por tipo de BD). Los contextos de log son `DbContext` planos. |
| `IUnitOfwork<TContext>` | `Repository<TEntity,TKey>()`, `SaveChangesAsync`, `BeginTransactionAsync`/`CommitTransactionAsync`/`RollbackTransactionAsync`, `GetContext()`. |
| `IRepository<T,TKey>` | `GetById(id, tracking=false)`, `AsQueryable()`, `AnyAsync`, `CountAsync`, `FindProjected(where, selector)`, `FindIQueryable`, `FirstOrDefaultAsync`, `InsertAsync`, `Update`, `Remove`, `Bulk*Async`. Todo sin tracking por defecto. **No guarda**: guarda el unit of work. |
| Paginación | `ToSeekPagerListAsync` (keyset, listados grandes), `ToPagerResultAsync` (página numerada, listados pequeños), `ToRangePagerAsync` (exportaciones por rangos). |
| `ApplyAuditConfiguration(DbTypes.MySql)` | Columnas de auditoría en la configuración Fluent. |
| `BaseDesignTimeDbContextFactory<T>` | Factories de diseño para `dotnet ef`. |

## Contextos

- **Catálogo** (`Context/<Catalogo>Context.cs`): empresas, sucursales, contrapartes, usuarios, roles, config…
- **Transaccional por empresa** (`MultiTenant/TenantDbContext.cs`): documentos y secuencias; `TenantDbContextFactory`
  elige la BD física de cada empresa. La entidad `Company` siempre se busca en el catálogo. Usa `TenantCrudService` /
  `ResolveTenantAsync`; nunca abras conexiones a mano.
- **Log** (`Context/*LogContext.cs`): una BD/tabla por categoría de log → `logging-config.md`.

La lista exacta de contextos del repo está en la skill de contexto.

## Entidad

```csharp
/// <summary>Ítem de catálogo de una empresa.</summary>
public class Item : AuditEntity, IHasKeyId<int>, ISoftDeleted
{
    /// <summary>Identificador interno.</summary>
    public int Id { get; set; }
    /// <summary>Licencia corta de la empresa dueña.</summary>
    public string CompanyLicCod { get; set; } = string.Empty;
    /// <summary>Código del ítem, único por empresa.</summary>
    public string Code { get; set; } = string.Empty;
    /// <summary>Borrado lógico.</summary>
    public bool IsDeleted { get; set; }
}
```

- Entidades por empresa llevan `CompanyLicCod` (`varchar(15)`): de eso dependen el alcance y la verificación de propiedad.
- XML doc en cada propiedad.

## Configuración EF (MySQL)

```csharp
modelBuilder.Entity<Item>(entity =>
{
    entity.ToTable("Item");
    entity.HasKey(e => e.Id);
    entity.HasIndex(e => new { e.CompanyLicCod, e.Code, e.IsDeleted }).IsUnique()
          .HasDatabaseName("UX_Item_CompanyLicCod_Code_IsDeleted");
    entity.Property(e => e.GuidId).IsRequired().HasMaxLength(128);
    entity.Property(e => e.CompanyLicCod).IsRequired().HasMaxLength(15);
    entity.Property(e => e.Code).IsRequired().HasMaxLength(50);
    entity.Property(e => e.IsDeleted).IsRequired().HasColumnType("tinyint(1)").HasDefaultValue(false);
    entity.ApplyAuditConfiguration(DbTypes.MySql);
});
```

- Toda columna `string` con `HasMaxLength` (mismo límite en `[StringLength]` del DTO y en el `maxlength` del front).
- **Tablas nuevas**: índice único con nombre `UX_<Tabla>_<Columnas>` que **incluye `IsDeleted`** (permite recrear tras un
  borrado lógico). Índices no únicos: `IX_<Tabla>_<Columnas>`. Hay nombres legados (`uq_…`, `UX_` sin tabla): no los imites
  ni los renombres de paso (renombrar un índice exige migración).
- Columnas JSON nativas: `.HasColumnType("json")`.
- Solo se mantiene la configuración MySQL; si el repo conserva una de SQL Server abandonada, no la actualices (skill de contexto).

## Migraciones

```bash
dotnet ef migrations add <NombreDelCambio> --context <Contexto> \
  --project 03-<Api>.Infraestructure --startup-project 01-<Api>.API [--output-dir Migrations/<Subcarpeta>]
```

- `dotnet ef` usa las **factories de diseño** de `03-…/Factory/` (y la del tenant en `MultiTenant/`). Llevan una cadena de
  conexión local: si la ajustas en tu máquina, **no la commitees**.
- Nombre en PascalCase que describe el cambio (`Add…`, `Alter…`, `Remove…`).
- Se commitean `.cs`, `.Designer.cs` y el `ModelSnapshot`.
- **Nunca edites ni borres una migración ya aplicada** en algún ambiente; crea otra.
- Revisa el `Up()` generado: renombres que EF interpreta como drop+add pierden datos.
- Las BD por empresa ya existentes pueden necesitar además un script de despliegue (checklist de despliegue del repo).

## Consultas

- Proyecta a DTO (`FindProjected` / `.Select`) en lugar de cargar entidades completas.
- Lecturas sin tracking (por defecto en el repositorio; `AsNoTracking()` si usas `GetContext()`).
- Sin consultas dentro de bucles (N+1): una sola consulta con `Contains` o joins.
- Nunca cargues tablas completas en memoria para filtrar después; filtra en el `IQueryable`.
- SQL crudo solo con `FromSqlInterpolated`/`ExecuteSqlInterpolatedAsync` o parámetros; nunca concatenando.
- Cadenas de conexión siempre por configuración/alias; nunca hardcodeadas en código de runtime.
