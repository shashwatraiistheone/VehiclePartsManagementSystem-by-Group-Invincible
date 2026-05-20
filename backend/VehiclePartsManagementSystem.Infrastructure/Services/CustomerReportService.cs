using Microsoft.EntityFrameworkCore;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;
using VehiclePartsManagementSystem.Domain.Entities;
using VehiclePartsManagementSystem.Infrastructure.Data;

namespace VehiclePartsManagementSystem.Infrastructure.Services
{
    public class CustomerReportService : ICustomerReportService
    {
        private const decimal LoyaltyOrderThreshold = 5000m;

        private readonly AppDbContext _db;

        public CustomerReportService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<CustomerReportsDto> GetReportsAsync(CancellationToken cancellationToken = default)
        {
            var top = await GetTopSpendersAsync(null, null, null, cancellationToken);
            var regular = await GetRegularCustomersAsync(null, null, null, cancellationToken);
            var pending = await GetPendingCreditsAsync(null, null, null, null, cancellationToken);

            return new CustomerReportsDto
            {
                HighSpenders = top.Select(MapLegacyRow).ToList(),
                RegularCustomers = regular.Select(MapLegacyRegular).ToList(),
                PendingCreditCustomers = pending.Items
                    .GroupBy(p => p.CustomerId)
                    .Select(g => new CustomerReportRowDto
                    {
                        CustomerId = g.Key,
                        Name = g.First().CustomerName,
                        Phone = string.Empty,
                        Email = g.First().CustomerEmail,
                        PurchaseCount = 0,
                        TotalSpent = 0,
                        PendingCreditAmount = g.Sum(x => x.OutstandingAmount),
                    })
                    .OrderByDescending(r => r.PendingCreditAmount)
                    .ToList(),
            };
        }

        public async Task<CustomerReportsDashboardDto> GetDashboardAsync(
            DateTime? from,
            DateTime? to,
            CancellationToken cancellationToken = default)
        {
            var (rangeStart, rangeEnd) = NormalizeRange(from, to);
            var hasRange = from.HasValue || to.HasValue;

            var salesQuery = _db.Sales.AsNoTracking().AsQueryable();
            if (hasRange)
            {
                salesQuery = salesQuery.Where(s => s.Date >= rangeStart && s.Date < rangeEnd);
            }

            var totalSales = await salesQuery.CountAsync(cancellationToken);
            var totalRevenue = await salesQuery.SumAsync(s => (decimal?)s.TotalAmount, cancellationToken) ?? 0m;

            var totalCustomers = hasRange
                ? await salesQuery.Select(s => s.CustomerId).Distinct().CountAsync(cancellationToken)
                : await _db.Customers.CountAsync(cancellationToken);

            var invoiceQuery = _db.Invoices.AsNoTracking()
                .Where(i => !i.IsPaid && i.BalanceAmount > 0);

            if (hasRange)
            {
                invoiceQuery = invoiceQuery.Where(i => i.CreatedDate >= rangeStart && i.CreatedDate < rangeEnd);
            }

            var pendingCredit = await invoiceQuery.SumAsync(i => (decimal?)i.BalanceAmount, cancellationToken) ?? 0m;

            return new CustomerReportsDashboardDto
            {
                TotalCustomers = totalCustomers,
                TotalRevenue = totalRevenue,
                PendingCredit = pendingCredit,
                TotalSales = totalSales,
            };
        }

