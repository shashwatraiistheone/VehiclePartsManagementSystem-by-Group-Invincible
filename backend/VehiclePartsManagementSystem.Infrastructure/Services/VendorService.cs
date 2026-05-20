using Microsoft.EntityFrameworkCore;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;
using VehiclePartsManagementSystem.Domain.Entities;
using VehiclePartsManagementSystem.Infrastructure.Data;

namespace VehiclePartsManagementSystem.Infrastructure.Services
{
    public class VendorService : IVendorService
    {
        private readonly IVendorRepository _vendorRepository;
        private readonly AppDbContext _db;

        public VendorService(IVendorRepository vendorRepository, AppDbContext db)
        {
            _vendorRepository = vendorRepository;
            _db = db;
        }

        public async Task<IReadOnlyList<VendorResponseDto>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            var rows = await _vendorRepository.GetAllAsync(cancellationToken);
            var totals = await GetPurchaseTotalsByVendorAsync(cancellationToken);
            return rows.Select(v => MapToDto(v, totals.GetValueOrDefault(v.Id))).ToList();
        }

        public async Task<VendorResponseDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            var vendor = await _vendorRepository.GetByIdAsync(id, cancellationToken);
            if (vendor == null)
            {
                return null;
            }

            var total = await _db.PurchaseInvoices
                .AsNoTracking()
                .Where(p => p.VendorId == id)
                .SumAsync(p => (decimal?)p.TotalAmount, cancellationToken) ?? 0m;

            return MapToDto(vendor, total);
        }

        public async Task<VendorResponseDto> CreateAsync(CreateVendorDto dto, CancellationToken cancellationToken = default)
        {
            var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
            if (await _vendorRepository.EmailExistsAsync(normalizedEmail, cancellationToken: cancellationToken))
            {
                throw new InvalidOperationException("A vendor with this email already exists.");
            }

            var vendor = new Vendor
            {
                Name = dto.Name.Trim(),
                ContactPerson = dto.ContactPerson.Trim(),
                Phone = dto.Phone.Trim(),
                Email = dto.Email.Trim(),
                Address = dto.Address?.Trim() ?? string.Empty,
                Notes = dto.Notes?.Trim() ?? string.Empty,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
            };

            var created = await _vendorRepository.AddAsync(vendor, cancellationToken);
            return MapToDto(created, 0m);
        }

        public async Task<VendorResponseDto?> UpdateAsync(int id, UpdateVendorDto dto, CancellationToken cancellationToken = default)
        {
            var vendor = await _vendorRepository.GetByIdAsync(id, cancellationToken);
            if (vendor == null)
            {
                return null;
            }

            var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
            if (await _vendorRepository.EmailExistsAsync(normalizedEmail, id, cancellationToken))
            {
                throw new InvalidOperationException("A vendor with this email already exists.");
            }

            vendor.Name = dto.Name.Trim();
            vendor.ContactPerson = dto.ContactPerson.Trim();
            vendor.Phone = dto.Phone.Trim();
            vendor.Email = dto.Email.Trim();
            vendor.Address = dto.Address?.Trim() ?? string.Empty;
            vendor.Notes = dto.Notes?.Trim() ?? string.Empty;
            if (dto.IsActive.HasValue)
            {
                vendor.IsActive = dto.IsActive.Value;
            }

            await _vendorRepository.UpdateAsync(vendor, cancellationToken);

            var total = await _db.PurchaseInvoices
                .AsNoTracking()
                .Where(p => p.VendorId == id)
                .SumAsync(p => (decimal?)p.TotalAmount, cancellationToken) ?? 0m;

            return MapToDto(vendor, total);
        }

        public async Task<VendorResponseDto?> DeactivateAsync(int id, CancellationToken cancellationToken = default)
        {
            var vendor = await _vendorRepository.GetByIdAsync(id, cancellationToken);
            if (vendor == null)
            {
                return null;
            }

            vendor.IsActive = false;
            await _vendorRepository.UpdateAsync(vendor, cancellationToken);

            var total = await _db.PurchaseInvoices
                .AsNoTracking()
                .Where(p => p.VendorId == id)
                .SumAsync(p => (decimal?)p.TotalAmount, cancellationToken) ?? 0m;

            return MapToDto(vendor, total);
        }

        public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
        {
            var vendor = await _vendorRepository.GetByIdAsync(id, cancellationToken);
            if (vendor == null)
            {
                throw new KeyNotFoundException("Vendor not found.");
            }

            if (await _vendorRepository.HasLinkedPartsAsync(id, cancellationToken))
            {
                throw new InvalidOperationException(
                    "Cannot delete this vendor because one or more parts are linked to them.");
            }

            await _vendorRepository.DeleteAsync(vendor, cancellationToken);
        }

        private async Task<Dictionary<int, decimal>> GetPurchaseTotalsByVendorAsync(CancellationToken cancellationToken)
        {
            return await _db.PurchaseInvoices
                .AsNoTracking()
                .Where(p => p.VendorId != null)
                .GroupBy(p => p.VendorId!.Value)
                .Select(g => new { VendorId = g.Key, Total = g.Sum(p => p.TotalAmount) })
                .ToDictionaryAsync(x => x.VendorId, x => x.Total, cancellationToken);
        }

        private static VendorResponseDto MapToDto(Vendor vendor, decimal totalPurchases) => new()
        {
            Id = vendor.Id,
            Name = vendor.Name,
            ContactPerson = vendor.ContactPerson,
            Phone = vendor.Phone,
            Email = vendor.Email,
            Address = vendor.Address,
            Notes = vendor.Notes,
            IsActive = vendor.IsActive,
            Status = vendor.IsActive ? "Active" : "Inactive",
            TotalPurchases = totalPurchases,
            CreatedAt = vendor.CreatedAt,
        };
    }
}
