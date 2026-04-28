using System.Collections.Generic;
using System.Threading.Tasks;
using VehiclePartsManagementSystem.Application.DTOs;

namespace VehiclePartsManagementSystem.Application.Interfaces
{
    public interface IPartService
    {
        Task<List<PartResponseDto>> GetAllPartsAsync();
        Task<PartResponseDto?> GetPartByIdAsync(int id);
        Task<PartResponseDto> CreatePartAsync(CreatePartDto dto);
        Task<bool> DeletePartAsync(int id);
    }
}