        public async Task<List<TopSpenderReportRowDto>> GetTopSpendersAsync(
            DateTime? from,
            DateTime? to,
            string? search,
            CancellationToken cancellationToken = default)
        {
            var (rangeStart, rangeEnd) = NormalizeRange(from, to);
            var hasRange = from.HasValue || to.HasValue;
            var term = search?.Trim().ToLowerInvariant();

            var salesQuery = _db.Sales.AsNoTracking().AsQueryable();
            if (hasRange)
            {
                salesQuery = salesQuery.Where(s => s.Date >= rangeStart && s.Date < rangeEnd);
            }

            var grouped = await salesQuery
                .GroupBy(s => s.CustomerId)
                .Select(g => new
                {
                    CustomerId = g.Key,
                    PurchaseCount = g.Count(),
                    TotalSpent = g.Sum(s => s.TotalAmount),
                    LastPurchaseDate = g.Max(s => s.Date),
                    QualifyingOrders = g.Count(s => s.OriginalTotalAmount >= LoyaltyOrderThreshold),
                    HasDiscount = g.Any(s => s.DiscountAmount > 0),
                    LargestSubtotal = g.Max(s => s.OriginalTotalAmount),
                })
                .Where(g => g.TotalSpent > 0)
                .OrderByDescending(g => g.TotalSpent)
                .Take(100)
                .ToListAsync(cancellationToken);

            if (grouped.Count == 0)
            {
                return new List<TopSpenderReportRowDto>();
            }

            var customerIds = grouped.Select(g => g.CustomerId).ToList();
            var customers = await _db.Customers
                .AsNoTracking()
                .Where(c => customerIds.Contains(c.Id))
                .ToDictionaryAsync(c => c.Id, cancellationToken);

            var rows = grouped.Select(g =>
            {
                customers.TryGetValue(g.CustomerId, out var customer);
                var loyaltyPoints = ComputeLoyaltyPoints(g.TotalSpent, g.QualifyingOrders);
                var tier = ResolveTier(
                    g.QualifyingOrders > 0 || g.HasDiscount,
                    g.QualifyingOrders,
                    g.LargestSubtotal);

                return new TopSpenderReportRowDto
                {
                    CustomerId = g.CustomerId,
                    CustomerName = customer?.Name ?? "Unknown",
                    Email = customer?.Email ?? string.Empty,
                    Phone = customer?.Phone ?? string.Empty,
                    TotalSpent = g.TotalSpent,
                    LoyaltyPoints = loyaltyPoints,
                    PurchaseCount = g.PurchaseCount,
                    LastPurchaseDate = g.LastPurchaseDate,
                    LoyaltyTier = tier,
                };
            }).ToList();

            if (!string.IsNullOrEmpty(term))
            {
                rows = rows
                    .Where(r =>
                        r.CustomerName.ToLowerInvariant().Contains(term)
                        || r.Email.ToLowerInvariant().Contains(term)
                        || r.Phone.Contains(term, StringComparison.OrdinalIgnoreCase))
                    .ToList();
            }

            return rows;
        }

        public async Task<List<RegularCustomerReportRowDto>> GetRegularCustomersAsync(
            DateTime? from,
            DateTime? to,
            string? search,
            CancellationToken cancellationToken = default)
        {
            var (rangeStart, rangeEnd) = NormalizeRange(from, to);
            var hasRange = from.HasValue || to.HasValue;
            var term = search?.Trim().ToLowerInvariant();
            var monthStart = DateTime.UtcNow.Date.AddDays(-30);

            var salesQuery = _db.Sales.AsNoTracking().AsQueryable();
            if (hasRange)
            {
                salesQuery = salesQuery.Where(s => s.Date >= rangeStart && s.Date < rangeEnd);
            }

            var grouped = await salesQuery
                .GroupBy(s => s.CustomerId)
                .Select(g => new
                {
                    CustomerId = g.Key,
                    PurchaseCount = g.Count(),
                    TotalSpent = g.Sum(s => s.TotalAmount),
                    MonthlyVisits = g.Count(s => s.Date >= monthStart),
                    QualifyingOrders = g.Count(s => s.OriginalTotalAmount >= LoyaltyOrderThreshold),
                    HasDiscount = g.Any(s => s.DiscountAmount > 0),
                    LargestSubtotal = g.Max(s => s.OriginalTotalAmount),
                })
                .Where(g => g.PurchaseCount >= 2 || g.MonthlyVisits >= 2)
                .ToListAsync(cancellationToken);

            if (grouped.Count == 0)
            {
                return new List<RegularCustomerReportRowDto>();
            }

            var customerIds = grouped.Select(g => g.CustomerId).ToList();
            var customers = await _db.Customers
                .AsNoTracking()
                .Where(c => customerIds.Contains(c.Id))
                .ToDictionaryAsync(c => c.Id, cancellationToken);

            var rows = grouped.Select(g =>
            {
                customers.TryGetValue(g.CustomerId, out var customer);
                var isEligible = g.QualifyingOrders > 0 || g.HasDiscount;
                var tier = ResolveTier(isEligible, g.QualifyingOrders, g.LargestSubtotal);
                var progressPercent = g.LargestSubtotal > 0
                    ? (int)Math.Min(100, Math.Round(g.LargestSubtotal / LoyaltyOrderThreshold * 100))
                    : 0;
                var engagement = ComputeEngagementScore(g.PurchaseCount, g.MonthlyVisits, tier, progressPercent);
                var avgValue = g.PurchaseCount > 0 ? g.TotalSpent / g.PurchaseCount : 0m;
                var engagementLevel = ResolveEngagementLevel(g.PurchaseCount, g.MonthlyVisits);

                return new RegularCustomerReportRowDto
                {
                    CustomerId = g.CustomerId,
                    CustomerName = customer?.Name ?? "Unknown",
                    Email = customer?.Email ?? string.Empty,
                    PurchaseCount = g.PurchaseCount,
                    MonthlyVisits = g.MonthlyVisits,
                    AverageOrderValue = avgValue,
                    EngagementLevel = engagementLevel,
                    LoyaltyTier = tier,
                    EngagementScore = engagement,
                    TotalSpent = g.TotalSpent,
                };
            })
            .OrderByDescending(r => r.EngagementScore)
            .ThenByDescending(r => r.PurchaseCount)
            .Take(100)
            .ToList();

            if (!string.IsNullOrEmpty(term))
            {
                rows = rows
                    .Where(r =>
                        r.CustomerName.ToLowerInvariant().Contains(term)
                        || r.Email.ToLowerInvariant().Contains(term))
                    .ToList();
            }

            return rows;
        }

