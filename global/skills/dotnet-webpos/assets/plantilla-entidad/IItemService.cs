using WPApiPortalFeEc.Common.Dto.Item;

namespace WPApiPortalFeEc.Services.Data.Interfaces
{
    /// <summary>
    /// Servicio de ítems: CRUD de la base más las consultas propias de la pantalla.
    /// </summary>
    /// <remarks>
    /// Si la entidad solo necesitara el CRUD base, se registraría directamente como <c>ICrudService&lt;…&gt;</c> y este
    /// archivo no haría falta.
    /// </remarks>
    public interface IItemService<TEntity, TKey, TDto, TCreateDto, TUpdateDto>
        : ICrudService<TEntity, TKey, TDto, TCreateDto, TUpdateDto>
        where TKey : struct
        where TCreateDto : class
        where TUpdateDto : class
    {
        /// <summary>Obtiene los ítems no eliminados de una empresa, ordenados por código.</summary>
        /// <param name="companyLicCod">Licencia corta de la empresa.</param>
        /// <param name="cancellationToken">Token de cancelación.</param>
        Task<IEnumerable<ItemDto>> GetByCompanyAsync(string companyLicCod, CancellationToken cancellationToken = default);
    }
}
