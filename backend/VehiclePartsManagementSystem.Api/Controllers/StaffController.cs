using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;

namespace VehiclePartsManagementSystem.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class StaffController : ControllerBase
    {
        private readonly IStaffService _staffService;

        public StaffController(IStaffService staffService)
        {
            _staffService = staffService;
        }

        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<StaffResponseDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<StaffResponseDto>>> GetAll(CancellationToken cancellationToken)
        {
            var staff = await _staffService.GetAllAsync(cancellationToken);
            return Ok(staff);
        }

        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(StaffResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<StaffResponseDto>> GetById(int id, CancellationToken cancellationToken)
        {
            var staff = await _staffService.GetByIdAsync(id, cancellationToken);
            if (staff == null)
            {
                return NotFound(new { message = "Staff member not found." });
            }

            return Ok(staff);
        }

        [HttpPost]
        [ProducesResponseType(typeof(StaffResponseDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<StaffResponseDto>> Register(
            [FromBody] RegisterStaffDto dto,
            CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            var created = await _staffService.RegisterAsync(dto, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id:int}")]
        [ProducesResponseType(typeof(StaffResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<StaffResponseDto>> Update(
            int id,
            [FromBody] UpdateStaffDto dto,
            CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            var updated = await _staffService.UpdateAsync(id, dto, cancellationToken);
            if (updated == null)
            {
                return NotFound(new { message = "Staff member not found." });
            }

            return Ok(updated);
        }

        [HttpPatch("{id:int}/deactivate")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Deactivate(int id, CancellationToken cancellationToken)
        {
            var ok = await _staffService.DeactivateAsync(id, cancellationToken);
            if (!ok)
            {
                return NotFound(new { message = "Staff member not found." });
            }

            return Ok(new { message = "Staff account deactivated." });
        }

        [HttpDelete("{id:int}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
        {
            var ok = await _staffService.DeleteAsync(id, cancellationToken);
            if (!ok)
            {
                return NotFound(new { message = "Staff member not found." });
            }

            return Ok(new { message = "Staff account deleted." });
        }
    }
}
