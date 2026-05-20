using System;

namespace VehiclePartsManagementSystem.Application.DTOs
{
    public class PartResponseDto
    {
        public int Id { get; set; }
        public string PartNumber { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal CostPrice { get; set; }
        public decimal SellingPrice { get; set; }
        public decimal Price { get; set; }
        public int Quantity { get; set; }
        public int CriticalStockLevel { get; set; } = 3;
        public int? VendorId { get; set; }
        public string VendorName { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public string Status { get; set; } = "Active";
        public DateTime CreatedAt { get; set; }
    }
}
