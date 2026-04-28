using System.ComponentModel.DataAnnotations;

namespace VehiclePartsManagementSystem.Domain.Entities
{
    public class Vendor
    {
        public int Id { get; set; }

        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        public string Email { get; set; } = string.Empty;

        public string Contact { get; set; } = string.Empty;

        public string Address { get; set; } = string.Empty;
    }
}

