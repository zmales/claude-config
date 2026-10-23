# Base de datos

EF Core 9 + MySQL (Pomelo 9). Librería base `WebPOS.Infrastructure.Base` (`IRepository<T,TKey>`, `IUnitOfwork<TContext>`,
`AuditEntity`, `ISoftDeleted`, `SeekPager`). Código fuente de esa librería: `C:\webpos\otros\WebPOS-EC\WebPOS.Infraestructure.Base`.

## Contextos

| Contexto | Contenido | Configuración | Migraciones |
|---|---|---|---|
| `PortalFeContext` | Catálogo: empresas, sucursales, POS, contrapartes, productos, usuarios, roles, config… | `ModelConfiguration/PortalFeMySqlModelConfiguration.cs` | `Migrations/` |
| `TenantDbContext` | Transaccional por empresa: `FiscalDoc`, `FiscalDocXml`, `PosSequence`, recepción… | `ModelConfiguration/TenantMySqlModelConfiguration.cs` | `Migrations/Tenant/` |
| Contextos de log (`PortalActionLog`, `SriTraceabilityLog`, `SystemEventLog`, `ApiB2BRequestLog`, `AuthFailureLog`, `TechnicalLog`…) | Logs en BD | propios | `Migrations/AuditLogs/` |

**Multi-empresa**: `TenantDbContextFactory.CreateForCompany(company)` elige la BD física por alias (`DbAliases.Default = "@feec1"`
y empresas con BD dedicada, `Company.UseAltFiscaDocDB`). `Company` siempre se busca en `PortalFeContext`.
Usa `TenantCrudService`/`ResolveTenantAsync`; nunca abras conexiones a mano.

## Entidad

```csharp
/// <summary>Entidad para gestionar las Sucursales de una Empresa</summary>
public class Branch : AuditEntity, IHasKeyId<int>, ISoftDeleted
{
    public int Id { get; set; }
    public string CompanyLicCod { get; set; } = string.Empty;
    public string BranchCod { get; set; } = string.Empty;
    public string? BranchPhone { get; set; }
    public bool IsDeleted { get; set; }
}
```

- `AuditEntity` aporta `GuidId`, `CreatedAt/By`, `UpdatedAt/By`, `DeletedAt/By` y `RowVersion`: **no los asignes a mano**
  (los llena `AuditSaveChangesInterceptor`).
- `ISoftDeleted`: `Repository.Remove()` se convierte en `IsDeleted = true` (`SoftDeleteSaveChangesInterceptor`), y
  `BaseDbContext` aplica un **filtro global** que oculta los eliminados en toda consulta. Nunca borres físicamente
  una entidad `ISoftDeleted`.
- Entidades por empresa llevan `CompanyLicCod` (`varchar(15)`): de eso dependen el alcance y la verificación de propiedad.
- XML doc en cada propiedad.

## Configuración EF (MySQL)

```csharp
modelBuilder.Entity<Branch>(entity =>
{
    #region table
    entity.ToTable("Branch");
    #endregion
    #region Keys
    entity.HasKey(e => e.Id);
    entity.HasIndex(e => new { e.CompanyLicCod, e.BranchCod, e.IsDeleted }).IsUnique()
          .HasDatabaseName("UX_CompanyLicCod_BranchCod_IsDeleted");
    #endregion
    #region Propiedades principales
    entity.Property(e => e.GuidId).IsRequired().HasMaxLength(128);
    entity.Property(e => e.CompanyLicCod).IsRequired().HasMaxLength(15);
    entity.Property(e => e.BranchJson).IsRequired().HasColumnType("json");
    #endregion
    #region IsDeleted
    entity.Property(e => e.IsDeleted).IsRequired().HasColumnType("tinyint(1)").HasDefaultValue(false);
    #endregion
    #region Auditoría
    entity.ApplyAuditConfiguration(DbTypes.MySql);
    #endregion
});
```

- Toda columna `string` con `HasMaxLength` (y el mismo límite en `[StringLength]` del DTO y en el `maxlength` del front).
- Índices únicos con nombre `UX_…` e incluyendo `IsDeleted`.
- Solo `PortalFeMySqlModelConfiguration`; la de SQL Server (`PortalFeSqlServerModelConfiguration.cs.cs`) está abandonada.

## Migraciones

```bash
# Catálogo
dotnet ef migrations add AddCarrierRoleAndLicensePlate --context PortalFeContext --project 03-WPApiPortalFeEc.Infraestructure --startup-project 01-WPApiPortalFeEc.API
# Transaccional por empresa
dotnet ef migrations add AddRecFiscalDocStatusMessage --context TenantDbContext --project 03-WPApiPortalFeEc.Infraestructure --startup-project 01-WPApiPortalFeEc.API --output-dir Migrations/Tenant
# Verificar que no falta ninguna
./scripts/check-pending-migrations.sh
```

- Nombre en PascalCase que describe el cambio (`Add…`, `Alter…`, `Remove…`).
- Se commitean `.cs`, `.Designer.cs` y el `ModelSnapshot`.
- **Nunca edites ni borres una migración ya aplicada** en algún ambiente; crea otra.
- Revisa el `Up()` generado: renombres que EF interpreta como drop+add pierden datos.
- Cambios en BD transaccional por empresa pueden necesitar además un script en `deploy/sql/` para bases ya
  existentes; sigue `deploy/CHECKLIST-DESPLIEGUE.md`.

## Consultas

- Proyecta a DTO (`FindProjected` / `.Select`) en lugar de cargar entidades completas.
- Lecturas sin tracking (por defecto en el repositorio; `AsNoTracking()` si usas `GetContext()`).
- Sin consultas dentro de bucles (N+1): trae los datos en una sola consulta (`Contains`, joins).
- Nunca cargues tablas completas en memoria para filtrar después; filtra en el `IQueryable`.
- Listados grandes con `SeekPager` (`ToSeekPagerListAsync`), como `FiscalDocService`.
- SQL crudo solo con `FromSqlInterpolated`/`ExecuteSqlInterpolatedAsync` o parámetros; nunca concatenando.
- Cadenas de conexión: siempre por configuración / alias; nunca hardcodeadas.
