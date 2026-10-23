using System.ComponentModel.DataAnnotations;

namespace WPApiPortalFeEc.Common.Dto.Item
{
    /// <summary>
    /// Dto de lectura de un ítem.
    /// </summary>
    public class ItemDto
    {
        /// <summary>Identificador del ítem.</summary>
        public int Id { get; set; }

        /// <summary>Identificador global del registro.</summary>
        [StringLength(128)]
        public string GuidId { get; set; } = string.Empty;

        /// <summary>Licencia corta de la empresa dueña.</summary>
        public string CompanyLicCod { get; set; } = string.Empty;

        /// <summary>Código del ítem.</summary>
        public string Code { get; set; } = string.Empty;

        /// <summary>Nombre del ítem.</summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>Descripción opcional.</summary>
        public string? Description { get; set; }

        /// <summary>Indica si el ítem está activo.</summary>
        public bool IsActive { get; set; }
    }
}
