using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;
using VehiclePartsManagementSystem.Domain.Entities;
using VehiclePartsManagementSystem.Infrastructure.Data;

namespace VehiclePartsManagementSystem.Api.Controllers
{
    [ApiController]
    [Route("api/invoices")]
    [Authorize(Roles = "Admin,Staff")]
    public class InvoicesController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IEmailService _emailService;

        public InvoicesController(AppDbContext db, IEmailService emailService)
        {
            _db = db;
            _emailService = emailService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllInvoices()
        {
            var invoices = await _db.Invoices
                .AsNoTracking()
                .Include(i => i.Sale)
                    .ThenInclude(s => s!.Customer)
                .OrderByDescending(i => i.CreatedDate)
                .Select(i => new
                {
                    i.Id,
                    i.InvoiceNumber,
                    i.CreatedDate,
                    i.DueDate,
                    i.IsSent,
                    i.SentDate,
                    i.IsPaid,
                    i.PaymentStatus,
                    i.PaidAmount,
                    i.BalanceAmount,
                    i.ReminderSentCount,
                    i.LastReminderDate,
                    Sale = i.Sale == null ? null : new
                    {
                        i.Sale.Id,
                        i.Sale.TotalAmount,
                        i.Sale.DiscountAmount,
                        i.Sale.OriginalTotalAmount,
                        Customer = i.Sale.Customer == null ? null : new
                        {
                            i.Sale.Customer.Id,
                            i.Sale.Customer.Name,
                            i.Sale.Customer.Email,
                            i.Sale.Customer.Phone,
                            i.Sale.Customer.Address,
                        },
                    },
                })
                .ToListAsync();

            return Ok(invoices);
        }

        [HttpPost("{id:int}/pay")]
        public async Task<IActionResult> MarkAsPaid(int id)
        {
            var invoice = await _db.Invoices.Include(i => i.Sale).FirstOrDefaultAsync(i => i.Id == id);
            if (invoice == null)
            {
                return NotFound(new { message = "Invoice not found." });
            }

            var total = invoice.Sale?.TotalAmount ?? invoice.BalanceAmount + invoice.PaidAmount;
            invoice.PaidAmount = total;
            invoice.BalanceAmount = 0m;
            invoice.PaymentStatus = InvoicePaymentStatus.Paid;
            invoice.IsPaid = true;

            await RemoveUnpaidNotificationAsync(id);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Invoice marked as paid successfully." });
        }

        [HttpPost("{id:int}/payment")]
        public async Task<IActionResult> RecordPayment(int id, [FromBody] RecordPaymentDto dto)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            var invoice = await _db.Invoices.Include(i => i.Sale).FirstOrDefaultAsync(i => i.Id == id);
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

            invoice.PaidAmount += dto.Amount;
            invoice.BalanceAmount -= dto.Amount;

            if (invoice.BalanceAmount <= 0)
            {
                invoice.BalanceAmount = 0m;
                invoice.PaymentStatus = InvoicePaymentStatus.Paid;
                invoice.IsPaid = true;
                await RemoveUnpaidNotificationAsync(id);
            }
            else
            {
                invoice.PaymentStatus = InvoicePaymentStatus.Partial;
                invoice.IsPaid = false;
            }

            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Payment recorded.",
                invoice.PaymentStatus,
                invoice.PaidAmount,
                invoice.BalanceAmount,
                invoice.IsPaid,
            });
        }

        [HttpPost("{id:int}/send-reminder")]
        public async Task<IActionResult> SendReminder(int id)
        {
            var invoice = await _db.Invoices
                .Include(i => i.Sale)
                    .ThenInclude(s => s!.Customer)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (invoice == null)
            {
                return NotFound(new { message = "Invoice not found." });
            }

            var customer = invoice.Sale?.Customer;
            if (customer == null)
            {
                return BadRequest(new { message = "Customer details not found for this invoice." });
            }

            var emailToSend = customer.Email;
            if (string.IsNullOrWhiteSpace(emailToSend) || emailToSend.EndsWith("@partshub.local", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { message = "Customer email is invalid. Update the customer profile first." });
            }

            var subject = $"Overdue Invoice Payment Reminder: {invoice.InvoiceNumber}";
            var htmlBody = $@"
<p>Dear {customer.Name},</p>
<p>Invoice <strong>{invoice.InvoiceNumber}</strong> had a due date of {invoice.DueDate:yyyy-MM-dd}.</p>
<p>Outstanding balance: <strong>Rs {invoice.BalanceAmount:N2}</strong></p>
<p>Please settle this amount at your earliest convenience.</p>";

            await _emailService.SendEmailAsync(emailToSend, subject, htmlBody);

            invoice.ReminderSentCount++;
            invoice.LastReminderDate = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new { message = "Payment reminder email successfully sent to customer." });
        }

        private async Task RemoveUnpaidNotificationAsync(int invoiceId)
        {
            var linked = await _db.Notifications
                .FirstOrDefaultAsync(n => n.ReferenceId == $"invoice-{invoiceId}" && n.Type == "UnpaidCredit");
            if (linked != null)
            {
                _db.Notifications.Remove(linked);
            }
        }
    }
}
