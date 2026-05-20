using Microsoft.EntityFrameworkCore;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;
using VehiclePartsManagementSystem.Domain.Entities;
using VehiclePartsManagementSystem.Infrastructure.Data;

namespace VehiclePartsManagementSystem.Infrastructure.Services
{
    public class InventoryNotificationService : IInventoryNotificationService
    {
        public const int DefaultCriticalStockLevel = 3;

        private readonly AppDbContext _db;

        public InventoryNotificationService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<int> SyncAlertsAsync(CancellationToken cancellationToken = default)
        {
            var created = 0;
            var parts = await _db.Parts
                .AsNoTracking()
                .Where(p => p.IsActive)
                .ToListAsync(cancellationToken);

            var lowStockPartIds = new HashSet<int>();

            foreach (var part in parts)
            {
                var threshold = part.CriticalStockLevel > 0 ? part.CriticalStockLevel : DefaultCriticalStockLevel;
                if (part.Quantity > threshold)
                {
                    await MarkPartAlertsResolvedAsync(part.Id, cancellationToken);
                    continue;
                }

                lowStockPartIds.Add(part.Id);
                var partNumber = !string.IsNullOrWhiteSpace(part.PartNumber) ? part.PartNumber : $"P-{part.Id:D4}";
                var severity = part.Quantity <= 0 ? "Critical" : part.Quantity < threshold ? "Warning" : "Info";
                var message =
                    $"Alert: {part.Name} ({partNumber}) is below reorder level. Current Stock: {part.Quantity}";

                var unread = await _db.InventoryNotifications
                    .FirstOrDefaultAsync(n => n.PartId == part.Id && !n.IsRead, cancellationToken);

                if (unread != null)
                {
                    unread.Message = message;
                    unread.Severity = severity;
                }
                else
                {
                    _db.InventoryNotifications.Add(new InventoryNotification
                    {
                        PartId = part.Id,
                        Message = message,
                        Severity = severity,
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow,
                    });
                    created++;
                }
            }

            var stale = await _db.InventoryNotifications
                .Where(n => !n.IsRead && !lowStockPartIds.Contains(n.PartId))
                .ToListAsync(cancellationToken);

            foreach (var n in stale)
            {
                n.IsRead = true;
            }

            await _db.SaveChangesAsync(cancellationToken);
            return created;
        }

        public async Task<IReadOnlyList<InventoryNotificationDto>> GetNotificationsAsync(
            int? limit,
            CancellationToken cancellationToken = default)
        {
            await SyncAlertsAsync(cancellationToken);

            var query = _db.InventoryNotifications
                .AsNoTracking()
                .Include(n => n.Part)
                .OrderBy(n => n.IsRead)
                .ThenByDescending(n => n.CreatedAt)
                .AsQueryable();

            if (limit.HasValue && limit.Value > 0)
            {
                query = query.Take(limit.Value);
            }

            var rows = await query.ToListAsync(cancellationToken);
            return rows.Select(MapDto).ToList();
        }

        public async Task<int> GetUnreadCountAsync(CancellationToken cancellationToken = default)
        {
            await SyncAlertsAsync(cancellationToken);
            return await _db.InventoryNotifications.CountAsync(n => !n.IsRead, cancellationToken);
        }

        public async Task<bool> MarkAsReadAsync(int id, CancellationToken cancellationToken = default)
        {
            var row = await _db.InventoryNotifications.FindAsync([id], cancellationToken);
            if (row == null) return false;
            row.IsRead = true;
            await _db.SaveChangesAsync(cancellationToken);
            return true;
        }

        public async Task MarkAllAsReadAsync(CancellationToken cancellationToken = default)
        {
            await _db.InventoryNotifications
                .Where(n => !n.IsRead)
                .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true), cancellationToken);
        }

        private async Task MarkPartAlertsResolvedAsync(int partId, CancellationToken cancellationToken)
        {
            await _db.InventoryNotifications
                .Where(n => n.PartId == partId && !n.IsRead)
                .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true), cancellationToken);
        }

        private static InventoryNotificationDto MapDto(InventoryNotification n)
        {
            var part = n.Part;
            var partNumber = part != null && !string.IsNullOrWhiteSpace(part.PartNumber)
                ? part.PartNumber
                : $"P-{n.PartId:D4}";
            var threshold = part?.CriticalStockLevel > 0 ? part!.CriticalStockLevel : DefaultCriticalStockLevel;

            return new InventoryNotificationDto
            {
                Id = n.Id,
                PartId = n.PartId,
                PartNumber = partNumber,
                PartName = part?.Name ?? "Unknown Part",
                StockQuantity = part?.Quantity ?? 0,
                CriticalStockLevel = threshold,
                Message = n.Message,
                Severity = n.Severity,
                IsRead = n.IsRead,
                CreatedAt = n.CreatedAt,
            };
        }
    }
}
