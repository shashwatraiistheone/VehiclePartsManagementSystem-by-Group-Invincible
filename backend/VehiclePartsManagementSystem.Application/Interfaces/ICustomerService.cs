using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Domain.Entities;

namespace VehiclePartsManagementSystem.Application.Interfaces
{
    public interface ICustomerService
    {
        Task<List<Customer>> GetAllAsync();
        Task<Customer> CreateAsync(CustomerDto dto);
    }
}
