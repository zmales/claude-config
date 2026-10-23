# Controllers y endpoints

Plantilla completa: `assets/plantilla-entidad/ItemController.cs`.

## Forma

```csharp
/// <summary>Controlador para la gestión de ítems.</summary>
/// <remarks>Por qué existe / reglas que no son obvias.</remarks>
[Route("api/v1/[controller]")]
[ApiController]
[Authorize]
public class ItemController : ControllerBase
{
    private readonly IItemService<Item, int, ItemDto, CreateItemDto, UpdateItemDto> _service;

    public ItemController(IItemService<Item, int, ItemDto, CreateItemDto, UpdateItemDto> service) => _service = service;

    /// <summary>Obtiene los ítems de una empresa.</summary>
    /// <param name="companyLicCod">Licencia corta de la empresa.</param>
    /// <param name="cancellationToken">Token de cancelación.</param>
    // GET: api/v1/item/company/{companyLicCod}
    [HttpGet("company/{companyLicCod}")]
    [RequirePermission(PermissionAction.Read)]
    [ClaimAccess(nameof(AppClaims.Role), AppRoles.WpAdmin)]
    [DbRoleAccess(AppRoles.Admin)]
    [DbRoleAccess(AppRoles.User)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IEnumerable<ItemDto>>> GetByCompany(string companyLicCod, CancellationToken cancellationToken)
        => Ok(await _service.GetByCompanyAsync(companyLicCod, cancellationToken));
}
```

## Reglas

- **Ruta**: `[Route("api/v1/[controller]")]` → `api/v1/item` (controller en **singular**, sin verbos). Sub-recursos con
  segmentos: `company/{companyLicCod}`, `{id:int}`, `by-guid/{guid}`. Si el frontend ya consume una ruta, no la renombres.
- `[ApiController]` + `[Authorize]` a nivel de clase. Endpoints públicos llevan `[AllowAnonymous]` explícito y justificado;
  los internos además quedan detrás del middleware de red interna del repo.
- **Autorización en cada acción** (permiso granular + rol global + rol de empresa) → `seguridad.md`.
- **Respuestas**:
  - GET → `Ok(dto)`. El servicio lanza `EntityNotFoundException` (404) si no existe; no devuelvas `null`.
  - POST → `CreatedAtAction(nameof(GetById), new { id }, dto)` (201). `CreateAsync` devuelve el id; luego `GetByIdAsync` para el body.
  - PUT → `await _service.UpdateAsync(id, dto, ct); return Ok(await _service.GetByIdAsync(id));`
  - DELETE → `await _service.DeleteAsync(id, ct); return NoContent();` (204).
  - `UpdateAsync`/`DeleteAsync` de `CrudService` **lanzan `EntityNotFoundException`** si el registro no existe o es de
    otra empresa: el 404 lo produce el middleware. Su `bool` solo indica si `SaveChanges` guardó filas (`false` = 0 filas),
    **no** "no encontrado": no lo traduzcas a `NotFound()`. Hay controllers legados con `if (!result) return NotFound();`;
    no los copies ni los cambies de paso.
  - Errores de negocio: no construyas `BadRequest(...)` a mano; lanza la excepción de dominio y el middleware arma el
    `ProblemDetails` → `errores.md`.
- **`[ProducesResponseType]`** para cada código posible (200/201/204, 400, 401, 403, 404, 409/422 si aplica).
- **`CancellationToken cancellationToken`** como último parámetro de toda acción async y pásalo al servicio.
  Excepción: `CrudService.GetByIdAsync(id)`, `GetAllAsync(filter)` y `GetEntityByFilter(filter)` (y sus variantes de
  `TenantCrudService` con `companyLicCod`) **no aceptan** token; una acción `GetById`/`GetAll`/`GetByCompany` que solo
  delega en ellos puede omitirlo. Métodos propios nuevos del servicio sí deben aceptarlo.
- **Siempre DTOs** en request y response; nunca la entidad. `[FromBody]` explícito en POST/PUT.
- **XML docs** en cada acción (alimentan Swagger) + comentario `// VERBO: ruta` encima del atributo HTTP.
- **Sin lógica de negocio en el controller**: solo orquesta. Validaciones simples de parámetros de consulta (rangos de
  fecha, `pageSize`) sí pueden ir aquí con los textos centralizados de `01-…/Code/ErrorMessages.cs`.
- **Listados grandes** paginan con `SeekPager<TDto, TKey>` (`ToSeekPagerListAsync`); catálogos pequeños por empresa pueden
  devolver la lista completa.
- Swagger activo fuera de Production; la doc XML es lo que ve el equipo de front.
- Hosts con otra autenticación (API Key, SOAP): no copies los atributos de rol del portal sin revisar cómo resuelven la
  empresa allí (skill de contexto).
