using System;
using System.Collections.Generic;

namespace VehiclePartsManagementSystem.Domain.Entities
{
    public class Sale
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public Customer? Customer { get; set; }
        public DateTime Date { get; set; } = DateTime.UtcNow;
        // The pre-discount total computed from line items
        public decimal OriginalTotalAmount { get; set; }

        // The loyalty discount amount (0 when not applicable)
        public decimal DiscountAmount { get; set; }

        // The amount payable after discounts (kept as TotalAmount for legacy UI/DTOs)
        public decimal TotalAmount { get; set; }

        public List<SaleItem> Items { get; set; } = new();
        public Invoice? Invoice { get; set; }
    }
}
