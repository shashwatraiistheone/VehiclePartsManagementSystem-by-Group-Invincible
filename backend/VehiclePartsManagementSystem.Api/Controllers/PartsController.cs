using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;

namespace VehiclePartsManagementSystem.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin,Staff")]
    public class PartsController : ControllerBase
    {
        private readonly IPartService _partService;

        public PartsController(IPartService partService)
        {
            _partService = partService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<PartResponseDto>>> GetAll()
        {
            var parts = await _partService.GetAllPartsAsync();
            return Ok(parts);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<PartResponseDto>> GetById(int id)
        {
            var part = await _partService.GetPartByIdAsync(id);
            if (part == null)
            {
                return NotFound(new { message = "Part not found." });
            }

            return Ok(part);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<PartResponseDto>> Create(CreatePartDto dto)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            var part = await _partService.CreatePartAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = part.Id }, part);
        }

        [HttpPut("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<PartResponseDto>> Update(int id, UpdatePartDto dto)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            var updated = await _partService.UpdatePartAsync(id, dto);
            if (updated == null)
            {
                return NotFound(new { message = "Part not found." });
            }

            return Ok(updated);
        }

        [HttpPatch("{id:int}/deactivate")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<PartResponseDto>> Deactivate(int id)
        {
            var updated = await _partService.DeactivatePartAsync(id);
            if (updated == null)
            {
                return NotFound(new { message = "Part not found." });
            }

            return Ok(updated);
        }

        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var result = await _partService.DeletePartAsync(id);
                if (!result)
                {
                    return NotFound(new { message = "Part not found." });
                }

                return Ok(new { message = "Part deleted successfully." });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
