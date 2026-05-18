using System;

namespace VehiclePartsManagementSystem.Domain.Entities
{
    public class Part
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int Quantity { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Optional link to supplier — used to block vendor delete when parts exist.
        /// </summary>
        public int? VendorId { get; set; }
        public Vendor? Vendor { get; set; }
    }
}
