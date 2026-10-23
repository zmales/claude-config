using System.ComponentModel.DataAnnotations;

namespace WPApiPortalFeEc.Common.Dto.Item
{
    /// <summary>
    /// Dto para actualizar un ítem.
    /// </summary>
    /// <remarks>
    /// No expone <c>CompanyLicCod</c> (ni <c>Id</c>/<c>GuidId</c>): <c>CrudService.UpdateAsync</c> copia el DTO sobre la
    /// entidad por nombre de propiedad, y ese campo permitiría mover el registro a otra empresa. Añade este tipo a
    /// <c>UpdateDtoNoExponeCompanyLicCodTest.UpdateDtoTypes</c>.
    /// </remarks>
    public class UpdateItemDto
    {
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
