using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VehiclePartsManagementSystem.Infrastructure.Data;
using VehiclePartsManagementSystem.Application.Interfaces;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;
using System.Linq;

namespace VehiclePartsManagementSystem.Api.Controllers
{
    [ApiController]
    [Route("api/invoices")]
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
            try
            {
                var invoices = await _db.Invoices
                    .Include(i => i.Sale)
                        .ThenInclude(s => s!.Customer)
                    .OrderByDescending(i => i.CreatedDate)
                    .Select(i => new
                    {
                        i.Id,
                        i.InvoiceNumber,
                        i.CreatedDate,
                        i.IsSent,
                        i.SentDate,
                        i.IsPaid,
                        i.ReminderSentCount,
                        i.LastReminderDate,
                        Sale = i.Sale != null ? new
                        {
                            i.Sale.Id,
                            i.Sale.TotalAmount,
                            i.Sale.DiscountAmount,
                            i.Sale.OriginalTotalAmount,
                            Customer = i.Sale.Customer != null ? new
                            {
                                i.Sale.Customer.Id,
                                i.Sale.Customer.Name,
                                i.Sale.Customer.Email,
                                i.Sale.Customer.Phone,
                                i.Sale.Customer.Address
                            } : null
                        } : null
                    })
                    .ToListAsync();

                return Ok(invoices);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error retrieving invoices: {ex.Message}" });
            }
        }

        [HttpPost("{id:int}/pay")]
        public async Task<IActionResult> MarkAsPaid(int id)
        {
            try
            {
                var invoice = await _db.Invoices.FindAsync(id);
                if (invoice == null)
                {
                    return NotFound(new { message = "Invoice not found." });
                }

                invoice.IsPaid = true;
                await _db.SaveChangesAsync();

                // Auto-delete any linked "UnpaidCredit" notification
                var linkedNotification = await _db.Notifications
                    .FirstOrDefaultAsync(n => n.ReferenceId == $"invoice-{id}" && n.Type == "UnpaidCredit");
                if (linkedNotification != null)
                {
                    _db.Notifications.Remove(linkedNotification);
                    await _db.SaveChangesAsync();
                }

                return Ok(new { message = "Invoice marked as paid successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error updating payment status: {ex.Message}" });
            }
        }

        [HttpPost("{id:int}/send-reminder")]
        public async Task<IActionResult> SendReminder(int id)
        {
            try
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
                    return BadRequest(new { message = "Customer email is invalid or points to @partshub.local. Please update the customer profile with a valid email first." });
                }

                var subject = $"Overdue Invoice Payment Reminder: {invoice.InvoiceNumber}";
                var dueDate = invoice.CreatedDate.AddDays(30);
                var pendingAmount = invoice.Sale!.TotalAmount;

                var htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; padding: 20px; background-color: #f9fafb; }}
        .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; overflow: hidden; }}
        .header {{ background-color: #dc2626; color: #ffffff; padding: 30px 20px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 24px; font-weight: 700; }}
        .header p {{ margin: 5px 0 0; font-size: 14px; opacity: 0.9; }}
        .content {{ padding: 30px 25px; }}
        .section {{ margin-bottom: 25px; }}
        .totals-row {{ display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 16px; border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 8px; font-weight: 700; color: #dc2626; }}
        .footer {{ background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>PAYMENT REMINDER</h1>
            <p>Invoice No: {invoice.InvoiceNumber} | Due Date: {dueDate.ToLocalTime():yyyy-MM-dd}</p>
        </div>
        <div class='content'>
            <p>Dear {customer.Name},</p>
            <p>This is a friendly reminder that invoice <strong>{invoice.InvoiceNumber}</strong> generated on {invoice.CreatedDate.ToLocalTime():yyyy-MM-dd} is overdue.</p>
            <p>We kindly request you to settle the outstanding payment as soon as possible.</p>
            <div class='section'>
                <div class='totals-row'>
                    <span>Amount Outstanding:</span>
                    <span>Rs {pendingAmount:N2}</span>
                </div>
            </div>
            <p>If you have already made the payment, please disregard this reminder.</p>
        </div>
        <div class='footer'>
            <p><strong>Invincible Vehicle Parts Hub</strong></p>
            <p>123 Gearbox Lane, Auto City | Phone: +1 (555) 0199-283</p>
            <p>Thank you for your cooperation!</p>
        </div>
    </div>
</body>
</html>";

                await _emailService.SendEmailAsync(emailToSend, subject, htmlBody);

                invoice.ReminderSentCount++;
                invoice.LastReminderDate = DateTime.UtcNow;
                await _db.SaveChangesAsync();

                return Ok(new { message = "Payment reminder email successfully sent to customer." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error sending email reminder: {ex.Message}" });
            }
        }
    }
}
