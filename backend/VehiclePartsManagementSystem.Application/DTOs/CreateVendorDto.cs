using System.ComponentModel.DataAnnotations;

namespace VehiclePartsManagementSystem.Application.DTOs
{
    public class CreateVendorDto
    {
        [Required(ErrorMessage = "Vendor name is required.")]
        [StringLength(200, MinimumLength = 2)]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Contact person is required.")]
        [StringLength(120, MinimumLength = 2)]
        public string ContactPerson { get; set; } = string.Empty;

        [Required(ErrorMessage = "Phone is required.")]
        [Phone(ErrorMessage = "A valid phone number is required.")]
        public string Phone { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "A valid email address is required.")]
        public string Email { get; set; } = string.Empty;

        public string? Address { get; set; }
    }
}
