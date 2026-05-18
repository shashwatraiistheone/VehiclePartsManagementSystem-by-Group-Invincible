using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using VehiclePartsManagementSystem.Application.Interfaces;

namespace VehiclePartsManagementSystem.Infrastructure.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendEmailAsync(string to, string subject, string htmlBody)
        {
            var host = _configuration["EmailSettings:Host"];
            var portStr = _configuration["EmailSettings:Port"];
            var username = _configuration["EmailSettings:Username"];
            var password = _configuration["EmailSettings:Password"];
            var from = _configuration["EmailSettings:From"] ?? "noreply@vehicleparts.com";
            var enableSslStr = _configuration["EmailSettings:EnableSsl"];

            // If SMTP Host is not configured or configured as a mock/local simulation
            if (string.IsNullOrWhiteSpace(host) || host.Equals("Mock", StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogInformation("SMTP Host not configured or configured as Mock. SIMULATING email send.");
                _logger.LogInformation($"[MOCK EMAIL SENT]\nTo: {to}\nSubject: {subject}\nBody: {htmlBody}");
                await Task.Delay(500); // Simulate network latency
                return;
            }

            int port = 587;
            if (int.TryParse(portStr, out int parsedPort))
            {
                port = parsedPort;
            }

            bool enableSsl = true;
            if (bool.TryParse(enableSslStr, out bool parsedSsl))
            {
                enableSsl = parsedSsl;
            }

            using (var message = new MailMessage())
            {
                message.From = new MailAddress(from);
                message.To.Add(new MailAddress(to));
                message.Subject = subject;
                message.Body = htmlBody;
                message.IsBodyHtml = true;

                using (var client = new SmtpClient(host, port))
                {
                    client.EnableSsl = enableSsl;
                    
                    if (!string.IsNullOrWhiteSpace(username) && !string.IsNullOrWhiteSpace(password))
                    {
                        client.Credentials = new NetworkCredential(username, password);
                    }

                    _logger.LogInformation($"Sending email to {to} via {host}:{port}");
                    await client.SendMailAsync(message);
                }
            }
        }
    }
}
