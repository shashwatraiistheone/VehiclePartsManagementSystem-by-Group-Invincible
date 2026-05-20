using System.ComponentModel.DataAnnotations;

namespace VehiclePartsManagementSystem.Application.DTOs
{
    /// <summary>Staff registers a customer with an initial vehicle.</summary>
    public class StaffRegisterCustomerDto
    {
        [Required]
        [MinLength(1)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [MinLength(1)]
        public string LastName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string Phone { get; set; } = string.Empty;

        public string Address { get; set; } = string.Empty;

        public StaffRegisterVehicleDto? Vehicle { get; set; }
    }

    public class StaffRegisterVehicleDto
    {
        [Required]
        public string LicensePlate { get; set; } = string.Empty;

        public string? Make { get; set; }
        public string? Model { get; set; }
        public int? Year { get; set; }
        public string? Vin { get; set; }
    }
}
