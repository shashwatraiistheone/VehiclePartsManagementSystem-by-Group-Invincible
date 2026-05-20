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
        public bool IsSent { get; set; } = false;
        public DateTime? SentDate { get; set; }

        public bool IsPaid { get; set; } = false;
        public int ReminderSentCount { get; set; } = 0;
        public DateTime? LastReminderDate { get; set; }

        /// <summary>Paid, Partial, or Credit.</summary>
        public string PaymentStatus { get; set; } = InvoicePaymentStatus.Credit;

        public DateTime DueDate { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal BalanceAmount { get; set; }
    }
}
