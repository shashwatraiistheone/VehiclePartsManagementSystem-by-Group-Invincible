using System;
using System.Collections.Generic;

namespace VehiclePartsManagementSystem.Domain.Entities
{
    public class PurchaseInvoice
    {
        public int Id { get; set; }
        public string VendorName { get; set; } = string.Empty;
        public DateTime Date { get; set; } = DateTime.UtcNow;
        public decimal TotalAmount { get; set; }

        public List<PurchaseItem> Items { get; set; } = new();
    }
}

