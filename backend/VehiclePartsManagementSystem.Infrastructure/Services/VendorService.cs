using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;
using VehiclePartsManagementSystem.Domain.Entities;

namespace VehiclePartsManagementSystem.Infrastructure.Services
{
    public class VendorService : IVendorService
    {
        private readonly IVendorRepository _vendorRepository;

        public VendorService(IVendorRepository vendorRepository)
        {
            _vendorRepository = vendorRepository;
        }

        public async Task<IReadOnlyList<VendorResponseDto>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            var rows = await _vendorRepository.GetAllAsync(cancellationToken);
            return rows.Select(MapToDto).ToList();
        }

        public async Task<VendorResponseDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            var vendor = await _vendorRepository.GetByIdAsync(id, cancellationToken);
            return vendor == null ? null : MapToDto(vendor);
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
                CreatedAt = DateTime.UtcNow,
            };

            var created = await _vendorRepository.AddAsync(vendor, cancellationToken);
            return MapToDto(created);
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

            await _vendorRepository.UpdateAsync(vendor, cancellationToken);
            return MapToDto(vendor);
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

        private static VendorResponseDto MapToDto(Vendor vendor) => new()
        {
            Id = vendor.Id,
            Name = vendor.Name,
            ContactPerson = vendor.ContactPerson,
            Phone = vendor.Phone,
            Email = vendor.Email,
            Address = vendor.Address,
            CreatedAt = vendor.CreatedAt,
        };
    }
}
