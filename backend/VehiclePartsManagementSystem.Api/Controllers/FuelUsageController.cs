using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;

namespace VehiclePartsManagementSystem.Api.Controllers
{
    [ApiController]
    [Route("api/fuel-usage")]
    [Authorize]
    public class FuelUsageController : ControllerBase
    {
        private readonly IFuelUsageService _fuelUsageService;

        public FuelUsageController(IFuelUsageService fuelUsageService)
        {
            _fuelUsageService = fuelUsageService;
        }

        [HttpGet("my")]
        [Authorize(Roles = "Customer")]
        public async Task<ActionResult<List<FuelUsageLogDto>>> GetMine(CancellationToken cancellationToken)
        {
            var customerId = GetCurrentCustomerId();
            if (customerId == null) return Unauthorized();
            var logs = await _fuelUsageService.GetByCustomerIdAsync(customerId.Value, cancellationToken);
            return Ok(logs);
        }

        [HttpGet("my/analytics")]
        [Authorize(Roles = "Customer")]
        public async Task<ActionResult<FuelUsageAnalyticsDto>> GetMyAnalytics(CancellationToken cancellationToken)
        {
            var customerId = GetCurrentCustomerId();
            if (customerId == null) return Unauthorized();
            var analytics = await _fuelUsageService.GetAnalyticsAsync(customerId.Value, cancellationToken);
            return Ok(analytics);
        }

        [HttpPost("update-usage")]
        [Authorize(Roles = "Customer")]
        public async Task<ActionResult<FuelUsageLogDto>> UpdateUsage(
            [FromBody] UpdateVehicleUsageDto dto,
            CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid) return ValidationProblem(ModelState);

            var customerId = GetCurrentCustomerId();
            if (customerId == null) return Unauthorized();

            try
            {
                var updated = await _fuelUsageService.UpdateUsageAsync(customerId.Value, dto, cancellationToken);
                return Ok(updated);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost]
        [Authorize(Roles = "Customer")]
        public async Task<ActionResult<FuelUsageLogDto>> Create(
            [FromBody] CreateFuelUsageLogDto dto,
            CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid) return ValidationProblem(ModelState);

            var customerId = GetCurrentCustomerId();
            if (customerId == null) return Unauthorized();

            try
            {
                var created = await _fuelUsageService.CreateAsync(customerId.Value, dto, cancellationToken);
                return CreatedAtAction(nameof(GetMine), null, created);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        private int? GetCurrentCustomerId()
        {
            var claimId = User.FindFirst("sub")?.Value ?? User.FindFirst("userId")?.Value;
            return int.TryParse(claimId, out var id) ? id : null;
        }
    }
}
