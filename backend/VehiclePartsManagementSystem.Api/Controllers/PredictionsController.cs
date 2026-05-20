using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;

namespace VehiclePartsManagementSystem.Api.Controllers
{
    [ApiController]
    [Route("api/predictions")]
    [Authorize]
    public class PredictionsController : ControllerBase
    {
        private readonly IAiPredictionService _predictionService;

        public PredictionsController(IAiPredictionService predictionService)
        {
            _predictionService = predictionService;
        }

        [HttpGet("customer/{customerId:int}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> GetForCustomer(int customerId, CancellationToken cancellationToken)
        {
            if (!CanAccessCustomer(customerId))
            {
                return Forbid();
            }

            var predictions = await _predictionService.GetPredictionsForCustomerAsync(customerId, cancellationToken);
            return Ok(predictions);
        }

        [HttpGet("my")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> GetMine(CancellationToken cancellationToken)
        {
            var claimId = User.FindFirst("sub")?.Value ?? User.FindFirst("userId")?.Value;
            if (!int.TryParse(claimId, out var customerId))
            {
                return Unauthorized();
            }

            var predictions = await _predictionService.GetPredictionsForCustomerAsync(customerId, cancellationToken);
            return Ok(predictions);
        }

        [HttpGet("my/dashboard")]
        [Authorize(Roles = "Customer")]
        [ProducesResponseType(typeof(MaintenanceDashboardDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetMyDashboard(CancellationToken cancellationToken)
        {
            var claimId = User.FindFirst("sub")?.Value ?? User.FindFirst("userId")?.Value;
            if (!int.TryParse(claimId, out var customerId))
            {
                return Unauthorized();
            }

            var dashboard = await _predictionService.GetMaintenanceDashboardAsync(customerId, cancellationToken);
            return Ok(dashboard);
        }

        [HttpGet("customer/{customerId:int}/dashboard")]
        [ProducesResponseType(typeof(MaintenanceDashboardDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetCustomerDashboard(int customerId, CancellationToken cancellationToken)
        {
            if (!CanAccessCustomer(customerId))
            {
                return Forbid();
            }

            var dashboard = await _predictionService.GetMaintenanceDashboardAsync(customerId, cancellationToken);
            return Ok(dashboard);
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
