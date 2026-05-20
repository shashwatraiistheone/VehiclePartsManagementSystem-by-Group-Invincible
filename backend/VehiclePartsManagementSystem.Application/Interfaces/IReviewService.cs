using VehiclePartsManagementSystem.Application.DTOs;

namespace VehiclePartsManagementSystem.Application.Interfaces
{
    public interface IReviewService
    {
        Task<List<ReviewDto>> GetAllAsync(CancellationToken cancellationToken = default);
        Task<List<ReviewDto>> GetApprovedAsync(CancellationToken cancellationToken = default);
        Task<List<ReviewDto>> GetByCustomerIdAsync(int customerId, CancellationToken cancellationToken = default);
        Task<ReviewDto> CreateAsync(int customerId, CreateReviewDto dto, CancellationToken cancellationToken = default);
        Task<ReviewDto?> UpdateStatusAsync(int reviewId, string status, CancellationToken cancellationToken = default);
    }
}
