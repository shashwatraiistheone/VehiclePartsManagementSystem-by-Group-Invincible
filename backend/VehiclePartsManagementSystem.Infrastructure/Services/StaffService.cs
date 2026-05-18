using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;
using VehiclePartsManagementSystem.Domain.Entities;

namespace VehiclePartsManagementSystem.Infrastructure.Services
{
    public class StaffService : IStaffService
    {
        private readonly IStaffRepository _staffRepository;
        private readonly IConfiguration _configuration;

        public StaffService(IStaffRepository staffRepository, IConfiguration configuration)
        {
            _staffRepository = staffRepository;
            _configuration = configuration;
        }

        public async Task<IReadOnlyList<StaffResponseDto>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            var rows = await _staffRepository.GetAllAsync(cancellationToken);
            return rows.Select(MapToDto).ToList();
        }

        public async Task<StaffResponseDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            var staff = await _staffRepository.GetByIdAsync(id, cancellationToken);
            return staff == null ? null : MapToDto(staff);
        }

        public async Task<StaffResponseDto> RegisterAsync(RegisterStaffDto dto, CancellationToken cancellationToken = default)
        {
            // FluentValidation runs in the API pipeline; service enforces business rules.
            var normalizedEmail = dto.Email.Trim().ToLowerInvariant();

            if (await _staffRepository.EmailExistsAsync(normalizedEmail, cancellationToken: cancellationToken))
            {
                throw new InvalidOperationException("A staff member with this email already exists.");
            }

            if (!Enum.TryParse<UserRole>(dto.Role, ignoreCase: true, out var role))
            {
                throw new InvalidOperationException("Role must be Admin or Staff.");
            }

            var staff = new Staff
            {
                FullName = dto.FullName.Trim(),
                Email = dto.Email.Trim(),
                Phone = dto.Phone.Trim(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role = role,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
            };

            var created = await _staffRepository.AddAsync(staff, cancellationToken);
            return MapToDto(created);
        }

        public async Task<StaffResponseDto?> UpdateAsync(int id, UpdateStaffDto dto, CancellationToken cancellationToken = default)
        {
            var staff = await _staffRepository.GetByIdAsync(id, cancellationToken);
            if (staff == null)
            {
                return null;
            }

            if (!Enum.TryParse<UserRole>(dto.Role, ignoreCase: true, out var role))
            {
                throw new InvalidOperationException("Role must be Admin or Staff.");
            }

            staff.FullName = dto.FullName.Trim();
            staff.Phone = dto.Phone.Trim();
            staff.Role = role;

            await _staffRepository.UpdateAsync(staff, cancellationToken);
            return MapToDto(staff);
        }

        public async Task<bool> DeactivateAsync(int id, CancellationToken cancellationToken = default)
        {
            var staff = await _staffRepository.GetByIdAsync(id, cancellationToken);
            if (staff == null)
            {
                return false;
            }

            staff.IsActive = false;
            await _staffRepository.UpdateAsync(staff, cancellationToken);
            return true;
        }

        public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
        {
            var staff = await _staffRepository.GetByIdAsync(id, cancellationToken);
            if (staff == null)
            {
                return false;
            }

            await _staffRepository.DeleteAsync(staff, cancellationToken);
            return true;
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto dto, CancellationToken cancellationToken = default)
        {
            var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
            var staff = await _staffRepository.GetByEmailAsync(normalizedEmail, cancellationToken);

            if (staff == null || !staff.IsActive)
            {
                throw new UnauthorizedAccessException("Invalid email or password.");
            }

            if (string.IsNullOrEmpty(staff.PasswordHash))
            {
                throw new UnauthorizedAccessException("Invalid email or password.");
            }

            bool passwordOk;
            try
            {
                passwordOk = BCrypt.Net.BCrypt.Verify(dto.Password, staff.PasswordHash);
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
                Token = GenerateJwtToken(staff),
                UserId = staff.Id,
                Name = staff.FullName,
                Email = staff.Email,
                Role = staff.Role.ToString(),
            };
        }

        private string GenerateJwtToken(Staff staff)
        {
            // Prefer JwtSettings; fall back to legacy Jwt section for existing configs.
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
                new(JwtRegisteredClaimNames.Sub, staff.Id.ToString()),
                new(JwtRegisteredClaimNames.Name, staff.FullName),
                new(JwtRegisteredClaimNames.Email, staff.Email),
                new(ClaimTypes.Role, staff.Role.ToString()),
                new("userId", staff.Id.ToString()),
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

        private static StaffResponseDto MapToDto(Staff staff) => new()
        {
            Id = staff.Id,
            FullName = staff.FullName,
            Email = staff.Email,
            Phone = staff.Phone,
            Role = staff.Role.ToString(),
            IsActive = staff.IsActive,
            CreatedAt = staff.CreatedAt,
        };
    }
}
