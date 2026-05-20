using System.ComponentModel.DataAnnotations;

namespace VehiclePartsManagementSystem.Application.DTOs
{
    public class UpdatePartDto
    {
        public string? PartNumber { get; set; }

        [Required]
        public string Name { get; set; } = string.Empty;

        public string? Category { get; set; }

        public string Description { get; set; } = string.Empty;

        [Range(0, double.MaxValue, ErrorMessage = "Cost price cannot be negative")]
        public decimal CostPrice { get; set; }

        [Range(0.01, double.MaxValue, ErrorMessage = "Selling price must be greater than 0")]
        public decimal SellingPrice { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Quantity cannot be negative")]
        public int Quantity { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Critical stock level cannot be negative")]
        public int CriticalStockLevel { get; set; } = 3;

        public int? VendorId { get; set; }

        public bool? IsActive { get; set; }
    }
}
