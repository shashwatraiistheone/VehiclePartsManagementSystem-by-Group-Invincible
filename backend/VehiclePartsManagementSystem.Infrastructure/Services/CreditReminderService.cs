using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;
using VehiclePartsManagementSystem.Domain.Entities;
using VehiclePartsManagementSystem.Infrastructure.Data;

namespace VehiclePartsManagementSystem.Infrastructure.Services
{
    public class CreditReminderService : ICreditReminderService
    {
        private const int MinOverdueDaysForAuto = 30;

        private readonly AppDbContext _db;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<CreditReminderService> _logger;

        public CreditReminderService(
            AppDbContext db,
            IEmailService emailService,
            IConfiguration configuration,
            ILogger<CreditReminderService> logger)
        {
            _db = db;
            _emailService = emailService;
            _configuration = configuration;
            _logger = logger;
        }

        public int CalculateOverdueDays(DateTime invoiceDate, DateTime dueDate, bool isPaid, decimal balanceDue)
        {
            if (isPaid || balanceDue <= 0)
            {
                return 0;
            }

            var effectiveDue = dueDate == default ? invoiceDate.AddDays(30) : dueDate;
            return Math.Max(0, (DateTime.UtcNow.Date - effectiveDue.Date).Days);
        }

        public string ResolveEmailType(int overdueDays, bool manual)
        {
            if (manual)
            {
                return CreditEmailTypes.ManualReminder;
            }

            if (overdueDays >= 90)
            {
                return CreditEmailTypes.FinalNotice;
            }

            if (overdueDays >= 60)
            {
                return CreditEmailTypes.UrgentReminder;
            }

            return CreditEmailTypes.FriendlyReminder;
        }

        public async Task<CreditReminderSendResult> SendReminderAsync(
            int invoiceId,
            bool manual,
            CancellationToken cancellationToken = default)
        {
            var invoice = await _db.Invoices
                .Include(i => i.Sale)
                    .ThenInclude(s => s!.Customer)
                .FirstOrDefaultAsync(i => i.Id == invoiceId, cancellationToken);

            if (invoice == null)
            {
                return new CreditReminderSendResult { Success = false, Message = "Invoice not found." };
            }

            if (invoice.IsPaid || invoice.BalanceAmount <= 0)
            {
                return new CreditReminderSendResult { Success = false, Message = "Invoice has no outstanding balance." };
            }

            var effectiveDue = invoice.DueDate == default
                ? invoice.CreatedDate.AddDays(30)
                : invoice.DueDate;

            var overdueDays = CalculateOverdueDays(
                invoice.CreatedDate,
                invoice.DueDate,
                invoice.IsPaid,
                invoice.BalanceAmount);

            if (!manual && overdueDays < MinOverdueDaysForAuto)
            {
                return new CreditReminderSendResult
                {
                    Success = false,
                    Message = $"Invoice is only {overdueDays} days overdue. Automatic reminders start after 30 days.",
                    OverdueDays = overdueDays,
                };
            }

            var customer = invoice.Sale?.Customer;
            if (customer == null)
            {
                return new CreditReminderSendResult { Success = false, Message = "Customer not found for this invoice." };
            }

            var emailTo = customer.Email;
            if (string.IsNullOrWhiteSpace(emailTo)
                || emailTo.EndsWith("@partshub.local", StringComparison.OrdinalIgnoreCase))
            {
                return new CreditReminderSendResult
                {
                    Success = false,
                    Message = "Customer email is invalid. Update the customer profile first.",
                };
            }

            if (!manual)
            {
                var todayUtc = DateTime.UtcNow.Date;
                var alreadySentToday = await _db.EmailReminderLogs
                    .AsNoTracking()
                    .AnyAsync(
                        l => l.CustomerId == customer.Id
                             && l.Status == "Sent"
                             && l.SentAt >= todayUtc,
                        cancellationToken);

                if (alreadySentToday)
                {
                    return new CreditReminderSendResult
                    {
                        Success = false,
                        Message = "A reminder email was already sent to this customer today.",
                        OverdueDays = overdueDays,
                    };
                }
            }

            var companyName = _configuration["CompanySettings:Name"]
                ?? _configuration["EmailSettings:DisplayName"]
                ?? "Vehicle Parts System";

            var (subject, html, emailTypeKey) = CreditReminderEmailTemplates.BuildPaymentReminder(
                customer.Name,
                invoice.InvoiceNumber,
                invoice.BalanceAmount,
                effectiveDue,
                overdueDays,
                companyName,
                manual);

            var emailType = emailTypeKey;

            var log = new EmailLog
            {
                CustomerId = customer.Id,
                InvoiceId = invoice.Id,
                EmailType = emailType,
                SentAt = DateTime.UtcNow,
                IsAutomatic = !manual,
            };

            var reminderLog = new EmailReminderLog
            {
                CustomerId = customer.Id,
                CreditPaymentId = invoice.Id,
                Email = emailTo.Trim(),
                SentAt = log.SentAt,
            };

            try
            {
                await _emailService.SendEmailAsync(emailTo, subject, html);
                log.Status = "Sent";
                reminderLog.Status = "Sent";
                invoice.ReminderSentCount++;
                invoice.LastReminderDate = log.SentAt;
                _logger.LogInformation(
                    "Credit reminder ({Type}) sent for invoice {InvoiceNumber} to {Email}",
                    emailType,
                    invoice.InvoiceNumber,
                    emailTo);
            }
            catch (Exception ex)
            {
                var error = ex.Message.Length > 500 ? ex.Message[..500] : ex.Message;
                log.Status = "Failed";
                log.ErrorMessage = error;
                reminderLog.Status = "Failed";
                reminderLog.ErrorMessage = error;
                _logger.LogWarning(ex, "Credit reminder failed for invoice {InvoiceId}", invoice.Id);
                await PersistLogsAsync(log, reminderLog, cancellationToken);
                return new CreditReminderSendResult
                {
                    Success = false,
                    Message = $"Failed to send email: {ex.Message}",
                    EmailType = emailType,
                    OverdueDays = overdueDays,
                };
            }

            await PersistLogsAsync(log, reminderLog, cancellationToken);

            return new CreditReminderSendResult
            {
                Success = true,
                Message = manual
                    ? overdueDays >= MinOverdueDaysForAuto
                        ? "Manual overdue payment reminder sent successfully."
                        : "Manual payment reminder sent successfully (outstanding balance)."
                    : "Automatic overdue reminder sent (30+ days past due).",
                EmailType = emailType,
                OverdueDays = overdueDays,
                Log = MapLog(log),
            };
        }

