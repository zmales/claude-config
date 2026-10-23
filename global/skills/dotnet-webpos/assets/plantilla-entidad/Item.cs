using WebPOS.Infrastructure.Base.Audit;

namespace WPApiPortalFeEc.Data.Entities
{
    /// <summary>
    /// Ítem de catálogo de una empresa.
    /// </summary>
    /// <remarks>
    /// Las columnas de auditoría (<c>GuidId</c>, <c>CreatedAt/By</c>, <c>UpdatedAt/By</c>, <c>DeletedAt/By</c>,
    /// <c>RowVersion</c>) vienen de <see cref="AuditEntity"/> y las llena el interceptor: no las asignes a mano.
    /// </remarks>
    public class Item : AuditEntity, IHasKeyId<int>, ISoftDeleted
    {
        /// <summary>Clave primaria.</summary>
        public int Id { get; set; }

        /// <summary>Licencia corta de la empresa dueña del ítem.</summary>
        public string CompanyLicCod { get; set; } = string.Empty;

        /// <summary>Código del ítem, único por empresa entre los no eliminados.</summary>
        public string Code { get; set; } = string.Empty;

        /// <summary>Nombre visible del ítem.</summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>Descripción opcional.</summary>
        public string? Description { get; set; }

        /// <summary>Indica si el ítem está activo.</summary>
        public bool IsActive { get; set; } = true;

        /// <summary>Borrado lógico (lo gestiona <c>SoftDeleteSaveChangesInterceptor</c>).</summary>
        public bool IsDeleted { get; set; }
    }
}
