using System.Collections.Generic;
using System.Threading.Tasks;
using VehiclePartsManagementSystem.Application.DTOs;

namespace VehiclePartsManagementSystem.Application.Interfaces
{
    public interface IPurchaseService
    {
        Task<PurchaseResponseDto> CreatePurchaseAsync(CreatePurchaseDto dto);
        Task<List<PurchaseResponseDto>> GetAllPurchasesAsync();
        Task<PurchaseResponseDto?> GetPurchaseByIdAsync(int id);
    }
}

