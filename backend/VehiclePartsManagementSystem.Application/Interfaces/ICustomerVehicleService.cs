using VehiclePartsManagementSystem.Application.DTOs;

namespace VehiclePartsManagementSystem.Application.Interfaces
{
    public interface ICustomerVehicleService
    {
        Task<List<VehicleDto>> GetByCustomerIdAsync(int customerId, CancellationToken cancellationToken = default);
        Task<VehicleDto?> AddAsync(int customerId, VehicleInputDto dto, CancellationToken cancellationToken = default);
        Task<VehicleDto?> UpdateAsync(int customerId, int vehicleId, VehicleInputDto dto, CancellationToken cancellationToken = default);
        Task<bool> DeleteAsync(int customerId, int vehicleId, CancellationToken cancellationToken = default);
        Task<List<string>> SearchVehicleNumbersAsync(string? query, int limit = 15, CancellationToken cancellationToken = default);
    }
}
