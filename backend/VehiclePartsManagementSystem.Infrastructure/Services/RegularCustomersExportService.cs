using System.Globalization;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;

namespace VehiclePartsManagementSystem.Infrastructure.Services
{
    public class RegularCustomersExportService : IRegularCustomersExportService
    {
        private readonly ICustomerReportService _reportService;

        public RegularCustomersExportService(ICustomerReportService reportService)
        {
            _reportService = reportService;
            QuestPDF.Settings.License = LicenseType.Community;
        }

        public async Task<byte[]> ExportPdfAsync(
            DateTime? from,
            DateTime? to,
            CancellationToken cancellationToken = default)
        {
            var rows = await _reportService.GetRegularCustomersAsync(from, to, null, cancellationToken);
            return BuildPdf(rows, from, to);
        }

        private static byte[] BuildPdf(
            List<RegularCustomerReportRowDto> rows,
            DateTime? from,
            DateTime? to)
        {
            var generatedAt = DateTime.UtcNow;
            var avgOrder = rows.Count > 0 ? rows.Average(r => r.AverageOrderValue) : 0m;
            var totalPurchases = rows.Sum(r => r.PurchaseCount);
            var frequentCount = rows.Count(r => r.EngagementLevel == "Frequent");

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(36);
                    page.DefaultTextStyle(x => x.FontSize(10));

                    page.Header().Column(col =>
                    {
                        col.Item().Text("AutoParts Plus").Bold().FontSize(18).FontColor(Colors.Green.Darken2);
                        col.Item().Text("Regular Customers Report").FontSize(14).SemiBold();
                        col.Item().PaddingTop(4).Text($"Date range: {FormatRangeLabel(from, to)}").FontSize(9);
                        col.Item().Text($"Generated: {generatedAt:MMMM d, yyyy h:mm tt} UTC").FontSize(9);
                        col.Item().PaddingTop(8).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
                    });

                    page.Content().PaddingVertical(12).Column(col =>
                    {
                        col.Item().Background(Colors.Green.Lighten4).Padding(8).Row(summary =>
                        {
                            summary.RelativeItem().Column(c =>
                            {
                                c.Item().Text("Regular customers").FontSize(8).FontColor(Colors.Grey.Darken1);
                                c.Item().Text(rows.Count.ToString()).Bold().FontSize(12);
                            });
                            summary.RelativeItem().Column(c =>
                            {
                                c.Item().Text("Total purchases").FontSize(8).FontColor(Colors.Grey.Darken1);
                                c.Item().Text(totalPurchases.ToString()).Bold().FontSize(12);
                            });
                            summary.RelativeItem().Column(c =>
                            {
                                c.Item().Text("Avg. order value").FontSize(8).FontColor(Colors.Grey.Darken1);
                                c.Item().Text(avgOrder.ToString("C2", CultureInfo.GetCultureInfo("en-US"))).Bold().FontSize(12);
                            });
                            summary.RelativeItem().Column(c =>
                            {
                                c.Item().Text("Frequent buyers").FontSize(8).FontColor(Colors.Grey.Darken1);
                                c.Item().Text(frequentCount.ToString()).Bold().FontSize(12);
                            });
                        });

                        col.Item().PaddingTop(12).Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn(3);
                                columns.ConstantColumn(72);
                                columns.RelativeColumn(2);
                                columns.RelativeColumn(2);
                            });

                            table.Header(header =>
                            {
                                var hdr = Colors.Green.Medium;
                                header.Cell().Background(hdr).Padding(6).Text("Customer").FontColor(Colors.White).SemiBold();
                                header.Cell().Background(hdr).Padding(6).Text("Purchases").FontColor(Colors.White).SemiBold();
                                header.Cell().Background(hdr).Padding(6).Text("Avg. Value").FontColor(Colors.White).SemiBold();
                                header.Cell().Background(hdr).Padding(6).Text("Engagement").FontColor(Colors.White).SemiBold();
                            });

                            var i = 0;
                            foreach (var row in rows)
                            {
                                i++;
                                var bg = i % 2 == 0 ? Colors.Grey.Lighten4 : Colors.White;
                                table.Cell().Background(bg).Padding(5).Text(row.CustomerName);
                                table.Cell().Background(bg).Padding(5).Text(row.PurchaseCount.ToString());
                                table.Cell().Background(bg).Padding(5)
                                    .Text(row.AverageOrderValue.ToString("C2", CultureInfo.GetCultureInfo("en-US")));
                                table.Cell().Background(bg).Padding(5).Text(row.EngagementLevel);
                            }

                            if (rows.Count == 0)
                            {
                                table.Cell().ColumnSpan(4).Padding(16).AlignCenter()
                                    .Text("No regular customers for the selected date range.");
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
