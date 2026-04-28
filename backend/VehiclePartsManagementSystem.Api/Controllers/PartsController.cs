using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;

namespace VehiclePartsManagementSystem.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
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

        [HttpGet("{id}")]
        public async Task<ActionResult<PartResponseDto>> GetById(int id)
        {
            var part = await _partService.GetPartByIdAsync(id);
            if (part == null)
            {
                return NotFound();
            }
            return Ok(part);
        }

        [HttpPost]
        public async Task<ActionResult<PartResponseDto>> Create(CreatePartDto dto)
        {
            var part = await _partService.CreatePartAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = part.Id }, part);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _partService.DeletePartAsync(id);
            if (!result)
            {
                return NotFound();
            }
            return NoContent();
        }
    }
}
