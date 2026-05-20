using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using VehiclePartsManagementSystem.Application.Interfaces;
using VehiclePartsManagementSystem.Domain.Entities;
using VehiclePartsManagementSystem.Infrastructure.Data;

namespace VehiclePartsManagementSystem.Infrastructure.Services
{
    public class NotificationService : INotificationService
    {
        public const int LowStockThreshold = 10;
        private const int OverdueCreditDays = 30;

        private readonly AppDbContext _db;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(
            AppDbContext db,
            IEmailService emailService,
            IConfiguration configuration,
            ILogger<NotificationService> logger)
        {
            _db = db;
            _emailService = emailService;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<IReadOnlyList<Notification>> SyncAndGetNotificationsAsync(CancellationToken cancellationToken = default)
        {
            var activeLowStockRefIds = await SyncLowStockNotificationsAsync(cancellationToken);
            var activeOverdueRefIds = await SyncOverdueCreditNotificationsAsync(cancellationToken);
            await RemoveStaleNotificationsAsync(activeLowStockRefIds, activeOverdueRefIds, cancellationToken);

            return await _db.Notifications
                .AsNoTracking()
                .OrderBy(n => n.IsRead)
                .ThenByDescending(n => n.CreatedAt)
                .ToListAsync(cancellationToken);
        }

        public async Task<bool> MarkAsReadAsync(int id, CancellationToken cancellationToken = default)
        {
            var notification = await _db.Notifications.FindAsync([id], cancellationToken);
            if (notification == null)
            {
                return false;
            }

            notification.IsRead = true;
            await _db.SaveChangesAsync(cancellationToken);
            return true;
        }

        public async Task MarkAllAsReadAsync(CancellationToken cancellationToken = default)
        {
            await _db.Notifications
                .Where(n => !n.IsRead)
                .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true), cancellationToken);
        }

        private async Task<HashSet<string>> SyncLowStockNotificationsAsync(CancellationToken cancellationToken)
        {
            var activeRefIds = new HashSet<string>();
            var lowStockParts = await _db.Parts
                .AsNoTracking()
                .Include(p => p.Vendor)
                .Where(p => p.Quantity < LowStockThreshold)
                .ToListAsync(cancellationToken);

            var adminEmail = _configuration["EmailSettings:AdminEmail"] ?? _configuration["EmailSettings:From"];

            foreach (var part in lowStockParts)
            {
                var refId = $"part-{part.Id}";
                activeRefIds.Add(refId);

                var exists = await _db.Notifications.AnyAsync(
                    n => n.ReferenceId == refId && n.Type == "LowStock",
                    cancellationToken);

                if (!exists)
                {
                    var vendorInfo = part.Vendor != null ? $" (Vendor: {part.Vendor.Name})" : "";
                    var message = $"The stock of '{part.Name}' is low. Current quantity: {part.Quantity}.{vendorInfo}";

                    _db.Notifications.Add(new Notification
                    {
                        Title = $"Low Stock: {part.Name}",
                        Message = message,
                        Type = "LowStock",
                        ReferenceId = refId,
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow,
                    });

                    await _db.SaveChangesAsync(cancellationToken);

                    if (!string.IsNullOrWhiteSpace(adminEmail))
                    {
                        try
                        {
                            await _emailService.SendEmailAsync(
                                adminEmail,
                                $"[Vehicle Management System] Low stock alert: {part.Name}",
                                $"<p>{message}</p><p>Threshold: fewer than {LowStockThreshold} units.</p>");
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Failed to send low-stock email for part {PartId}", part.Id);
                        }
                    }
                }
            }

            return activeRefIds;
        }

        private async Task<HashSet<string>> SyncOverdueCreditNotificationsAsync(CancellationToken cancellationToken)
        {
            var activeRefIds = new HashSet<string>();

            var overdueInvoices = await _db.Invoices
                .Include(i => i.Sale)
                    .ThenInclude(s => s!.Customer)
                .Where(i => !i.IsPaid && i.BalanceAmount > 0 && i.DueDate < DateTime.UtcNow)
                .ToListAsync(cancellationToken);

            foreach (var invoice in overdueInvoices)
            {
                var refId = $"invoice-{invoice.Id}";
                activeRefIds.Add(refId);

                var exists = await _db.Notifications.AnyAsync(
                    n => n.ReferenceId == refId && n.Type == "UnpaidCredit",
                    cancellationToken);

                if (!exists)
                {
                    var customerName = invoice.Sale?.Customer?.Name ?? "Unknown Customer";
                    _db.Notifications.Add(new Notification
                    {
                        Title = $"Overdue Credit: {customerName}",
                        Message = $"Invoice {invoice.InvoiceNumber} is overdue (due {invoice.DueDate:yyyy-MM-dd}). Balance: Rs {invoice.BalanceAmount:N2}.",
                        Type = "UnpaidCredit",
                        ReferenceId = refId,
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow,
                    });
                }
            }

            await _db.SaveChangesAsync(cancellationToken);
            return activeRefIds;
        }

        private async Task RemoveStaleNotificationsAsync(
            HashSet<string> activeLowStockRefIds,
            HashSet<string> activeOverdueRefIds,
            CancellationToken cancellationToken)
        {
            var all = await _db.Notifications.ToListAsync(cancellationToken);
            var toDelete = all.Where(n =>
                (n.Type == "LowStock" && !activeLowStockRefIds.Contains(n.ReferenceId)) ||
                (n.Type == "UnpaidCredit" && !activeOverdueRefIds.Contains(n.ReferenceId))).ToList();

            if (toDelete.Count > 0)
            {
                _db.Notifications.RemoveRange(toDelete);
                await _db.SaveChangesAsync(cancellationToken);
            }
        }
    }
}
