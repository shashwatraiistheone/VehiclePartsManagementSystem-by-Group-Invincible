using Microsoft.EntityFrameworkCore;
using VehiclePartsManagementSystem.Application.Interfaces;
using VehiclePartsManagementSystem.Domain.Entities;
using VehiclePartsManagementSystem.Infrastructure.Data;

namespace VehiclePartsManagementSystem.Infrastructure.Repositories
{
    public class VendorRepository : IVendorRepository
    {
        private readonly AppDbContext _db;

        public VendorRepository(AppDbContext db)
        {
            _db = db;
        }

        public async Task<IReadOnlyList<Vendor>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            return await _db.Vendors
                .AsNoTracking()
                .OrderByDescending(v => v.CreatedAt)
                .ToListAsync(cancellationToken);
        }

        public async Task<Vendor?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            return await _db.Vendors.FirstOrDefaultAsync(v => v.Id == id, cancellationToken);
        }

        public async Task<Vendor> AddAsync(Vendor vendor, CancellationToken cancellationToken = default)
        {
            await _db.Vendors.AddAsync(vendor, cancellationToken);
            await _db.SaveChangesAsync(cancellationToken);
            return vendor;
        }

        public async Task UpdateAsync(Vendor vendor, CancellationToken cancellationToken = default)
        {
            _db.Vendors.Update(vendor);
            await _db.SaveChangesAsync(cancellationToken);
        }

        public async Task DeleteAsync(Vendor vendor, CancellationToken cancellationToken = default)
        {
            _db.Vendors.Remove(vendor);
            await _db.SaveChangesAsync(cancellationToken);
        }

        public async Task<bool> EmailExistsAsync(
            string normalizedEmail,
            int? excludeId = null,
            CancellationToken cancellationToken = default)
        {
            var query = _db.Vendors.AsNoTracking().Where(v => v.Email.ToLower() == normalizedEmail);
            if (excludeId.HasValue)
            {
                query = query.Where(v => v.Id != excludeId.Value);
            }

            return await query.AnyAsync(cancellationToken);
        }

        public async Task<bool> HasLinkedPartsAsync(int vendorId, CancellationToken cancellationToken = default)
        {
            return await _db.Parts.AsNoTracking().AnyAsync(p => p.VendorId == vendorId, cancellationToken);
        }
    }
}
