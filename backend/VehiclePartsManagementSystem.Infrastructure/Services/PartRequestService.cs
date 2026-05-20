using Microsoft.EntityFrameworkCore;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;
using VehiclePartsManagementSystem.Domain.Entities;
using VehiclePartsManagementSystem.Infrastructure.Data;

namespace VehiclePartsManagementSystem.Infrastructure.Services
{
    public class PartRequestService : IPartRequestService
    {
        public static readonly string[] AllowedStatuses =
            ["Pending", "Ordered", "Arrived", "Fulfilled", "Rejected"];

        private readonly AppDbContext _db;

        public PartRequestService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<List<PartRequestDto>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            var rows = await _db.PartRequests
                .AsNoTracking()
                .Include(p => p.Customer)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync(cancellationToken);

            return rows.Select(Map).ToList();
        }

        public async Task<PartRequestDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            var row = await _db.PartRequests
                .AsNoTracking()
                .Include(p => p.Customer)
                .Include(p => p.FulfilledByStaff)
                .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

            return row == null ? null : Map(row);
        }

        public async Task<List<PartRequestDto>> GetByCustomerIdAsync(int customerId, CancellationToken cancellationToken = default)
        {
            var rows = await _db.PartRequests
                .AsNoTracking()
                .Include(p => p.Customer)
                .Where(p => p.CustomerId == customerId)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync(cancellationToken);

            return rows.Select(Map).ToList();
        }

        public async Task<PartRequestDto> CreateAsync(int customerId, CreatePartRequestDto dto, CancellationToken cancellationToken = default)
        {
            if (!await _db.Customers.AnyAsync(c => c.Id == customerId, cancellationToken))
            {
                throw new InvalidOperationException("Customer not found.");
            }

            var partName = dto.PartName?.Trim() ?? string.Empty;
            if (partName.Length < 2)
            {
                throw new InvalidOperationException("Part name is required.");
            }

            if (dto.Quantity < 1)
            {
                throw new InvalidOperationException("Quantity must be at least 1.");
            }

            int? vehicleId = null;
            if (dto.VehicleId is > 0)
            {
                var vehicle = await _db.CustomerVehicles
                    .AsNoTracking()
                    .FirstOrDefaultAsync(
                        v => v.Id == dto.VehicleId.Value && v.CustomerId == customerId,
                        cancellationToken);
                if (vehicle == null)
                {
                    throw new InvalidOperationException("Selected vehicle was not found on your account.");
                }

                vehicleId = vehicle.Id;
            }

            var vehicleDetails = dto.VehicleDetails?.Trim() ?? string.Empty;
            if (vehicleId is > 0 && string.IsNullOrWhiteSpace(vehicleDetails))
            {
                var vehicle = await _db.CustomerVehicles.AsNoTracking()
                    .FirstAsync(v => v.Id == vehicleId.Value, cancellationToken);
                vehicleDetails = $"{vehicle.Brand} {vehicle.Model} ({vehicle.VehicleNumber})";
            }

            var entity = new PartRequest
            {
                CustomerId = customerId,
                VehicleId = vehicleId,
                PartName = partName,
                VehicleDetails = vehicleDetails,
                Description = dto.Description?.Trim() ?? string.Empty,
                Quantity = dto.Quantity,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow,
            };

            await _db.PartRequests.AddAsync(entity, cancellationToken);
            await _db.SaveChangesAsync(cancellationToken);

            await _db.Entry(entity).Reference(p => p.Customer).LoadAsync(cancellationToken);
            return Map(entity);
        }

        public async Task<PartRequestDto?> UpdateStatusAsync(
            int id,
            UpdatePartRequestStatusDto dto,
            int? actingStaffId = null,
            CancellationToken cancellationToken = default)
        {
            var status = dto.Status.Trim();
            if (!IsAllowedStatus(status))
            {
                throw new InvalidOperationException(
                    "Invalid status. Use Pending, Ordered, Arrived, Fulfilled, or Rejected.");
            }

            var entity = await _db.PartRequests
                .Include(p => p.Customer)
                .Include(p => p.FulfilledByStaff)
                .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

            if (entity == null)
            {
                return null;
            }

            entity.Status = status;
            if (dto.ResponseNotes != null)
            {
                entity.ResponseNotes = string.IsNullOrWhiteSpace(dto.ResponseNotes)
                    ? null
                    : dto.ResponseNotes.Trim();
            }

            if (string.Equals(status, "Fulfilled", StringComparison.OrdinalIgnoreCase))
            {
                entity.FulfilledAt = DateTime.UtcNow;
                entity.FulfilledByStaffId = actingStaffId;
            }
            else if (string.Equals(status, "Rejected", StringComparison.OrdinalIgnoreCase))
            {
                entity.FulfilledAt = null;
                entity.FulfilledByStaffId = actingStaffId;
            }

            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);
            return Map(entity);
        }

        public async Task<bool> DeleteAsync(int id, int? customerId, bool isStaffOrAdmin, CancellationToken cancellationToken = default)
        {
            var entity = await _db.PartRequests.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
            if (entity == null)
            {
                return false;
            }

            if (!isStaffOrAdmin)
            {
                if (customerId == null || entity.CustomerId != customerId.Value)
                {
                    throw new UnauthorizedAccessException("You can only delete your own requests.");
                }

                if (!string.Equals(entity.Status, "Pending", StringComparison.OrdinalIgnoreCase))
                {
                    throw new InvalidOperationException("Only pending requests can be cancelled.");
                }
            }

            _db.PartRequests.Remove(entity);
            await _db.SaveChangesAsync(cancellationToken);
            return true;
        }

        private static bool IsAllowedStatus(string status) =>
            AllowedStatuses.Contains(status, StringComparer.OrdinalIgnoreCase);

        private static PartRequestDto Map(PartRequest p) => new()
        {
            Id = p.Id,
            CustomerId = p.CustomerId,
            CustomerName = p.Customer?.Name ?? string.Empty,
            PartName = p.PartName,
            VehicleDetails = p.VehicleDetails,
            Description = p.Description,
            Quantity = p.Quantity > 0 ? p.Quantity : 1,
            ResponseNotes = p.ResponseNotes,
            Status = NormalizeStatus(p.Status),
            CreatedAt = p.CreatedAt,
            UpdatedAt = p.UpdatedAt,
            VehicleId = p.VehicleId,
            FulfilledAt = p.FulfilledAt,
            FulfilledByStaffId = p.FulfilledByStaffId,
            FulfilledByStaffName = p.FulfilledByStaff?.FullName,
        };

        private static string NormalizeStatus(string status)
        {
            if (string.Equals(status, "InReview", StringComparison.OrdinalIgnoreCase)) return "Pending";
            if (string.Equals(status, "Approved", StringComparison.OrdinalIgnoreCase)) return "Ordered";
            if (string.Equals(status, "Available", StringComparison.OrdinalIgnoreCase)) return "Fulfilled";
            return status;
        }
    }
}
