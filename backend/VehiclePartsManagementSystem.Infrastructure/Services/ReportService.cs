using Microsoft.EntityFrameworkCore;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;
using VehiclePartsManagementSystem.Domain.Entities;
using VehiclePartsManagementSystem.Infrastructure.Data;

namespace VehiclePartsManagementSystem.Infrastructure.Services
{
    public class ReportService : IReportService
    {
        private readonly AppDbContext _db;

        public ReportService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<ReportDto> GetDashboardAsync(CancellationToken cancellationToken = default)
        {
            var utcNow = DateTime.UtcNow;
            var weekStart = utcNow.Date.AddDays(-(int)utcNow.DayOfWeek);
            var monthStart = new DateTime(utcNow.Year, utcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);

            var totalCustomers = await _db.Customers.CountAsync(cancellationToken);
            var totalSales = await _db.Sales.CountAsync(cancellationToken);
            var totalRevenue = await _db.Sales.SumAsync(s => (decimal?)s.TotalAmount, cancellationToken) ?? 0m;
            var lowStockPartsCount = await _db.Parts.CountAsync(p => p.Quantity < 10, cancellationToken);
            var pending = await _db.Invoices
                .Where(i => !i.IsPaid && i.BalanceAmount > 0)
                .GroupBy(_ => 1)
                .Select(g => new { Count = g.Count(), Amount = g.Sum(i => i.BalanceAmount) })
                .FirstOrDefaultAsync(cancellationToken);
            var weeklyPurchaseItems = await (
                from item in _db.PurchaseItems
                join invoice in _db.PurchaseInvoices on item.PurchaseInvoiceId equals invoice.Id
                where invoice.Date >= weekStart
                select (int?)item.Quantity).SumAsync(cancellationToken) ?? 0;
            var weeklySales = await _db.Sales.CountAsync(s => s.Date >= weekStart, cancellationToken);
            var weeklyAppointments = await _db.ServiceAppointments.CountAsync(a => a.Date >= weekStart, cancellationToken);
            var monthlyPurchaseCost = await _db.PurchaseInvoices
                .Where(p => p.Date >= monthStart)
                .SumAsync(p => (decimal?)p.TotalAmount, cancellationToken) ?? 0m;

            return new ReportDto
            {
                TotalCustomers = totalCustomers,
                TotalSales = totalSales,
                TotalRevenue = totalRevenue,
                LowStockPartsCount = lowStockPartsCount,
                PendingCreditsCount = pending?.Count ?? 0,
                PendingCreditsAmount = pending?.Amount ?? 0m,
                WeeklyPurchaseItemsCount = weeklyPurchaseItems,
                WeeklyCustomerInteractions = weeklySales + weeklyAppointments,
                MonthlyPurchaseCost = monthlyPurchaseCost,
            };
        }

