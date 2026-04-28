using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Domain.Entities;

namespace VehiclePartsManagementSystem.Application.Interfaces
{
    public interface ICustomerService
    {
        Task<List<Customer>> GetAllAsync();
        Task<List<Customer>> SearchByNameAsync(string name);
        Task<Customer> CreateAsync(CustomerDto dto);
    }
}
