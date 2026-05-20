namespace VehiclePartsManagementSystem.Domain.Entities
{
    public class EmailLog
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public Customer? Customer { get; set; }
        public int InvoiceId { get; set; }
        public Invoice? Invoice { get; set; }
        /// <summary>FriendlyReminder, UrgentReminder, FinalNotice, ManualReminder</summary>
        public string EmailType { get; set; } = string.Empty;
        public DateTime SentAt { get; set; } = DateTime.UtcNow;
        /// <summary>Sent, Failed</summary>
        public string Status { get; set; } = "Sent";
        public string? ErrorMessage { get; set; }
        public bool IsAutomatic { get; set; }
    }

    public static class CreditEmailTypes
    {
        public const string FriendlyReminder = "FriendlyReminder";
        public const string UrgentReminder = "UrgentReminder";
        public const string FinalNotice = "FinalNotice";
        public const string ManualReminder = "ManualReminder";
        public const string AutomaticOverdue = "AutomaticOverdue";
        public const string ManualOutstanding = "ManualOutstanding";
    }
}
