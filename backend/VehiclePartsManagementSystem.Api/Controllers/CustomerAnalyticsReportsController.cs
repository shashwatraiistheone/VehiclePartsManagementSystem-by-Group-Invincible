using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;

namespace VehiclePartsManagementSystem.Api.Controllers
{
    [ApiController]
    [Route("api/reports")]
    [Authorize(Roles = "Admin,Staff")]
    public class CustomerAnalyticsReportsController : ControllerBase
    {
        private readonly ICustomerReportService _reportService;
        private readonly ITopSpendersExportService _exportService;
        private readonly IRegularCustomersExportService _regularExportService;
        private readonly IPendingCreditsExportService _pendingExportService;

        public CustomerAnalyticsReportsController(
            ICustomerReportService reportService,
            ITopSpendersExportService exportService,
            IRegularCustomersExportService regularExportService,
            IPendingCreditsExportService pendingExportService)
        {
            _reportService = reportService;
            _exportService = exportService;
            _regularExportService = regularExportService;
            _pendingExportService = pendingExportService;
        }

        private static string RegularCustomersExportFileName()
            => $"regular-customers-report-{DateTime.UtcNow:yyyy-MM-dd}.pdf";

        private static (DateTime? From, DateTime? To, ActionResult? Error) ResolveDateRange(
            DateTime? from,
            DateTime? to,
            DateTime? fromDate,
            DateTime? toDate)
        {
            var rangeFrom = from ?? fromDate;
            var rangeTo = to ?? toDate;
            if (rangeFrom.HasValue && rangeTo.HasValue && rangeFrom > rangeTo)
            {
                return (null, null, new BadRequestObjectResult(new { message = "'fromDate' must be on or before 'toDate'." }));
            }

            return (rangeFrom, rangeTo, null);
        }

        private static string ExportFileName(string extension)
            => $"top-spenders-report-{DateTime.UtcNow:yyyy-MM-dd}.{extension}";

