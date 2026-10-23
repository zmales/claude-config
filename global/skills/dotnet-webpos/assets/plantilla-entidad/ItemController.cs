using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebPOS.Toolkit.Web.Filters;                    // [ClaimAccess], [DbRoleAccess]
using WPApiPortalFeEc.API.Code;                      // [RequirePermission], [RequireCompanyRoleFromBody], AppRoles, AppClaims
using WPApiPortalFeEc.Common.Dto.Item;
using WPApiPortalFeEc.Data.Entities;
using WPApiPortalFeEc.Infraestructure.Authorization; // PermissionAction
using WPApiPortalFeEc.Services.Data.Interfaces;

namespace WPApiPortalFeEc.API.Controllers.v1
{
    /// <summary>
    /// Controlador para la gestión de ítems de catálogo por empresa.
    /// </summary>
    /// <remarks>
    /// Solo orquesta: reglas de negocio, unicidad y verificación de propiedad viven en el servicio. Los 404/409/422 los
    /// arma el middleware a partir de las excepciones de dominio.
    /// </remarks>
    [Route("api/v1/[controller]")]
    [ApiController]
    [Authorize]
    public class ItemController : ControllerBase
    {
        private readonly IItemService<Item, int, ItemDto, CreateItemDto, UpdateItemDto> _service;

        /// <summary>Constructor del controlador de ítems.</summary>
        /// <param name="service">Servicio de ítems.</param>
        public ItemController(IItemService<Item, int, ItemDto, CreateItemDto, UpdateItemDto> service)
        {
            _service = service;
        }

        #region Methods

        /// <summary>Obtiene los ítems de las empresas visibles para el usuario.</summary>
        /// <returns>Lista de <c>ItemDto</c>.</returns>
        /// <remarks><c>GetAllAsync</c> de la base no acepta <c>CancellationToken</c>; por eso esta acción no lo declara.</remarks>
        // GET: api/v1/item
        [HttpGet]
        [RequirePermission(PermissionAction.Read)]
        [ClaimAccess(nameof(AppClaims.Role), AppRoles.WpAdmin)]
        [DbRoleAccess(AppRoles.Admin)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<IEnumerable<ItemDto>>> GetAll()
            => Ok(await _service.GetAllAsync());

        /// <summary>Obtiene un ítem por su identificador.</summary>
        /// <param name="id">Identificador del ítem.</param>
        /// <returns>El <c>ItemDto</c>, o 404 si no existe o es de otra empresa.</returns>
        // GET: api/v1/item/{id}
        [HttpGet("{id:int}")]
        [RequirePermission(PermissionAction.Read)]
        [ClaimAccess(nameof(AppClaims.Role), AppRoles.WpAdmin)]
        [DbRoleAccess(AppRoles.Admin)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ItemDto>> GetById(int id)
            => Ok(await _service.GetByIdAsync(id));

        /// <summary>Obtiene los ítems de una empresa.</summary>
        /// <param name="companyLicCod">Licencia corta de la empresa.</param>
        /// <param name="cancellationToken">Token de cancelación.</param>
        /// <returns>Lista de <c>ItemDto</c> de la empresa, ordenada por código.</returns>
        // GET: api/v1/item/company/{companyLicCod}
        [HttpGet("company/{companyLicCod}")]
        [RequirePermission(PermissionAction.Read)]
        [ClaimAccess(nameof(AppClaims.Role), AppRoles.WpAdmin)]
        [DbRoleAccess(AppRoles.Admin)]
        [DbRoleAccess(AppRoles.User)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<IEnumerable<ItemDto>>> GetByCompany(string companyLicCod, CancellationToken cancellationToken)
            => Ok(await _service.GetByCompanyAsync(companyLicCod, cancellationToken));

        /// <summary>Crea un ítem.</summary>
        /// <param name="dto">Datos del nuevo ítem (la empresa viene en <c>CompanyLicCod</c>).</param>
        /// <param name="cancellationToken">Token de cancelación.</param>
        /// <returns>El <c>ItemDto</c> creado, con HTTP 201.</returns>
        // POST: api/v1/item
        [HttpPost]
        [RequirePermission(PermissionAction.Write)]
        [ClaimAccess(nameof(AppClaims.Role), AppRoles.WpAdmin)]
        [DbRoleAccess(AppRoles.Admin)]
        [RequireCompanyRoleFromBody(AppRoles.Admin)] // la empresa llega en el body: exige el rol en ESA empresa
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<ActionResult<ItemDto>> Create([FromBody] CreateItemDto dto, CancellationToken cancellationToken)
        {
            var id = await _service.CreateAsync(dto, cancellationToken);
            var created = await _service.GetByIdAsync(id);
            return CreatedAtAction(nameof(GetById), new { id }, created);
        }

        /// <summary>Actualiza un ítem.</summary>
        /// <param name="id">Identificador del ítem.</param>
        /// <param name="dto">Datos actualizados (sin <c>CompanyLicCod</c>: un ítem no cambia de empresa).</param>
        /// <param name="cancellationToken">Token de cancelación.</param>
        /// <returns>El <c>ItemDto</c> actualizado. 404 si no existe o es de otra empresa (lo lanza el servicio).</returns>
        // PUT: api/v1/item/{id}
        [HttpPut("{id:int}")]
        [RequirePermission(PermissionAction.Write)]
        [ClaimAccess(nameof(AppClaims.Role), AppRoles.WpAdmin)]
        [DbRoleAccess(AppRoles.Admin)]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<ActionResult<ItemDto>> Update(int id, [FromBody] UpdateItemDto dto, CancellationToken cancellationToken)
        {
            // El bool de UpdateAsync solo dice si SaveChanges guardó filas; el "no existe" llega como EntityNotFoundException.
            await _service.UpdateAsync(id, dto, cancellationToken);
            return Ok(await _service.GetByIdAsync(id));
        }

        /// <summary>Elimina (borrado lógico) un ítem.</summary>
        /// <param name="id">Identificador del ítem.</param>
        /// <param name="cancellationToken">Token de cancelación.</param>
        /// <returns>HTTP 204. 404 si no existe o es de otra empresa (lo lanza el servicio).</returns>
        // DELETE: api/v1/item/{id}
        [HttpDelete("{id:int}")]
        [RequirePermission(PermissionAction.Delete)]
        [ClaimAccess(nameof(AppClaims.Role), AppRoles.WpAdmin)]
        [DbRoleAccess(AppRoles.Admin)]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult> Delete(int id, CancellationToken cancellationToken)
        {
            await _service.DeleteAsync(id, cancellationToken);
            return NoContent();
        }

        #endregion
    }
}
