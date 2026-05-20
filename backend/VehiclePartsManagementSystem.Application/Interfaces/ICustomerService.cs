using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Domain.Entities;

namespace VehiclePartsManagementSystem.Application.Interfaces
{
    public interface ICustomerService
    {
        Task<List<CustomerSearchResultDto>> GetAllAsync(CancellationToken cancellationToken = default);
        Task<List<Customer>> SearchByNameAsync(string name);
        Task<List<CustomerSearchResultDto>> SearchAsync(string? query, CancellationToken cancellationToken = default);
        Task<CustomerDetailDto?> GetDetailAsync(int id, CancellationToken cancellationToken = default);
        Task<Customer> CreateAsync(CustomerDto dto);
        Task<CustomerDetailDto> CreateWithVehiclesAsync(CreateCustomerWithVehiclesDto dto, CancellationToken cancellationToken = default);
        Task<CustomerDetailDto?> UpdateProfileAsync(int id, UpdateCustomerProfileDto dto, CancellationToken cancellationToken = default);
        Task ChangePasswordAsync(int id, ChangeCustomerPasswordDto dto, CancellationToken cancellationToken = default);
        Task<List<CustomerNotificationDto>> GetNotificationsAsync(int customerId, CancellationToken cancellationToken = default);
        Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);

        Task<AuthResponseDto> RegisterAsync(RegisterCustomerDto dto, CancellationToken cancellationToken = default);
        Task<AuthResponseDto> LoginAsync(LoginDto dto, CancellationToken cancellationToken = default);
    }
}
