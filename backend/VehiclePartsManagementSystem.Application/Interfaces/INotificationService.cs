using VehiclePartsManagementSystem.Domain.Entities;

namespace VehiclePartsManagementSystem.Application.Interfaces
{
    public interface INotificationService
    {
        Task<IReadOnlyList<Notification>> SyncAndGetNotificationsAsync(CancellationToken cancellationToken = default);
        Task<bool> MarkAsReadAsync(int id, CancellationToken cancellationToken = default);
        Task MarkAllAsReadAsync(CancellationToken cancellationToken = default);
    }
}
