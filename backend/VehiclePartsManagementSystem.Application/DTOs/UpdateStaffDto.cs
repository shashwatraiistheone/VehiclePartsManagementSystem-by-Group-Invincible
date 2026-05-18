using System.ComponentModel.DataAnnotations;

namespace VehiclePartsManagementSystem.Application.DTOs
{
    public class UpdateStaffDto
    {
        [Required(ErrorMessage = "Full name is required.")]
        [StringLength(120, MinimumLength = 2)]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Phone is required.")]
        [Phone(ErrorMessage = "A valid phone number is required.")]
        public string Phone { get; set; } = string.Empty;

        [Required(ErrorMessage = "Role is required.")]
        [RegularExpression("^(Admin|Staff)$", ErrorMessage = "Role must be Admin or Staff.")]
        public string Role { get; set; } = "Staff";
    }
}
