using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;
using VehiclePartsManagementSystem.Domain.Entities;

namespace VehiclePartsManagementSystem.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CustomerController : ControllerBase
    {
        private readonly ICustomerService _customerService;

        public CustomerController(ICustomerService customerService)
        {
            _customerService = customerService;
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Staff")]
        [ProducesResponseType(typeof(List<CustomerSearchResultDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<List<CustomerSearchResultDto>>> GetAll(CancellationToken cancellationToken)
        {
            var customers = await _customerService.GetAllAsync(cancellationToken);
            return Ok(customers);
        }

        [HttpGet("me")]
        [Authorize(Roles = "Customer")]
        [ProducesResponseType(typeof(CustomerDetailDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<CustomerDetailDto>> GetMe(CancellationToken cancellationToken)
        {
            var id = GetCurrentCustomerId();
            if (id == null)
            {
                return Unauthorized();
            }

            var detail = await _customerService.GetDetailAsync(id.Value, cancellationToken);
            if (detail == null)
            {
                return NotFound(new { message = "Customer not found." });
            }

            return Ok(detail);
        }

        [HttpGet("me/notifications")]
        [Authorize(Roles = "Customer")]
        [ProducesResponseType(typeof(List<CustomerNotificationDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<List<CustomerNotificationDto>>> GetMyNotifications(CancellationToken cancellationToken)
        {
            var id = GetCurrentCustomerId();
            if (id == null)
            {
                return Unauthorized();
            }

            var notifications = await _customerService.GetNotificationsAsync(id.Value, cancellationToken);
            return Ok(notifications);
        }

        [HttpPost("me/change-password")]
        [Authorize(Roles = "Customer")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> ChangeMyPassword(
            [FromBody] ChangeCustomerPasswordDto dto,
            CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            var id = GetCurrentCustomerId();
            if (id == null)
            {
                return Unauthorized();
            }

            try
            {
                await _customerService.ChangePasswordAsync(id.Value, dto, cancellationToken);
                return Ok(new { message = "Password updated successfully." });
            }
            catch (UnauthorizedAccessException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(CustomerDetailDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<CustomerDetailDto>> GetById(int id, CancellationToken cancellationToken)
        {
            if (!CanAccessCustomer(id))
            {
                return Forbid();
            }

            var detail = await _customerService.GetDetailAsync(id, cancellationToken);
            if (detail == null)
            {
                return NotFound(new { message = "Customer not found." });
            }

            return Ok(detail);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<ActionResult<Customer>> Create(CustomerDto dto)
        {
            try
            {
                var customer = await _customerService.CreateAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = customer.Id }, customer);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("with-vehicles")]
        [Authorize(Roles = "Admin,Staff")]
        [ProducesResponseType(typeof(CustomerDetailDto), StatusCodes.Status201Created)]
        public async Task<ActionResult<CustomerDetailDto>> CreateWithVehicles(
            [FromBody] CreateCustomerWithVehiclesDto dto,
            CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            try
            {
                var created = await _customerService.CreateWithVehiclesAsync(dto, cancellationToken);
                return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id:int}/profile")]
        [ProducesResponseType(typeof(CustomerDetailDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<CustomerDetailDto>> UpdateProfile(
            int id,
            [FromBody] UpdateCustomerProfileDto dto,
            CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            if (!CanAccessCustomer(id))
            {
                return Forbid();
            }

            var updated = await _customerService.UpdateProfileAsync(id, dto, cancellationToken);
            if (updated == null)
            {
                return NotFound(new { message = "Customer not found." });
            }

            return Ok(updated);
        }

        [HttpGet("search")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<ActionResult<List<Customer>>> SearchByName([FromQuery] string name)
        {
            var customers = await _customerService.SearchByNameAsync(name ?? string.Empty);
            return Ok(customers);
        }

        /// <summary>Search by name, phone, customer ID, or vehicle number.</summary>
        [HttpGet("find")]
        [Authorize(Roles = "Admin,Staff")]
        [ProducesResponseType(typeof(List<CustomerSearchResultDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<List<CustomerSearchResultDto>>> Find(
            [FromQuery] string? q,
            CancellationToken cancellationToken)
        {
            var results = await _customerService.SearchAsync(q, cancellationToken);
            return Ok(results);
        }

        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin,Staff")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
        {
            try
            {
                var deleted = await _customerService.DeleteAsync(id, cancellationToken);
                if (!deleted)
                {
                    return NotFound(new { message = "Customer not found." });
                }

                return NoContent();
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

        private bool CanAccessCustomer(int customerId)
        {
            if (User.IsInRole("Admin") || User.IsInRole("Staff"))
            {
                return true;
            }

            if (User.IsInRole("Customer"))
            {
                return GetCurrentCustomerId() == customerId;
            }

            return false;
        }
    }
}
