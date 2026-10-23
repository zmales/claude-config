# Plantilla de entidad CRUD (`Item`)

Feature completa y limpia para un catálogo por empresa, con la forma real de WebPOS (basada en `Branch`/`Carrier` de
WPApiPortalFeEc, sin su deuda). Los namespaces usan `WPApiPortalFeEc` / `PortalFeContext` / `PortalFeEc.UnitTest` como
ejemplo concreto: en otra solución, cámbialos por los suyos.

## Qué renombrar

| Busca | Reemplaza por | Ojo |
|---|---|---|
| `Item` / `item` | Nombre de la entidad (singular, PascalCase) / ruta en minúsculas | También en `nameof(Item)`, el nombre de tabla y el índice |
| `ITEM` (ErrorMessages) | `NOMBREENTIDAD` en mayúsculas | Debe coincidir con `typeof(TEntity).Name.ToUpperInvariant()` |
| `Ítem` / `ítem` | Nombre de negocio en español | XML docs y mensajes |
| `Code`, `Name`, `Description` | Campos reales | Mismas longitudes en entidad, configuración EF y DTO |
| `/admin/item` | Ruta real del frontend | Sección `path` de ErrorMessages.json |
| `WPApiPortalFeEc`, `PortalFeContext`, `PortalFeEc.UnitTest` | Prefijo, contexto de catálogo y proyecto de tests de tu solución | |

## Dónde va cada archivo

| Archivo | Destino |
|---|---|
| `Item.cs` | `04-<Api>.Data/Entities/Item.cs` |
| `ItemModelConfiguration.snippet.cs` | Dentro de `Configure()` de `03-…/ModelConfiguration/<Catalogo>MySqlModelConfiguration.cs`, + `DbSet<Item>` en `03-…/Context/<Catalogo>Context.cs` |
| `ItemDto.cs`, `CreateItemDto.cs`, `UpdateItemDto.cs` | `05-<Api>.Common/Dto/Item/` |
| `ErrorMessages.snippet.json` | Sección `ITEM` dentro de `05-…/Resources/ErrorMessages.json` (sin la clave `_comentario`) |
| `IItemService.cs` | `02-…/<Api>.Services.Data/Interfaces/` (omítelo si solo usas el CRUD base) |
| `ItemService.cs` | `02-…/<Api>.Services.Data/Services/` |
| `ServiceDataRegistration.snippet.cs` | Línea dentro de `AddServicesData()` en `ServiceDataRegistration.cs` |
| `ItemController.cs` | `01-<Api>.API/Controllers/v1/` |
| `ItemServiceTest.cs` | `06-…/<Proyecto>.UnitTest.Services.Data/Test.Service/` |

## Después de copiar

1. Añade `typeof(UpdateItemDto)` a `UpdateDtoTypes` en `UpdateDtoNoExponeCompanyLicCodTest`.
2. Genera la migración del contexto de catálogo (`dotnet ef migrations add AddItem --context <Catalogo>Context …`) y revisa el `Up()`.
3. Ejecuta `check-backend.js` sobre los archivos nuevos, `dotnet build` y `dotnet test --filter ItemServiceTest`.

## Variantes

- **Solo CRUD**: borra `IItemService.cs` y `GetByCompanyAsync`; registra `ICrudService<Item, int, ItemDto, CreateItemDto, UpdateItemDto>`.
- **Tabla compartida por varias pantallas** (un rol/tipo por pantalla): pon el criterio en `NotDeletedFilter`
  (`e => e.IsX && !e.IsDeleted`) y en cada consulta propia; usa el mismo `entityName` en todas las excepciones.
- **BD transaccional por empresa**: hereda de `TenantCrudService` (ver `references/servicios.md`), la entidad va en
  `TenantDbContext` y su configuración Tenant, y las rutas llevan `companyLicCod` (`{companyLicCod}/{id:int}`).
- **Catálogo global sin empresa** (solo WPAdmin edita): sin `CompanyLicCod`, escrituras con `[GlobalAdminOnly("motivo")]` +
  `[ClaimAccess(... WpAdmin)]`, sin `[RequireCompanyRoleFromBody]`.

## Límite conocido del patrón

El índice `UX_…_IsDeleted` permite **un** registro borrado por clave: borrar dos veces el mismo código en la misma empresa
choca con el índice. Si el negocio lo necesita, decide (y documenta) otra estrategia antes de copiar.