        [HttpGet("dashboard")]
        [ProducesResponseType(typeof(CustomerReportsDashboardDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<CustomerReportsDashboardDto>> Dashboard(
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to,
            CancellationToken cancellationToken)
        {
            if (from.HasValue && to.HasValue && from > to)
            {
                return BadRequest(new { message = "'from' must be on or before 'to'." });
            }

            var data = await _reportService.GetDashboardAsync(from, to, cancellationToken);
            return Ok(data);
        }

        [HttpGet("top-spenders")]
        [ProducesResponseType(typeof(List<TopSpenderReportRowDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<List<TopSpenderReportRowDto>>> TopSpenders(
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to,
            [FromQuery(Name = "fromDate")] DateTime? fromDate,
            [FromQuery(Name = "toDate")] DateTime? toDate,
            [FromQuery] string? search,
            CancellationToken cancellationToken)
        {
            var rangeFrom = from ?? fromDate;
            var rangeTo = to ?? toDate;

            if (rangeFrom.HasValue && rangeTo.HasValue && rangeFrom > rangeTo)
            {
                return BadRequest(new { message = "'fromDate' must be on or before 'toDate'." });
            }

            var data = await _reportService.GetTopSpendersAsync(rangeFrom, rangeTo, search, cancellationToken);
            return Ok(data);
        }

        [HttpGet("top-spenders/export/csv")]
        public async Task<IActionResult> ExportTopSpendersCsv(
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to,
            [FromQuery(Name = "fromDate")] DateTime? fromDate,
            [FromQuery(Name = "toDate")] DateTime? toDate,
            CancellationToken cancellationToken)
        {
            var (rangeFrom, rangeTo, error) = ResolveDateRange(from, to, fromDate, toDate);
            if (error != null)
            {
                return error;
            }

            var bytes = await _exportService.ExportCsvAsync(rangeFrom, rangeTo, cancellationToken);
            return File(bytes, "text/csv", ExportFileName("csv"));
        }

        [HttpGet("top-spenders/export/excel")]
        public async Task<IActionResult> ExportTopSpendersExcel(
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to,
            [FromQuery(Name = "fromDate")] DateTime? fromDate,
            [FromQuery(Name = "toDate")] DateTime? toDate,
            CancellationToken cancellationToken)
        {
            var (rangeFrom, rangeTo, error) = ResolveDateRange(from, to, fromDate, toDate);
            if (error != null)
            {
                return error;
            }

            var bytes = await _exportService.ExportExcelAsync(rangeFrom, rangeTo, cancellationToken);
            return File(
                bytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                ExportFileName("xlsx"));
        }

        [HttpGet("top-spenders/export/pdf")]
        public async Task<IActionResult> ExportTopSpendersPdf(
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to,
            [FromQuery(Name = "fromDate")] DateTime? fromDate,
            [FromQuery(Name = "toDate")] DateTime? toDate,
            CancellationToken cancellationToken)
        {
            var (rangeFrom, rangeTo, error) = ResolveDateRange(from, to, fromDate, toDate);
            if (error != null)
            {
                return error;
            }

            var bytes = await _exportService.ExportPdfAsync(rangeFrom, rangeTo, cancellationToken);
            return File(bytes, "application/pdf", ExportFileName("pdf"));
        }

        [HttpGet("regular-customers")]
        [ProducesResponseType(typeof(List<RegularCustomerReportRowDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<List<RegularCustomerReportRowDto>>> RegularCustomers(
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to,
            [FromQuery(Name = "fromDate")] DateTime? fromDate,
            [FromQuery(Name = "toDate")] DateTime? toDate,
            [FromQuery] string? search,
            CancellationToken cancellationToken)
        {
            var (rangeFrom, rangeTo, error) = ResolveDateRange(from, to, fromDate, toDate);
            if (error != null)
            {
                return error;
            }

            var data = await _reportService.GetRegularCustomersAsync(rangeFrom, rangeTo, search, cancellationToken);
            return Ok(data);
        }

        [HttpGet("regular-customers/export/pdf")]
        public async Task<IActionResult> ExportRegularCustomersPdf(
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to,
            [FromQuery(Name = "fromDate")] DateTime? fromDate,
            [FromQuery(Name = "toDate")] DateTime? toDate,
            CancellationToken cancellationToken)
        {
            var (rangeFrom, rangeTo, error) = ResolveDateRange(from, to, fromDate, toDate);
            if (error != null)
            {
                return error;
            }

            var bytes = await _regularExportService.ExportPdfAsync(rangeFrom, rangeTo, cancellationToken);
            return File(bytes, "application/pdf", RegularCustomersExportFileName());
        }

        [HttpGet("pending-credits")]
        [ProducesResponseType(typeof(PendingCreditsReportDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<PendingCreditsReportDto>> PendingCredits(
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to,
            [FromQuery(Name = "fromDate")] DateTime? fromDate,
            [FromQuery(Name = "toDate")] DateTime? toDate,
            [FromQuery] string? search,
            [FromQuery] string? overdueStatus,
            CancellationToken cancellationToken)
        {
            var (rangeFrom, rangeTo, error) = ResolveDateRange(from, to, fromDate, toDate);
            if (error != null)
            {
                return error;
            }

            var data = await _reportService.GetPendingCreditsAsync(
                rangeFrom, rangeTo, search, overdueStatus, cancellationToken);
            return Ok(data);
        }

        [HttpGet("pending-credits/export/pdf")]
        public async Task<IActionResult> ExportPendingCreditsPdf(
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to,
            [FromQuery(Name = "fromDate")] DateTime? fromDate,
            [FromQuery(Name = "toDate")] DateTime? toDate,
            [FromQuery] string? search,
            [FromQuery] string? overdueStatus,
            CancellationToken cancellationToken)
        {
            var (rangeFrom, rangeTo, error) = ResolveDateRange(from, to, fromDate, toDate);
            if (error != null)
            {
                return error;
            }

            var bytes = await _pendingExportService.ExportPdfAsync(
                rangeFrom, rangeTo, search, overdueStatus, cancellationToken);
            return File(bytes, "application/pdf", $"pending-credit-report-{DateTime.UtcNow:yyyy-MM-dd}.pdf");
        }
    }
}
