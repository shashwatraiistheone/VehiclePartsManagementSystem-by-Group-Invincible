using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VehiclePartsManagementSystem.Infrastructure.Data;
using VehiclePartsManagementSystem.Domain.Entities;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;
using System.Linq;

namespace VehiclePartsManagementSystem.Api.Controllers
{
    [ApiController]
    [Route("api/notifications")]
    public class NotificationsController : ControllerBase
    {
        private readonly AppDbContext _db;

        public NotificationsController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<ActionResult<List<Notification>>> GetNotifications()
        {
            try
            {
                // 1. Scan for Low Stock Parts (quantity < 10)
                var lowStockParts = await _db.Parts
                    .Include(p => p.Vendor)
                    .Where(p => p.Quantity < 10)
                    .ToListAsync();

                var activeLowStockRefIds = new HashSet<string>();

                foreach (var part in lowStockParts)
                {
                    var refId = $"part-{part.Id}";
                    activeLowStockRefIds.Add(refId);

                    // Check if notification already exists
                    var exists = await _db.Notifications.AnyAsync(n => n.ReferenceId == refId && n.Type == "LowStock");
                    if (!exists)
                    {
                        var vendorInfo = part.Vendor != null ? $" (Vendor: {part.Vendor.Name})" : "";
                        _db.Notifications.Add(new Notification
                        {
                            Title = $"Low Stock: {part.Name}",
                            Message = $"The stock of '{part.Name}' is low. Current quantity: {part.Quantity}.{vendorInfo}",
                            Type = "LowStock",
                            ReferenceId = refId,
                            IsRead = false,
                            CreatedAt = DateTime.UtcNow
                        });
                    }
                }

                // 2. Scan for Overdue Unpaid Invoices (older than 30 days and unpaid)
                var cutoffDate = DateTime.UtcNow.AddDays(-30);
                var overdueInvoices = await _db.Invoices
                    .Include(i => i.Sale)
                        .ThenInclude(s => s!.Customer)
                    .Where(i => i.CreatedDate < cutoffDate && !i.IsPaid)
                    .ToListAsync();

                var activeOverdueRefIds = new HashSet<string>();

                foreach (var invoice in overdueInvoices)
                {
                    var refId = $"invoice-{invoice.Id}";
                    activeOverdueRefIds.Add(refId);

                    // Check if notification already exists
                    var exists = await _db.Notifications.AnyAsync(n => n.ReferenceId == refId && n.Type == "UnpaidCredit");
                    if (!exists)
                    {
                        var customerName = invoice.Sale?.Customer?.Name ?? "Unknown Customer";
                        var amount = invoice.Sale?.TotalAmount ?? 0m;
                        _db.Notifications.Add(new Notification
                        {
                            Title = $"Overdue Credit: {customerName}",
                            Message = $"Invoice {invoice.InvoiceNumber} for {customerName} has been unpaid for more than 30 days. Amount due: Rs {amount:N2}.",
                            Type = "UnpaidCredit",
                            ReferenceId = refId,
                            IsRead = false,
                            CreatedAt = DateTime.UtcNow
                        });
                    }
                }

                await _db.SaveChangesAsync();

                // 3. Auto-resolve/remove notifications that are no longer active
                // e.g., if a part's stock goes back up >= 10, or an invoice is paid
                var allNotifications = await _db.Notifications.ToListAsync();
                var notificationsToDelete = new List<Notification>();

                foreach (var n in allNotifications)
                {
                    if (n.Type == "LowStock" && !activeLowStockRefIds.Contains(n.ReferenceId))
                    {
                        notificationsToDelete.Add(n);
                    }
                    else if (n.Type == "UnpaidCredit" && !activeOverdueRefIds.Contains(n.ReferenceId))
                    {
                        notificationsToDelete.Add(n);
                    }
                }

                if (notificationsToDelete.Count > 0)
                {
                    _db.Notifications.RemoveRange(notificationsToDelete);
                    await _db.SaveChangesAsync();
                }

                // 4. Return all remaining active notifications
                var remaining = await _db.Notifications
                    .OrderBy(n => n.IsRead)
                    .ThenByDescending(n => n.CreatedAt)
                    .ToListAsync();

                return Ok(remaining);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error processing notifications: {ex.Message}" });
            }
        }

        [HttpPost("{id:int}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var notification = await _db.Notifications.FindAsync(id);
            if (notification == null)
            {
                return NotFound(new { message = "Notification not found" });
            }

            notification.IsRead = true;
            await _db.SaveChangesAsync();

            return Ok(new { message = "Notification marked as read" });
        }

        [HttpPost("read-all")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var unread = await _db.Notifications.Where(n => !n.IsRead).ToListAsync();
            foreach (var n in unread)
            {
                n.IsRead = true;
            }
            await _db.SaveChangesAsync();

            return Ok(new { message = "All notifications marked as read" });
        }
    }
}
