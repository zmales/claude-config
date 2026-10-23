using System.ComponentModel.DataAnnotations;

namespace WPApiPortalFeEc.Common.Dto.Item
{
    /// <summary>
    /// Dto para crear un ítem.
    /// </summary>
    public class CreateItemDto
    {
        /// <summary>Licencia corta de la empresa dueña.</summary>
        [Required(ErrorMessage = "El campo CompanyLicCod es requerido")]
        [StringLength(15, ErrorMessage = "CompanyLicCod no puede superar los 15 caracteres")]
        public string CompanyLicCod { get; set; } = string.Empty;

        /// <summary>Código del ítem, único por empresa.</summary>
        [Required(ErrorMessage = "El campo Code es requerido")]
        [StringLength(50, ErrorMessage = "Code no puede superar los 50 caracteres")]
        public string Code { get; set; } = string.Empty;

        /// <summary>Nombre del ítem.</summary>
        [Required(ErrorMessage = "El campo Name es requerido")]
        [StringLength(200, ErrorMessage = "Name no puede superar los 200 caracteres")]
        public string Name { get; set; } = string.Empty;

        /// <summary>Descripción opcional.</summary>
        [StringLength(500, ErrorMessage = "Description no puede superar los 500 caracteres")]
        public string? Description { get; set; }

        /// <summary>Indica si el ítem está activo.</summary>
        public bool IsActive { get; set; } = true;
    }
}
