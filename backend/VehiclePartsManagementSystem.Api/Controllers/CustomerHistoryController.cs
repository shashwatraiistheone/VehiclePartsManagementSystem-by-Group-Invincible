using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;
using VehiclePartsManagementSystem.Infrastructure.Data;

namespace VehiclePartsManagementSystem.Api.Controllers
{
    [ApiController]
    [Route("api/customer")]
    [Authorize]
    public class CustomerHistoryController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly ILoyaltyService _loyaltyService;

        public CustomerHistoryController(
            AppDbContext db,
            ILoyaltyService loyaltyService)
        {
            _db = db;
            _loyaltyService = loyaltyService;
        }

        [HttpGet("{id:int}/history")]
        public async Task<ActionResult<CustomerHistoryDto>> GetHistory(int id)
        {
            if (!CanAccessCustomer(id))
            {
                return Forbid();
            }

            var customer = await _db.Customers.FindAsync(id);
            if (customer == null)
            {
                return NotFound(new { message = "Customer not found" });
            }

            var purchases = await LoadPurchasesAsync(id);
            var services = await LoadServicesAsync(id);

            var dto = new CustomerHistoryDto
            {
                CustomerId = id,
                CustomerName = customer.Name,
                CustomerEmail = customer.Email,
                Purchases = purchases,
                Services = services,
            };

            return Ok(dto);
        }

        [HttpGet("{id:int}/purchase-history")]
        public async Task<ActionResult<PagedResultDto<PurchaseHistoryDto>>> GetPurchaseHistory(
            int id,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 5)
        {
            if (!CanAccessCustomer(id))
            {
                return Forbid();
            }

            if (!await _db.Customers.AnyAsync(c => c.Id == id))
            {
                return NotFound(new { message = "Customer not found" });
            }

            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 50);

            var all = await LoadPurchasesAsync(id);
            return Ok(ToPaged(all, page, pageSize));
        }

        [HttpGet("{id:int}/service-history")]
        public async Task<ActionResult<PagedResultDto<ServiceHistoryDto>>> GetServiceHistory(
            int id,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 5)
        {
            if (!CanAccessCustomer(id))
            {
                return Forbid();
            }

            if (!await _db.Customers.AnyAsync(c => c.Id == id))
            {
                return NotFound(new { message = "Customer not found" });
            }

            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 50);

            var all = await LoadServicesAsync(id);
            return Ok(ToPaged(all, page, pageSize));
        }

        [HttpGet("{id:int}/appointments")]
        public async Task<ActionResult<List<ServiceHistoryDto>>> GetAppointments(int id)
        {
            if (!CanAccessCustomer(id))
            {
                return Forbid();
            }

            if (!await _db.Customers.AnyAsync(c => c.Id == id))
            {
                return NotFound(new { message = "Customer not found" });
            }

            return Ok(await LoadServicesAsync(id));
        }

        [HttpGet("{id:int}/loyalty")]
        public async Task<ActionResult<CustomerLoyaltyDto>> GetLoyalty(int id, CancellationToken cancellationToken)
        {
            if (!CanAccessCustomer(id))
            {
                return Forbid();
            }

            var loyalty = await _loyaltyService.GetCustomerLoyaltyAsync(id, cancellationToken);
            if (loyalty == null)
            {
                return NotFound(new { message = "Customer not found" });
            }

            return Ok(loyalty);
        }

        private async Task<List<PurchaseHistoryDto>> LoadPurchasesAsync(int customerId)
        {
            var purchases = await _db.Sales
                .Where(s => s.CustomerId == customerId)
                .Include(s => s.Invoice)
                .Include(s => s.Items)
                .ThenInclude(i => i.Part)
                .OrderByDescending(s => s.Date)
                .ToListAsync();

            return purchases.Select(s => new PurchaseHistoryDto
            {
                SaleId = s.Id,
                InvoiceNumber = s.Invoice != null ? s.Invoice.InvoiceNumber : $"SALE-{s.Id}",
                PaymentStatus = s.Invoice != null ? s.Invoice.PaymentStatus : "Credit",
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
                    Price = i.Price,
                }).ToList(),
            }).ToList();
        }

        private async Task<List<ServiceHistoryDto>> LoadServicesAsync(int customerId)
        {
            var services = await _db.ServiceAppointments
                .Where(a => a.CustomerId == customerId)
                .OrderByDescending(a => a.Date)
                .ToListAsync();

            return services.Select(a => new ServiceHistoryDto
            {
                AppointmentId = a.Id,
                ServiceType = a.ServiceType,
                Status = a.Status,
                VehicleNumber = a.VehicleNumber,
                Date = a.Date.ToString("O"),
                Notes = a.Notes,
                AssignedStaff = ResolveAssignedStaff(a.Status),
            }).ToList();
        }

        private static string ResolveAssignedStaff(string status)
        {
            var s = status.ToLowerInvariant();
            if (s.Contains("cancel"))
            {
                return "—";
            }

            return "Service Desk";
        }

        private static PagedResultDto<T> ToPaged<T>(List<T> all, int page, int pageSize)
        {
            var total = all.Count;
            var totalPages = total == 0 ? 0 : (int)Math.Ceiling(total / (double)pageSize);
            var items = all.Skip((page - 1) * pageSize).Take(pageSize).ToList();
            return new PagedResultDto<T>
            {
                Items = items,
                Page = page,
                PageSize = pageSize,
                TotalCount = total,
                TotalPages = totalPages,
            };
        }

        private bool CanAccessCustomer(int customerId)
        {
            if (User.IsInRole("Admin") || User.IsInRole("Staff"))
            {
                return true;
            }

            if (User.IsInRole("Customer"))
            {
                var claimId = User.FindFirst("sub")?.Value ?? User.FindFirst("userId")?.Value;
                return int.TryParse(claimId, out var id) && id == customerId;
            }

            return false;
        }
    }
}