        public async Task<DashboardAnalyticsDto> GetDashboardAnalyticsAsync(CancellationToken cancellationToken = default)
        {
            var utcNow = DateTime.UtcNow;
            var start = new DateTime(utcNow.Year, utcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(-11);

            var sales = await _db.Sales
                .AsNoTracking()
                .Include(s => s.Items)
                .Where(s => s.Date >= start)
                .ToListAsync(cancellationToken);

            var labels = new List<string>();
            var monthlyRevenue = new List<decimal>();
            var monthlySalesCount = new List<int>();
            var monthlyUnits = new List<int>();

            for (var i = 0; i < 12; i++)
            {
                var monthStart = start.AddMonths(i);
                var monthEnd = monthStart.AddMonths(1);
                var bucket = sales.Where(s => s.Date >= monthStart && s.Date < monthEnd).ToList();

                labels.Add(monthStart.ToString("MMM yyyy"));
                monthlyRevenue.Add(bucket.Sum(s => s.TotalAmount));
                monthlySalesCount.Add(bucket.Count);
                monthlyUnits.Add(bucket.SelectMany(s => s.Items).Sum(i => i.Quantity));
            }

            var pending = await _db.Invoices
                .Where(i => !i.IsPaid && i.BalanceAmount > 0)
                .GroupBy(_ => 1)
                .Select(g => new { Count = g.Count(), Amount = g.Sum(i => i.BalanceAmount) })
                .FirstOrDefaultAsync(cancellationToken);

            var currentMonthRevenue = monthlyRevenue.Count > 0 ? monthlyRevenue[^1] : 0m;
            var previousMonthRevenue = monthlyRevenue.Count > 1 ? monthlyRevenue[^2] : 0m;
            var currentMonthSales = monthlySalesCount.Count > 0 ? monthlySalesCount[^1] : 0;
            var previousMonthSales = monthlySalesCount.Count > 1 ? monthlySalesCount[^2] : 0;

            var currentMonthStart = new DateTime(utcNow.Year, utcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var previousMonthStart = currentMonthStart.AddMonths(-1);
            var customersThisMonth = await _db.Customers.CountAsync(c => c.Id > 0, cancellationToken);
            var customersLastMonth = await _db.Sales
                .Where(s => s.Date >= previousMonthStart && s.Date < currentMonthStart)
                .Select(s => s.CustomerId)
                .Distinct()
                .CountAsync(cancellationToken);

            var lowStockNow = await _db.Parts.CountAsync(p => p.Quantity < 10, cancellationToken);
            var lowStockPrev = await _db.Parts.CountAsync(p => p.Quantity < 5, cancellationToken);

            return new DashboardAnalyticsDto
            {
                Labels = labels,
                MonthlyRevenue = monthlyRevenue,
                MonthlySalesCount = monthlySalesCount,
                MonthlyUnitsSold = monthlyUnits,
                PendingCreditsCount = pending?.Count ?? 0,
                PendingCreditsAmount = pending?.Amount ?? 0m,
                RevenueTrendPercent = ComputeTrendPercent(currentMonthRevenue, previousMonthRevenue),
                SalesTrendPercent = ComputeTrendPercent(currentMonthSales, previousMonthSales),
                CustomersTrendPercent = ComputeTrendPercent(customersThisMonth, customersLastMonth),
                LowStockTrendPercent = ComputeTrendPercent(lowStockNow, lowStockPrev),
                PendingCreditsTrendPercent = ComputeTrendPercent(pending?.Count ?? 0, Math.Max((pending?.Count ?? 1) - 1, 0)),
            };
        }

        public async Task<StaffDashboardDto> GetStaffDashboardAsync(
            string? displayName,
            string? email,
            string? role,
            CancellationToken cancellationToken = default)
        {
            var todayStart = DateTime.UtcNow.Date;
            var todayEnd = todayStart.AddDays(1);

            var totalCustomers = await _db.Customers.CountAsync(cancellationToken);
            var appointmentsToday = await _db.ServiceAppointments
                .CountAsync(a => a.Date >= todayStart && a.Date < todayEnd, cancellationToken);
            var salesToday = await _db.Sales
                .CountAsync(s => s.Date >= todayStart && s.Date < todayEnd, cancellationToken);
            var pendingPartRequests = await _db.PartRequests
                .CountAsync(r => r.Status == "Pending", cancellationToken);

            var account = ResolveAccountLabel(email, displayName);
            var username = !string.IsNullOrWhiteSpace(displayName)
                ? displayName.Trim()
                : account;

            var roleLabel = string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)
                ? "ADMIN"
                : "STAFF MEMBER";

            return new StaffDashboardDto
            {
                Username = username,
                Account = account,
                Role = roleLabel,
                TotalCustomers = totalCustomers,
                AppointmentsToday = appointmentsToday,
                SalesToday = salesToday,
                PendingPartRequests = pendingPartRequests,
                SystemOnline = true,
            };
        }

        public async Task<StaffWorkspaceDto> GetStaffWorkspaceAsync(
            string? displayName,
            string? email,
            CancellationToken cancellationToken = default)
        {
            var utcNow = DateTime.UtcNow;
            var todayStart = utcNow.Date;
            var todayEnd = todayStart.AddDays(1);
            var weekStart = utcNow.Date.AddDays(-(int)utcNow.DayOfWeek);
            var monthStart = new DateTime(utcNow.Year, utcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var account = ResolveAccountLabel(email, displayName);
            var username = !string.IsNullOrWhiteSpace(displayName) ? displayName.Trim() : account;

            var salesToday = await _db.Sales
                .AsNoTracking()
                .Include(s => s.Customer)
                .Include(s => s.Invoice)
                .Where(s => s.Date >= todayStart && s.Date < todayEnd)
                .ToListAsync(cancellationToken);

            var salesWeek = await _db.Sales
                .AsNoTracking()
                .Include(s => s.Customer)
                .Include(s => s.Invoice)
                .Where(s => s.Date >= weekStart)
                .ToListAsync(cancellationToken);

            var appointments = await _db.ServiceAppointments
                .AsNoTracking()
                .Include(a => a.Customer)
                .ToListAsync(cancellationToken);

            var pendingAppointments = appointments
                .Where(a =>
                    string.Equals(a.Status, "Scheduled", StringComparison.OrdinalIgnoreCase) &&
                    a.Date >= todayStart)
                .ToList();

            var todayConfirmed = appointments
                .Where(a =>
                    a.Date >= todayStart &&
                    a.Date < todayEnd &&
                    !string.Equals(a.Status, "Cancelled", StringComparison.OrdinalIgnoreCase) &&
                    !string.Equals(a.Status, "Rejected", StringComparison.OrdinalIgnoreCase))
                .OrderBy(a => a.Date)
                .Take(12)
                .ToList();

            var weekCustomerIdsFromSales = salesWeek.Select(s => s.CustomerId).Distinct();
            var weekCustomerIdsFromAppts = appointments
                .Where(a => a.Date >= weekStart)
                .Select(a => a.CustomerId)
                .Distinct();
            var customersServicedWeek = weekCustomerIdsFromSales
                .Union(weekCustomerIdsFromAppts)
                .Distinct()
                .Count();

            var salesMonth = await _db.Sales
                .AsNoTracking()
                .Where(s => s.Date >= monthStart)
                .ToListAsync(cancellationToken);

            var monthCustomerIdsFromSales = salesMonth.Select(s => s.CustomerId).Distinct();
            var monthCustomerIdsFromAppts = appointments
                .Where(a => a.Date >= monthStart)
                .Select(a => a.CustomerId)
                .Distinct();
            var customersServicedMonth = monthCustomerIdsFromSales
                .Union(monthCustomerIdsFromAppts)
                .Distinct()
                .Count();

            var pendingPartRequests = await _db.PartRequests
                .AsNoTracking()
                .Include(r => r.Customer)
                .Where(r => r.Status == "Pending")
                .OrderByDescending(r => r.CreatedAt)
                .Take(10)
                .ToListAsync(cancellationToken);

            var overdueInvoices = await _db.Invoices
                .AsNoTracking()
                .Include(i => i.Sale!)
                    .ThenInclude(s => s!.Customer)
                .Where(i => !i.IsPaid && i.BalanceAmount > 0 && i.DueDate < todayStart)
                .OrderBy(i => i.DueDate)
                .Take(10)
                .ToListAsync(cancellationToken);

            var recentSales = await _db.Sales
                .AsNoTracking()
                .Include(s => s.Customer)
                .Include(s => s.Invoice)
                .OrderByDescending(s => s.Date)
                .Take(8)
                .ToListAsync(cancellationToken);

            return new StaffWorkspaceDto
            {
                Username = username,
                Account = account,
                SalesTodayRevenue = salesToday.Sum(s => s.TotalAmount),
                SalesTodayCount = salesToday.Count,
                SalesWeekCount = salesWeek.Count,
                SalesWeekRevenue = salesWeek.Sum(s => s.TotalAmount),
                CustomersServicedWeek = customersServicedWeek,
                RevenueThisMonth = salesMonth.Sum(s => s.TotalAmount),
                CustomersServicedMonth = customersServicedMonth,
                PendingAppointmentsCount = pendingAppointments.Count,
                PendingPartRequestsCount = await _db.PartRequests.CountAsync(r => r.Status == "Pending", cancellationToken),
                OverduePaymentsCount = await _db.Invoices.CountAsync(
                    i => !i.IsPaid && i.BalanceAmount > 0 && i.DueDate < todayStart,
                    cancellationToken),
                OverduePaymentsAmount = await _db.Invoices
                    .Where(i => !i.IsPaid && i.BalanceAmount > 0 && i.DueDate < todayStart)
                    .SumAsync(i => (decimal?)i.BalanceAmount, cancellationToken) ?? 0m,
                TodayConfirmedAppointments = todayConfirmed.Select(a => new StaffWorkspaceAppointmentDto
                {
                    Id = a.Id,
                    CustomerName = a.Customer?.Name ?? "Customer",
                    ServiceType = a.ServiceType,
                    Status = a.Status,
                    Date = a.Date,
                    VehicleNumber = a.VehicleNumber,
                }).ToList(),
                PendingPartRequests = pendingPartRequests.Select(r => new StaffWorkspacePartRequestDto
                {
                    Id = r.Id,
                    CustomerName = r.Customer?.Name ?? "Customer",
                    PartName = r.PartName,
                    Quantity = r.Quantity,
                    Status = r.Status,
                    CreatedAt = r.CreatedAt,
                }).ToList(),
                OverduePayments = overdueInvoices.Select(i => new StaffWorkspaceOverduePaymentDto
                {
                    InvoiceId = i.Id,
                    InvoiceNumber = i.InvoiceNumber,
                    CustomerName = i.Sale?.Customer?.Name ?? "Customer",
                    BalanceAmount = i.BalanceAmount,
                    DueDate = i.DueDate,
                    OverdueDays = Math.Max(0, (int)(todayStart - i.DueDate.Date).TotalDays),
                }).ToList(),
                RecentSales = recentSales.Select(s => new StaffWorkspaceSaleDto
                {
                    Id = s.Id,
                    CustomerName = s.Customer?.Name ?? "Customer",
                    FinalAmount = s.TotalAmount,
                    Date = s.Date,
                    InvoiceNumber = s.Invoice?.InvoiceNumber ?? $"SALE-{s.Id}",
                    PaymentStatus = NormalizePaymentStatus(s.Invoice),
                }).ToList(),
            };
        }

        private static string NormalizePaymentStatus(Domain.Entities.Invoice? invoice)
        {
            if (invoice == null)
            {
                return "CREDIT";
            }

            if (invoice.IsPaid || string.Equals(invoice.PaymentStatus, InvoicePaymentStatus.Paid, StringComparison.OrdinalIgnoreCase))
            {
                return "PAID";
            }

            if (string.Equals(invoice.PaymentStatus, InvoicePaymentStatus.Partial, StringComparison.OrdinalIgnoreCase))
            {
                return "PARTIAL";
            }

            return "CREDIT";
        }

        private static string ResolveAccountLabel(string? email, string? displayName)
        {
            if (!string.IsNullOrWhiteSpace(email))
            {
                var local = email.Split('@')[0].Trim();
                if (!string.IsNullOrEmpty(local))
                {
                    return local.ToLowerInvariant();
                }
            }

            if (!string.IsNullOrWhiteSpace(displayName))
            {
                return displayName.Trim().Replace(' ', '.').ToLowerInvariant();
            }

            return "staff";
        }

        private static decimal ComputeTrendPercent(decimal current, decimal previous)
        {
            if (previous == 0m)
            {
                return current > 0m ? 100m : 0m;
            }

            return Math.Round((current - previous) / previous * 100m, 1);
        }

        public async Task<FinancialReportDto> GetFinancialReportAsync(
            string? period,
            DateTime? from,
            DateTime? to,
            CancellationToken cancellationToken = default)
        {
            var normalizedPeriod = NormalizePeriod(period);
            var (rangeFrom, rangeTo) = ResolveDateRange(normalizedPeriod, from, to);

            var sales = await _db.Sales
                .AsNoTracking()
                .Include(s => s.Items)
                .Where(s => s.Date >= rangeFrom && s.Date < rangeTo)
                .ToListAsync(cancellationToken);

            var purchases = await _db.PurchaseInvoices
                .AsNoTracking()
                .Where(p => p.Date >= rangeFrom && p.Date < rangeTo)
                .ToListAsync(cancellationToken);

            var avgCostByPart = await _db.PurchaseItems
                .AsNoTracking()
                .GroupBy(i => i.PartId)
                .Select(g => new { PartId = g.Key, AvgCost = g.Average(i => i.Price) })
                .ToDictionaryAsync(x => x.PartId, x => x.AvgCost, cancellationToken);

            var revenue = sales.Sum(s => s.TotalAmount);
            var purchaseCost = purchases.Sum(p => p.TotalAmount);
            var cogs = sales
                .SelectMany(s => s.Items)
                .Sum(i => i.Quantity * avgCostByPart.GetValueOrDefault(i.PartId, 0m));
            var grossProfit = revenue - cogs;

            var breakdown = BuildBreakdown(normalizedPeriod, rangeFrom, rangeTo, sales, purchases, avgCostByPart);

            return new FinancialReportDto
            {
                Period = normalizedPeriod,
                From = rangeFrom,
                To = rangeTo.AddTicks(-1),
                Revenue = revenue,
                PurchaseCost = purchaseCost,
                GrossProfit = grossProfit,
                SalesCount = sales.Count,
                PurchaseCount = purchases.Count,
                Breakdown = breakdown
            };
        }

        private static string NormalizePeriod(string? period)
        {
            var p = (period ?? "monthly").Trim().ToLowerInvariant();
            return p switch
            {
                "daily" or "monthly" or "yearly" or "custom" => p,
                _ => "custom"
            };
        }

        private static (DateTime From, DateTime To) ResolveDateRange(string period, DateTime? from, DateTime? to)
        {
            var utcNow = DateTime.UtcNow;

            if (from.HasValue && to.HasValue)
            {
                var start = DateTime.SpecifyKind(from.Value.Date, DateTimeKind.Utc);
                var end = DateTime.SpecifyKind(to.Value.Date.AddDays(1), DateTimeKind.Utc);
                return (start, end);
            }

            if (from.HasValue)
            {
                var start = DateTime.SpecifyKind(from.Value.Date, DateTimeKind.Utc);
                return period switch
                {
                    "daily" => (start, start.AddDays(1)),
                    "monthly" => (
                        new DateTime(start.Year, start.Month, 1, 0, 0, 0, DateTimeKind.Utc),
                        new DateTime(start.Year, start.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(1)),
                    "yearly" => (
                        new DateTime(start.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                        new DateTime(start.Year + 1, 1, 1, 0, 0, 0, DateTimeKind.Utc)),
                    _ => (start, start.AddDays(1))
                };
            }

            return period switch
            {
                "daily" => (utcNow.Date, utcNow.Date.AddDays(1)),
                "monthly" => (new DateTime(utcNow.Year, utcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc),
                    new DateTime(utcNow.Year, utcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(1)),
                "yearly" => (new DateTime(utcNow.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    new DateTime(utcNow.Year + 1, 1, 1, 0, 0, 0, DateTimeKind.Utc)),
                _ => (utcNow.Date.AddDays(-30), utcNow.Date.AddDays(1))
            };
        }

        private static List<FinancialPeriodBreakdownDto> BuildBreakdown(
            string period,
            DateTime rangeFrom,
            DateTime rangeTo,
            List<Domain.Entities.Sale> sales,
            List<Domain.Entities.PurchaseInvoice> purchases,
            Dictionary<int, decimal> avgCostByPart)
        {
            var buckets = new List<(DateTime From, DateTime To, string Label)>();

            switch (period)
            {
                case "daily":
                    for (var hour = 0; hour < 24; hour++)
                    {
                        var bucketStart = rangeFrom.AddHours(hour);
                        var bucketEnd = bucketStart.AddHours(1);
                        if (bucketEnd > rangeTo)
                        {
                            break;
                        }

                        buckets.Add((bucketStart, bucketEnd, bucketStart.ToString("HH:mm")));
                    }
                    break;
                case "monthly":
                    for (var d = rangeFrom; d < rangeTo; d = d.AddDays(1))
                    {
                        buckets.Add((d, d.AddDays(1), d.ToString("MMM dd")));
                    }
                    break;
                case "yearly":
                    for (var m = rangeFrom; m < rangeTo; m = m.AddMonths(1))
                    {
                        buckets.Add((m, m.AddMonths(1), m.ToString("MMM yyyy")));
                    }
                    break;
                default:
                    var span = rangeTo - rangeFrom;
                    if (span.TotalDays <= 31)
                    {
                        for (var d = rangeFrom; d < rangeTo; d = d.AddDays(1))
                        {
                            buckets.Add((d, d.AddDays(1), d.ToString("MMM dd")));
                        }
                    }
                    else
                    {
                        for (var m = rangeFrom; m < rangeTo; m = m.AddMonths(1))
                        {
                            buckets.Add((m, m.AddMonths(1), m.ToString("MMM yyyy")));
                        }
                    }
                    break;
            }

            return buckets.Select(b =>
            {
                var bucketSales = sales.Where(s => s.Date >= b.From && s.Date < b.To).ToList();
                var bucketPurchases = purchases.Where(p => p.Date >= b.From && p.Date < b.To).ToList();
                var bucketRevenue = bucketSales.Sum(s => s.TotalAmount);
                var bucketPurchaseCost = bucketPurchases.Sum(p => p.TotalAmount);
                var bucketCogs = bucketSales
                    .SelectMany(s => s.Items)
                    .Sum(i => i.Quantity * avgCostByPart.GetValueOrDefault(i.PartId, 0m));

                return new FinancialPeriodBreakdownDto
                {
                    Label = b.Label,
                    From = b.From,
                    To = b.To.AddTicks(-1),
                    Revenue = bucketRevenue,
                    PurchaseCost = bucketPurchaseCost,
                    GrossProfit = bucketRevenue - bucketCogs
                };
            }).ToList();
        }
    }
}
