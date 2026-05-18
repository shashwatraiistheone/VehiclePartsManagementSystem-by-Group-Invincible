using VehiclePartsManagementSystem.Domain.Entities;

namespace VehiclePartsManagementSystem.Application.Interfaces
{
    public interface IStaffRepository
    {
        Task<IReadOnlyList<Staff>> GetAllAsync(CancellationToken cancellationToken = default);
        Task<Staff?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
        Task<Staff?> GetByEmailAsync(string normalizedEmail, CancellationToken cancellationToken = default);
        Task<Staff> AddAsync(Staff staff, CancellationToken cancellationToken = default);
        Task UpdateAsync(Staff staff, CancellationToken cancellationToken = default);
        Task DeleteAsync(Staff staff, CancellationToken cancellationToken = default);
        Task<bool> EmailExistsAsync(string normalizedEmail, int? excludeId = null, CancellationToken cancellationToken = default);
    }
}
