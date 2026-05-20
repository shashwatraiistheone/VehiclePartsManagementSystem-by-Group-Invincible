using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;

namespace VehiclePartsManagementSystem.Api.Controllers
{
    /// <summary>
    /// Staff home dashboard data (alias for report/staff-dashboard).
    /// </summary>
    [ApiController]
    [Route("api/staff")]
    [Authorize(Roles = "Admin,Staff")]
    public class StaffHomeController : ControllerBase
    {
        private readonly IReportService _reportService;

        public StaffHomeController(IReportService reportService)
        {
            _reportService = reportService;
        }

        [HttpGet("home")]
        [ProducesResponseType(typeof(StaffDashboardDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<StaffDashboardDto>> GetHome(CancellationToken cancellationToken)
        {
            var name = User.FindFirst(ClaimTypes.Name)?.Value ?? User.Identity?.Name;
            var email = User.FindFirst(ClaimTypes.Email)?.Value;
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            var data = await _reportService.GetStaffDashboardAsync(name, email, role, cancellationToken);
            return Ok(data);
        }

        [HttpGet("workspace")]
        [ProducesResponseType(typeof(StaffWorkspaceDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<StaffWorkspaceDto>> GetWorkspace(CancellationToken cancellationToken)
        {
            var name = User.FindFirst(ClaimTypes.Name)?.Value ?? User.Identity?.Name;
            var email = User.FindFirst(ClaimTypes.Email)?.Value;
            var data = await _reportService.GetStaffWorkspaceAsync(name, email, cancellationToken);
            return Ok(data);
        }
    }
}
