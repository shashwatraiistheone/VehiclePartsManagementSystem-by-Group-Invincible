using VehiclePartsManagementSystem.Application.DTOs;

namespace VehiclePartsManagementSystem.Application.Interfaces
{
    public interface IStaffService
    {
        Task<IReadOnlyList<StaffResponseDto>> GetAllAsync(CancellationToken cancellationToken = default);
        Task<StaffResponseDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
        Task<StaffResponseDto> RegisterAsync(RegisterStaffDto dto, CancellationToken cancellationToken = default);
        Task<StaffResponseDto?> UpdateAsync(int id, UpdateStaffDto dto, CancellationToken cancellationToken = default);
        Task<bool> DeactivateAsync(int id, CancellationToken cancellationToken = default);
        Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);
        Task<AuthResponseDto> LoginAsync(LoginDto dto, CancellationToken cancellationToken = default);

        Task ChangePasswordAsync(int id, ChangeCustomerPasswordDto dto, CancellationToken cancellationToken = default);
    }
}
