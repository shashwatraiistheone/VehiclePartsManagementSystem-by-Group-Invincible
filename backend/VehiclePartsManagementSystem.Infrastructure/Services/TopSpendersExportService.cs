using System.Globalization;
using System.Text;
using ClosedXML.Excel;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;

namespace VehiclePartsManagementSystem.Infrastructure.Services
{
    public class TopSpendersExportService : ITopSpendersExportService
    {
        private readonly ICustomerReportService _reportService;

        public TopSpendersExportService(ICustomerReportService reportService)
        {
            _reportService = reportService;
            QuestPDF.Settings.License = LicenseType.Community;
        }

        public Task<byte[]> ExportCsvAsync(
            DateTime? from,
            DateTime? to,
            CancellationToken cancellationToken = default)
            => ExportAsync(from, to, BuildCsv, cancellationToken);

        public Task<byte[]> ExportExcelAsync(
            DateTime? from,
            DateTime? to,
            CancellationToken cancellationToken = default)
            => ExportAsync(from, to, BuildExcel, cancellationToken);

        public Task<byte[]> ExportPdfAsync(
            DateTime? from,
            DateTime? to,
            CancellationToken cancellationToken = default)
            => ExportAsync(from, to, BuildPdf, cancellationToken);

        private async Task<byte[]> ExportAsync(
            DateTime? from,
            DateTime? to,
            Func<List<TopSpenderReportRowDto>, DateTime?, DateTime?, byte[]> builder,
            CancellationToken cancellationToken)
        {
            var rows = await _reportService.GetTopSpendersAsync(from, to, null, cancellationToken);
            return builder(rows, from, to);
        }

        private static byte[] BuildCsv(List<TopSpenderReportRowDto> rows, DateTime? from, DateTime? to)
        {
            var sb = new StringBuilder();
            sb.AppendLine("Rank,Customer Name,Total Spent,Total Purchases,Last Purchase Date");

            var rank = 1;
            foreach (var row in rows)
            {
                sb.Append(rank).Append(',');
                sb.Append(EscapeCsv(row.CustomerName)).Append(',');
                sb.Append(row.TotalSpent.ToString("F2", CultureInfo.InvariantCulture)).Append(',');
                sb.Append(row.PurchaseCount).Append(',');
                sb.Append(EscapeCsv(FormatDate(row.LastPurchaseDate)));
                sb.AppendLine();
                rank++;
            }

            return Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(sb.ToString())).ToArray();
        }

        private static byte[] BuildExcel(List<TopSpenderReportRowDto> rows, DateTime? from, DateTime? to)
        {
            using var workbook = new XLWorkbook();
            var ws = workbook.Worksheets.Add("Top Spenders Report");

            ws.Cell(1, 1).Value = "AutoParts Plus — Top Spenders Report";
            ws.Range(1, 1, 1, 5).Merge().Style.Font.SetBold().Font.SetFontSize(14);

            ws.Cell(2, 1).Value = $"Date range: {FormatRangeLabel(from, to)}";
            ws.Range(2, 1, 2, 5).Merge().Style.Font.SetFontSize(10);

            ws.Cell(3, 1).Value = $"Generated: {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC";
            ws.Range(3, 1, 3, 5).Merge().Style.Font.SetFontSize(10);

            const int headerRow = 5;
            var headers = new[] { "Rank", "Customer Name", "Total Spent", "Total Purchases", "Last Purchase Date" };
            for (var c = 0; c < headers.Length; c++)
            {
                var cell = ws.Cell(headerRow, c + 1);
                cell.Value = headers[c];
                cell.Style.Font.SetBold();
                cell.Style.Fill.SetBackgroundColor(XLColor.FromHtml("#2563EB"));
                cell.Style.Font.SetFontColor(XLColor.White);
            }

            var dataRow = headerRow + 1;
            var rank = 1;
            foreach (var row in rows)
            {
                ws.Cell(dataRow, 1).Value = rank;
                ws.Cell(dataRow, 2).Value = row.CustomerName;
                ws.Cell(dataRow, 3).Value = row.TotalSpent;
                ws.Cell(dataRow, 3).Style.NumberFormat.Format = "$#,##0.00";
                ws.Cell(dataRow, 4).Value = row.PurchaseCount;
                if (row.LastPurchaseDate.HasValue)
                {
                    ws.Cell(dataRow, 5).Value = row.LastPurchaseDate.Value;
                    ws.Cell(dataRow, 5).Style.DateFormat.Format = "yyyy-mm-dd";
                }
                else
                {
                    ws.Cell(dataRow, 5).Value = "—";
                }

                dataRow++;
                rank++;
            }

            if (rows.Count > 0)
            {
                var summaryRow = dataRow + 1;
                ws.Cell(summaryRow, 1).Value = "Summary";
                ws.Cell(summaryRow, 1).Style.Font.SetBold();
                ws.Cell(summaryRow, 2).Value = $"{rows.Count} customers";
                ws.Cell(summaryRow, 3).Value = rows.Sum(r => r.TotalSpent);
                ws.Cell(summaryRow, 3).Style.NumberFormat.Format = "$#,##0.00";
                ws.Cell(summaryRow, 4).Value = rows.Sum(r => r.PurchaseCount);
            }

            ws.Columns().AdjustToContents();
            ws.SheetView.FreezeRows(headerRow);

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            return stream.ToArray();
        }

