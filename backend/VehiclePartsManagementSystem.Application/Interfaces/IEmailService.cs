using System.Threading.Tasks;

namespace VehiclePartsManagementSystem.Application.Interfaces
{
    public interface IEmailService
    {
        Task SendEmailAsync(string to, string subject, string htmlBody);

        /// <summary>Verifies SMTP connectivity and authentication without sending mail.</summary>
        Task<bool> TestSmtpConnectionAsync(CancellationToken cancellationToken = default);
    }
}
