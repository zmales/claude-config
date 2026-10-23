# Controllers y endpoints

Referencia canónica: `01-WPApiPortalFeEc.API/Controllers/v1/CarrierController.cs`.

## Plantilla

```csharp
/// <summary>Controlador para la gestión de transportistas.</summary>
/// <remarks>Por qué existe / reglas que no son obvias.</remarks>
[Route("api/v1/[controller]")]
[ApiController]
[Authorize]
public class CarrierController : ControllerBase
{
    private readonly ICarrierService<Client, int, CarrierDto, CreateCarrierDto, UpdateCarrierDto> _service;

    public CarrierController(ICarrierService<Client, int, CarrierDto, CreateCarrierDto, UpdateCarrierDto> service)
    {
        _service = service;
    }

    #region Methods

    /// <summary>Obtiene todos los transportistas de una empresa.</summary>
    /// <param name="companyLicCod">Licencia corta de la empresa.</param>
    /// <param name="cancellationToken">Token de Cancelacion</param>
    // GET: api/v1/carrier/company/{companyLicCod}
    [HttpGet("company/{companyLicCod}")]
    [RequirePermission(PermissionAction.Read)]
    [ClaimAccess(nameof(AppClaims.Role), AppRoles.WpAdmin)]
    [DbRoleAccess(AppRoles.Admin)]
    [DbRoleAccess(AppRoles.User)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IEnumerable<CarrierDto>>> GetByCompany(string companyLicCod, CancellationToken cancellationToken)
        => Ok(await _service.GetCarriersByCompanyAsync(companyLicCod, cancellationToken));

    #endregion
}
```

## Reglas

- **Ruta**: `[Route("api/v1/[controller]")]` → `api/v1/carrier` (nombre del controller en **singular**, sin verbos).
  Sub-recursos con segmentos: `company/{companyLicCod}`, `{id:int}`, `by-guid/{guid}/{companyLicCod}`.
  El frontend ya consume estas rutas: no las renombres.
- `[ApiController]` + `[Authorize]` a nivel de clase. Endpoints públicos (`HelloController`, `Internal/*`, alguno de
  `ApiKeyController`) llevan `[AllowAnonymous]` explícito; los internos además quedan detrás de `UseInternalOnly()`.
- **Autorización en cada acción** (rol global, rol de empresa y permiso granular) → `seguridad.md`.
- **Respuestas**:
  - GET → `Ok(dto)`; el servicio lanza `EntityNotFoundException` (404) si no existe, no devuelvas `null`.
  - POST → `CreatedAtAction(nameof(GetById), new { id }, dto)` (201). Crear devuelve el id; luego `GetByIdAsync` para el body.
  - PUT → `Ok(dtoActualizado)`; si `UpdateAsync` devuelve `false`, `NotFound()`.
  - DELETE → `NoContent()` (204); si `DeleteAsync` devuelve `false`, `NotFound()`.
  - Errores: no construyas `BadRequest(...)` a mano para reglas de negocio; lanza la excepción del dominio y el
    middleware arma el `ProblemDetails` → `errores.md`.
- **`[ProducesResponseType]`** para cada código posible (200/201/204, 400, 401, 404, 409/422 si aplica).
- **`CancellationToken cancellationToken`** como último parámetro en toda acción async y pásalo al servicio.
  (`GetById` del repo no lo recibe porque `ICrudService.GetByIdAsync` no lo acepta: no "arregles" eso en una feature.)
- **Siempre DTOs** en request y response; nunca la entidad. `[FromBody]` explícito en POST/PUT.
- **XML docs** en cada acción (alimentan Swagger) + comentario `// VERBO: ruta` encima del atributo HTTP.
- **Sin lógica de negocio en el controller**: solo orquesta llamadas al servicio. Validaciones de parámetros simples
  de consulta (rangos de fecha, `pageSize`) sí pueden ir aquí usando los textos de `Code/ErrorMessages.cs`.
- **Listados grandes** (documentos fiscales) paginan con `SeekPager<TDto, TKey>` (`ToSeekPagerListAsync`, ver
  `FiscalDocService`). Catálogos pequeños por empresa pueden devolver la lista completa, como hace el repo.
- Swagger (`UseWebPOSSwagger`) está activo fuera de Production; la doc XML es la que ve el equipo de front.

## API B2B (07) y SOAP (08)

- `07-WPApiFeEc.Api` autentica por **API Key** (no OIDC) y tiene sus propios controllers, filtros y middleware.
  No copies los atributos `[DbRoleAccess]` del portal ahí sin revisar cómo resuelve la empresa esa API.
- Logs de requests B2B van a la categoría `B2BApi.` y SOAP a su propio contexto → `logging-config.md`.
