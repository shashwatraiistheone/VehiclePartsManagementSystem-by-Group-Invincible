using Microsoft.EntityFrameworkCore;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;
using VehiclePartsManagementSystem.Domain.Entities;
using VehiclePartsManagementSystem.Infrastructure.Data;

namespace VehiclePartsManagementSystem.Infrastructure.Services
{
    public class CustomerVehicleService : ICustomerVehicleService
    {
        private readonly AppDbContext _db;

        public CustomerVehicleService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<List<VehicleDto>> GetByCustomerIdAsync(int customerId, CancellationToken cancellationToken = default)
        {
            return await _db.CustomerVehicles
                .AsNoTracking()
                .Where(v => v.CustomerId == customerId)
                .OrderBy(v => v.VehicleNumber)
                .Select(v => Map(v))
                .ToListAsync(cancellationToken);
        }

        public async Task<VehicleDto?> AddAsync(int customerId, VehicleInputDto dto, CancellationToken cancellationToken = default)
        {
            if (!await _db.Customers.AnyAsync(c => c.Id == customerId, cancellationToken))
            {
                return null;
            }

            ValidateVehicle(dto);
            await EnsureUniqueVehicleNumberAsync(customerId, dto.VehicleNumber, excludeVehicleId: null, cancellationToken);
            var entity = ToEntity(customerId, dto);
            await _db.CustomerVehicles.AddAsync(entity, cancellationToken);
            await _db.SaveChangesAsync(cancellationToken);
            return Map(entity);
        }

        public async Task<VehicleDto?> UpdateAsync(int customerId, int vehicleId, VehicleInputDto dto, CancellationToken cancellationToken = default)
        {
            var entity = await _db.CustomerVehicles
                .FirstOrDefaultAsync(v => v.Id == vehicleId && v.CustomerId == customerId, cancellationToken);
            if (entity == null)
            {
                return null;
            }

            ValidateVehicle(dto);
            await EnsureUniqueVehicleNumberAsync(customerId, dto.VehicleNumber, vehicleId, cancellationToken);
            entity.VehicleNumber = dto.VehicleNumber.Trim().ToUpperInvariant();
            entity.Brand = dto.Brand.Trim();
            entity.Model = dto.Model.Trim();
            entity.Year = dto.Year;
            entity.Mileage = dto.Mileage;
            entity.Vin = string.IsNullOrWhiteSpace(dto.Vin) ? null : dto.Vin.Trim().ToUpperInvariant();
            entity.Notes = string.IsNullOrWhiteSpace(dto.Notes) ? null : dto.Notes.Trim();
            await _db.SaveChangesAsync(cancellationToken);
            return Map(entity);
        }

        public async Task<bool> DeleteAsync(int customerId, int vehicleId, CancellationToken cancellationToken = default)
        {
            var entity = await _db.CustomerVehicles
                .FirstOrDefaultAsync(v => v.Id == vehicleId && v.CustomerId == customerId, cancellationToken);
            if (entity == null)
            {
                return false;
            }

            _db.CustomerVehicles.Remove(entity);
            await _db.SaveChangesAsync(cancellationToken);
            return true;
        }

        public async Task<List<string>> SearchVehicleNumbersAsync(
            string? query,
            int limit = 15,
            CancellationToken cancellationToken = default)
        {
            var q = _db.CustomerVehicles.AsNoTracking();
            if (!string.IsNullOrWhiteSpace(query))
            {
                var term = query.Trim().ToUpperInvariant();
                q = q.Where(v => EF.Functions.ILike(v.VehicleNumber, $"%{term}%"));
            }

            return await q
                .Select(v => v.VehicleNumber)
                .Distinct()
                .OrderBy(n => n)
                .Take(limit)
                .ToListAsync(cancellationToken);
        }

        internal static VehicleDto Map(CustomerVehicle v) => new()
        {
            Id = v.Id,
            CustomerId = v.CustomerId,
            VehicleNumber = v.VehicleNumber,
            Brand = v.Brand,
            Model = v.Model,
            Year = v.Year,
            Mileage = v.Mileage,
            Vin = v.Vin,
            Notes = v.Notes,
        };

        internal static CustomerVehicle ToEntity(int customerId, VehicleInputDto dto) => new()
        {
            CustomerId = customerId,
            VehicleNumber = dto.VehicleNumber.Trim().ToUpperInvariant(),
            Brand = dto.Brand.Trim(),
            Model = dto.Model.Trim(),
            Year = dto.Year,
            Mileage = dto.Mileage,
            Vin = string.IsNullOrWhiteSpace(dto.Vin) ? null : dto.Vin.Trim().ToUpperInvariant(),
            Notes = string.IsNullOrWhiteSpace(dto.Notes) ? null : dto.Notes.Trim(),
        };

        internal static async Task EnsureGlobalUniqueVehicleNumberAsync(
            AppDbContext db,
            string vehicleNumber,
            CancellationToken cancellationToken)
        {
            var normalized = vehicleNumber.Trim().ToUpperInvariant();
            var exists = await db.CustomerVehicles.AnyAsync(
                v => v.VehicleNumber == normalized,
                cancellationToken);
            if (exists)
            {
                throw new InvalidOperationException("This vehicle number is already registered.");
            }
        }

        private async Task EnsureUniqueVehicleNumberAsync(
            int customerId,
            string vehicleNumber,
            int? excludeVehicleId,
            CancellationToken cancellationToken)
        {
            var normalized = vehicleNumber.Trim().ToUpperInvariant();
            var duplicate = await _db.CustomerVehicles.AnyAsync(
                v => v.CustomerId == customerId
                    && v.VehicleNumber == normalized
                    && (excludeVehicleId == null || v.Id != excludeVehicleId),
                cancellationToken);

            if (duplicate)
            {
                throw new InvalidOperationException("This vehicle number is already registered on your account.");
            }
        }

        internal static void ValidateVehicle(VehicleInputDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.VehicleNumber))
            {
                throw new InvalidOperationException("Vehicle number is required.");
            }

            if (string.IsNullOrWhiteSpace(dto.Brand) || string.IsNullOrWhiteSpace(dto.Model))
            {
                throw new InvalidOperationException("Brand and model are required.");
            }

            if (dto.Year < 1900 || dto.Year > DateTime.UtcNow.Year + 1)
            {
                throw new InvalidOperationException("Invalid vehicle year.");
            }

            if (dto.Mileage < 0)
            {
                throw new InvalidOperationException("Mileage cannot be negative.");
            }
        }
    }
}
