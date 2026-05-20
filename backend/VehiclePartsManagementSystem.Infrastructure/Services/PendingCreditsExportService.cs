using System.Globalization;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using VehiclePartsManagementSystem.Application.Interfaces;

namespace VehiclePartsManagementSystem.Infrastructure.Services
{
    public class PendingCreditsExportService : IPendingCreditsExportService
    {
        private readonly ICustomerReportService _reportService;

        public PendingCreditsExportService(ICustomerReportService reportService)
        {
            _reportService = reportService;
            QuestPDF.Settings.License = LicenseType.Community;
        }

        public async Task<byte[]> ExportPdfAsync(
            DateTime? from,
            DateTime? to,
            string? search,
            string? overdueStatus,
            CancellationToken cancellationToken = default)
        {
            var report = await _reportService.GetPendingCreditsAsync(from, to, search, overdueStatus, cancellationToken);
            return BuildPdf(report, from, to);
        }

        private static byte[] BuildPdf(
            Application.DTOs.PendingCreditsReportDto report,
            DateTime? from,
            DateTime? to)
        {
            var rows = report.Items;
            var generatedAt = DateTime.UtcNow;
            var currentCount = rows.Count(r => r.AgingBucket == "current");
            var warningCount = rows.Count(r => r.AgingBucket == "warning");
            var overdueCount = rows.Count(r => r.AgingBucket == "overdue");

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4.Landscape());
                    page.Margin(32);
                    page.DefaultTextStyle(x => x.FontSize(9));

                    page.Header().Column(col =>
                    {
                        col.Item().Text("AutoParts Plus").Bold().FontSize(16).FontColor(Colors.Red.Medium);
                        col.Item().Text("Pending Credit Report").FontSize(13).SemiBold();
                        col.Item().Text($"Date range: {FormatRangeLabel(from, to)}").FontSize(8);
                        col.Item().Text($"Generated: {generatedAt:MMMM d, yyyy h:mm tt} UTC").FontSize(8);
                        col.Item().PaddingTop(6).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
                    });

                    page.Content().PaddingVertical(10).Column(col =>
                    {
                        col.Item().Background(Colors.Blue.Lighten4).Padding(8).Row(r =>
                        {
                            r.RelativeItem().Text($"Outstanding Total: {report.OutstandingTotal:C2}")
                                .Bold().FontSize(11);
                            r.RelativeItem().AlignRight().Text(
                                $"Invoices: {rows.Count} · Current: {currentCount} · Warning: {warningCount} · Overdue: {overdueCount}")
                                .FontSize(8);
                        });

                        col.Item().PaddingTop(10).Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn(2);
                                columns.RelativeColumn(3);
                                columns.RelativeColumn(2);
                                columns.RelativeColumn(2);
                                columns.ConstantColumn(48);
                                columns.RelativeColumn(2);
                            });

                            table.Header(header =>
                            {
                                var hdr = Colors.Red.Medium;
                                void H(string t) => header.Cell().Background(hdr).Padding(4)
                                    .Text(t).FontColor(Colors.White).SemiBold().FontSize(8);
                                H("Invoice #");
                                H("Customer");
                                H("Amount Due");
                                H("Sales Date");
                                H("Days");
                                H("Contact");
                            });

                            var i = 0;
                            foreach (var row in rows)
                            {
                                i++;
                                var bg = i % 2 == 0 ? Colors.Grey.Lighten4 : Colors.White;
                                table.Cell().Background(bg).Padding(4).Text(row.InvoiceNumber);
                                table.Cell().Background(bg).Padding(4).Text(row.CustomerName);
                                table.Cell().Background(bg).Padding(4)
                                    .Text(row.OutstandingAmount.ToString("C2", CultureInfo.GetCultureInfo("en-US")));
                                table.Cell().Background(bg).Padding(4)
                                    .Text(row.SalesDate.ToString("MMM d, yyyy", CultureInfo.InvariantCulture));
                                table.Cell().Background(bg).Padding(4).Text(row.DaysOutstanding.ToString());
                                table.Cell().Background(bg).Padding(4).Text(row.CustomerPhone);
                            }

                            if (rows.Count == 0)
                            {
                                table.Cell().ColumnSpan(6).Padding(12).AlignCenter()
                                    .Text("No pending credit invoices for the selected filters.");
                            }
                        });
                    });

                    page.Footer().AlignCenter().Text(text =>
                    {
                        text.Span("AutoParts Plus · Confidential · Page ");
                        text.CurrentPageNumber();
                        text.Span(" of ");
                        text.TotalPages();
                    });
                });
            });

            return document.GeneratePdf();
        }

        private static string FormatRangeLabel(DateTime? from, DateTime? to)
        {
            if (from.HasValue && to.HasValue)
            {
                return $"{from.Value:yyyy-MM-dd} to {to.Value:yyyy-MM-dd}";
            }

            if (from.HasValue)
            {
                return $"From {from.Value:yyyy-MM-dd}";
            }

            if (to.HasValue)
            {
                return $"Through {to.Value:yyyy-MM-dd}";
            }

            return "All dates";
        }
    }
}
