namespace VehiclePartsManagementSystem.Application.DTOs
{
    public class EmailLogDto
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public int InvoiceId { get; set; }
        public string EmailType { get; set; } = string.Empty;
        public string EmailTypeLabel { get; set; } = string.Empty;
        public DateTime SentAt { get; set; }
        public string Status { get; set; } = string.Empty;
        public bool IsAutomatic { get; set; }
        public string? ErrorMessage { get; set; }
    }
}
