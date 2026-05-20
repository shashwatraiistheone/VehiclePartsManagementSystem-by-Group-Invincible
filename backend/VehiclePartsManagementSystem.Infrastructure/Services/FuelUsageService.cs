using Microsoft.EntityFrameworkCore;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;
using VehiclePartsManagementSystem.Domain.Entities;
using VehiclePartsManagementSystem.Infrastructure.Data;

namespace VehiclePartsManagementSystem.Infrastructure.Services
{
    public class FuelUsageService : IFuelUsageService
    {
        private const int MinLogsForAi = 1;

        private readonly AppDbContext _db;

        public FuelUsageService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<FuelUsageAnalyticsDto> GetAnalyticsAsync(int customerId, CancellationToken cancellationToken = default)
        {
            var logs = await _db.FuelUsageLogs
                .AsNoTracking()
                .Include(l => l.Vehicle)
                .Where(l => l.CustomerId == customerId)
                .OrderByDescending(l => l.LogDate)
                .ThenByDescending(l => l.Id)
                .ToListAsync(cancellationToken);

            var latest = logs.FirstOrDefault();
            var recent = logs.Take(5).Select(Map).ToList();

            return new FuelUsageAnalyticsDto
            {
                LatestOdometerKm = latest?.OdometerKm ?? 0,
                LatestOdometerMiles = latest != null ? KmToMiles(latest.OdometerKm) : 0,
                TotalLogCount = logs.Count,
                HasSufficientData = logs.Count >= MinLogsForAi,
                LastLogDate = latest?.LogDate,
                AvgMpg = CalculateAvgMpg(logs),
                RecentLogs = recent,
            };
        }

        public async Task<List<FuelUsageLogDto>> GetByCustomerIdAsync(int customerId, CancellationToken cancellationToken = default)
        {
            return await _db.FuelUsageLogs
                .AsNoTracking()
                .Include(l => l.Vehicle)
                .Where(l => l.CustomerId == customerId)
                .OrderByDescending(l => l.LogDate)
                .Select(l => Map(l))
                .ToListAsync(cancellationToken);
        }

        public async Task<FuelUsageLogDto> CreateAsync(int customerId, CreateFuelUsageLogDto dto, CancellationToken cancellationToken = default)
        {
            var vehicle = await _db.CustomerVehicles
                .FirstOrDefaultAsync(v => v.Id == dto.VehicleId && v.CustomerId == customerId, cancellationToken);
            if (vehicle == null)
            {
                throw new InvalidOperationException("Vehicle not found.");
            }

            if (dto.OdometerKm < 0)
            {
                throw new InvalidOperationException("Odometer reading must be positive.");
            }

            var logDate = dto.LogDate.HasValue
                ? DateTime.SpecifyKind(dto.LogDate.Value.ToUniversalTime(), DateTimeKind.Utc)
                : DateTime.UtcNow;

            var entity = new FuelUsageLog
            {
                CustomerId = customerId,
                VehicleId = dto.VehicleId,
                OdometerKm = dto.OdometerKm,
                FuelAmountLiters = dto.FuelAmountLiters,
                FuelType = string.IsNullOrWhiteSpace(dto.FuelType) ? "Petrol" : dto.FuelType.Trim(),
                FuelCost = dto.FuelCost,
                LogDate = logDate,
                Notes = string.IsNullOrWhiteSpace(dto.Notes) ? null : dto.Notes.Trim(),
                CreatedAt = DateTime.UtcNow,
            };

            if (dto.OdometerKm > vehicle.Mileage)
            {
                vehicle.Mileage = dto.OdometerKm;
            }

            await _db.FuelUsageLogs.AddAsync(entity, cancellationToken);
            await _db.SaveChangesAsync(cancellationToken);
            await _db.Entry(entity).Reference(e => e.Vehicle).LoadAsync(cancellationToken);
            return Map(entity);
        }

        public async Task<FuelUsageLogDto> UpdateUsageAsync(
            int customerId,
            UpdateVehicleUsageDto dto,
            CancellationToken cancellationToken = default)
        {
            var vehicle = await _db.CustomerVehicles
                .FirstOrDefaultAsync(v => v.Id == dto.VehicleId && v.CustomerId == customerId, cancellationToken);
            if (vehicle == null)
            {
                throw new InvalidOperationException("Vehicle not found.");
            }

            var lastLogKm = await _db.FuelUsageLogs
                .Where(l => l.VehicleId == dto.VehicleId && l.CustomerId == customerId)
                .Select(l => (int?)l.OdometerKm)
                .MaxAsync(cancellationToken) ?? 0;

            var minKm = Math.Max(vehicle.Mileage, lastLogKm);
            if (dto.OdometerKm < minKm)
            {
                throw new InvalidOperationException(
                    $"Odometer cannot be less than {KmToMiles(minKm):N0} miles ({minKm:N0} km).");
            }

            vehicle.Mileage = dto.OdometerKm;
            if (!string.IsNullOrWhiteSpace(dto.ConditionNotes))
            {
                vehicle.Notes = dto.ConditionNotes.Trim();
            }

            var entity = new FuelUsageLog
            {
                CustomerId = customerId,
                VehicleId = dto.VehicleId,
                OdometerKm = dto.OdometerKm,
                FuelAmountLiters = 0,
                FuelType = "UsageUpdate",
                FuelCost = 0,
                LogDate = DateTime.UtcNow,
                Notes = string.IsNullOrWhiteSpace(dto.ConditionNotes) ? null : dto.ConditionNotes.Trim(),
                CreatedAt = DateTime.UtcNow,
            };

            await _db.FuelUsageLogs.AddAsync(entity, cancellationToken);
            await _db.SaveChangesAsync(cancellationToken);
            await _db.Entry(entity).Reference(e => e.Vehicle).LoadAsync(cancellationToken);
            return Map(entity);
        }

        private static decimal? CalculateAvgMpg(List<FuelUsageLog> logs)
        {
            if (logs.Count < 2) return null;

            var ordered = logs.OrderBy(l => l.OdometerKm).ThenBy(l => l.LogDate).ToList();
            var oldest = ordered.First();
            var newest = ordered.Last();
            var kmDriven = newest.OdometerKm - oldest.OdometerKm;
            if (kmDriven <= 0) return null;

            var totalLiters = ordered.Skip(1).Sum(l => l.FuelAmountLiters);
            if (totalLiters <= 0) return null;

            var miles = kmDriven * 0.621371m;
            var gallons = totalLiters * 0.264172m;
            if (gallons <= 0) return null;

            return Math.Round(miles / gallons, 1);
        }

        private static FuelUsageLogDto Map(FuelUsageLog l) => new()
        {
            Id = l.Id,
            CustomerId = l.CustomerId,
            VehicleId = l.VehicleId,
            VehicleNumber = l.Vehicle?.VehicleNumber ?? string.Empty,
            OdometerKm = l.OdometerKm,
            OdometerMiles = KmToMiles(l.OdometerKm),
            FuelAmountLiters = l.FuelAmountLiters,
            FuelType = l.FuelType,
            FuelCost = l.FuelCost,
            LogDate = l.LogDate,
            Notes = l.Notes,
            CreatedAt = l.CreatedAt,
        };

        private static int KmToMiles(int km) => (int)Math.Round(km * 0.621371);
    }
}
