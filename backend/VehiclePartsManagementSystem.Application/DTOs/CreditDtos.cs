namespace VehiclePartsManagementSystem.Application.DTOs
{
    public class CreditInvoiceDto
    {
        public int Id { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public DateTime InvoiceDate { get; set; }
        public DateTime DueDate { get; set; }
        public int CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerEmail { get; set; } = string.Empty;
        public decimal OriginalAmount { get; set; }
        public decimal BalanceDue { get; set; }
        public decimal PaidAmount { get; set; }
        public string Status { get; set; } = string.Empty;
        public int OverdueDays { get; set; }
        public int ReminderSentCount { get; set; }
        public DateTime? LastReminderDate { get; set; }
    }

    public class CreditPayDto
    {
        public int InvoiceId { get; set; }
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = "Cash";
        public string? Notes { get; set; }
    }

    public class CreditRemindDto
    {
        public int InvoiceId { get; set; }
    }

    public class CreditPaymentHistoryDto
    {
        public int Id { get; set; }
        public int InvoiceId { get; set; }
        public decimal AmountPaid { get; set; }
        public decimal RemainingBalanceAfter { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public DateTime PaymentDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public int? StaffId { get; set; }
        public string? StaffMember { get; set; }
    }

    public class CreditPaymentResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public decimal PaidAmount { get; set; }
        public decimal RemainingBalance { get; set; }
        public string Status { get; set; } = string.Empty;
        public decimal TotalReceivables { get; set; }
        public CreditInvoiceDto Invoice { get; set; } = new();
        public CreditPaymentReceiptDto Receipt { get; set; } = new();
    }

    public class CreditPaymentReceiptDto
    {
        public int PaymentId { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public decimal AmountPaid { get; set; }
        public decimal RemainingBalance { get; set; }
        public decimal TotalAmount { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime PaymentDate { get; set; }
    }
}
