using Microsoft.EntityFrameworkCore;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;
using VehiclePartsManagementSystem.Domain.Entities;
using VehiclePartsManagementSystem.Infrastructure.Data;

namespace VehiclePartsManagementSystem.Infrastructure.Services
{
    public class ReviewService : IReviewService
    {
        private static readonly HashSet<string> AllowedStatuses = new(StringComparer.OrdinalIgnoreCase)
        {
            "Pending", "Approved", "Rejected",
        };

        private readonly AppDbContext _db;

        public ReviewService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<List<ReviewDto>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            return await _db.Reviews
                .AsNoTracking()
                .Include(r => r.Customer)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => Map(r))
                .ToListAsync(cancellationToken);
        }

        public async Task<List<ReviewDto>> GetApprovedAsync(CancellationToken cancellationToken = default)
        {
            return await _db.Reviews
                .AsNoTracking()
                .Include(r => r.Customer)
                .Where(r => r.Status == "Approved")
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => Map(r))
                .ToListAsync(cancellationToken);
        }

        public async Task<List<ReviewDto>> GetByCustomerIdAsync(int customerId, CancellationToken cancellationToken = default)
        {
            return await _db.Reviews
                .AsNoTracking()
                .Include(r => r.Customer)
                .Where(r => r.CustomerId == customerId)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => Map(r))
                .ToListAsync(cancellationToken);
        }

        public async Task<ReviewDto> CreateAsync(int customerId, CreateReviewDto dto, CancellationToken cancellationToken = default)
        {
            if (!await _db.Customers.AnyAsync(c => c.Id == customerId, cancellationToken))
            {
                throw new InvalidOperationException("Customer not found.");
            }

            if (dto.Rating < 1 || dto.Rating > 5)
            {
                throw new InvalidOperationException("Rating must be between 1 and 5.");
            }

            var entity = new Review
            {
                CustomerId = customerId,
                Rating = dto.Rating,
                Title = string.IsNullOrWhiteSpace(dto.Title) ? null : dto.Title.Trim(),
                Comment = dto.Comment.Trim(),
                ServiceType = string.IsNullOrWhiteSpace(dto.ServiceType) ? "General Service" : dto.ServiceType.Trim(),
                Status = "Pending",
                CreatedAt = DateTime.UtcNow,
            };

            await _db.Reviews.AddAsync(entity, cancellationToken);
            await _db.SaveChangesAsync(cancellationToken);
            await _db.Entry(entity).Reference(r => r.Customer).LoadAsync(cancellationToken);
            return Map(entity);
        }

        public async Task<ReviewDto?> UpdateStatusAsync(int reviewId, string status, CancellationToken cancellationToken = default)
        {
            if (!AllowedStatuses.Contains(status))
            {
                throw new InvalidOperationException("Status must be Pending, Approved, or Rejected.");
            }

            var entity = await _db.Reviews
                .Include(r => r.Customer)
                .FirstOrDefaultAsync(r => r.Id == reviewId, cancellationToken);

            if (entity == null)
            {
                return null;
            }

            entity.Status = status;
            await _db.SaveChangesAsync(cancellationToken);
            return Map(entity);
        }

        private static ReviewDto Map(Review r) => new()
        {
            Id = r.Id,
            CustomerId = r.CustomerId,
            CustomerName = r.Customer?.Name ?? string.Empty,
            Rating = r.Rating,
            Title = r.Title,
            Comment = r.Comment,
            ServiceType = r.ServiceType,
            Status = string.IsNullOrWhiteSpace(r.Status) ? "Pending" : r.Status,
            CreatedAt = r.CreatedAt,
        };
    }
}
