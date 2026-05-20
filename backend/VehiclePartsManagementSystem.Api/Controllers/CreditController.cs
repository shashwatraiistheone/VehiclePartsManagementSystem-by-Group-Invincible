using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;
using VehiclePartsManagementSystem.Domain.Entities;
using VehiclePartsManagementSystem.Infrastructure.Data;
using VehiclePartsManagementSystem.Infrastructure.Services;

namespace VehiclePartsManagementSystem.Api.Controllers
{
    [ApiController]
    [Route("api/credit")]
    [Authorize(Roles = "Admin,Staff")]
    public class CreditController : ControllerBase
    {
        private static readonly string[] AllowedPaymentMethods =
        {
            "Cash", "Card", "Bank Transfer", "eSewa", "Khalti",
        };

        private readonly AppDbContext _db;
        private readonly ICreditReminderService _creditReminderService;

        public CreditController(AppDbContext db, ICreditReminderService creditReminderService)
        {
            _db = db;
            _creditReminderService = creditReminderService;
        }

        [HttpGet]
        public async Task<ActionResult<object>> GetAll(CancellationToken cancellationToken)
        {
            var invoices = await LoadInvoicesQuery().ToListAsync(cancellationToken);
            var items = invoices.Select(MapToDto).ToList();
            var totalReceivables = items
                .Where(i => !string.Equals(i.Status, InvoicePaymentStatus.Paid, StringComparison.OrdinalIgnoreCase))
                .Sum(i => i.BalanceDue);

            return Ok(new { totalReceivables, items });
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<CreditInvoiceDto>> GetById(int id, CancellationToken cancellationToken)
        {
            var invoice = await LoadInvoicesQuery()
                .FirstOrDefaultAsync(i => i.Id == id, cancellationToken);

            if (invoice == null)
            {
                return NotFound(new { message = "Credit invoice not found." });
            }

            return Ok(MapToDto(invoice));
        }

        [HttpGet("history/{invoiceId:int}")]
        public async Task<ActionResult<List<CreditPaymentHistoryDto>>> GetPaymentHistory(
            int invoiceId,
            CancellationToken cancellationToken)
        {
            var invoice = await _db.Invoices
                .AsNoTracking()
                .Include(i => i.Sale)
                .FirstOrDefaultAsync(i => i.Id == invoiceId, cancellationToken);

            if (invoice == null)
            {
                return NotFound(new { message = "Invoice not found." });
            }

            var payments = await _db.InvoicePayments
                .AsNoTracking()
                .Where(p => p.InvoiceId == invoiceId)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync(cancellationToken);

            var staffIds = payments
                .Where(p => p.StaffId.HasValue)
                .Select(p => p.StaffId!.Value)
                .Distinct()
                .ToList();

            var staffNames = staffIds.Count == 0
                ? new Dictionary<int, string>()
                : await _db.Users
                    .AsNoTracking()
                    .Where(u => staffIds.Contains(u.Id))
                    .ToDictionaryAsync(u => u.Id, u => u.Username, cancellationToken);

            var total = await GetInvoiceTotalAsync(invoice, cancellationToken);
            var runningPaid = 0m;
            var history = new List<CreditPaymentHistoryDto>();

            foreach (var payment in payments.OrderBy(p => p.CreatedAt))
            {
                runningPaid += payment.Amount;
                var remaining = Math.Max(0, total - runningPaid);
                history.Add(new CreditPaymentHistoryDto
                {
                    Id = payment.Id,
                    InvoiceId = payment.InvoiceId,
                    AmountPaid = payment.Amount,
                    RemainingBalanceAfter = remaining,
                    PaymentMethod = payment.PaymentMethod,
                    Notes = payment.Notes,
                    PaymentDate = payment.CreatedAt,
                    Status = remaining <= 0
                        ? "PAID"
                        : runningPaid > 0 ? "PARTIAL" : "UNPAID",
                    StaffId = payment.StaffId,
                    StaffMember = payment.StaffId.HasValue && staffNames.TryGetValue(payment.StaffId.Value, out var name)
                        ? name
                        : null,
                });
            }

            return Ok(history.OrderByDescending(h => h.PaymentDate).ToList());
        }

        [HttpPost("pay")]
        public Task<IActionResult> PayLegacy([FromBody] CreditPayDto dto, CancellationToken cancellationToken)
            => ProcessPaymentAsync(dto, cancellationToken);

        [HttpPost("payment")]
        public Task<IActionResult> RecordPayment([FromBody] CreditPayDto dto, CancellationToken cancellationToken)
            => ProcessPaymentAsync(dto, cancellationToken);

        private async Task<IActionResult> ProcessPaymentAsync(CreditPayDto dto, CancellationToken cancellationToken)
        {
            if (dto.InvoiceId <= 0 || dto.Amount <= 0)
            {
                return BadRequest(new { message = "Valid invoice and payment amount are required." });
            }

            var method = NormalizePaymentMethod(dto.PaymentMethod);

            var invoice = await _db.Invoices
                .Include(i => i.Sale)
                    .ThenInclude(s => s!.Customer)
                .FirstOrDefaultAsync(i => i.Id == dto.InvoiceId, cancellationToken);

            if (invoice == null)
            {
                return NotFound(new { message = "Invoice not found." });
            }

            if (invoice.IsPaid || invoice.BalanceAmount <= 0)
            {
                return BadRequest(new { message = "Invoice has no outstanding balance." });
            }

            if (dto.Amount > invoice.BalanceAmount)
            {
                return BadRequest(new { message = $"Payment cannot exceed balance of {invoice.BalanceAmount:N2}." });
            }

            var total = invoice.Sale?.TotalAmount ?? (invoice.PaidAmount + invoice.BalanceAmount);

            invoice.PaidAmount += dto.Amount;
            invoice.BalanceAmount -= dto.Amount;

            if (invoice.BalanceAmount <= 0)
            {
                invoice.BalanceAmount = 0m;
                invoice.PaymentStatus = InvoicePaymentStatus.Paid;
                invoice.IsPaid = true;
                await RemoveUnpaidNotificationAsync(invoice.Id, cancellationToken);
            }
            else
            {
                invoice.PaymentStatus = InvoicePaymentStatus.Partial;
                invoice.IsPaid = false;
            }

            var staffId = GetCurrentStaffId();

            var payment = new InvoicePayment
            {
                InvoiceId = invoice.Id,
                Amount = dto.Amount,
                PaymentMethod = method,
                Notes = string.IsNullOrWhiteSpace(dto.Notes) ? null : dto.Notes.Trim(),
                StaffId = staffId,
                CreatedAt = DateTime.UtcNow,
            };

            await _db.InvoicePayments.AddAsync(payment, cancellationToken);
            await _db.SaveChangesAsync(cancellationToken);

            var statusLabel = invoice.IsPaid ? "PAID" : "PARTIAL";
            var customer = invoice.Sale?.Customer;
            var mappedInvoice = MapToDto(invoice);
            var totalReceivables = await ComputeTotalReceivablesAsync(cancellationToken);

            return Ok(new CreditPaymentResponseDto
            {
                Success = true,
                Message = invoice.IsPaid
                    ? $"Payment of {dto.Amount:N2} recorded. Invoice paid in full."
                    : $"Payment of {dto.Amount:N2} recorded. Remaining balance: {invoice.BalanceAmount:N2}.",
                PaidAmount = dto.Amount,
                RemainingBalance = invoice.BalanceAmount,
                Status = statusLabel,
                TotalReceivables = totalReceivables,
                Invoice = mappedInvoice,
                Receipt = new CreditPaymentReceiptDto
                {
                    PaymentId = payment.Id,
                    InvoiceNumber = invoice.InvoiceNumber,
                    CustomerName = customer?.Name ?? "Unknown",
                    AmountPaid = dto.Amount,
                    RemainingBalance = invoice.BalanceAmount,
                    TotalAmount = total,
                    PaymentMethod = method,
                    Status = statusLabel,
                    PaymentDate = payment.CreatedAt,
                },
            });
        }

        private async Task<decimal> ComputeTotalReceivablesAsync(CancellationToken cancellationToken)
        {
            return await _db.Invoices
                .AsNoTracking()
                .Where(i => !i.IsPaid && i.BalanceAmount > 0)
                .SumAsync(i => i.BalanceAmount, cancellationToken);
        }

        private int? GetCurrentStaffId()
        {
            if (!User.IsInRole("Admin") && !User.IsInRole("Staff"))
            {
                return null;
            }

            var claimId = User.FindFirst("sub")?.Value ?? User.FindFirst("userId")?.Value;
            return int.TryParse(claimId, out var id) ? id : null;
        }

        private async Task<decimal> GetInvoiceTotalAsync(Invoice invoice, CancellationToken cancellationToken)
        {
            if (invoice.Sale != null)
            {
                return invoice.Sale.TotalAmount;
            }

            var sale = await _db.Sales
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == invoice.SaleId, cancellationToken);

            return sale?.TotalAmount ?? (invoice.PaidAmount + invoice.BalanceAmount);
        }

