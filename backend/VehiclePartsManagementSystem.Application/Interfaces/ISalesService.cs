using System.Collections.Generic;
using System.Threading.Tasks;
using VehiclePartsManagementSystem.Application.DTOs;

namespace VehiclePartsManagementSystem.Application.Interfaces
{
    public interface ISalesService
    {
        Task<SaleResponseDto> CreateSaleAsync(CreateSaleDto dto);
        Task<List<SaleResponseDto>> GetAllSalesAsync();
        Task<SaleResponseDto?> GetSaleByIdAsync(int saleId);
        Task SendInvoiceEmailAsync(int saleId, string? customEmail);
    }
}
