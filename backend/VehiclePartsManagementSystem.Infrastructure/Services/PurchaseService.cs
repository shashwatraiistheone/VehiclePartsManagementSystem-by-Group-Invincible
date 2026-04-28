using Microsoft.EntityFrameworkCore;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;
using VehiclePartsManagementSystem.Domain.Entities;
using VehiclePartsManagementSystem.Infrastructure.Data;

namespace VehiclePartsManagementSystem.Infrastructure.Services
{
    public class PurchaseService : IPurchaseService
    {
        private readonly AppDbContext _db;

        public PurchaseService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<PurchaseResponseDto> CreatePurchaseAsync(CreatePurchaseDto dto)
        {
            if (dto.Items == null || dto.Items.Count == 0)
            {
                throw new InvalidOperationException("At least one purchase item is required.");
            }

            await using var tx = await _db.Database.BeginTransactionAsync();

            var invoice = new PurchaseInvoice
            {
                VendorName = dto.VendorName.Trim(),
                Date = DateTime.UtcNow
            };

            foreach (var item in dto.Items)
            {
                if (item.Quantity <= 0) throw new InvalidOperationException("Quantity must be greater than 0.");
                if (item.Price <= 0) throw new InvalidOperationException("Price must be greater than 0.");

                var part = await _db.Parts.FindAsync(item.PartId);
                if (part == null) throw new InvalidOperationException($"Part not found: {item.PartId}");

                part.Quantity += item.Quantity;

                invoice.Items.Add(new PurchaseItem
                {
                    PartId = item.PartId,
                    Quantity = item.Quantity,
                    Price = item.Price
                });
            }

            invoice.TotalAmount = invoice.Items.Sum(i => i.Price * i.Quantity);

            await _db.PurchaseInvoices.AddAsync(invoice);
            await _db.SaveChangesAsync();

            await tx.CommitAsync();

            return MapToResponse(invoice);
        }

        public async Task<List<PurchaseResponseDto>> GetAllPurchasesAsync()
        {
            var invoices = await _db.PurchaseInvoices
                .Include(p => p.Items)
                .OrderByDescending(p => p.Id)
                .ToListAsync();

            return invoices.Select(MapToResponse).ToList();
        }

        private static PurchaseResponseDto MapToResponse(PurchaseInvoice invoice)
        {
            return new PurchaseResponseDto
            {
                Id = invoice.Id,
                VendorName = invoice.VendorName,
                Date = invoice.Date,
                TotalAmount = invoice.TotalAmount,
                Items = invoice.Items.Select(i => new PurchaseItemDto
                {
                    PartId = i.PartId,
                    Quantity = i.Quantity,
                    Price = i.Price
                }).ToList()
            };
        }
    }
}