        public async Task<PendingCreditsReportDto> GetPendingCreditsAsync(
            DateTime? from,
            DateTime? to,
            string? search,
            string? overdueStatus,
            CancellationToken cancellationToken = default)
        {
            var (rangeStart, rangeEnd) = NormalizeRange(from, to);
            var hasRange = from.HasValue || to.HasValue;
            var term = search?.Trim().ToLowerInvariant();
            var bucketFilter = overdueStatus?.Trim().ToLowerInvariant();
            var today = DateTime.UtcNow.Date;

            var query = _db.Invoices
                .AsNoTracking()
                .Include(i => i.Sale)
                    .ThenInclude(s => s!.Customer)
                .Where(i => !i.IsPaid && i.BalanceAmount > 0);

            if (hasRange)
            {
                query = query.Where(i => i.CreatedDate >= rangeStart && i.CreatedDate < rangeEnd);
            }

            var invoices = await query
                .OrderByDescending(i => i.BalanceAmount)
                .ThenByDescending(i => i.CreatedDate)
                .Take(500)
                .ToListAsync(cancellationToken);

            var rows = invoices.Select(i =>
            {
                var due = i.DueDate == default ? i.CreatedDate.AddDays(30) : i.DueDate;
                var salesDate = i.Sale?.Date ?? i.CreatedDate;
                var daysOutstanding = Math.Max(0, (today - salesDate.Date).Days);
                var dueOverdueDays = Math.Max(0, (today - due.Date).Days);
                var total = i.Sale?.TotalAmount ?? (i.PaidAmount + i.BalanceAmount);
                var customer = i.Sale?.Customer;
                var bucket = ResolveAgingBucket(daysOutstanding);

                return new PendingCreditReportRowDto
                {
                    InvoiceId = i.Id,
                    InvoiceNumber = i.InvoiceNumber,
                    CustomerId = customer?.Id ?? 0,
                    CustomerName = customer?.Name ?? "Unknown",
                    CustomerEmail = customer?.Email ?? string.Empty,
                    CustomerPhone = customer?.Phone ?? string.Empty,
                    OutstandingAmount = i.BalanceAmount,
                    OriginalAmount = total,
                    PaidAmount = i.PaidAmount,
                    DaysOutstanding = daysOutstanding,
                    OverdueDays = dueOverdueDays,
                    AgingBucket = bucket,
                    DueDate = due,
                    SalesDate = salesDate,
                    InvoiceDate = i.CreatedDate,
                    Status = string.IsNullOrWhiteSpace(i.PaymentStatus)
                        ? (i.PaidAmount > 0 ? "Partial" : "Credit")
                        : i.PaymentStatus,
                };
            }).ToList();

            if (!string.IsNullOrEmpty(term))
            {
                rows = rows
                    .Where(r =>
                        r.CustomerName.ToLowerInvariant().Contains(term)
                        || r.InvoiceNumber.ToLowerInvariant().Contains(term)
                        || r.CustomerEmail.ToLowerInvariant().Contains(term)
                        || r.CustomerPhone.Contains(term, StringComparison.OrdinalIgnoreCase))
                    .ToList();
            }

            if (!string.IsNullOrEmpty(bucketFilter) && bucketFilter != "all")
            {
                rows = rows.Where(r => r.AgingBucket == bucketFilter).ToList();
            }

            return new PendingCreditsReportDto
            {
                OutstandingTotal = rows.Sum(r => r.OutstandingAmount),
                Items = rows,
            };
        }

