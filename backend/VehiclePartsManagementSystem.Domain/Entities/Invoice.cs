using System;

namespace VehiclePartsManagementSystem.Domain.Entities
{
    public class Invoice
    {
        public int Id { get; set; }

        public int SaleId { get; set; }
        public Sale? Sale { get; set; }

        public string InvoiceNumber { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    }
}
