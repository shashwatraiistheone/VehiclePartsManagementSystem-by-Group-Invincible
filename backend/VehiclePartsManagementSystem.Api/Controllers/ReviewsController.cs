using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;

namespace VehiclePartsManagementSystem.Api.Controllers
{
    [ApiController]
    [Route("api/reviews")]
    [Authorize]
    public class ReviewsController : ControllerBase
    {
        private readonly IReviewService _reviewService;

        public ReviewsController(IReviewService reviewService)
        {
            _reviewService = reviewService;
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<ActionResult<List<ReviewDto>>> GetAll(CancellationToken cancellationToken)
        {
            var reviews = await _reviewService.GetAllAsync(cancellationToken);
            return Ok(reviews);
        }

        [HttpGet("approved")]
        public async Task<ActionResult<List<ReviewDto>>> GetApproved(CancellationToken cancellationToken)
        {
            var reviews = await _reviewService.GetApprovedAsync(cancellationToken);
            return Ok(reviews);
        }

        [HttpGet("my")]
        [Authorize(Roles = "Customer")]
        public async Task<ActionResult<List<ReviewDto>>> GetMine(CancellationToken cancellationToken)
        {
            var customerId = GetCurrentCustomerId();
            if (customerId == null)
            {
                return Unauthorized();
            }

            var reviews = await _reviewService.GetByCustomerIdAsync(customerId.Value, cancellationToken);
            return Ok(reviews);
        }

        [HttpPost]
        [Authorize(Roles = "Customer")]
        public async Task<ActionResult<ReviewDto>> Create(
            [FromBody] CreateReviewDto dto,
            CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            var customerId = GetCurrentCustomerId();
            if (customerId == null)
            {
                return Unauthorized();
            }

            try
            {
                var created = await _reviewService.CreateAsync(customerId.Value, dto, cancellationToken);
                return CreatedAtAction(nameof(GetAll), null, created);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPatch("{id:int}/status")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<ActionResult<ReviewDto>> UpdateStatus(
            int id,
            [FromBody] UpdateReviewStatusDto dto,
            CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            try
            {
                var updated = await _reviewService.UpdateStatusAsync(id, dto.Status, cancellationToken);
                if (updated == null)
                {
                    return NotFound(new { message = "Review not found." });
                }

                return Ok(updated);
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
