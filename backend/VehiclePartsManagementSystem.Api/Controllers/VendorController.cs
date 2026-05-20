using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VehiclePartsManagementSystem.Domain.Entities;
using VehiclePartsManagementSystem.Infrastructure.Data;

namespace VehiclePartsManagementSystem.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class VendorController : ControllerBase
    {
        private readonly AppDbContext _context;

        public VendorController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Vendor>>> GetVendors()
        {
            return await _context.Vendors.ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<Vendor>> CreateVendor(Vendor vendor)
        {
            if (string.IsNullOrWhiteSpace(vendor.Name) || string.IsNullOrWhiteSpace(vendor.Email))
            {
                return BadRequest(new { message = "Name and Email are required." });
            }

            vendor.Name = vendor.Name.Trim();
            vendor.Email = vendor.Email.Trim();
            vendor.ContactPerson = string.IsNullOrWhiteSpace(vendor.ContactPerson) ? string.Empty : vendor.ContactPerson.Trim();
            vendor.Phone = string.IsNullOrWhiteSpace(vendor.Phone) ? string.Empty : vendor.Phone.Trim();
            vendor.Address = string.IsNullOrWhiteSpace(vendor.Address) ? string.Empty : vendor.Address.Trim();

            _context.Vendors.Add(vendor);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetVendors), new { id = vendor.Id }, vendor);
        }
    }
}
