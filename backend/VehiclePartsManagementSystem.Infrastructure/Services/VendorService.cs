using Microsoft.EntityFrameworkCore;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;
using VehiclePartsManagementSystem.Domain.Entities;
using VehiclePartsManagementSystem.Infrastructure.Data;

namespace VehiclePartsManagementSystem.Infrastructure.Services
{
    public class VendorService : IVendorService
    {
        private readonly AppDbContext _db;

        public VendorService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<List<Vendor>> GetAllAsync()
        {
            return await _db.Vendors
                .OrderByDescending(v => v.Id)
                .ToListAsync();
        }

        public async Task<Vendor> CreateAsync(VendorDto dto)
        {
            var vendor = new Vendor
            {
                Name = dto.Name,
                Contact = dto.Contact,
                Address = dto.Address
            };

            await _db.Vendors.AddAsync(vendor);
            await _db.SaveChangesAsync();

            return vendor;
        }
    }
}