        private static string ResolveAgingBucket(int daysOutstanding)
        {
            if (daysOutstanding <= 30)
            {
                return "current";
            }

            if (daysOutstanding <= 60)
            {
                return "warning";
            }

            return "overdue";
        }

        private static (DateTime Start, DateTime End) NormalizeRange(DateTime? from, DateTime? to)
        {
            var start = from.HasValue
                ? DateTime.SpecifyKind(from.Value.Date, DateTimeKind.Utc)
                : DateTime.MinValue;
            var end = to.HasValue
                ? DateTime.SpecifyKind(to.Value.Date.AddDays(1), DateTimeKind.Utc)
                : DateTime.MaxValue;
            return (start, end);
        }

        private static int ComputeLoyaltyPoints(decimal totalSpent, int qualifyingOrderCount)
        {
            return (int)Math.Round(totalSpent * 0.2184m) + qualifyingOrderCount * 200;
        }

        private static string ResolveTier(bool isEligible, int qualifyingOrderCount, decimal largestSubtotal)
        {
            var progressPercent = largestSubtotal > 0
                ? (int)Math.Min(100, Math.Round(largestSubtotal / LoyaltyOrderThreshold * 100))
                : 0;

            if (isEligible && qualifyingOrderCount >= 2)
            {
                return "GOLD PLUS";
            }

            if (isEligible)
            {
                return "GOLD";
            }

            if (progressPercent >= 50)
            {
                return "SILVER";
            }

            return "MEMBER";
        }

        private static string ResolveEngagementLevel(int purchaseCount, int monthlyVisits)
        {
            if (purchaseCount >= 5 || monthlyVisits >= 3)
            {
                return "Frequent";
            }

            if (purchaseCount >= 3 || monthlyVisits >= 2)
            {
                return "Regular";
            }

            if (purchaseCount >= 2 && monthlyVisits >= 1)
            {
                return "Occasional";
            }

            if (purchaseCount >= 2)
            {
                return "Inactive";
            }

            return "Inactive";
        }

        private static int ComputeEngagementScore(
            int purchaseCount,
            int monthlyVisits,
            string tier,
            int progressPercent)
        {
            var tierBonus = tier switch
            {
                "GOLD PLUS" => 28,
                "GOLD" => 20,
                "SILVER" => 12,
                _ => 4,
            };

            var score = purchaseCount * 10 + monthlyVisits * 12 + tierBonus + progressPercent / 5;
            return Math.Min(100, score);
        }

        private static CustomerReportRowDto MapLegacyRow(TopSpenderReportRowDto row)
        {
            return new CustomerReportRowDto
            {
                CustomerId = row.CustomerId,
                Name = row.CustomerName,
                Phone = row.Phone,
                Email = row.Email,
                PurchaseCount = row.PurchaseCount,
                TotalSpent = row.TotalSpent,
                PendingCreditAmount = 0,
            };
        }

        private static CustomerReportRowDto MapLegacyRegular(RegularCustomerReportRowDto row)
        {
            return new CustomerReportRowDto
            {
                CustomerId = row.CustomerId,
                Name = row.CustomerName,
                Phone = string.Empty,
                Email = row.Email,
                PurchaseCount = row.PurchaseCount,
                TotalSpent = row.TotalSpent,
                PendingCreditAmount = 0,
            };
        }
    }
}