        private static byte[] BuildPdf(List<TopSpenderReportRowDto> rows, DateTime? from, DateTime? to)
        {
            var totalSpent = rows.Sum(r => r.TotalSpent);
            var totalPurchases = rows.Sum(r => r.PurchaseCount);
            var generatedAt = DateTime.UtcNow;

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(36);
                    page.DefaultTextStyle(x => x.FontSize(10));

                    page.Header().Column(col =>
                    {
                        col.Item().Text("AutoParts Plus").Bold().FontSize(18).FontColor(Colors.Blue.Darken2);
                        col.Item().Text("Top Spenders Report").FontSize(14).SemiBold();
                        col.Item().PaddingTop(4).Text($"Date range: {FormatRangeLabel(from, to)}").FontSize(9);
                        col.Item().Text($"Generated: {generatedAt:MMMM d, yyyy h:mm tt} UTC").FontSize(9);
                        col.Item().PaddingTop(8).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
                    });

                    page.Content().PaddingVertical(12).Column(col =>
                    {
                        col.Item().Background(Colors.Blue.Lighten4).Padding(8).Row(summary =>
                        {
                            summary.RelativeItem().Column(c =>
                            {
                                c.Item().Text("Total customers").FontSize(8).FontColor(Colors.Grey.Darken1);
                                c.Item().Text(rows.Count.ToString()).Bold().FontSize(12);
                            });
                            summary.RelativeItem().Column(c =>
                            {
                                c.Item().Text("Combined spend").FontSize(8).FontColor(Colors.Grey.Darken1);
                                c.Item().Text(totalSpent.ToString("C2", CultureInfo.GetCultureInfo("en-US"))).Bold().FontSize(12);
                            });
                            summary.RelativeItem().Column(c =>
                            {
                                c.Item().Text("Total purchases").FontSize(8).FontColor(Colors.Grey.Darken1);
                                c.Item().Text(totalPurchases.ToString()).Bold().FontSize(12);
                            });
                        });

                        col.Item().PaddingTop(12).Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.ConstantColumn(32);
                                columns.RelativeColumn(3);
                                columns.RelativeColumn(2);
                                columns.ConstantColumn(56);
                                columns.RelativeColumn(2);
                            });

                            table.Header(header =>
                            {
                                header.Cell().Background(Colors.Blue.Medium).Padding(6)
                                    .Text("Rank").FontColor(Colors.White).SemiBold();
                                header.Cell().Background(Colors.Blue.Medium).Padding(6)
                                    .Text("Customer").FontColor(Colors.White).SemiBold();
                                header.Cell().Background(Colors.Blue.Medium).Padding(6)
                                    .Text("Total Spent").FontColor(Colors.White).SemiBold();
                                header.Cell().Background(Colors.Blue.Medium).Padding(6)
                                    .Text("Purchases").FontColor(Colors.White).SemiBold();
                                header.Cell().Background(Colors.Blue.Medium).Padding(6)
                                    .Text("Last Purchase").FontColor(Colors.White).SemiBold();
                            });

                            var rank = 1;
                            foreach (var row in rows)
                            {
                                var bg = rank % 2 == 0 ? Colors.Grey.Lighten4 : Colors.White;
                                table.Cell().Background(bg).Padding(5).Text(rank.ToString());
                                table.Cell().Background(bg).Padding(5).Text(row.CustomerName);
                                table.Cell().Background(bg).Padding(5)
                                    .Text(row.TotalSpent.ToString("C2", CultureInfo.GetCultureInfo("en-US")));
                                table.Cell().Background(bg).Padding(5).Text(row.PurchaseCount.ToString());
                                table.Cell().Background(bg).Padding(5).Text(FormatDate(row.LastPurchaseDate));
                                rank++;
                            }

                            if (rows.Count == 0)
                            {
                                table.Cell().ColumnSpan(5).Padding(16)
                                    .AlignCenter().Text("No records for the selected date range.");
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

        private static string EscapeCsv(string value)
        {
            if (value.Contains(',') || value.Contains('"') || value.Contains('\n'))
            {
                return $"\"{value.Replace("\"", "\"\"")}\"";
            }

            return value;
        }

        private static string FormatDate(DateTime? date)
        {
            return date.HasValue
                ? date.Value.ToString("MMM d, yyyy", CultureInfo.InvariantCulture)
                : "—";
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
