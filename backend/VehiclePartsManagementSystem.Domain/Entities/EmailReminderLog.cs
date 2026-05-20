namespace VehiclePartsManagementSystem.Domain.Entities
{
    /// <summary>
    /// Audit log for overdue payment reminder emails.
    /// CreditPaymentId maps to the credit invoice (Invoice.Id) in this system.
    /// </summary>
    public class EmailReminderLog
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public Customer? Customer { get; set; }
        /// <summary>Credit invoice id (credit payment record).</summary>
        public int CreditPaymentId { get; set; }
        public Invoice? Invoice { get; set; }
        public string Email { get; set; } = string.Empty;
        public DateTime SentAt { get; set; } = DateTime.UtcNow;
        /// <summary>Sent, Failed</summary>
        public string Status { get; set; } = "Sent";
        public string? ErrorMessage { get; set; }
    }
}
