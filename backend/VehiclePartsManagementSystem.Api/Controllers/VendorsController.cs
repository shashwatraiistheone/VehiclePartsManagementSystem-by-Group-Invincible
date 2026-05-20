using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;

namespace VehiclePartsManagementSystem.Api.Controllers
{
    [ApiController]
    [Route("api/vendors")]
    [Authorize(Roles = "Admin")]
    public class VendorsController : ControllerBase
    {
        private readonly IVendorService _vendorService;

        public VendorsController(IVendorService vendorService)
        {
            _vendorService = vendorService;
        }

        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<VendorResponseDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<VendorResponseDto>>> GetAll(CancellationToken cancellationToken)
        {
            var vendors = await _vendorService.GetAllAsync(cancellationToken);
            return Ok(vendors);
        }

        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(VendorResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<VendorResponseDto>> GetById(int id, CancellationToken cancellationToken)
        {
            var vendor = await _vendorService.GetByIdAsync(id, cancellationToken);
            if (vendor == null)
            {
                return NotFound(new { message = "Vendor not found." });
            }

            return Ok(vendor);
        }

        [HttpPost]
        [ProducesResponseType(typeof(VendorResponseDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<ActionResult<VendorResponseDto>> Create(
            [FromBody] CreateVendorDto dto,
            CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            try
            {
                var created = await _vendorService.CreateAsync(dto, cancellationToken);
                return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("email", StringComparison.OrdinalIgnoreCase))
            {
                return Conflict(new { message = ex.Message });
            }
        }

        [HttpPut("{id:int}")]
        [ProducesResponseType(typeof(VendorResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<ActionResult<VendorResponseDto>> Update(
            int id,
            [FromBody] UpdateVendorDto dto,
            CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            try
            {
                var updated = await _vendorService.UpdateAsync(id, dto, cancellationToken);
                if (updated == null)
                {
                    return NotFound(new { message = "Vendor not found." });
                }

                return Ok(updated);
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("email", StringComparison.OrdinalIgnoreCase))
            {
                return Conflict(new { message = ex.Message });
            }
        }

        [HttpPatch("{id:int}/deactivate")]
        [ProducesResponseType(typeof(VendorResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<VendorResponseDto>> Deactivate(int id, CancellationToken cancellationToken)
        {
            var updated = await _vendorService.DeactivateAsync(id, cancellationToken);
            if (updated == null)
            {
                return NotFound(new { message = "Vendor not found." });
            }

            return Ok(updated);
        }

        [HttpDelete("{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
        {
            try
            {
                await _vendorService.DeleteAsync(id, cancellationToken);
                return NoContent();
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = "Vendor not found." });
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("linked", StringComparison.OrdinalIgnoreCase))
            {
                return Conflict(new { message = ex.Message });
            }
        }
    }
}
