using VehiclePartsManagementSystem.Application.DTOs;

namespace VehiclePartsManagementSystem.Application.Interfaces
{
    public interface ICommunityReviewService
    {
        Task<CommunityReviewsFeedDto> GetApprovedFeedAsync(CancellationToken cancellationToken = default);
        Task<List<CommunityReviewDto>> GetAllAsync(CancellationToken cancellationToken = default);
        Task<CommunityReviewDto> CreateAsync(int customerId, CreateCommunityReviewDto dto, CancellationToken cancellationToken = default);
        Task<CommunityReviewDto?> UpdateStatusAsync(int id, string status, CancellationToken cancellationToken = default);
    }
}
