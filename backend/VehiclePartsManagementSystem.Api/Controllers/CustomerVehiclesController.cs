using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;
using VehiclePartsManagementSystem.Infrastructure.Data;

namespace VehiclePartsManagementSystem.Api.Controllers
{
    [ApiController]
    [Route("api/customer/{customerId:int}/vehicles")]
    [Authorize]
    public class CustomerVehiclesController : ControllerBase
    {
        private readonly ICustomerVehicleService _vehicleService;
        private readonly AppDbContext _db;

        public CustomerVehiclesController(ICustomerVehicleService vehicleService, AppDbContext db)
        {
            _vehicleService = vehicleService;
            _db = db;
        }

        [HttpGet("~/api/customer/vehicle-number-suggestions")]
        [ProducesResponseType(typeof(List<string>), StatusCodes.Status200OK)]
        public async Task<ActionResult<List<string>>> SearchVehicleNumbers(
            [FromQuery] string? q,
            CancellationToken cancellationToken)
        {
            var numbers = await _vehicleService.SearchVehicleNumbersAsync(q, 15, cancellationToken);
            return Ok(numbers);
        }

        [HttpGet]
        [ProducesResponseType(typeof(List<VehicleDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<List<VehicleDto>>> GetAll(int customerId, CancellationToken cancellationToken)
        {
            if (!CanAccess(customerId))
            {
                return Forbid();
            }

            var vehicles = await _vehicleService.GetByCustomerIdAsync(customerId, cancellationToken);

            var services = await _db.ServiceAppointments
                .AsNoTracking()
                .Where(a => a.CustomerId == customerId && a.VehicleNumber != null)
                .OrderByDescending(a => a.Date)
                .ToListAsync(cancellationToken);

            var lastByPlate = services
                .GroupBy(a => a.VehicleNumber!.Trim().ToUpperInvariant())
                .ToDictionary(g => g.Key, g => g.First().Date);

            foreach (var v in vehicles)
            {
                var key = v.VehicleNumber.Trim().ToUpperInvariant();
                if (lastByPlate.TryGetValue(key, out var last))
                {
                    v.LastServiceDate = last.ToString("O");
                }
            }

            return Ok(vehicles);
        }

        [HttpPost]
        [ProducesResponseType(typeof(VehicleDto), StatusCodes.Status201Created)]
        public async Task<ActionResult<VehicleDto>> Create(
            int customerId,
            [FromBody] VehicleInputDto dto,
            CancellationToken cancellationToken)
        {
            if (!CanAccess(customerId))
            {
                return Forbid();
            }

            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            try
            {
                var created = await _vehicleService.AddAsync(customerId, dto, cancellationToken);
                if (created == null)
                {
                    return NotFound(new { message = "Customer not found." });
                }

                return CreatedAtAction(nameof(GetAll), new { customerId }, created);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{vehicleId:int}")]
        [ProducesResponseType(typeof(VehicleDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<VehicleDto>> Update(
            int customerId,
            int vehicleId,
            [FromBody] VehicleInputDto dto,
            CancellationToken cancellationToken)
        {
            if (!CanAccess(customerId))
            {
                return Forbid();
            }

            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            try
            {
                var updated = await _vehicleService.UpdateAsync(customerId, vehicleId, dto, cancellationToken);
                if (updated == null)
                {
                    return NotFound(new { message = "Vehicle not found." });
                }

                return Ok(updated);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{vehicleId:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        public async Task<IActionResult> Delete(int customerId, int vehicleId, CancellationToken cancellationToken)
        {
            if (!CanAccess(customerId))
            {
                return Forbid();
            }

            var ok = await _vehicleService.DeleteAsync(customerId, vehicleId, cancellationToken);
            if (!ok)
            {
                return NotFound(new { message = "Vehicle not found." });
            }

            return NoContent();
        }

        private bool CanAccess(int customerId)
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
