using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;

namespace VehiclePartsManagementSystem.Api.Controllers
{
    [ApiController]
    [Route("api/community-reviews")]
    [Authorize]
    public class CommunityReviewsController : ControllerBase
    {
        private readonly ICommunityReviewService _communityReviewService;

        public CommunityReviewsController(ICommunityReviewService communityReviewService)
        {
            _communityReviewService = communityReviewService;
        }

        [HttpGet]
        public async Task<ActionResult<CommunityReviewsFeedDto>> GetApprovedFeed(CancellationToken cancellationToken)
        {
            var feed = await _communityReviewService.GetApprovedFeedAsync(cancellationToken);
            return Ok(feed);
        }

        [HttpGet("all")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<ActionResult<List<CommunityReviewDto>>> GetAll(CancellationToken cancellationToken)
        {
            var reviews = await _communityReviewService.GetAllAsync(cancellationToken);
            return Ok(reviews);
        }

        [HttpPost]
        [Authorize(Roles = "Customer")]
        public async Task<ActionResult<CommunityReviewDto>> Create(
            [FromBody] CreateCommunityReviewDto dto,
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
                var created = await _communityReviewService.CreateAsync(customerId.Value, dto, cancellationToken);
                return CreatedAtAction(nameof(GetApprovedFeed), created);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPatch("{id:int}/status")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<ActionResult<CommunityReviewDto>> UpdateStatus(
            int id,
            [FromBody] UpdateCommunityReviewStatusDto dto,
            CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            try
            {
                var updated = await _communityReviewService.UpdateStatusAsync(id, dto.Status, cancellationToken);
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
