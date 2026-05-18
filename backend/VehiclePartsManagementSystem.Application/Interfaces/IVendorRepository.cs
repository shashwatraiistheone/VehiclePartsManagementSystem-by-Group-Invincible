using VehiclePartsManagementSystem.Domain.Entities;

namespace VehiclePartsManagementSystem.Application.Interfaces
{
    public interface IVendorRepository
    {
        Task<IReadOnlyList<Vendor>> GetAllAsync(CancellationToken cancellationToken = default);
        Task<Vendor?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
        Task<Vendor> AddAsync(Vendor vendor, CancellationToken cancellationToken = default);
        Task UpdateAsync(Vendor vendor, CancellationToken cancellationToken = default);
        Task DeleteAsync(Vendor vendor, CancellationToken cancellationToken = default);
        Task<bool> EmailExistsAsync(string normalizedEmail, int? excludeId = null, CancellationToken cancellationToken = default);
        Task<bool> HasLinkedPartsAsync(int vendorId, CancellationToken cancellationToken = default);
    }
}
