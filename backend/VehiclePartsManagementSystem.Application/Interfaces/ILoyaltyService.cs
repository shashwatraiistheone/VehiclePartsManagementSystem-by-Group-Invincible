using VehiclePartsManagementSystem.Application.DTOs;

namespace VehiclePartsManagementSystem.Application.Interfaces
{
    public interface ILoyaltyService
    {
        Task<CustomerLoyaltyDto?> GetCustomerLoyaltyAsync(int customerId, CancellationToken cancellationToken = default);

        Task<LoyaltyProgramSummaryDto> GetProgramSummaryAsync(CancellationToken cancellationToken = default);
    }
}
