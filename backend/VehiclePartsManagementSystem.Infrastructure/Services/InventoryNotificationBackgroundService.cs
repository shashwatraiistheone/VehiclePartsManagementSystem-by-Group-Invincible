using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using VehiclePartsManagementSystem.Application.Interfaces;

namespace VehiclePartsManagementSystem.Infrastructure.Services
{
    public class InventoryNotificationBackgroundService : BackgroundService
    {
        private static readonly TimeSpan Interval = TimeSpan.FromMinutes(15);

        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<InventoryNotificationBackgroundService> _logger;

        public InventoryNotificationBackgroundService(
            IServiceProvider serviceProvider,
            ILogger<InventoryNotificationBackgroundService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Inventory low-stock notification checker started (every {Minutes} minutes).", Interval.TotalMinutes);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await Task.Delay(Interval, stoppingToken);
                }
                catch (TaskCanceledException)
                {
                    break;
                }

                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var service = scope.ServiceProvider.GetRequiredService<IInventoryNotificationService>();
                    var created = await service.SyncAlertsAsync(stoppingToken);
                    if (created > 0)
                    {
                        _logger.LogInformation("Inventory alert sync created {Count} new notification(s).", created);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Inventory notification background sync failed.");
                }
            }
        }
    }
}
