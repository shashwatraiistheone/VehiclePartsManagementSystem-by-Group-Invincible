using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;

namespace VehiclePartsManagementSystem.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IStaffService _staffService;

        public AuthController(IStaffService staffService)
        {
            _staffService = staffService;
        }

        /// <summary>
        /// Staff/Admin sign-in — returns JWT with userId, name, email, role.
        /// </summary>
        [HttpPost("login")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<AuthResponseDto>> Login(
            [FromBody] LoginDto dto,
            CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            var result = await _staffService.LoginAsync(dto, cancellationToken);
            return Ok(result);
        }

        /// <summary>
        /// Example staff-protected endpoint — any authenticated staff or admin.
        /// </summary>
        [HttpGet("me")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public IActionResult Me()
        {
            var userId = User.FindFirst("sub")?.Value ?? User.FindFirst("userId")?.Value;
            var name = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value
                ?? User.Identity?.Name;
            var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
            var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

            return Ok(new { userId, name, email, role });
        }
    }
}
