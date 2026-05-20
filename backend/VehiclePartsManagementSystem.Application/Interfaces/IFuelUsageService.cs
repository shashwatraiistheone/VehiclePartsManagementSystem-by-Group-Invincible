using VehiclePartsManagementSystem.Application.DTOs;

namespace VehiclePartsManagementSystem.Application.Interfaces
{
    public interface IFuelUsageService
    {
        Task<FuelUsageAnalyticsDto> GetAnalyticsAsync(int customerId, CancellationToken cancellationToken = default);
        Task<List<FuelUsageLogDto>> GetByCustomerIdAsync(int customerId, CancellationToken cancellationToken = default);
        Task<FuelUsageLogDto> CreateAsync(int customerId, CreateFuelUsageLogDto dto, CancellationToken cancellationToken = default);
        Task<FuelUsageLogDto> UpdateUsageAsync(int customerId, UpdateVehicleUsageDto dto, CancellationToken cancellationToken = default);
    }
}
