using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;

namespace VehiclePartsManagementSystem.Api.Controllers
{
    [ApiController]
    [Route("api/maintenance")]
    [Authorize]
    public class MaintenanceController : ControllerBase
    {
        private readonly IAiPredictionService _predictionService;

        public MaintenanceController(IAiPredictionService predictionService)
        {
            _predictionService = predictionService;
        }

        /// <summary>Alias for customer maintenance predictions (dashboard payload).</summary>
        [HttpGet("predictions")]
        [Authorize(Roles = "Customer")]
        [ProducesResponseType(typeof(MaintenanceDashboardDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetMyPredictions(CancellationToken cancellationToken)
        {
            var claimId = User.FindFirst("sub")?.Value ?? User.FindFirst("userId")?.Value;
            if (!int.TryParse(claimId, out var customerId))
            {
                return Unauthorized();
            }

            var dashboard = await _predictionService.GetMaintenanceDashboardAsync(customerId, cancellationToken);
            return Ok(dashboard);
        }
    }
}
