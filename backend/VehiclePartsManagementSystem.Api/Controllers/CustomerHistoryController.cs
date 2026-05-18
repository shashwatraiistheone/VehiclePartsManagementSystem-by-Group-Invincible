using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Infrastructure.Data;

namespace VehiclePartsManagementSystem.Api.Controllers
{
    [ApiController]
    [Route("api/customer")]
    public class CustomerHistoryController : ControllerBase
    {
        private readonly AppDbContext _db;

        public CustomerHistoryController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet("{id:int}/history")]
        public async Task<ActionResult<CustomerHistoryDto>> GetHistory(int id)
        {
            var customer = await _db.Customers.FindAsync(id);
            if (customer == null)
            {
                return NotFound(new { message = "Customer not found" });
            }

            var purchases = await _db.Sales
                .Where(s => s.CustomerId == id)
                .Include(s => s.Invoice)
                .Include(s => s.Items)
                .ThenInclude(i => i.Part)
                .OrderByDescending(s => s.Date)
                .ToListAsync();

            var services = await _db.ServiceAppointments
                .Where(a => a.CustomerId == id)
                .OrderByDescending(a => a.Date)
                .ToListAsync();

            var dto = new CustomerHistoryDto
            {
                CustomerId = id,
                CustomerName = customer.Name,
                CustomerEmail = customer.Email,
                Purchases = purchases.Select(s => new PurchaseHistoryDto
                {
                    SaleId = s.Id,
                    Date = s.Date.ToString("O"),
                    TotalAmount = s.OriginalTotalAmount,
                    Discount = s.DiscountAmount,
                    FinalAmount = s.TotalAmount,
                    IsInvoiceSent = s.Invoice != null && s.Invoice.IsSent,
                    InvoiceSentDate = s.Invoice != null && s.Invoice.IsSent && s.Invoice.SentDate.HasValue 
                        ? s.Invoice.SentDate.Value.ToString("O") 
                        : null,
                    Items = s.Items.Select(i => new PurchaseItemHistoryDto
                    {
                        PartId = i.PartId,
                        PartName = i.Part != null ? i.Part.Name : string.Empty,
                        Quantity = i.Quantity,
                        Price = i.Price
                    }).ToList()
                }).ToList(),
                Services = services.Select(a => new ServiceHistoryDto
                {
                    AppointmentId = a.Id,
                    ServiceType = a.ServiceType,
                    Status = a.Status,
                    Date = a.Date.ToString("O")
                }).ToList()
            };

            return Ok(dto);
        }
    }
}

