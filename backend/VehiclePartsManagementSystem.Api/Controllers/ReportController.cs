using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;

namespace VehiclePartsManagementSystem.Api.Controllers
{
    [ApiController]
    [Route("api/report")]
    public class ReportController : ControllerBase
    {
        private readonly IReportService _reportService;

        public ReportController(IReportService reportService)
        {
            _reportService = reportService;
        }

        [HttpGet("dashboard")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ReportDto>> Dashboard(CancellationToken cancellationToken)
        {
            var data = await _reportService.GetDashboardAsync(cancellationToken);
            return Ok(data);
        }

        /// <summary>
        /// Financial report: daily, monthly, yearly, or custom date range (from/to).
        /// </summary>
        [HttpGet("financial")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(FinancialReportDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<FinancialReportDto>> Financial(
            [FromQuery] string? period,
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to,
            CancellationToken cancellationToken)
        {
            if (from.HasValue && to.HasValue && from > to)
            {
                return BadRequest(new { message = "'from' must be on or before 'to'." });
            }

            var data = await _reportService.GetFinancialReportAsync(period, from, to, cancellationToken);
            return Ok(data);
        }

        [HttpGet("analytics")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(DashboardAnalyticsDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<DashboardAnalyticsDto>> Analytics(CancellationToken cancellationToken)
        {
            var data = await _reportService.GetDashboardAnalyticsAsync(cancellationToken);
            return Ok(data);
        }

        /// <summary>
        /// Staff home dashboard: account overview and live operational counts from PostgreSQL.
        /// </summary>
        [HttpGet("staff-dashboard")]
        [Authorize(Roles = "Admin,Staff")]
        [ProducesResponseType(typeof(StaffDashboardDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<StaffDashboardDto>> StaffDashboard(CancellationToken cancellationToken)
        {
            var name = User.FindFirst(ClaimTypes.Name)?.Value ?? User.Identity?.Name;
            var email = User.FindFirst(ClaimTypes.Email)?.Value;
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            var data = await _reportService.GetStaffDashboardAsync(name, email, role, cancellationToken);
            return Ok(data);
        }

        /// <summary>
        /// Staff operations workspace: analytics, lists, and daily workflow data.
        /// </summary>
        [HttpGet("staff-workspace")]
        [Authorize(Roles = "Admin,Staff")]
        [ProducesResponseType(typeof(StaffWorkspaceDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<StaffWorkspaceDto>> StaffWorkspace(CancellationToken cancellationToken)
        {
            var name = User.FindFirst(ClaimTypes.Name)?.Value ?? User.Identity?.Name;
            var email = User.FindFirst(ClaimTypes.Email)?.Value;
            var data = await _reportService.GetStaffWorkspaceAsync(name, email, cancellationToken);
            return Ok(data);
        }
    }
}
