namespace VehiclePartsManagementSystem.Infrastructure.Services
{
    internal static class CreditReminderEmailTemplates
    {
        public const string OverduePaymentReminderSubject = "Overdue Payment Reminder";
        public const string OutstandingPaymentReminderSubject = "Outstanding Credit Payment Reminder";

        /// <summary>
        /// Unified payment reminder email for automatic (30+ days overdue) and manual (Credit Management) sends.
        /// </summary>
        public static (string Subject, string Html, string EmailTypeKey) BuildPaymentReminder(
            string customerName,
            string invoiceNumber,
            decimal balanceDue,
            DateTime dueDate,
            int overdueDays,
            string companyName,
            bool isManual)
        {
            var amount = balanceDue.ToString("N2");
            var dueDateLabel = dueDate.ToString("MMMM dd, yyyy");
            var isOverdue30Plus = overdueDays >= 30;

            string subject;
            string headline;
            string bodyParagraph;
            string badgeHtml;
            string footerNote;
            string emailTypeKey;

            if (isManual && !isOverdue30Plus)
            {
                subject = OutstandingPaymentReminderSubject;
                headline = "Credit balance reminder";
                bodyParagraph =
                    $@"You have an <strong>outstanding credit balance of ${amount}</strong> remaining to be paid
for Invoice <strong>#{System.Net.WebUtility.HtmlEncode(invoiceNumber)}</strong>.
Please complete your payment at your earliest convenience.";
                badgeHtml =
                    @"<span style=""display:inline-block;background:#2563eb;color:#fff;font-size:11px;font-weight:700;padding:6px 14px;border-radius:999px;letter-spacing:0.06em;"">OUTSTANDING BALANCE</span>";
                footerNote = "This reminder was sent manually from our credit management team.";
                emailTypeKey = "ManualOutstanding";
            }
            else if (isOverdue30Plus)
            {
                subject = OverduePaymentReminderSubject;
                headline = "Payment Reminder";
                bodyParagraph =
                    @"Your credit payment is <strong>overdue</strong>. Please complete your payment as soon as possible to avoid further issues.";
                var badgeLabel = overdueDays >= 90
                    ? "FINAL NOTICE"
                    : overdueDays >= 60
                        ? "URGENT · OVERDUE"
                        : "OVERDUE · ACTION REQUIRED";
                var badgeColor = overdueDays >= 90 ? "#dc2626" : overdueDays >= 60 ? "#ea580c" : "#dc2626";
                badgeHtml =
                    $@"<span style=""display:inline-block;background:{badgeColor};color:#fff;font-size:11px;font-weight:700;padding:6px 14px;border-radius:999px;letter-spacing:0.06em;"">{badgeLabel} · {overdueDays} DAYS</span>";
                footerNote = isManual
                    ? "This overdue payment reminder was sent manually from Credit Management."
                    : $"This is an automated overdue payment reminder (30+ days past due) from {System.Net.WebUtility.HtmlEncode(companyName)}.";
                emailTypeKey = isManual ? "ManualReminder" : "AutomaticOverdue";
            }
            else
            {
                subject = OutstandingPaymentReminderSubject;
                headline = "Payment Reminder";
                bodyParagraph =
                    $@"This is a reminder that your outstanding balance of <strong>${amount}</strong>
for Invoice <strong>#{System.Net.WebUtility.HtmlEncode(invoiceNumber)}</strong> is still due.
Please visit our service center or contact us regarding payment.";
                badgeHtml =
                    @"<span style=""display:inline-block;background:#d97706;color:#fff;font-size:11px;font-weight:700;padding:6px 14px;border-radius:999px;letter-spacing:0.06em;"">PAYMENT DUE</span>";
                footerNote = isManual
                    ? "This reminder was sent manually from Credit Management."
                    : "This is an automated credit payment reminder.";
                emailTypeKey = isManual ? "ManualReminder" : "FriendlyReminder";
            }

            var html = $@"
<!DOCTYPE html>
<html>
<head><meta charset=""utf-8""/><meta name=""viewport"" content=""width=device-width, initial-scale=1""/></head>
<body style=""margin:0;padding:0;background:#f1f5f9;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;"">
  <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""background:#f1f5f9;padding:24px 12px;"">
    <tr><td align=""center"">
      <table role=""presentation"" width=""100%"" style=""max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08);"">
        <tr>
          <td style=""background:linear-gradient(135deg,#1d4ed8,#2563eb);padding:28px 32px;color:#ffffff;"">
            <p style=""margin:0;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;opacity:0.9;"">{System.Net.WebUtility.HtmlEncode(companyName)}</p>
            <h1 style=""margin:8px 0 0;font-size:22px;font-weight:700;"">{headline}</h1>
          </td>
        </tr>
        <tr>
          <td style=""padding:32px;"">
            <p style=""margin:0 0 16px;font-size:15px;color:#334155;line-height:1.6;"">Dear {System.Net.WebUtility.HtmlEncode(customerName)},</p>
            <p style=""margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;"">{bodyParagraph}</p>
            <p style=""margin:0 0 20px;text-align:center;"">{badgeHtml}</p>
            <table role=""presentation"" width=""100%"" style=""background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;margin-bottom:20px;"">
              <tr>
                <td style=""padding:20px 24px;"">
                  <p style=""margin:0 0 10px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;"">Payment details</p>
                  <p style=""margin:0;font-size:15px;color:#0f172a;""><strong>Invoice #:</strong> {System.Net.WebUtility.HtmlEncode(invoiceNumber)}</p>
                  <p style=""margin:10px 0 0;font-size:15px;color:#0f172a;""><strong>Amount left to pay:</strong> ${amount}</p>
                  <p style=""margin:10px 0 0;font-size:15px;color:#0f172a;""><strong>Due date:</strong> {System.Net.WebUtility.HtmlEncode(dueDateLabel)}</p>
                  {(isOverdue30Plus ? $@"<p style=""margin:10px 0 0;font-size:15px;color:#0f172a;""><strong>Days overdue:</strong> {overdueDays}</p>" : "")}
                </td>
              </tr>
            </table>
            <p style=""margin:0;font-size:14px;color:#64748b;line-height:1.6;"">
              If you have already made this payment, please disregard this message or contact us with your receipt reference.
            </p>
            <p style=""margin:20px 0 0;font-size:14px;color:#64748b;line-height:1.6;"">Thank you,<br/><strong style=""color:#0f172a;"">{System.Net.WebUtility.HtmlEncode(companyName)}</strong></p>
          </td>
        </tr>
        <tr>
          <td style=""padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;"">
            <p style=""margin:0;font-size:11px;color:#94a3b8;"">{footerNote}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>";

            return (subject, html, emailTypeKey);
        }