        [HttpPost("remind")]
        public async Task<IActionResult> Remind([FromBody] CreditRemindDto dto, CancellationToken cancellationToken)
        {
            var result = await _creditReminderService.SendReminderAsync(dto.InvoiceId, manual: true, cancellationToken);
            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }

            return Ok(new
            {
                message = result.Message,
                emailType = result.EmailType,
                overdueDays = result.OverdueDays,
                log = result.Log,
            });
        }

        [HttpGet("{id:int}/email-logs")]
        public async Task<ActionResult<List<EmailLogDto>>> GetEmailLogs(int id, CancellationToken cancellationToken)
        {
            var exists = await _db.Invoices.AsNoTracking().AnyAsync(i => i.Id == id, cancellationToken);
            if (!exists)
            {
                return NotFound(new { message = "Invoice not found." });
            }

            var logs = await _db.EmailLogs
                .AsNoTracking()
                .Where(e => e.InvoiceId == id)
                .OrderByDescending(e => e.SentAt)
                .ToListAsync(cancellationToken);

            return Ok(logs.Select(CreditReminderService.MapLog).ToList());
        }

        private IQueryable<Invoice> LoadInvoicesQuery()
        {
            return _db.Invoices
                .AsNoTracking()
                .Include(i => i.Sale)
                    .ThenInclude(s => s!.Customer)
                .OrderByDescending(i => i.BalanceAmount)
                .ThenByDescending(i => i.CreatedDate);
        }

