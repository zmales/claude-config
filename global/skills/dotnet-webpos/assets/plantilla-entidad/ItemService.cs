using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using WebPOS.Infrastructure.Base.Security;
using WebPOS.Infrastructure.Base.UnitOfWork;
using WPApiPortalFeEc.Common.Dto.Item;
using WPApiPortalFeEc.Common.Exceptions.DomainExceptions;
using WPApiPortalFeEc.Data.Entities;
using WPApiPortalFeEc.Infraestructure.Authorization;
using WPApiPortalFeEc.Infraestructure.Context;
using WPApiPortalFeEc.Services.Data.Interfaces;

namespace WPApiPortalFeEc.Services.Data.Services
{
    /// <summary>
    /// Servicio de ítems de catálogo por empresa.
    /// </summary>
    /// <remarks>
    /// Hereda de <see cref="CrudService{TEntity, TDto, TCreateDto, TUpdateDto, TKey}"/>: validación de DTO, alcance por
    /// empresa, verificación de propiedad (404 si el registro es de otra empresa) y auditoría ya vienen de la base.
    /// Aquí solo va lo propio: la unicidad del código por empresa (respaldada por el índice
    /// <c>UX_Item_CompanyLicCod_Code_IsDeleted</c>) y la consulta por empresa.
    /// <para>
    /// Si la entidad viviera en la BD transaccional por empresa, heredaría de <c>TenantCrudService</c> con
    /// <c>(tenantDbContextFactory, catalogUnitOfWork, dto =&gt; dto.CompanyLicCod, currentUserAccessor, loggerFactory)</c>
    /// y filtraría <c>!IsDeleted</c>/<c>CompanyLicCod</c> por su cuenta (esa base no tiene <c>NotDeletedFilter</c>).
    /// </para>
    /// </remarks>
    public class ItemService(
        IUnitOfwork<PortalFeContext> unitOfWork,
        ICurrentUserAccessor currentUserAccessor,
        ILoggerFactory loggerFactory,
        ICompanyRoleVerifier companyRoleVerifier,
        ICallerCompanyScope? callerCompanyScope = null) :
        CrudService<Item, ItemDto, CreateItemDto, UpdateItemDto, int>(
            unitOfWork, uow => uow.Repository<Item, int>(), currentUserAccessor, loggerFactory, companyRoleVerifier, callerCompanyScope),
        IItemService<Item, int, ItemDto, CreateItemDto, UpdateItemDto>
    {
        #region Projection

        /// <summary>Proyección de <see cref="Item"/> a <see cref="ItemDto"/>.</summary>
        protected override Expression<Func<Item, ItemDto>> ProjectionExpression =>
            entity => new ItemDto
            {
                Id = entity.Id,
                GuidId = entity.GuidId,
                CompanyLicCod = entity.CompanyLicCod,
                Code = entity.Code,
                Name = entity.Name,
                Description = entity.Description,
                IsActive = entity.IsActive,
            };

        /// <summary>
        /// Filtro que la base combina en <c>GetByIdAsync</c>/<c>GetAllAsync</c>. Si la tabla la compartieran varias
        /// pantallas (un rol o tipo por pantalla), aquí iría también ese criterio, p. ej. <c>e =&gt; e.IsX &amp;&amp; !e.IsDeleted</c>.
        /// </summary>
        protected override Expression<Func<Item, bool>>? NotDeletedFilter => e => !e.IsDeleted;

        #endregion

        #region Methods

        /// <inheritdoc/>
        public async Task<IEnumerable<ItemDto>> GetByCompanyAsync(string companyLicCod, CancellationToken cancellationToken = default)
        {
            return await Repository
                .FindProjected(where: e => e.CompanyLicCod == companyLicCod && !e.IsDeleted, selector: ProjectionExpression)
                .OrderBy(d => d.Code)
                .ToListAsync(cancellationToken);
        }

        /// <summary>Crea el ítem tras comprobar que el código no existe ya en la empresa.</summary>
        /// <exception cref="DuplicateEntityException">Si la empresa ya tiene un ítem activo con ese código (409).</exception>
        public override async Task<int> CreateAsync(CreateItemDto dto, CancellationToken cancellationToken = default)
        {
            ValidateDto(dto);
            await EnsureCodeIsFreeAsync(dto.CompanyLicCod, dto.Code, excludeId: null);
            return await base.CreateAsync(dto, cancellationToken);
        }

        /// <summary>Actualiza el ítem comprobando que el nuevo código no lo use otro ítem de la misma empresa.</summary>
        /// <exception cref="EntityNotFoundException">Si no existe o es de otra empresa (404, lo lanza la base).</exception>
        /// <exception cref="DuplicateEntityException">Si el código ya lo usa otro ítem de la empresa (409).</exception>
        public override async Task<bool> UpdateAsync(int id, UpdateItemDto dto, CancellationToken cancellationToken = default)
        {
            ValidateDto(dto);
            var existing = await Repository.GetById(id) ?? throw new EntityNotFoundException(nameof(Item), id);
            await EnsureCodeIsFreeAsync(existing.CompanyLicCod, dto.Code, excludeId: id);
            return await base.UpdateAsync(id, dto, cancellationToken);
        }

        #endregion

        #region Helpers

        /// <summary>
        /// Lanza <see cref="DuplicateEntityException"/> si otro ítem activo de la empresa ya usa <paramref name="code"/>.
        /// El índice único en BD es el respaldo ante carreras; este chequeo da el mensaje claro al usuario.
        /// </summary>
        private async Task EnsureCodeIsFreeAsync(string companyLicCod, string code, int? excludeId)
        {
            var exists = await Repository.AnyAsync(e =>
                e.CompanyLicCod == companyLicCod && e.Code == code && !e.IsDeleted && (excludeId == null || e.Id != excludeId));
            if (exists)
                throw new DuplicateEntityException(nameof(Item), nameof(Item.Code), code);
        }

        #endregion
    }
}
