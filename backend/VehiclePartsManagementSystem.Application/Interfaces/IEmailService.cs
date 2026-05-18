using System.Threading.Tasks;

namespace VehiclePartsManagementSystem.Application.Interfaces
{
    public interface IEmailService
    {
        Task SendEmailAsync(string to, string subject, string htmlBody);
    }
}
