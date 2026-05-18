using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;
using VehiclePartsManagementSystem.Domain.Entities;
using VehiclePartsManagementSystem.Infrastructure.Data;

namespace VehiclePartsManagementSystem.Infrastructure.Services
{
    public class SalesService : ISalesService
    {
        private const decimal LoyaltyThreshold = 5000m;
        private const decimal LoyaltyDiscountRate = 0.10m;

        private readonly AppDbContext _db;
        private readonly ILogger<SalesService> _logger;
        private readonly IEmailService _emailService;

        public SalesService(AppDbContext db, ILogger<SalesService> logger, IEmailService emailService)
        {
            _db = db;
            _logger = logger;
            _emailService = emailService;
        }

        public async Task<SaleResponseDto> CreateSaleAsync(CreateSaleDto dto)
        {
            if (dto.Items == null || dto.Items.Count == 0)
            {
                throw new InvalidOperationException("At least one sale item is required");
            }

            var customer = await _db.Customers.FindAsync(dto.CustomerId);
            if (customer == null)
            {
                throw new InvalidOperationException("Customer not found");
            }

            await using var tx = await _db.Database.BeginTransactionAsync();

            var sale = new Sale
            {
                CustomerId = dto.CustomerId,
                Date = DateTime.UtcNow
            };

            foreach (var item in dto.Items)
            {
                if (item.Quantity <= 0)
                {
                    throw new InvalidOperationException("Quantity must be greater than 0");
                }

                var part = await _db.Parts.AsNoTracking().FirstOrDefaultAsync(p => p.Id == item.PartId);
                if (part == null)
                {
                    throw new InvalidOperationException("Part not found");
                }

                var rowsUpdated = await _db.Parts
                    .Where(p => p.Id == item.PartId && p.Quantity >= item.Quantity)
                    .ExecuteUpdateAsync(setters => setters.SetProperty(p => p.Quantity, p => p.Quantity - item.Quantity));

                if (rowsUpdated == 0)
                {
                    throw new InvalidOperationException("Insufficient stock");
                }

                sale.Items.Add(new SaleItem
                {
                    PartId = item.PartId,
                    Quantity = item.Quantity,
                    Price = part.Price
                });
            }

            var originalTotal = sale.Items.Sum(i => i.Price * i.Quantity);
            var discount = originalTotal >= LoyaltyThreshold ? (originalTotal * LoyaltyDiscountRate) : 0m;
            var finalTotal = originalTotal - discount;

            sale.OriginalTotalAmount = originalTotal;
            sale.DiscountAmount = discount;
            sale.TotalAmount = finalTotal;

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

            _logger.LogInformation(
                "Sale {SaleId} created for customer {CustomerId} ({CustomerName}), original {OriginalTotal}, discount {Discount}, final {FinalTotal}, line items {ItemCount}",
                sale.Id,
                customer.Id,
                customer.Name,
                sale.OriginalTotalAmount,
                sale.DiscountAmount,
                sale.TotalAmount,
                sale.Items.Count);

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
            SaleInvoiceResponseDto? invoiceDto = null;
            if (invoice != null)
            {
                invoiceDto = new SaleInvoiceResponseDto
                {
                    Id = invoice.Id,
                    InvoiceNumber = invoice.InvoiceNumber,
                    CreatedDate = invoice.CreatedDate
                };
            }

            return new SaleResponseDto
            {
                Id = sale.Id,
                CustomerId = sale.CustomerId,
                CustomerName = sale.Customer?.Name ?? string.Empty,
                Date = sale.Date,
                TotalAmount = sale.OriginalTotalAmount,
                Discount = sale.DiscountAmount,
                FinalAmount = sale.TotalAmount,
                Items = sale.Items.Select(i => new SaleItemResponseDto
                {
                    PartId = i.PartId,
                    Quantity = i.Quantity,
                    Price = i.Price
                }).ToList(),
                InvoiceId = invoice?.Id ?? 0,
                InvoiceNumber = invoice?.InvoiceNumber ?? string.Empty,
                InvoiceCreatedDate = invoice?.CreatedDate ?? default,
                Invoice = invoiceDto
            };
        }

