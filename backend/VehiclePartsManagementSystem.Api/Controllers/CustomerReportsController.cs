using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;

namespace VehiclePartsManagementSystem.Api.Controllers
{
    [ApiController]
    [Route("api/customer/reports")]
    [Authorize(Roles = "Admin,Staff")]
    public class CustomerReportsController : ControllerBase
    {
        private readonly ICustomerReportService _reportService;

        public CustomerReportsController(ICustomerReportService reportService)
        {
            _reportService = reportService;
        }

        [HttpGet]
        [ProducesResponseType(typeof(CustomerReportsDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<CustomerReportsDto>> GetReports(CancellationToken cancellationToken)
        {
            var reports = await _reportService.GetReportsAsync(cancellationToken);
            return Ok(reports);
        }
    }
}
