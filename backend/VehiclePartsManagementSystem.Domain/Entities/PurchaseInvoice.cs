using System;
using System.Collections.Generic;

namespace VehiclePartsManagementSystem.Domain.Entities
{
    public class PurchaseInvoice
    {
        public int Id { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public int? VendorId { get; set; }
        public Vendor? Vendor { get; set; }
        public string VendorName { get; set; } = string.Empty;
        public DateTime Date { get; set; } = DateTime.UtcNow;
        public string Notes { get; set; } = string.Empty;
        public string ProcessedBy { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public List<PurchaseItem> Items { get; set; } = new();
    }
}

