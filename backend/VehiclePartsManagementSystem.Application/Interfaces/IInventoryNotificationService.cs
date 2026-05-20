using VehiclePartsManagementSystem.Application.DTOs;

namespace VehiclePartsManagementSystem.Application.Interfaces
{
    public interface IInventoryNotificationService
    {
        Task<int> SyncAlertsAsync(CancellationToken cancellationToken = default);
        Task<IReadOnlyList<InventoryNotificationDto>> GetNotificationsAsync(int? limit, CancellationToken cancellationToken = default);
        Task<int> GetUnreadCountAsync(CancellationToken cancellationToken = default);
        Task<bool> MarkAsReadAsync(int id, CancellationToken cancellationToken = default);
        Task MarkAllAsReadAsync(CancellationToken cancellationToken = default);
    }
}
