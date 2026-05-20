using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using VehiclePartsManagementSystem.Application.Interfaces;

namespace VehiclePartsManagementSystem.Infrastructure.Services
{
    /// <summary>
    /// Background worker that checks for overdue credit payments every 24 hours
    /// and sends automatic reminder emails.
    /// </summary>
    public class OverduePaymentService : BackgroundService
    {
        private static readonly TimeSpan RunInterval = TimeSpan.FromHours(24);

        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<OverduePaymentService> _logger;

        public OverduePaymentService(
            IServiceProvider serviceProvider,
            ILogger<OverduePaymentService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation(
                "Overdue payment reminder service started. Checking every {Hours} hours.",
                RunInterval.TotalHours);

            // Brief startup delay so the host and database are ready.
            try
            {
                await Task.Delay(TimeSpan.FromSeconds(15), stoppingToken);
            }
            catch (TaskCanceledException)
            {
                return;
            }

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var reminderService = scope.ServiceProvider.GetRequiredService<ICreditReminderService>();
                    var sent = await reminderService.ProcessAutomaticRemindersAsync(stoppingToken);
                    _logger.LogInformation(
                        "Overdue payment reminder job completed. {Count} email(s) sent.",
                        sent);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Overdue payment reminder job failed.");
                }

                try
                {
                    await Task.Delay(RunInterval, stoppingToken);
                }
                catch (TaskCanceledException)
                {
                    break;
                }
            }

            _logger.LogInformation("Overdue payment reminder service stopped.");
        }
    }
}
