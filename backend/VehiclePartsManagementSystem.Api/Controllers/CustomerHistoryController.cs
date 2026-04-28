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
            var customerExists = await _db.Customers.AnyAsync(c => c.Id == id);
            if (!customerExists)
            {
                return NotFound(new { message = "Customer not found" });
            }

            var purchases = await _db.Sales
                .Where(s => s.CustomerId == id)
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
                Purchases = purchases.Select(s => new PurchaseHistoryDto
                {
                    SaleId = s.Id,
                    Date = s.Date.ToString("O"),
                    TotalAmount = s.TotalAmount,
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

