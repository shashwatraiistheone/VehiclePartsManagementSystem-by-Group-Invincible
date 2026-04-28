using Microsoft.AspNetCore.Mvc;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;
using VehiclePartsManagementSystem.Domain.Entities;

namespace VehiclePartsManagementSystem.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VendorController : ControllerBase
    {
        private readonly IVendorService _vendorService;

        public VendorController(IVendorService vendorService)
        {
            _vendorService = vendorService;
        }

        [HttpGet]
        public async Task<ActionResult<List<Vendor>>> GetAll()
        {
            var vendors = await _vendorService.GetAllAsync();
            return Ok(vendors);
        }

        [HttpPost]
        public async Task<ActionResult<Vendor>> Create(VendorDto dto)
        {
            var vendor = await _vendorService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetAll), null, vendor);
        }
    }
}
