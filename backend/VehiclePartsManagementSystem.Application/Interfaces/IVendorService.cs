using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Domain.Entities;

namespace VehiclePartsManagementSystem.Application.Interfaces
{
    public interface IVendorService
    {
        Task<List<Vendor>> GetAllAsync();
        Task<Vendor> CreateAsync(VendorDto dto);
    }
}
