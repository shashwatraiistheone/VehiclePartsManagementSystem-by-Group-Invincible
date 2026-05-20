using System;

namespace VehiclePartsManagementSystem.Domain.Entities
{
    public class Part
    {
        public int Id { get; set; }
        public string PartNumber { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = "General";
        public string Description { get; set; } = string.Empty;
        public decimal CostPrice { get; set; }
        /// <summary>Selling price (legacy column name: Price).</summary>
        public decimal Price { get; set; }
        public int Quantity { get; set; }
        public int CriticalStockLevel { get; set; } = 3;
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Optional link to supplier — used to block vendor delete when parts exist.
        /// </summary>
        public int? VendorId { get; set; }
        public Vendor? Vendor { get; set; }
    }
}
