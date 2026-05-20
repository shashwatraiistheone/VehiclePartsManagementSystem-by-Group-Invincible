namespace VehiclePartsManagementSystem.Application.DTOs
{
    public class EmailReminderLogDto
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public int CreditPaymentId { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public decimal PaymentAmount { get; set; }
        public DateTime? DueDate { get; set; }
        public DateTime SentAt { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? ErrorMessage { get; set; }
    }

    public class EmailReminderLogsPageDto
    {
        public List<EmailReminderLogDto> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
    }

    public class SmtpTestResultDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public class OverdueReminderRunResultDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public int EmailsSent { get; set; }
    }
}
