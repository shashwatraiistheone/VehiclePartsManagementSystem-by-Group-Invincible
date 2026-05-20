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
        private readonly IInventoryNotificationService _notifications;

        public PurchaseService(AppDbContext db, IInventoryNotificationService notifications)
        {
            _db = db;
            _notifications = notifications;
        }

        public async Task<PurchaseResponseDto> CreatePurchaseAsync(CreatePurchaseDto dto)
        {
            if (dto.Items == null || dto.Items.Count == 0)
            {
                throw new InvalidOperationException("At least one purchase item is required.");
            }

            var vendor = await _db.Vendors.FindAsync(dto.VendorId);
            if (vendor == null)
            {
                throw new InvalidOperationException($"Vendor not found: {dto.VendorId}");
            }

            await using var tx = await _db.Database.BeginTransactionAsync();

            var purchaseDate = dto.PurchaseDate.HasValue
                ? DateTime.SpecifyKind(dto.PurchaseDate.Value, DateTimeKind.Utc)
                : DateTime.UtcNow;

            var invoice = new PurchaseInvoice
            {
                InvoiceNumber = string.IsNullOrWhiteSpace(dto.InvoiceNumber)
                    ? string.Empty
                    : dto.InvoiceNumber.Trim(),
                VendorId = vendor.Id,
                VendorName = vendor.Name,
                Date = purchaseDate,
                Notes = dto.Notes?.Trim() ?? string.Empty,
                ProcessedBy = string.IsNullOrWhiteSpace(dto.ProcessedBy)
                    ? "System"
                    : dto.ProcessedBy.Trim(),
                CreatedAt = DateTime.UtcNow,
            };

            foreach (var item in dto.Items)
            {
                if (item.Quantity <= 0)
                {
                    throw new InvalidOperationException("Quantity must be greater than 0.");
                }

                if (item.CostPrice <= 0)
                {
                    throw new InvalidOperationException("Unit price must be greater than 0.");
                }

                var part = await _db.Parts.FindAsync(item.PartId);
                if (part == null)
                {
                    throw new InvalidOperationException($"Part not found: {item.PartId}");
                }

                part.Quantity += item.Quantity;

                invoice.Items.Add(new PurchaseItem
                {
                    PartId = item.PartId,
                    Quantity = item.Quantity,
                    Price = item.CostPrice,
                });
            }

            invoice.TotalAmount = invoice.Items.Sum(i => i.Price * i.Quantity);

            await _db.PurchaseInvoices.AddAsync(invoice);
            await _db.SaveChangesAsync();

            if (string.IsNullOrWhiteSpace(invoice.InvoiceNumber))
            {
                invoice.InvoiceNumber = $"PI-{invoice.Id:D5}";
            }

            var invoiceLabel = invoice.InvoiceNumber;
            foreach (var item in invoice.Items)
            {
                _db.InventoryStockLogs.Add(new InventoryStockLog
                {
                    PartId = item.PartId,
                    QuantityChange = item.Quantity,
                    Reason = $"Purchase invoice {invoiceLabel}",
                    ReferenceType = "Purchase",
                    ReferenceId = invoice.Id,
                    CreatedAt = DateTime.UtcNow,
                });
            }

            await _db.SaveChangesAsync();
            await tx.CommitAsync();

            await _notifications.SyncAlertsAsync();

            return await MapToResponseAsync(invoice.Id);
        }

        public async Task<List<PurchaseResponseDto>> GetAllPurchasesAsync()
        {
            var invoices = await _db.PurchaseInvoices
                .AsNoTracking()
                .Include(p => p.Items)
                .ThenInclude(i => i.Part)
                .OrderByDescending(p => p.Date)
                .ThenByDescending(p => p.Id)
                .ToListAsync();

            return invoices.Select(MapToResponse).ToList();
        }

        public async Task<PurchaseResponseDto?> GetPurchaseByIdAsync(int id)
        {
            var invoice = await _db.PurchaseInvoices
                .AsNoTracking()
                .Include(p => p.Items)
                .ThenInclude(i => i.Part)
                .FirstOrDefaultAsync(p => p.Id == id);

            return invoice == null ? null : MapToResponse(invoice);
        }

        private async Task<PurchaseResponseDto> MapToResponseAsync(int id)
        {
            var invoice = await _db.PurchaseInvoices
                .AsNoTracking()
                .Include(p => p.Items)
                .ThenInclude(i => i.Part)
                .FirstAsync(p => p.Id == id);

            return MapToResponse(invoice);
        }

        private static PurchaseResponseDto MapToResponse(PurchaseInvoice invoice)
        {
            var number = !string.IsNullOrWhiteSpace(invoice.InvoiceNumber)
                ? invoice.InvoiceNumber
                : $"PI-{invoice.Id:D5}";

            return new PurchaseResponseDto
            {
                Id = invoice.Id,
                InvoiceNumber = number,
                VendorId = invoice.VendorId ?? 0,
                VendorName = invoice.VendorName,
                PurchaseDate = invoice.Date,
                Notes = invoice.Notes,
                ProcessedBy = invoice.ProcessedBy,
                TotalAmount = invoice.TotalAmount,
                CreatedAt = invoice.CreatedAt == default ? invoice.Date : invoice.CreatedAt,
                Items = invoice.Items.Select(i => new PurchaseItemDto
                {
                    PartId = i.PartId,
                    PartName = i.Part?.Name ?? string.Empty,
                    Quantity = i.Quantity,
                    CostPrice = i.Price,
                }).ToList(),
            };
        }
    }
}
