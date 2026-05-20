using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;
using VehiclePartsManagementSystem.Application.Helpers;
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
            if (!EmailValidator.CanSendTo(to))
            {
                throw new ArgumentException("A valid recipient email address is required.", nameof(to));
            }

            var (host, port, username, password, from, senderName, useMock) = ResolveSmtpSettings();

            if (useMock)
            {
                _logger.LogInformation(
                    "Email mock mode active. To: {To}, Subject: {Subject}",
                    to,
                    subject);
                _logger.LogDebug("Mock email body: {Body}", htmlBody);
                await Task.Delay(100);
                return;
            }

            var message = BuildMessage(to, subject, htmlBody, from, senderName);

            using var client = new SmtpClient();
            try
            {
                var secureSocket = port == 465
                    ? SecureSocketOptions.SslOnConnect
                    : SecureSocketOptions.StartTls;

                await client.ConnectAsync(host, port, secureSocket);

                if (!string.IsNullOrWhiteSpace(username) && !string.IsNullOrWhiteSpace(password))
                {
                    await client.AuthenticateAsync(username, password);
                }

                await client.SendAsync(message);
                _logger.LogInformation("Email sent to {To} via {Host}:{Port}", to, host, port);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email to {To} via {Host}:{Port}", to, host, port);
                throw new InvalidOperationException($"Failed to send email: {ex.Message}", ex);
            }
            finally
            {
                if (client.IsConnected)
                {
                    await client.DisconnectAsync(true);
                }
            }
        }

        public async Task<bool> TestSmtpConnectionAsync(CancellationToken cancellationToken = default)
        {
            var (host, port, username, password, _, _, useMock) = ResolveSmtpSettings();

            if (useMock)
            {
                _logger.LogWarning("SMTP test failed — mock mode is enabled. Set EmailSettings:UseMock to false.");
                return false;
            }

            using var client = new SmtpClient();
            try
            {
                var secureSocket = port == 465
                    ? SecureSocketOptions.SslOnConnect
                    : SecureSocketOptions.StartTls;

                await client.ConnectAsync(host, port, secureSocket, cancellationToken);

                if (!string.IsNullOrWhiteSpace(username) && !string.IsNullOrWhiteSpace(password))
                {
                    await client.AuthenticateAsync(username, password, cancellationToken);
                }

                _logger.LogInformation("SMTP connection test succeeded for {Host}:{Port}", host, port);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "SMTP connection test failed for {Host}:{Port}", host, port);
                return false;
            }
            finally
            {
                if (client.IsConnected)
                {
                    await client.DisconnectAsync(true, cancellationToken: cancellationToken);
                }
            }
        }

        private MimeMessage BuildMessage(
            string to,
            string subject,
            string htmlBody,
            string from,
            string? senderName)
        {
            var message = new MimeMessage();
            if (!string.IsNullOrWhiteSpace(senderName))
            {
                message.From.Add(new MailboxAddress(senderName, from));
            }
            else
            {
                message.From.Add(MailboxAddress.Parse(from));
            }

            message.To.Add(MailboxAddress.Parse(to.Trim()));
            message.Subject = subject;
            message.Body = new BodyBuilder { HtmlBody = htmlBody }.ToMessageBody();
            return message;
        }

        private (
            string Host,
            int Port,
            string? Username,
            string? Password,
            string From,
            string? SenderName,
            bool UseMock) ResolveSmtpSettings()
        {
            var host = GetSetting("EmailSettings:SmtpServer", "SMTP_HOST")
                ?? GetSetting("EmailSettings:Host", "SMTP_HOST");
            var portStr = GetSetting("EmailSettings:Port", "SMTP_PORT");
            var username = GetSetting("EmailSettings:Username", "SMTP_USERNAME")
                ?? GetSetting("EmailSettings:Mail", "SMTP_USERNAME")
                ?? GetSetting("EmailSettings:SenderEmail", "SMTP_FROM");
            var password = GetSetting("EmailSettings:Password", "SMTP_PASSWORD");
            var senderName = GetSetting("EmailSettings:DisplayName", "SMTP_SENDER_NAME")
                ?? GetSetting("EmailSettings:SenderName", "SMTP_SENDER_NAME");
            var senderEmail = GetSetting("EmailSettings:SenderEmail", "SMTP_SENDER_EMAIL")
                ?? GetSetting("EmailSettings:Mail", "SMTP_FROM");
            var from = senderEmail
                ?? GetSetting("EmailSettings:From", "SMTP_FROM")
                ?? "noreply@vehicleparts.com";
            var useMockStr = GetSetting("EmailSettings:UseMock", "SMTP_USE_MOCK");

            var useMock = string.Equals(useMockStr, "true", StringComparison.OrdinalIgnoreCase)
                || string.IsNullOrWhiteSpace(host)
                || host.Equals("Mock", StringComparison.OrdinalIgnoreCase);

            var port = 587;
            if (int.TryParse(portStr, out var parsedPort))
            {
                port = parsedPort;
            }

            return (host!, port, username, password, from, senderName, useMock);
        }

        /// <summary>
        /// Reads from appsettings or environment variables (e.g. SMTP_HOST).
        /// </summary>
        private string? GetSetting(string configKey, string envKey)
        {
            var env = Environment.GetEnvironmentVariable(envKey);
            if (!string.IsNullOrWhiteSpace(env))
            {
                return env;
            }

            return _configuration[configKey];
        }
    }
}
