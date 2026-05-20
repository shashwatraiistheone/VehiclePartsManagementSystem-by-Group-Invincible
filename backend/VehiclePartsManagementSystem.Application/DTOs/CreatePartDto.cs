using System.ComponentModel.DataAnnotations;

namespace VehiclePartsManagementSystem.Application.DTOs
{
    public class CreatePartDto
    {
        [Required]
        public string PartNumber { get; set; } = string.Empty;

        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        public string Category { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        [Range(0, double.MaxValue, ErrorMessage = "Cost price cannot be negative")]
        public decimal CostPrice { get; set; }

        [Range(0.01, double.MaxValue, ErrorMessage = "Selling price must be greater than 0")]
        public decimal SellingPrice { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Stock cannot be negative")]
        public int Quantity { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Critical stock level cannot be negative")]
        public int CriticalStockLevel { get; set; } = 3;

        [Required]
        public int VendorId { get; set; }

        public bool IsActive { get; set; } = true;
    }
}
