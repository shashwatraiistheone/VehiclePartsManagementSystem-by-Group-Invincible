using Microsoft.EntityFrameworkCore;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;
using VehiclePartsManagementSystem.Domain.Entities;
using VehiclePartsManagementSystem.Infrastructure.Data;

namespace VehiclePartsManagementSystem.Infrastructure.Services
{
    public class PartService : IPartService
    {
        private readonly AppDbContext _db;

        public PartService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<List<PartResponseDto>> GetAllPartsAsync()
        {
            var parts = await _db.Parts
                .AsNoTracking()
                .Include(p => p.Vendor)
                .OrderByDescending(p => p.Id)
                .ToListAsync();

            return parts.Select(MapToResponseDto).ToList();
        }

        public async Task<PartResponseDto?> GetPartByIdAsync(int id)
        {
            var part = await _db.Parts
                .AsNoTracking()
                .Include(p => p.Vendor)
                .FirstOrDefaultAsync(p => p.Id == id);

            return part == null ? null : MapToResponseDto(part);
        }

        public async Task<PartResponseDto> CreatePartAsync(CreatePartDto dto)
        {
            var part = new Part
            {
                Name = dto.Name.Trim(),
                PartNumber = ResolvePartNumber(dto.PartNumber, 0),
                Category = string.IsNullOrWhiteSpace(dto.Category) ? "General" : dto.Category.Trim(),
                Description = dto.Description?.Trim() ?? string.Empty,
                CostPrice = dto.CostPrice,
                Price = dto.SellingPrice,
                Quantity = dto.Quantity,
                CriticalStockLevel = dto.CriticalStockLevel > 0 ? dto.CriticalStockLevel : InventoryNotificationService.DefaultCriticalStockLevel,
                VendorId = dto.VendorId,
                IsActive = dto.IsActive,
                CreatedAt = DateTime.UtcNow,
            };

            await _db.Parts.AddAsync(part);
            await _db.SaveChangesAsync();

            await _db.Entry(part).Reference(p => p.Vendor).LoadAsync();
            return MapToResponseDto(part);
        }

        public async Task<PartResponseDto?> UpdatePartAsync(int id, UpdatePartDto dto)
        {
            var part = await _db.Parts.Include(p => p.Vendor).FirstOrDefaultAsync(p => p.Id == id);
            if (part == null)
            {
                return null;
            }

            part.Name = dto.Name.Trim();
            part.PartNumber = ResolvePartNumber(dto.PartNumber, part.Id);
            part.Category = string.IsNullOrWhiteSpace(dto.Category) ? part.Category : dto.Category.Trim();
            part.Description = dto.Description?.Trim() ?? string.Empty;
            part.CostPrice = dto.CostPrice;
            part.Price = dto.SellingPrice;
            part.Quantity = dto.Quantity;
            part.CriticalStockLevel = dto.CriticalStockLevel > 0
                ? dto.CriticalStockLevel
                : part.CriticalStockLevel;
            part.VendorId = dto.VendorId;
            if (dto.IsActive.HasValue)
            {
                part.IsActive = dto.IsActive.Value;
            }

            await _db.SaveChangesAsync();
            await _db.Entry(part).Reference(p => p.Vendor).LoadAsync();
            return MapToResponseDto(part);
        }

        public async Task<PartResponseDto?> DeactivatePartAsync(int id)
        {
            var part = await _db.Parts.Include(p => p.Vendor).FirstOrDefaultAsync(p => p.Id == id);
            if (part == null)
            {
                return null;
            }

            part.IsActive = false;
            await _db.SaveChangesAsync();
            return MapToResponseDto(part);
        }

        public async Task<bool> DeletePartAsync(int id)
        {
            var part = await _db.Parts.FindAsync(id);
            if (part == null)
            {
                return false;
            }

            if (await _db.SaleItems.AnyAsync(i => i.PartId == id))
            {
                throw new InvalidOperationException(
                    "Cannot delete this part because it is linked to existing sales. Deactivate it instead.");
            }

            if (await _db.PurchaseItems.AnyAsync(i => i.PartId == id))
            {
                throw new InvalidOperationException(
                    "Cannot delete this part because it is linked to purchase invoices. Deactivate it instead.");
            }

            _db.Parts.Remove(part);
            await _db.SaveChangesAsync();
            return true;
        }

        private static string ResolvePartNumber(string? partNumber, int id)
        {
            if (!string.IsNullOrWhiteSpace(partNumber))
            {
                return partNumber.Trim();
            }

            return id > 0 ? $"P-{id:D4}" : string.Empty;
        }

        private static PartResponseDto MapToResponseDto(Part part)
        {
            var partNumber = !string.IsNullOrWhiteSpace(part.PartNumber)
                ? part.PartNumber
                : $"P-{part.Id:D4}";

            var category = !string.IsNullOrWhiteSpace(part.Category)
                ? part.Category
                : ParseLegacyCategory(part.Description);

            return new PartResponseDto
            {
                Id = part.Id,
                PartNumber = partNumber,
                Name = part.Name,
                Category = category,
                Description = part.Description,
                CostPrice = part.CostPrice,
                SellingPrice = part.Price,
                Price = part.Price,
                Quantity = part.Quantity,
                CriticalStockLevel = part.CriticalStockLevel > 0 ? part.CriticalStockLevel : InventoryNotificationService.DefaultCriticalStockLevel,
                VendorId = part.VendorId,
                VendorName = part.Vendor?.Name ?? "—",
                IsActive = part.IsActive,
                Status = part.IsActive ? "Active" : "Inactive",
                CreatedAt = part.CreatedAt,
            };
        }

        private static string ParseLegacyCategory(string description)
        {
            var d = description?.Trim() ?? string.Empty;
            if (!d.Contains('|')) return "General";
            var i = d.IndexOf('|');
            return d[(i + 1)..].Trim();
        }
    }
}
