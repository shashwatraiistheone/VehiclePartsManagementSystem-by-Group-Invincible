using System.ComponentModel.DataAnnotations;

namespace VehiclePartsManagementSystem.Application.DTOs
{
    public class RegisterDto
    {
        [Required]
        public string Username { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;

        [Required]
        [RegularExpression("^(Admin|Staff)$", ErrorMessage = "Role must be Admin or Staff")]
        public string Role { get; set; } = "Staff";
    }
}

