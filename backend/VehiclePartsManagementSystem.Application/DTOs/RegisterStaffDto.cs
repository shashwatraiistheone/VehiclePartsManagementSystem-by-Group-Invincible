using System.ComponentModel.DataAnnotations;

namespace VehiclePartsManagementSystem.Application.DTOs
{
    public class RegisterStaffDto
    {
        [Required(ErrorMessage = "Full name is required.")]
        [StringLength(120, MinimumLength = 2)]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "A valid email address is required.")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Phone is required.")]
        [Phone(ErrorMessage = "A valid phone number is required.")]
        public string Phone { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password is required.")]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters.")]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "Role is required.")]
        [RegularExpression("^(Admin|Staff)$", ErrorMessage = "Role must be Admin or Staff.")]
        public string Role { get; set; } = "Staff";
    }
}
