using Microsoft.EntityFrameworkCore;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;
using VehiclePartsManagementSystem.Domain.Entities;
using VehiclePartsManagementSystem.Infrastructure.Data;

namespace VehiclePartsManagementSystem.Infrastructure.Services
{
    public class CommunityReviewService : ICommunityReviewService
    {
        private static readonly HashSet<string> AllowedStatuses = new(StringComparer.OrdinalIgnoreCase)
        {
            "Pending", "Approved", "Rejected",
        };

        private readonly AppDbContext _db;

        public CommunityReviewService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<CommunityReviewsFeedDto> GetApprovedFeedAsync(CancellationToken cancellationToken = default)
        {
            var approved = await _db.CommunityReviews
                .AsNoTracking()
                .Where(r => r.Status == "Approved")
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync(cancellationToken);

            var reviews = approved.Select(Map).ToList();
            return new CommunityReviewsFeedDto
            {
                Reviews = reviews,
                Stats = BuildStats(approved),
            };
        }

        public async Task<List<CommunityReviewDto>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            return await _db.CommunityReviews
                .AsNoTracking()
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => Map(r))
                .ToListAsync(cancellationToken);
        }

        public async Task<CommunityReviewDto> CreateAsync(
            int customerId,
            CreateCommunityReviewDto dto,
            CancellationToken cancellationToken = default)
        {
            var customer = await _db.Customers.AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == customerId, cancellationToken);
            if (customer == null)
            {
                throw new InvalidOperationException("Customer not found.");
            }

            if (dto.Rating < 1 || dto.Rating > 5)
            {
                throw new InvalidOperationException("Rating must be between 1 and 5.");
            }

            var startOfUtcDay = DateTime.UtcNow.Date;
            var alreadySubmittedToday = await _db.CommunityReviews
                .AnyAsync(
                    r => r.CustomerId == customerId && r.CreatedAt >= startOfUtcDay,
                    cancellationToken);
            if (alreadySubmittedToday)
            {
                throw new InvalidOperationException("You have already submitted a review today.");
            }

            var entity = new CommunityReview
            {
                CustomerId = customerId,
                CustomerName = FormatDisplayName(customer.Name),
                Rating = dto.Rating,
                ReviewText = dto.ReviewText.Trim(),
                Status = "Pending",
                CreatedAt = DateTime.UtcNow,
            };

            await _db.CommunityReviews.AddAsync(entity, cancellationToken);
            await _db.SaveChangesAsync(cancellationToken);
            return Map(entity);
        }

        public async Task<CommunityReviewDto?> UpdateStatusAsync(
            int id,
            string status,
            CancellationToken cancellationToken = default)
        {
            if (!AllowedStatuses.Contains(status))
            {
                throw new InvalidOperationException("Status must be Pending, Approved, or Rejected.");
            }

            var entity = await _db.CommunityReviews.FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
            if (entity == null)
            {
                return null;
            }

            entity.Status = status;
            await _db.SaveChangesAsync(cancellationToken);
            return Map(entity);
        }

        internal static CommunityReviewStatsDto BuildStats(IReadOnlyList<CommunityReview> approved)
        {
            if (approved.Count == 0)
            {
                return new CommunityReviewStatsDto();
            }

            var total = approved.Count;
            var sum = approved.Sum(r => r.Rating);
            var fiveStar = approved.Count(r => r.Rating == 5);
            return new CommunityReviewStatsDto
            {
                TotalReviews = total,
                AverageRating = Math.Round(sum / (double)total, 1),
                FiveStarPercentage = (int)Math.Round(fiveStar * 100.0 / total),
            };
        }

        internal static string FormatDisplayName(string fullName)
        {
            var parts = fullName.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length == 0) return "Customer";
            if (parts.Length == 1) return parts[0];
            return $"{parts[0]} {parts[^1][0]}.";
        }

        private static CommunityReviewDto Map(CommunityReview r) => new()
        {
            Id = r.Id,
            CustomerId = r.CustomerId,
            CustomerName = r.CustomerName,
            Rating = r.Rating,
            ReviewText = r.ReviewText,
            Status = r.Status,
            CreatedAt = r.CreatedAt,
        };
    }
}