        public async Task SendInvoiceEmailAsync(int saleId, string? customEmail)
        {
            var sale = await _db.Sales
                .Include(s => s.Customer)
                .Include(s => s.Invoice)
                .Include(s => s.Items)
                    .ThenInclude(i => i.Part)
                .FirstOrDefaultAsync(s => s.Id == saleId);

            if (sale == null)
            {
                throw new InvalidOperationException("Sale not found.");
            }

            if (sale.Customer == null)
            {
                throw new InvalidOperationException("Customer not associated with this sale.");
            }

            var emailToSend = !string.IsNullOrWhiteSpace(customEmail) 
                ? customEmail.Trim() 
                : sale.Customer.Email;

            if (string.IsNullOrWhiteSpace(emailToSend) || emailToSend.EndsWith("@partshub.local", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("Please provide a valid customer email address.");
            }

            // Optional: update customer email in DB if a custom one is supplied
            if (!string.IsNullOrWhiteSpace(customEmail) && sale.Customer.Email != customEmail)
            {
                sale.Customer.Email = customEmail.Trim();
            }

            if (sale.Invoice == null)
            {
                throw new InvalidOperationException("Invoice not generated for this sale.");
            }

            var vehicleDetails = InferVehicle(sale.Customer.Address);
            var subject = $"Invoice {sale.Invoice.InvoiceNumber} - Vehicle Parts Management System";

            var htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; margin: 0; padding: 20px; background-color: #f9fafb; }}
        .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; overflow: hidden; }}
        .header {{ background-color: #1e3a8a; color: #ffffff; padding: 30px 20px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 24px; font-weight: 700; }}
        .header p {{ margin: 5px 0 0; font-size: 14px; opacity: 0.9; }}
        .content {{ padding: 30px 25px; }}
        .section {{ margin-bottom: 25px; border-bottom: 1px solid #f3f4f6; padding-bottom: 15px; }}
        .section-title {{ font-size: 14px; text-transform: uppercase; color: #6b7280; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 10px; }}
        .grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }}
        .field {{ margin-bottom: 10px; }}
        .label {{ font-size: 12px; color: #9ca3af; font-weight: 600; text-transform: uppercase; }}
        .value {{ font-size: 14px; color: #1f2937; font-weight: 500; }}
        .table {{ width: 100%; border-collapse: collapse; margin-top: 15px; }}
        .table th {{ background-color: #f9fafb; padding: 10px; text-align: left; font-size: 12px; color: #4b5563; font-weight: 600; text-transform: uppercase; border-bottom: 2px solid #e5e7eb; }}
        .table td {{ padding: 12px 10px; font-size: 14px; color: #374151; border-bottom: 1px solid #f3f4f6; }}
        .table tr:last-child td {{ border-bottom: none; }}
        .totals {{ margin-top: 20px; text-align: right; background-color: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; }}
        .totals-row {{ display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }}
        .totals-row.final {{ font-size: 18px; font-weight: 700; color: #1e3a8a; border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 8px; margin-bottom: 0; }}
        .footer {{ background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }}
        .footer p {{ margin: 5px 0; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>INVOICE</h1>
            <p>Invoice No: {sale.Invoice.InvoiceNumber} | Date: {sale.Date.ToLocalTime():yyyy-MM-dd HH:mm}</p>
        </div>
        <div class='content'>
            <div class='section grid'>
                <div>
                    <div class='section-title'>Customer Details</div>
                    <div class='field'>
                        <div class='label'>Name</div>
                        <div class='value'>{sale.Customer.Name}</div>
                    </div>
                    <div class='field'>
                        <div class='label'>Phone</div>
                        <div class='value'>{sale.Customer.Phone}</div>
                    </div>
                </div>
                <div>
                    <div class='section-title'>Vehicle Info</div>
                    <div class='field'>
                        <div class='label'>Vehicle/Address</div>
                        <div class='value'>{vehicleDetails}</div>
                    </div>
                </div>
            </div>

            <div class='section'>
                <div class='section-title'>Purchased Items</div>
                <table class='table'>
                    <thead>
                        <tr>
                            <th>Item/Part</th>
                            <th>Qty</th>
                            <th style='text-align: right;'>Unit Price</th>
                            <th style='text-align: right;'>Total</th>
                        </tr>
                    </thead>
                    <tbody>";

            foreach (var item in sale.Items)
            {
                var partName = item.Part != null ? item.Part.Name : $"Part #{item.PartId}";
                var itemTotal = item.Quantity * item.Price;
                htmlBody += $@"
                        <tr>
                            <td>{partName}</td>
                            <td>{item.Quantity}</td>
                            <td style='text-align: right;'>${item.Price:F2}</td>
                            <td style='text-align: right;'>${itemTotal:F2}</td>
                        </tr>";
            }

            htmlBody += $@"
                    </tbody>
                </table>
            </div>

            <div class='totals'>
                <div class='totals-row'>
                    <span>Subtotal:</span>
                    <strong>${sale.OriginalTotalAmount:F2}</strong>
                </div>";

            if (sale.DiscountAmount > 0)
            {
                htmlBody += $@"
                <div class='totals-row' style='color: #16a34a;'>
                    <span>Loyalty Discount:</span>
                    <strong>-${sale.DiscountAmount:F2}</strong>
                </div>";
            }

            htmlBody += $@"
                <div class='totals-row final'>
                    <span>Amount Payable:</span>
                    <span>${sale.TotalAmount:F2}</span>
                </div>
            </div>
        </div>
        <div class='footer'>
            <p><strong>Invincible Vehicle Parts Hub</strong></p>
            <p>123 Gearbox Lane, Auto City | Phone: +1 (555) 0199-283</p>
            <p>Thank you for your business!</p>
        </div>
    </div>
</body>
</html>";

            await _emailService.SendEmailAsync(emailToSend, subject, htmlBody);

            sale.Invoice.IsSent = true;
            sale.Invoice.SentDate = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            _logger.LogInformation($"Invoice {sale.Invoice.InvoiceNumber} successfully sent to {emailToSend}");
        }

        private static string InferVehicle(string address)
        {
            var raw = (address ?? "").Trim();
            if (string.IsNullOrEmpty(raw)) return "—";
            
            if (raw.StartsWith("Vehicle:", StringComparison.OrdinalIgnoreCase))
            {
                return raw.Substring(8).Trim();
            }
            return raw.Split(',')[0].Trim();
        }
    }
}
