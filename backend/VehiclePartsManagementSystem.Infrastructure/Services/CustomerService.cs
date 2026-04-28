using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;
using VehiclePartsManagementSystem.Domain.Entities;
using VehiclePartsManagementSystem.Infrastructure.Data;

namespace VehiclePartsManagementSystem.Infrastructure.Services
{
    public class CustomerService : ICustomerService
    {
        private static readonly EmailAddressAttribute EmailValidator = new();

        private readonly AppDbContext _db;

        public CustomerService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<List<Customer>> GetAllAsync()
        {
            return await _db.Customers
                .OrderByDescending(c => c.Id)
                .ToListAsync();
        }

        public async Task<List<Customer>> SearchByNameAsync(string name)
        {
            if (string.IsNullOrWhiteSpace(name))
            {
                return new List<Customer>();
            }

            var term = name.Trim();
            return await _db.Customers
                .Where(c => EF.Functions.ILike(c.Name, $"%{term}%"))
                .OrderBy(c => c.Name)
                .ToListAsync();
        }

        public async Task<Customer> CreateAsync(CustomerDto dto)
        {
            var name = dto.Name?.Trim() ?? string.Empty;
            if (name.Length == 0)
            {
                throw new InvalidOperationException("Customer name is required");
            }

            var email = dto.Email?.Trim() ?? string.Empty;
            if (!EmailValidator.IsValid(email))
            {
                throw new InvalidOperationException("Invalid email format");
            }

            var phone = dto.Phone?.Trim() ?? string.Empty;
            if (phone.Length == 0)
            {
                throw new InvalidOperationException("Phone is required");
            }

            var emailNormalized = email.ToLowerInvariant();
            var exists = await _db.Customers.AnyAsync(c => c.Email.ToLower() == emailNormalized);
            if (exists)
            {
                throw new InvalidOperationException("Customer already exists");
            }

            var address = dto.Address?.Trim() ?? string.Empty;

            var customer = new Customer
            {
                Name = name,
                Email = emailNormalized,
                Phone = phone,
                Address = address
            };

            try
            {
                await _db.Customers.AddAsync(customer);
                await _db.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (ex.InnerException is PostgresException pg && pg.SqlState == "23505")
            {
                throw new InvalidOperationException("Customer already exists");
            }

            return customer;
        }
    }
}