        /// <summary>Backward-compatible wrapper for automatic overdue sends.</summary>
        public static (string Subject, string Html) BuildOverduePaymentReminder(
            string customerName,
            decimal dueAmount,
            DateTime dueDate,
            string companyName,
            string invoiceNumber = "",
            int overdueDays = 30)
        {
            var (subject, html, _) = BuildPaymentReminder(
                customerName,
                string.IsNullOrWhiteSpace(invoiceNumber) ? "—" : invoiceNumber,
                dueAmount,
                dueDate,
                Math.Max(30, overdueDays),
                companyName,
                isManual: false);
            return (subject, html);
        }

        public static (string Subject, string Html) Build(
            string emailType,
            string customerName,
            string invoiceNumber,
            decimal remainingBalance,
            int overdueDays,
            string companyName)
        {
            var (subject, html, _) = BuildPaymentReminder(
                customerName,
                invoiceNumber,
                remainingBalance,
                DateTime.UtcNow,
                overdueDays,
                companyName,
                isManual: true);
            return (subject, html);
        }

        public static string TypeLabel(string emailType) => emailType switch
        {
            "AutomaticOverdue" => "Automatic overdue (30+ days)",
            "ManualOutstanding" => "Manual — outstanding balance",
            "FinalNotice" => "Final notice (90+ days)",
            "UrgentReminder" => "Urgent reminder (60+ days)",
            "FriendlyReminder" => "Friendly reminder (30+ days)",
            "ManualReminder" => "Manual reminder (30+ days overdue)",
            _ => emailType,
        };
    }
}
