using Microsoft.EntityFrameworkCore;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;
using VehiclePartsManagementSystem.Domain.Entities;
using VehiclePartsManagementSystem.Infrastructure.Data;

namespace VehiclePartsManagementSystem.Infrastructure.Services
{
    public class SalesService : ISalesService
    {
        private readonly AppDbContext _db;

        public SalesService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<SaleResponseDto> CreateSaleAsync(CreateSaleDto dto)
        {
            if (dto.Items == null || dto.Items.Count == 0)
            {
                throw new InvalidOperationException("At least one sale item is required.");
            }

            var customer = await _db.Customers.FindAsync(dto.CustomerId);
            if (customer == null) throw new InvalidOperationException($"Customer not found: {dto.CustomerId}");

            await using var tx = await _db.Database.BeginTransactionAsync();

            var sale = new Sale
            {
                CustomerId = dto.CustomerId,
                Date = DateTime.UtcNow
            };

            foreach (var item in dto.Items)
            {
                if (item.Quantity <= 0) throw new InvalidOperationException("Quantity must be greater than 0.");

                var part = await _db.Parts.FindAsync(item.PartId);
                if (part == null) throw new InvalidOperationException($"Part not found: {item.PartId}");
                if (part.Quantity < item.Quantity)
                {
                    throw new InvalidOperationException(
                        $"Insufficient stock for part '{part.Name}' (Id {part.Id}). Available: {part.Quantity}, requested: {item.Quantity}.");
                }

                part.Quantity -= item.Quantity;

                sale.Items.Add(new SaleItem
                {
                    PartId = item.PartId,
                    Quantity = item.Quantity,
                    Price = part.Price
                });
            }

            sale.TotalAmount = sale.Items.Sum(i => i.Price * i.Quantity);

            await _db.Sales.AddAsync(sale);
            await _db.SaveChangesAsync();

            var invoiceNumber = await GenerateUniqueInvoiceNumberAsync(sale.Id);
            var invoice = new Invoice
            {
                SaleId = sale.Id,
                InvoiceNumber = invoiceNumber,
                CreatedDate = DateTime.UtcNow
            };

            await _db.Invoices.AddAsync(invoice);
            await _db.SaveChangesAsync();

            await tx.CommitAsync();

            sale.Invoice = invoice;
            sale.Customer = customer;
            return MapToResponse(sale);
        }

        public async Task<List<SaleResponseDto>> GetAllSalesAsync()
        {
            var sales = await _db.Sales
                .Include(s => s.Items)
                .Include(s => s.Invoice)
                .Include(s => s.Customer)
                .OrderByDescending(s => s.Id)
                .ToListAsync();

            return sales.Select(MapToResponse).ToList();
        }

        private async Task<string> GenerateUniqueInvoiceNumberAsync(int saleId)
        {
            var candidate = $"INV-{saleId:D3}";

            if (!await _db.Invoices.AnyAsync(i => i.InvoiceNumber == candidate))
                return candidate;

            for (var n = 0; n < 100; n++)
            {
                var alt = $"{candidate}-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}";
                if (!await _db.Invoices.AnyAsync(i => i.InvoiceNumber == alt))
                    return alt;
            }

            return $"{candidate}-{Guid.NewGuid().ToString("N")}";
        }

        private static SaleResponseDto MapToResponse(Sale sale)
        {
            var invoice = sale.Invoice;
            return new SaleResponseDto
            {
                Id = sale.Id,
                CustomerId = sale.CustomerId,
                CustomerName = sale.Customer?.Name ?? string.Empty,
                Date = sale.Date,
                TotalAmount = sale.TotalAmount,
                Items = sale.Items.Select(i => new SaleItemResponseDto
                {
                    PartId = i.PartId,
                    Quantity = i.Quantity,
                    Price = i.Price
                }).ToList(),
                InvoiceId = invoice?.Id ?? 0,
                InvoiceNumber = invoice?.InvoiceNumber ?? string.Empty,
                InvoiceCreatedDate = invoice?.CreatedDate ?? default
            };
        }
    }
}
