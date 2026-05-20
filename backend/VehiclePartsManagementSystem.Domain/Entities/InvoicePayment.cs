using System;

namespace VehiclePartsManagementSystem.Domain.Entities
{
    public class InvoicePayment
    {
        public int Id { get; set; }
        public int InvoiceId { get; set; }
        public Invoice? Invoice { get; set; }
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = "Cash";
        public string? Notes { get; set; }
        public int? StaffId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
