using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using VehiclePartsManagementSystem.Application.Interfaces;

namespace VehiclePartsManagementSystem.Infrastructure.Services
{
    /// <summary>
    /// Sends automatic overdue credit reminder emails daily at 9:00 AM local time.
    /// </summary>
    public class CreditReminderBackgroundService : BackgroundService
    {
        private static readonly TimeSpan DailyRunTime = new(9, 0, 0);

        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<CreditReminderBackgroundService> _logger;

        public CreditReminderBackgroundService(
            IServiceProvider serviceProvider,
            ILogger<CreditReminderBackgroundService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Credit reminder scheduler started. Daily run at 9:00 AM local time.");

            while (!stoppingToken.IsCancellationRequested)
            {
                var delay = GetDelayUntilNextRun();
                _logger.LogDebug("Next credit reminder batch in {Hours:F1} hours", delay.TotalHours);

                try
                {
                    await Task.Delay(delay, stoppingToken);
                }
                catch (TaskCanceledException)
                {
                    break;
                }

                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var reminderService = scope.ServiceProvider.GetRequiredService<ICreditReminderService>();
                    var sent = await reminderService.ProcessAutomaticRemindersAsync(stoppingToken);
                    _logger.LogInformation("Daily credit reminder job completed. {Count} email(s) sent.", sent);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Daily credit reminder job failed.");
                }
            }
        }

        internal static TimeSpan GetDelayUntilNextRun()
        {
            var now = DateTime.Now;
            var next = now.Date.Add(DailyRunTime);
            if (now >= next)
            {
                next = next.AddDays(1);
            }

            return next - now;
        }
    }
}
