using System.Globalization;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;
using VehiclePartsManagementSystem.Infrastructure.Data;

namespace VehiclePartsManagementSystem.Infrastructure.Services
{
    public class AppointmentsExportService : IAppointmentsExportService
    {
        private readonly AppDbContext _db;

        public AppointmentsExportService(AppDbContext db)
        {
            _db = db;
            QuestPDF.Settings.License = LicenseType.Community;
        }

        public async Task<byte[]> ExportPdfAsync(
            string? status,
            string? fromDate,
            string? toDate,
            string? serviceType,
            string? search,
            CancellationToken cancellationToken = default)
        {
            var report = await QueryAppointmentsAsync(
                status,
                fromDate,
                toDate,
                serviceType,
                search,
                cancellationToken);
            return BuildPdf(report, fromDate, toDate);
        }

        private async Task<AppointmentsListResponseDto> QueryAppointmentsAsync(
            string? status,
            string? fromDate,
            string? toDate,
            string? serviceType,
            string? search,
            CancellationToken cancellationToken)
        {
            var query = _db.ServiceAppointments.AsNoTracking()
                .Include(a => a.Customer!)
                .ThenInclude(c => c.Vehicles)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(serviceType))
            {
                var st = serviceType.Trim();
                query = query.Where(a => a.ServiceType.ToLower() == st.ToLower());
            }

            if (DateOnly.TryParseExact(fromDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var fromDay))
            {
                var fromUtc = DateTime.SpecifyKind(fromDay.ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc);
                query = query.Where(a => a.Date >= fromUtc);
            }

            if (DateOnly.TryParseExact(toDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var toDay))
            {
                var toUtc = DateTime.SpecifyKind(toDay.ToDateTime(TimeOnly.MaxValue), DateTimeKind.Utc);
                query = query.Where(a => a.Date <= toUtc);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLower();
                query = query.Where(a =>
                    (a.Customer != null && a.Customer.Name.ToLower().Contains(term)) ||
                    (a.Customer != null && a.Customer.Phone.ToLower().Contains(term)) ||
                    (a.VehicleNumber != null && a.VehicleNumber.ToLower().Contains(term)) ||
                    a.ServiceType.ToLower().Contains(term) ||
                    a.Status.ToLower().Contains(term));
            }

            var rows = await query.OrderByDescending(a => a.Date).ToListAsync(cancellationToken);

            var items = rows.Select(a =>
            {
                var vehicle = a.Customer?.Vehicles?.FirstOrDefault(v =>
                    !string.IsNullOrWhiteSpace(a.VehicleNumber) &&
                    string.Equals(v.VehicleNumber, a.VehicleNumber, StringComparison.OrdinalIgnoreCase));

                return new AppointmentDto
                {
                    Id = a.Id,
                    CustomerId = a.CustomerId,
                    CustomerName = a.Customer?.Name ?? "",
                    CustomerPhone = a.Customer?.Phone ?? "",
                    VehicleNumber = a.VehicleNumber,
                    VehicleMakeModel = vehicle != null ? $"{vehicle.Brand} {vehicle.Model}".Trim() : null,
                    ServiceType = a.ServiceType,
                    Status = a.Status,
                    Date = a.Date,
                    Notes = a.Notes,
                    EstimatedCost = a.EstimatedCost,
                };
            }).ToList();

            var allItems = items;
            if (!string.IsNullOrWhiteSpace(status))
            {
                var bucket = NormalizeStatusBucket(status);
                items = allItems.Where(a => NormalizeStatusBucket(a.Status) == bucket).ToList();
            }

            return new AppointmentsListResponseDto
            {
                Summary = new AppointmentsSummaryDto
                {
                    Pending = allItems.Count(a => NormalizeStatusBucket(a.Status) == "pending"),
                    Confirmed = allItems.Count(a => NormalizeStatusBucket(a.Status) == "confirmed"),
                    Cancelled = allItems.Count(a => NormalizeStatusBucket(a.Status) == "cancelled"),
                    Completed = allItems.Count(a => NormalizeStatusBucket(a.Status) == "completed"),
                },
                Items = items,
            };
        }

        private static string NormalizeStatusBucket(string status)
        {
            var s = status.Trim().ToLowerInvariant();
            if (s is "scheduled" or "pending") return "pending";
            if (s is "approved" or "confirmed") return "confirmed";
            if (s is "cancelled" or "canceled" or "rejected") return "cancelled";
            if (s == "completed") return "completed";
            return s;
        }

        private static byte[] BuildPdf(AppointmentsListResponseDto report, string? fromDate, string? toDate)
        {
            using var stream = new MemoryStream();
            var generatedAt = DateTime.UtcNow;
            var rows = report.Items;

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4.Landscape());
                    page.Margin(32);
                    page.DefaultTextStyle(x => x.FontSize(9));

                    page.Header().Column(col =>
                    {
                        col.Item().Text("AutoParts Plus").Bold().FontSize(16).FontColor(Colors.Blue.Medium);
                        col.Item().Text("Manage Appointments Report").FontSize(13).SemiBold();
                        col.Item().Text($"Date range: {FormatRangeLabel(fromDate, toDate)}").FontSize(8);
                        col.Item().Text($"Generated: {generatedAt:MMMM d, yyyy h:mm tt} UTC").FontSize(8);
                    });

                    page.Content().PaddingVertical(10).Column(col =>
                    {
                        col.Item().Text(
                            $"Pending: {report.Summary.Pending} · Confirmed: {report.Summary.Confirmed} · Cancelled: {report.Summary.Cancelled} · Completed: {report.Summary.Completed}")
                            .FontSize(10).SemiBold();

                        col.Item().PaddingTop(10).Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn(2);
                                columns.RelativeColumn(2.5f);
                                columns.RelativeColumn(2);
                                columns.RelativeColumn(2);
                                columns.RelativeColumn(1.5f);
                            });

                            table.Header(header =>
                            {
                                foreach (var title in new[] { "Date & Time", "Customer", "Vehicle", "Service", "Status" })
                                {
                                    header.Cell().Background(Colors.Blue.Medium).Padding(4)
                                        .Text(title).FontColor(Colors.White);
                                }
                            });

                            foreach (var row in rows)
                            {
                                table.Cell().BorderBottom(0.5f).Padding(4)
                                    .Text(row.Date.ToString("MMM d, yyyy h:mm tt", CultureInfo.InvariantCulture));
                                table.Cell().BorderBottom(0.5f).Padding(4)
                                    .Text($"{row.CustomerName}\n{row.CustomerPhone}");
                                table.Cell().BorderBottom(0.5f).Padding(4)
                                    .Text($"{row.VehicleMakeModel ?? "—"}\n{row.VehicleNumber ?? ""}");
                                table.Cell().BorderBottom(0.5f).Padding(4).Text(row.ServiceType);
                                table.Cell().BorderBottom(0.5f).Padding(4).Text(row.Status);
                            }
                        });
                    });
                });
            });

            document.GeneratePdf(stream);
            return stream.ToArray();
        }

        private static string FormatRangeLabel(string? fromDate, string? toDate)
        {
            if (!string.IsNullOrWhiteSpace(fromDate) && !string.IsNullOrWhiteSpace(toDate))
                return $"{fromDate} to {toDate}";
            if (!string.IsNullOrWhiteSpace(fromDate)) return $"From {fromDate}";
            if (!string.IsNullOrWhiteSpace(toDate)) return $"Through {toDate}";
            return "All dates";
        }
    }
}
