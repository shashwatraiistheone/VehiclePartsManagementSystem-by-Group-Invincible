using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;

namespace VehiclePartsManagementSystem.Api.Controllers
{
    [ApiController]
    [Route("api/customers")]
    [Authorize(Roles = "Admin,Staff")]
    public class CustomersRegisterController : ControllerBase
    {
        private readonly ICustomerService _customerService;

        public CustomersRegisterController(ICustomerService customerService)
        {
            _customerService = customerService;
        }

        [HttpPost("register")]
        [ProducesResponseType(typeof(CustomerDetailDto), StatusCodes.Status201Created)]
        public async Task<ActionResult<CustomerDetailDto>> Register(
            [FromBody] StaffRegisterCustomerDto dto,
            CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            var vehicle = dto.Vehicle;
            if (vehicle == null || string.IsNullOrWhiteSpace(vehicle.LicensePlate))
            {
                return BadRequest(new { message = "Vehicle license plate is required." });
            }

            var year = vehicle.Year ?? DateTime.UtcNow.Year;
            var payload = new CreateCustomerWithVehiclesDto
            {
                Name = $"{dto.FirstName.Trim()} {dto.LastName.Trim()}",
                Email = dto.Email.Trim(),
                Phone = dto.Phone.Trim(),
                Address = dto.Address?.Trim() ?? string.Empty,
                Vehicles = new List<VehicleInputDto>
                {
                    new()
                    {
                        VehicleNumber = vehicle.LicensePlate.Trim(),
                        Brand = string.IsNullOrWhiteSpace(vehicle.Make) ? "Unknown" : vehicle.Make.Trim(),
                        Model = string.IsNullOrWhiteSpace(vehicle.Model) ? "Unknown" : vehicle.Model.Trim(),
                        Year = year,
                        Mileage = 0,
                        Vin = string.IsNullOrWhiteSpace(vehicle.Vin) ? null : vehicle.Vin.Trim(),
                    },
                },
            };

            try
            {
                var created = await _customerService.CreateWithVehiclesAsync(payload, cancellationToken);
                return StatusCode(StatusCodes.Status201Created, created);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
