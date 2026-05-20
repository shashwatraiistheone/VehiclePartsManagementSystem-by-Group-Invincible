using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;

namespace VehiclePartsManagementSystem.Api.Controllers
{
    [ApiController]
    [Route("api/part-requests")]
    [Authorize]
    public class PartRequestsController : ControllerBase
    {
        private readonly IPartRequestService _partRequestService;

        public PartRequestsController(IPartRequestService partRequestService)
        {
            _partRequestService = partRequestService;
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<ActionResult<List<PartRequestDto>>> GetAll(CancellationToken cancellationToken)
        {
            var items = await _partRequestService.GetAllAsync(cancellationToken);
            return Ok(items);
        }

        [HttpGet("{id:int}")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<ActionResult<PartRequestDto>> GetById(int id, CancellationToken cancellationToken)
        {
            var item = await _partRequestService.GetByIdAsync(id, cancellationToken);
            if (item == null)
            {
                return NotFound(new { message = "Part request not found." });
            }

            return Ok(item);
        }

        [HttpGet("my")]
        [Authorize(Roles = "Customer")]
        public async Task<ActionResult<List<PartRequestDto>>> GetMine(CancellationToken cancellationToken)
        {
            var customerId = GetCurrentCustomerId();
            if (customerId == null)
            {
                return Unauthorized();
            }

            var items = await _partRequestService.GetByCustomerIdAsync(customerId.Value, cancellationToken);
            return Ok(items);
        }

        [HttpGet("customer/{customerId:int}")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<ActionResult<List<PartRequestDto>>> GetByCustomer(int customerId, CancellationToken cancellationToken)
        {
            var items = await _partRequestService.GetByCustomerIdAsync(customerId, cancellationToken);
            return Ok(items);
        }

        [HttpPost]
        [Authorize(Roles = "Customer")]
        public async Task<ActionResult<PartRequestDto>> Create(
            [FromBody] CreatePartRequestDto dto,
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
                var created = await _partRequestService.CreateAsync(customerId.Value, dto, cancellationToken);
                return CreatedAtAction(nameof(GetAll), null, created);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPatch("{id:int}/status")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<ActionResult<PartRequestDto>> UpdateStatus(
            int id,
            [FromBody] UpdatePartRequestStatusDto dto,
            CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            try
            {
                var staffId = GetCurrentStaffId();
                var updated = await _partRequestService.UpdateStatusAsync(id, dto, staffId, cancellationToken);
                if (updated == null)
                {
                    return NotFound(new { message = "Part request not found." });
                }

                return Ok(updated);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id:int}/fulfill")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<ActionResult<PartRequestDto>> Fulfill(
            int id,
            [FromBody] FulfillPartRequestDto dto,
            CancellationToken cancellationToken)
        {
            try
            {
                var updated = await _partRequestService.UpdateStatusAsync(
                    id,
                    new UpdatePartRequestStatusDto { Status = "Fulfilled", ResponseNotes = dto.ResponseNotes },
                    GetCurrentStaffId(),
                    cancellationToken);
                if (updated == null)
                {
                    return NotFound(new { message = "Part request not found." });
                }

                return Ok(updated);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id:int}/reject")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<ActionResult<PartRequestDto>> Reject(
            int id,
            [FromBody] RejectPartRequestDto dto,
            CancellationToken cancellationToken)
        {
            try
            {
                var updated = await _partRequestService.UpdateStatusAsync(
                    id,
                    new UpdatePartRequestStatusDto { Status = "Rejected", ResponseNotes = dto.ResponseNotes },
                    GetCurrentStaffId(),
                    cancellationToken);
                if (updated == null)
                {
                    return NotFound(new { message = "Part request not found." });
                }

                return Ok(updated);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
        {
            var customerId = GetCurrentCustomerId();
            var isStaffOrAdmin = User.IsInRole("Admin") || User.IsInRole("Staff");

            try
            {
                var deleted = await _partRequestService.DeleteAsync(id, customerId, isStaffOrAdmin, cancellationToken);
                if (!deleted)
                {
                    return NotFound(new { message = "Part request not found." });
                }

                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
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

        private int? GetCurrentStaffId()
        {
            if (!User.IsInRole("Admin") && !User.IsInRole("Staff"))
            {
                return null;
            }

            var claimId = User.FindFirst("sub")?.Value ?? User.FindFirst("userId")?.Value;
            return int.TryParse(claimId, out var id) ? id : null;
        }
    }
}
