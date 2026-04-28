using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;
using VehiclePartsManagementSystem.Domain.Entities;
using VehiclePartsManagementSystem.Infrastructure.Data;

namespace VehiclePartsManagementSystem.Infrastructure.Services
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _db;
        private readonly IConfiguration _configuration;

        public AuthService(AppDbContext db, IConfiguration configuration)
        {
            _db = db;
            _configuration = configuration;
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
        {
            var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
            var normalizedUsername = dto.Username.Trim().ToLowerInvariant();

            var emailExists = await _db.Users.AnyAsync(u => u.Email.ToLower() == normalizedEmail);
            if (emailExists)
            {
                throw new InvalidOperationException("Email already exists.");
            }

            var usernameExists = await _db.Users.AnyAsync(u => u.Username.ToLower() == normalizedUsername);
            if (usernameExists)
            {
                throw new InvalidOperationException("Username already exists.");
            }

            if (!Enum.TryParse<UserRole>(dto.Role, ignoreCase: true, out var role))
            {
                throw new InvalidOperationException("Role must be Admin or Staff.");
            }

            var user = new User
            {
                Username = dto.Username.Trim(),
                Email = dto.Email.Trim(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role = role,
                CreatedAt = DateTime.UtcNow
            };

            await _db.Users.AddAsync(user);
            await _db.SaveChangesAsync();

            return new AuthResponseDto
            {
                Token = GenerateJwtToken(user),
                Email = user.Email,
                Role = user.Role.ToString()
            };
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
        {
            var email = dto.Email.Trim();

            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null)
            {
                throw new InvalidOperationException("Invalid email or password.");
            }

            var ok = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);
            if (!ok)
            {
                throw new InvalidOperationException("Invalid email or password.");
            }

            return new AuthResponseDto
            {
                Token = GenerateJwtToken(user),
                Email = user.Email,
                Role = user.Role.ToString()
            };
        }

        private string GenerateJwtToken(User user)
        {
            var section = _configuration.GetSection("Jwt");
            var issuer = section["Issuer"] ?? "VehiclePartsManagementSystem";
            var audience = section["Audience"] ?? "VehiclePartsManagementSystem";
            var secret = section["Key"] ?? throw new InvalidOperationException("JWT key not configured (Jwt:Key).");

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new(JwtRegisteredClaimNames.Email, user.Email),
                new(ClaimTypes.Role, user.Role.ToString()),
                new("username", user.Username)
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
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}

