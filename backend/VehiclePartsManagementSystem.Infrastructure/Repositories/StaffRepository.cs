using Microsoft.EntityFrameworkCore;
using VehiclePartsManagementSystem.Application.Interfaces;
using VehiclePartsManagementSystem.Domain.Entities;
using VehiclePartsManagementSystem.Infrastructure.Data;

namespace VehiclePartsManagementSystem.Infrastructure.Repositories
{
    public class StaffRepository : IStaffRepository
    {
        private readonly AppDbContext _db;

        public StaffRepository(AppDbContext db)
        {
            _db = db;
        }

        public async Task<IReadOnlyList<Staff>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            return await _db.Staff
                .AsNoTracking()
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync(cancellationToken);
        }

        public async Task<Staff?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            return await _db.Staff.FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
        }

        public async Task<Staff?> GetByEmailAsync(string normalizedEmail, CancellationToken cancellationToken = default)
        {
            return await _db.Staff
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Email.ToLower() == normalizedEmail, cancellationToken);
        }

        public async Task<Staff> AddAsync(Staff staff, CancellationToken cancellationToken = default)
        {
            await _db.Staff.AddAsync(staff, cancellationToken);
            await _db.SaveChangesAsync(cancellationToken);
            return staff;
        }

        public async Task UpdateAsync(Staff staff, CancellationToken cancellationToken = default)
        {
            _db.Staff.Update(staff);
            await _db.SaveChangesAsync(cancellationToken);
        }

        public async Task DeleteAsync(Staff staff, CancellationToken cancellationToken = default)
        {
            _db.Staff.Remove(staff);
            await _db.SaveChangesAsync(cancellationToken);
        }

        public async Task<bool> EmailExistsAsync(
            string normalizedEmail,
            int? excludeId = null,
            CancellationToken cancellationToken = default)
        {
            var query = _db.Staff.AsNoTracking().Where(s => s.Email.ToLower() == normalizedEmail);
            if (excludeId.HasValue)
            {
                query = query.Where(s => s.Id != excludeId.Value);
            }

            return await query.AnyAsync(cancellationToken);
        }
    }
}
