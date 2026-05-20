using VehiclePartsManagementSystem.Application.DTOs;

namespace VehiclePartsManagementSystem.Application.Interfaces
{
    public interface IPartRequestService
    {
        Task<List<PartRequestDto>> GetAllAsync(CancellationToken cancellationToken = default);

        Task<PartRequestDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
        Task<List<PartRequestDto>> GetByCustomerIdAsync(int customerId, CancellationToken cancellationToken = default);
        Task<PartRequestDto> CreateAsync(int customerId, CreatePartRequestDto dto, CancellationToken cancellationToken = default);
        Task<PartRequestDto?> UpdateStatusAsync(
            int id,
            UpdatePartRequestStatusDto dto,
            int? actingStaffId = null,
            CancellationToken cancellationToken = default);
        Task<bool> DeleteAsync(int id, int? customerId, bool isStaffOrAdmin, CancellationToken cancellationToken = default);
    }
}
