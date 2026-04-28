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
                .OrderByDescending(p => p.Id)
                .ToListAsync();

            return parts.Select(MapToResponseDto).ToList();
        }

        public async Task<PartResponseDto?> GetPartByIdAsync(int id)
        {
            var part = await _db.Parts.FindAsync(id);
            return part == null ? null : MapToResponseDto(part);
        }

        public async Task<PartResponseDto> CreatePartAsync(CreatePartDto dto)
        {
            var part = new Part
            {
                Name = dto.Name,
                Description = dto.Description,
                Price = dto.Price,
                Quantity = dto.Quantity,
                CreatedAt = DateTime.UtcNow
            };

            await _db.Parts.AddAsync(part);
            await _db.SaveChangesAsync();

            return MapToResponseDto(part);
        }

        public async Task<bool> DeletePartAsync(int id)
        {
            var part = await _db.Parts.FindAsync(id);
            if (part == null) return false;

            _db.Parts.Remove(part);
            await _db.SaveChangesAsync();
            return true;
        }

        private static PartResponseDto MapToResponseDto(Part part)
        {
            return new PartResponseDto
            {
                Id = part.Id,
                Name = part.Name,
                Description = part.Description,
                Price = part.Price,
                Quantity = part.Quantity,
                CreatedAt = part.CreatedAt
            };
        }
    }
}

