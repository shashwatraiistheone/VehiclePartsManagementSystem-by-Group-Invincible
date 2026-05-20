using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;

namespace VehiclePartsManagementSystem.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class LoyaltyController : ControllerBase
    {
        private readonly ILoyaltyService _loyaltyService;

        public LoyaltyController(ILoyaltyService loyaltyService)
        {
            _loyaltyService = loyaltyService;
        }

        [HttpGet("summary")]
        [Authorize(Roles = "Admin,Staff")]
        [ProducesResponseType(typeof(LoyaltyProgramSummaryDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<LoyaltyProgramSummaryDto>> GetSummary(CancellationToken cancellationToken)
        {
            var summary = await _loyaltyService.GetProgramSummaryAsync(cancellationToken);
            return Ok(summary);
        }

        [HttpGet("{customerId:int}")]
        [Authorize(Roles = "Admin,Staff,Customer")]
        [ProducesResponseType(typeof(CustomerLoyaltyDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<CustomerLoyaltyDto>> GetByCustomer(
            int customerId,
            CancellationToken cancellationToken)
        {
            if (!CanAccessCustomer(customerId))
            {
                return Forbid();
            }

            var loyalty = await _loyaltyService.GetCustomerLoyaltyAsync(customerId, cancellationToken);
            if (loyalty == null)
            {
                return NotFound(new { message = "Customer not found." });
            }

            return Ok(loyalty);
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
