using VehiclePartsManagementSystem.Application.DTOs;

namespace VehiclePartsManagementSystem.Application.Interfaces
{
    public interface ICreditReminderService
    {
        int CalculateOverdueDays(DateTime invoiceDate, DateTime dueDate, bool isPaid, decimal balanceDue);

        string ResolveEmailType(int overdueDays, bool manual);

        Task<CreditReminderSendResult> SendReminderAsync(
            int invoiceId,
            bool manual,
            CancellationToken cancellationToken = default);

        Task<int> ProcessAutomaticRemindersAsync(CancellationToken cancellationToken = default);

        Task<EmailReminderLogsPageDto> GetReminderLogsAsync(
            string? search,
            int page,
            int pageSize,
            CancellationToken cancellationToken = default);
    }

    public class CreditReminderSendResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string EmailType { get; set; } = string.Empty;
        public int OverdueDays { get; set; }
        public EmailLogDto? Log { get; set; }
    }
}
