using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
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
        private readonly IConfiguration _configuration;

        public CustomerService(AppDbContext db, IConfiguration configuration)
        {
            _db = db;
            _configuration = configuration;
        }

        public async Task<List<CustomerSearchResultDto>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            var customers = await _db.Customers
                .AsNoTracking()
                .Include(c => c.Vehicles)
                .OrderByDescending(c => c.Id)
                .ToListAsync(cancellationToken);

            return await MapCustomerListAsync(customers, cancellationToken);
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
                Address = address,
                CreatedAt = DateTime.UtcNow,
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

        public async Task<AuthResponseDto> RegisterAsync(
            RegisterCustomerDto dto,
            CancellationToken cancellationToken = default)
        {
            var name = dto.Name.Trim();
            var email = dto.Email.Trim().ToLowerInvariant();
            var phone = dto.Phone.Trim();

            if (!EmailValidator.IsValid(email))
            {
                throw new InvalidOperationException("Invalid email format.");
            }

            if (dto.Vehicles == null || dto.Vehicles.Count == 0)
            {
                throw new InvalidOperationException("At least one vehicle is required.");
            }

            foreach (var vehicle in dto.Vehicles)
            {
                CustomerVehicleService.ValidateVehicle(vehicle);
            }

            var existing = await _db.Customers
                .FirstOrDefaultAsync(c => c.Email.ToLower() == email, cancellationToken);

            if (existing != null)
            {
                if (!string.IsNullOrEmpty(existing.PasswordHash))
                {
                    throw new InvalidOperationException("An account with this email already exists. Sign in instead.");
                }

                throw new InvalidOperationException(
                    "This email is on file from a shop visit. Contact the store to link your account, or use a different email.");
            }

            var customer = new Customer
            {
                Name = name,
                Email = email,
                Phone = phone,
                Address = dto.Address?.Trim() ?? string.Empty,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                CreatedAt = DateTime.UtcNow,
            };

            await _db.Customers.AddAsync(customer, cancellationToken);
            try
            {
                await _db.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException ex) when (ex.InnerException is PostgresException pg && pg.SqlState == "23505")
            {
                throw new InvalidOperationException("An account with this email already exists.");
            }

            await AddVehiclesAsync(customer.Id, dto.Vehicles, cancellationToken);

            return new AuthResponseDto
            {
                Token = GenerateJwtToken(customer),
                UserId = customer.Id,
                Name = customer.Name,
                Email = customer.Email,
                Role = UserRole.Customer.ToString(),
            };
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto dto, CancellationToken cancellationToken = default)
        {
            var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
            var customer = await _db.Customers
                .FirstOrDefaultAsync(c => c.Email.ToLower() == normalizedEmail, cancellationToken);

            if (customer == null || string.IsNullOrEmpty(customer.PasswordHash))
            {
                throw new UnauthorizedAccessException("Invalid email or password.");
            }

            bool passwordOk;
            try
            {
                passwordOk = BCrypt.Net.BCrypt.Verify(dto.Password, customer.PasswordHash);
            }
            catch
            {
                passwordOk = false;
            }

            if (!passwordOk)
            {
                throw new UnauthorizedAccessException("Invalid email or password.");
            }

            return new AuthResponseDto
            {
                Token = GenerateJwtToken(customer),
                UserId = customer.Id,
                Name = customer.Name,
                Email = customer.Email,
                Role = UserRole.Customer.ToString(),
            };
        }

        private string GenerateJwtToken(Customer customer)
        {
            var section = _configuration.GetSection("JwtSettings");
            if (!section.Exists() || string.IsNullOrWhiteSpace(section["Key"]))
            {
                section = _configuration.GetSection("Jwt");
            }

            var issuer = section["Issuer"] ?? "VehiclePartsManagementSystem";
            var audience = section["Audience"] ?? "VehiclePartsManagementSystem";
            var secret = section["Key"] ?? throw new InvalidOperationException("JWT key not configured.");

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new(JwtRegisteredClaimNames.Sub, customer.Id.ToString()),
                new(JwtRegisteredClaimNames.Name, customer.Name),
                new(JwtRegisteredClaimNames.Email, customer.Email),
                new(ClaimTypes.Role, UserRole.Customer.ToString()),
                new("role", UserRole.Customer.ToString()),
                new("userId", customer.Id.ToString()),
            };

            var expiresMinutes = 60;
            if (int.TryParse(section["ExpiresMinutes"], out var parsed) && parsed > 0)
            {
                expiresMinutes = parsed;
            }

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expiresMinutes),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public async Task<List<CustomerSearchResultDto>> SearchAsync(string? query, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return await GetAllAsync(cancellationToken);
            }

            var term = query.Trim();
            var isId = int.TryParse(term, out var parsedId);
            var customers = await _db.Customers
                .AsNoTracking()
                .Include(c => c.Vehicles)
                .Where(c =>
                    EF.Functions.ILike(c.Name, $"%{term}%") ||
                    EF.Functions.ILike(c.Email, $"%{term}%") ||
                    EF.Functions.ILike(c.Phone, $"%{term}%") ||
                    (isId && c.Id == parsedId) ||
                    c.Vehicles.Any(v => EF.Functions.ILike(v.VehicleNumber, $"%{term}%")))
                .OrderBy(c => c.Name)
                .Take(50)
                .ToListAsync(cancellationToken);

            return await MapCustomerListAsync(customers, cancellationToken);
        }

        public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
        {
            var hasSales = await _db.Sales.AnyAsync(s => s.CustomerId == id, cancellationToken);
            if (hasSales)
            {
                throw new InvalidOperationException("Cannot delete a customer with sales history.");
            }

            var customer = await _db.Customers
                .Include(c => c.ServiceAppointments)
                .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

            if (customer == null)
            {
                return false;
            }

            if (customer.ServiceAppointments.Count > 0)
            {
                _db.ServiceAppointments.RemoveRange(customer.ServiceAppointments);
            }

            _db.Customers.Remove(customer);
            await _db.SaveChangesAsync(cancellationToken);
            return true;
        }

        private async Task<List<CustomerSearchResultDto>> MapCustomerListAsync(
            List<Customer> customers,
            CancellationToken cancellationToken)
        {
            if (customers.Count == 0)
            {
                return new List<CustomerSearchResultDto>();
            }

            var ids = customers.Select(c => c.Id).ToList();
            var purchaseStats = await _db.Sales
                .AsNoTracking()
                .Where(s => ids.Contains(s.CustomerId))
                .GroupBy(s => s.CustomerId)
                .Select(g => new { CustomerId = g.Key, Count = g.Count(), LastDate = g.Max(s => s.Date) })
                .ToListAsync(cancellationToken);

            var appointmentStats = await _db.ServiceAppointments
                .AsNoTracking()
                .Where(a => ids.Contains(a.CustomerId))
                .GroupBy(a => a.CustomerId)
                .Select(g => new { CustomerId = g.Key, LastDate = g.Max(a => a.Date) })
                .ToListAsync(cancellationToken);

            var purchaseMap = purchaseStats.ToDictionary(x => x.CustomerId);
            var appointmentMap = appointmentStats.ToDictionary(x => x.CustomerId);
            var activeThreshold = DateTime.UtcNow.AddDays(-90);

            return customers.Select(c =>
            {
                purchaseMap.TryGetValue(c.Id, out var purchases);
                appointmentMap.TryGetValue(c.Id, out var appointments);

                DateTime? lastVisit = null;
                if (purchases != null)
                {
                    lastVisit = purchases.LastDate;
                }

                if (appointments != null && (lastVisit == null || appointments.LastDate > lastVisit))
                {
                    lastVisit = appointments.LastDate;
                }

                var totalPurchases = purchases?.Count ?? 0;
                var isActive = totalPurchases > 0 || (lastVisit.HasValue && lastVisit.Value >= activeThreshold);

                return new CustomerSearchResultDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Phone = c.Phone,
                    Email = c.Email,
                    Address = c.Address,
                    Vehicles = c.Vehicles.Select(CustomerVehicleService.Map).ToList(),
                    TotalPurchases = totalPurchases,
                    LastVisitDate = lastVisit?.ToString("O"),
                    CreatedAt = c.CreatedAt.ToString("O"),
                    Status = isActive ? "Active" : "Inactive",
                };
            }).ToList();
        }

        public async Task<CustomerDetailDto?> GetDetailAsync(int id, CancellationToken cancellationToken = default)
        {
            var customer = await _db.Customers
                .AsNoTracking()
                .Include(c => c.Vehicles)
                .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

            if (customer == null)
            {
                return null;
            }

            var sales = await _db.Sales
                .AsNoTracking()
                .Where(s => s.CustomerId == id)
                .ToListAsync(cancellationToken);

            var pendingCredits = await (
                from i in _db.Invoices.AsNoTracking()
                join s in _db.Sales.AsNoTracking() on i.SaleId equals s.Id
                where !i.IsPaid && i.BalanceAmount > 0 && s.CustomerId == id
                orderby i.CreatedDate descending
                select new { Invoice = i, Sale = s }
            ).ToListAsync(cancellationToken);

            return new CustomerDetailDto
            {
                Id = customer.Id,
                Name = customer.Name,
                Email = customer.Email,
                Phone = customer.Phone,
                Address = customer.Address,
                Vehicles = customer.Vehicles.Select(CustomerVehicleService.Map).ToList(),
                TotalPurchases = sales.Count,
                TotalSpent = sales.Sum(s => s.TotalAmount),
                LastPurchaseDate = sales.OrderByDescending(s => s.Date).FirstOrDefault()?.Date.ToString("O"),
                CreatedAt = customer.CreatedAt.ToString("O"),
                PendingCredits = pendingCredits.Select(x => new PendingCreditDto
                {
                    InvoiceId = x.Invoice.Id,
                    SaleId = x.Invoice.SaleId,
                    InvoiceNumber = x.Invoice.InvoiceNumber,
                    Amount = x.Invoice.BalanceAmount > 0 ? x.Invoice.BalanceAmount : x.Sale.TotalAmount,
                    CreatedDate = x.Invoice.CreatedDate.ToString("O"),
                }).ToList(),
            };
        }

        public async Task<CustomerDetailDto> CreateWithVehiclesAsync(
            CreateCustomerWithVehiclesDto dto,
            CancellationToken cancellationToken = default)
        {
            if (dto.Vehicles == null || dto.Vehicles.Count == 0)
            {
                throw new InvalidOperationException("At least one vehicle is required.");
            }

            var email = string.IsNullOrWhiteSpace(dto.Email)
                ? $"{dto.Phone.Trim().Replace("+", "")}@partshub.local"
                : dto.Email.Trim().ToLowerInvariant();

            var created = await CreateAsync(new CustomerDto
            {
                Name = dto.Name,
                Email = email,
                Phone = dto.Phone,
                Address = dto.Address,
            });

            await AddVehiclesAsync(created.Id, dto.Vehicles, cancellationToken);

            return (await GetDetailAsync(created.Id, cancellationToken))!;
        }

        public async Task<CustomerDetailDto?> UpdateProfileAsync(
            int id,
            UpdateCustomerProfileDto dto,
            CancellationToken cancellationToken = default)
        {
            var customer = await _db.Customers.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
            if (customer == null)
            {
                return null;
            }

            customer.Name = dto.Name.Trim();
            customer.Phone = dto.Phone.Trim();
            customer.Address = dto.Address?.Trim() ?? string.Empty;
            await _db.SaveChangesAsync(cancellationToken);
            return await GetDetailAsync(id, cancellationToken);
        }

        public async Task ChangePasswordAsync(
            int id,
            ChangeCustomerPasswordDto dto,
            CancellationToken cancellationToken = default)
        {
            var customer = await _db.Customers.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
            if (customer == null)
            {
                throw new InvalidOperationException("Customer not found.");
            }

            if (string.IsNullOrWhiteSpace(customer.PasswordHash))
            {
                throw new InvalidOperationException("Password login is not set up for this account.");
            }

            bool currentOk;
            try
            {
                currentOk = BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, customer.PasswordHash);
            }
            catch
            {
                currentOk = false;
            }

            if (!currentOk)
            {
                throw new UnauthorizedAccessException("Current password is incorrect.");
            }

            customer.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            await _db.SaveChangesAsync(cancellationToken);
        }

        public async Task<List<CustomerNotificationDto>> GetNotificationsAsync(
            int customerId,
            CancellationToken cancellationToken = default)
        {
            var notifications = new List<CustomerNotificationDto>();
            var now = DateTime.UtcNow;

            var pendingCredits = await (
                from i in _db.Invoices.AsNoTracking()
                join s in _db.Sales.AsNoTracking() on i.SaleId equals s.Id
                where !i.IsPaid && i.BalanceAmount > 0 && s.CustomerId == customerId
                select new { i, s }
            ).ToListAsync(cancellationToken);

            foreach (var row in pendingCredits)
            {
                notifications.Add(new CustomerNotificationDto
                {
                    Id = $"credit-{row.i.Id}",
                    Title = "Payment reminder",
                    Message = $"Invoice {row.i.InvoiceNumber} has an outstanding balance of Rs {row.i.BalanceAmount:N2}.",
                    Type = "Payment",
                    IsRead = false,
                    CreatedAt = row.i.CreatedDate.ToString("O"),
                });
            }

            var upcoming = await _db.ServiceAppointments
                .AsNoTracking()
                .Where(a => a.CustomerId == customerId
                    && a.Date >= now
                    && a.Status != "Cancelled"
                    && a.Status != "Completed")
                .OrderBy(a => a.Date)
                .Take(5)
                .ToListAsync(cancellationToken);

            foreach (var appt in upcoming)
            {
                notifications.Add(new CustomerNotificationDto
                {
                    Id = $"appt-{appt.Id}",
                    Title = "Upcoming appointment",
                    Message = $"{appt.ServiceType} scheduled for {appt.Date:MMM dd, yyyy 'at' HH:mm} — status: {appt.Status}.",
                    Type = "Appointment",
                    IsRead = false,
                    CreatedAt = appt.Date.ToString("O"),
                });
            }

            var partRequests = await _db.PartRequests
                .AsNoTracking()
                .Where(r => r.CustomerId == customerId && r.Status != "Pending")
                .OrderByDescending(r => r.CreatedAt)
                .Take(5)
                .ToListAsync(cancellationToken);

            foreach (var req in partRequests)
            {
                notifications.Add(new CustomerNotificationDto
                {
                    Id = $"partreq-{req.Id}",
                    Title = "Part request update",
                    Message = $"Your request for \"{req.PartName}\" is now {req.Status}.",
                    Type = "PartRequest",
                    IsRead = false,
                    CreatedAt = req.CreatedAt.ToString("O"),
                });
            }

            var salesCount = await _db.Sales.CountAsync(s => s.CustomerId == customerId, cancellationToken);
            if (salesCount >= 3)
            {
                notifications.Add(new CustomerNotificationDto
                {
                    Id = "loyalty-eligible",
                    Title = "Loyalty discount active",
                    Message = "You qualify for 10% loyalty discount on single orders over Rs 5,000.",
                    Type = "Loyalty",
                    IsRead = false,
                    CreatedAt = now.ToString("O"),
                });
            }

            return notifications.OrderByDescending(n => n.CreatedAt).ToList();
        }

        private async Task AddVehiclesAsync(int customerId, List<VehicleInputDto> vehicles, CancellationToken cancellationToken)
        {
            if (vehicles == null || vehicles.Count == 0)
            {
                return;
            }

            foreach (var v in vehicles)
            {
                CustomerVehicleService.ValidateVehicle(v);
                await CustomerVehicleService.EnsureGlobalUniqueVehicleNumberAsync(
                    _db,
                    v.VehicleNumber,
                    cancellationToken);
                await _db.CustomerVehicles.AddAsync(CustomerVehicleService.ToEntity(customerId, v), cancellationToken);
            }

            await _db.SaveChangesAsync(cancellationToken);
        }
    }
}
