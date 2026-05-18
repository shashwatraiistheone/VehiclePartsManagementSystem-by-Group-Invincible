using VehiclePartsManagementSystem.Application.DTOs;

namespace VehiclePartsManagementSystem.Application.Interfaces
{
    public interface IVendorService
    {
        Task<IReadOnlyList<VendorResponseDto>> GetAllAsync(CancellationToken cancellationToken = default);
        Task<VendorResponseDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
        Task<VendorResponseDto> CreateAsync(CreateVendorDto dto, CancellationToken cancellationToken = default);
        Task<VendorResponseDto?> UpdateAsync(int id, UpdateVendorDto dto, CancellationToken cancellationToken = default);
        Task DeleteAsync(int id, CancellationToken cancellationToken = default);
    }
}