        private static CreditInvoiceDto MapToDto(Invoice invoice)
        {
            var total = invoice.Sale?.TotalAmount ?? (invoice.PaidAmount + invoice.BalanceAmount);
            var balance = invoice.BalanceAmount;
            if (balance <= 0 && !invoice.IsPaid && invoice.Sale != null)
            {
                balance = invoice.Sale.TotalAmount - invoice.PaidAmount;
            }

            var due = invoice.DueDate == default
                ? invoice.CreatedDate.AddDays(30)
                : invoice.DueDate;

            var overdueDays = 0;
            if (!invoice.IsPaid && balance > 0)
            {
                overdueDays = Math.Max(0, (DateTime.UtcNow.Date - due.Date).Days);
            }

            var customer = invoice.Sale?.Customer;

            return new CreditInvoiceDto
            {
                Id = invoice.Id,
                InvoiceNumber = invoice.InvoiceNumber,
                InvoiceDate = invoice.CreatedDate,
                DueDate = due,
                CustomerId = customer?.Id ?? 0,
                CustomerName = customer?.Name ?? "Unknown",
                CustomerEmail = customer?.Email ?? string.Empty,
                OriginalAmount = total,
                BalanceDue = Math.Max(0, balance),
                PaidAmount = invoice.PaidAmount,
                Status = invoice.PaymentStatus,
                OverdueDays = overdueDays,
                ReminderSentCount = invoice.ReminderSentCount,
                LastReminderDate = invoice.LastReminderDate,
            };
        }

        private static string NormalizePaymentMethod(string? method)
        {
            if (string.IsNullOrWhiteSpace(method))
            {
                return "Cash";
            }

            var match = AllowedPaymentMethods.FirstOrDefault(
                m => string.Equals(m, method.Trim(), StringComparison.OrdinalIgnoreCase));

            return match ?? "Cash";
        }

        private async Task RemoveUnpaidNotificationAsync(int invoiceId, CancellationToken cancellationToken)
        {
            var linked = await _db.Notifications
                .FirstOrDefaultAsync(
                    n => n.ReferenceId == $"invoice-{invoiceId}" && n.Type == "UnpaidCredit",
                    cancellationToken);

            if (linked != null)
            {
                _db.Notifications.Remove(linked);
            }
        }
    }
}
