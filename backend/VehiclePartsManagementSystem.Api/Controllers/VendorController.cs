using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VehiclePartsManagementSystem.Domain.Entities;
using VehiclePartsManagementSystem.Infrastructure.Data;

namespace VehiclePartsManagementSystem.Api.Controllers
{
    [ApiController]
    [Route("api/vendor")]
    public class VendorController : ControllerBase
    {
        private readonly AppDbContext _db;

        public VendorController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<ActionResult<List<Vendor>>> GetAll()
        {
            var vendors = await _db.Vendors
                .OrderByDescending(v => v.Id)
                .ToListAsync();

            return Ok(vendors);
        }

        public sealed class CreateVendorRequest
        {
            [Required]
            public string Name { get; set; } = string.Empty;

            [Required]
            public string Email { get; set; } = string.Empty;
        }

        [HttpPost]
        public async Task<ActionResult<Vendor>> Create([FromBody] CreateVendorRequest body)
        {
            var name = body.Name?.Trim() ?? string.Empty;
            var email = body.Email?.Trim() ?? string.Empty;

            if (string.IsNullOrWhiteSpace(name))
            {
                return BadRequest(new { message = "Vendor name is required." });
            }

            if (string.IsNullOrWhiteSpace(email))
            {
                return BadRequest(new { message = "Vendor email is required." });
            }

            var vendor = new Vendor
            {
                Name = name,
                Email = email,
                Contact = string.Empty,
                Address = string.Empty
            };

            await _db.Vendors.AddAsync(vendor);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAll), null, vendor);
        }
    }
}