        public async Task<int> ProcessAutomaticRemindersAsync(CancellationToken cancellationToken = default)
        {
            var candidates = await _db.Invoices
                .AsNoTracking()
                .Include(i => i.Sale)
                .Where(i =>
                    !i.IsPaid &&
                    i.BalanceAmount > 0 &&
                    (i.PaymentStatus == InvoicePaymentStatus.Credit
                     || i.PaymentStatus == InvoicePaymentStatus.Partial))
                .OrderByDescending(i => i.BalanceAmount)
                .ToListAsync(cancellationToken);

            var sent = 0;
            foreach (var row in candidates)
            {
                var overdueDays = CalculateOverdueDays(
                    row.CreatedDate,
                    row.DueDate,
                    row.IsPaid,
                    row.BalanceAmount);

                if (overdueDays < MinOverdueDaysForAuto)
                {
                    continue;
                }

                var result = await SendReminderAsync(row.Id, manual: false, cancellationToken);
                if (result.Success)
                {
                    sent++;
                }
            }

            return sent;
        }

        public async Task<EmailReminderLogsPageDto> GetReminderLogsAsync(
            string? search,
            int page,
            int pageSize,
            CancellationToken cancellationToken = default)
        {
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var query = _db.EmailReminderLogs
                .AsNoTracking()
                .Include(l => l.Customer)
                .Include(l => l.Invoice)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLowerInvariant();
                query = query.Where(l =>
                    l.Email.ToLower().Contains(term)
                    || (l.Customer != null && l.Customer.Name.ToLower().Contains(term))
                    || (l.Invoice != null && l.Invoice.InvoiceNumber.ToLower().Contains(term))
                    || l.Status.ToLower().Contains(term));
            }

            var totalCount = await query.CountAsync(cancellationToken);

            var rows = await query
                .OrderByDescending(l => l.SentAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            return new EmailReminderLogsPageDto
            {
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                Items = rows.Select(MapReminderLog).ToList(),
            };
        }

        private async Task PersistLogsAsync(
            EmailLog log,
            EmailReminderLog reminderLog,
            CancellationToken cancellationToken)
        {
            await _db.EmailLogs.AddAsync(log, cancellationToken);
            await _db.EmailReminderLogs.AddAsync(reminderLog, cancellationToken);
            await _db.SaveChangesAsync(cancellationToken);
        }

        public static EmailLogDto MapLog(EmailLog log) => new()
        {
            Id = log.Id,
            CustomerId = log.CustomerId,
            InvoiceId = log.InvoiceId,
            EmailType = log.EmailType,
            EmailTypeLabel = CreditReminderEmailTemplates.TypeLabel(log.EmailType),
            SentAt = log.SentAt,
            Status = log.Status,
            IsAutomatic = log.IsAutomatic,
            ErrorMessage = log.ErrorMessage,
        };

        public static EmailReminderLogDto MapReminderLog(EmailReminderLog log)
        {
            DateTime? due = null;
            if (log.Invoice != null)
            {
                due = log.Invoice.DueDate == default
                    ? log.Invoice.CreatedDate.AddDays(30)
                    : log.Invoice.DueDate;
            }

            return new EmailReminderLogDto
            {
                Id = log.Id,
                CustomerId = log.CustomerId,
                CustomerName = log.Customer?.Name ?? "Unknown",
                CreditPaymentId = log.CreditPaymentId,
                InvoiceNumber = log.Invoice?.InvoiceNumber ?? $"INV-{log.CreditPaymentId}",
                Email = log.Email,
                PaymentAmount = log.Invoice?.BalanceAmount ?? 0,
                DueDate = due,
                SentAt = log.SentAt,
                Status = log.Status,
                ErrorMessage = log.ErrorMessage,
            };
        }
    }
}
