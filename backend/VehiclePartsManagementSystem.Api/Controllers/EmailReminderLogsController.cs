using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;

namespace VehiclePartsManagementSystem.Api.Controllers
{
    [ApiController]
    [Route("api/admin/email-reminder-logs")]
    [Authorize(Roles = "Admin")]
    public class EmailReminderLogsController : ControllerBase
    {
        private readonly ICreditReminderService _creditReminderService;
        private readonly IEmailService _emailService;

        public EmailReminderLogsController(
            ICreditReminderService creditReminderService,
            IEmailService emailService)
        {
            _creditReminderService = creditReminderService;
            _emailService = emailService;
        }

        [HttpGet]
        public async Task<ActionResult<EmailReminderLogsPageDto>> GetLogs(
            [FromQuery] string? search,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            CancellationToken cancellationToken = default)
        {
            var result = await _creditReminderService.GetReminderLogsAsync(
                search,
                page,
                pageSize,
                cancellationToken);
            return Ok(result);
        }

        [HttpPost("test-smtp")]
        public async Task<ActionResult<SmtpTestResultDto>> TestSmtp(CancellationToken cancellationToken)
        {
            var ok = await _emailService.TestSmtpConnectionAsync(cancellationToken);
            return Ok(new SmtpTestResultDto
            {
                Success = ok,
                Message = ok
                    ? "SMTP connection and authentication succeeded."
                    : "SMTP connection failed. Check EmailSettings in appsettings.json.",
            });
        }

        [HttpPost("run-overdue-check")]
        public async Task<ActionResult<OverdueReminderRunResultDto>> RunOverdueCheck(
            CancellationToken cancellationToken)
        {
            var sent = await _creditReminderService.ProcessAutomaticRemindersAsync(cancellationToken);
            return Ok(new OverdueReminderRunResultDto
            {
                Success = true,
                EmailsSent = sent,
                Message = sent > 0
                    ? $"Overdue check completed. {sent} reminder email(s) sent."
                    : "Overdue check completed. No new reminders were sent (none eligible or already reminded today).",
            });
        }

        [HttpPost("send-test")]
        public async Task<IActionResult> SendTestReminder(
            [FromBody] SendTestReminderDto dto,
            CancellationToken cancellationToken)
        {
            if (dto.InvoiceId <= 0)
            {
                return BadRequest(new { message = "A valid invoice id is required." });
            }

            var result = await _creditReminderService.SendReminderAsync(
                dto.InvoiceId,
                manual: true,
                cancellationToken);

            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }

            return Ok(new
            {
                message = result.Message,
                log = result.Log,
            });
        }
    }

    public class SendTestReminderDto
    {
        public int InvoiceId { get; set; }
    }
}
