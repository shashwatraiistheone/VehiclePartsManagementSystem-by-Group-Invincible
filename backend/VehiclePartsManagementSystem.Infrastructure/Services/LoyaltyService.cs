using Microsoft.EntityFrameworkCore;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;
using VehiclePartsManagementSystem.Infrastructure.Data;

namespace VehiclePartsManagementSystem.Infrastructure.Services
{
    public class LoyaltyService : ILoyaltyService
    {
        public const decimal OrderThreshold = 5000m;
        public const int DiscountPercent = 10;

        private readonly AppDbContext _db;

        public LoyaltyService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<CustomerLoyaltyDto?> GetCustomerLoyaltyAsync(
            int customerId,
            CancellationToken cancellationToken = default)
        {
            if (!await _db.Customers.AnyAsync(c => c.Id == customerId, cancellationToken))
            {
                return null;
            }

            var purchases = await _db.Sales
                .AsNoTracking()
                .Where(s => s.CustomerId == customerId)
                .Select(s => new { s.OriginalTotalAmount, s.TotalAmount, s.DiscountAmount })
                .ToListAsync(cancellationToken);

            var subtotals = purchases.Select(p => p.OriginalTotalAmount).ToList();
            var totalSpent = purchases.Sum(p => p.TotalAmount);
            var largestOrderSubtotal = subtotals.Count > 0 ? subtotals.Max() : 0m;
            var qualifyingOrderCount = subtotals.Count(t => t >= OrderThreshold);
            var hasDiscountApplied = purchases.Any(p => p.DiscountAmount > 0);
            var isEligible = qualifyingOrderCount > 0 || hasDiscountApplied;
            var progressPercent = largestOrderSubtotal > 0
                ? (int)Math.Min(100, Math.Round(largestOrderSubtotal / OrderThreshold * 100))
                : 0;
            var remainingAmount = Math.Max(0, OrderThreshold - largestOrderSubtotal);

            var loyaltyPoints = (int)Math.Round(totalSpent * 0.2184m) + qualifyingOrderCount * 200;
            var tier = ResolveTier(isEligible, qualifyingOrderCount, progressPercent);
            var nextDiscountMessage = isEligible
                ? $"You've unlocked {DiscountPercent}% off on qualifying orders over Rs. {OrderThreshold:N0}."
                : largestOrderSubtotal > 0
                    ? $"Earn {DiscountPercent}% off — spend Rs. {remainingAmount:N0} more on a single order over Rs. {OrderThreshold:N0}."
                    : $"Earn {DiscountPercent}% off on purchases over Rs. {OrderThreshold:N0}.";

            return new CustomerLoyaltyDto
            {
                CustomerId = customerId,
                LoyaltyPoints = loyaltyPoints,
                TotalSpent = totalSpent,
                OrderThreshold = OrderThreshold,
                DiscountPercent = DiscountPercent,
                IsEligible = isEligible,
                ProgressPercent = progressPercent,
                LargestOrderSubtotal = largestOrderSubtotal,
                RemainingAmount = remainingAmount,
                QualifyingOrderCount = qualifyingOrderCount,
                Tier = tier,
                NextDiscountMessage = nextDiscountMessage,
            };
        }

        public async Task<LoyaltyProgramSummaryDto> GetProgramSummaryAsync(
            CancellationToken cancellationToken = default)
        {
            var totalCustomers = await _db.Customers.CountAsync(cancellationToken);

            var salesGrouped = await _db.Sales
                .AsNoTracking()
                .GroupBy(s => s.CustomerId)
                .Select(g => new
                {
                    CustomerId = g.Key,
                    TotalSpent = g.Sum(s => s.TotalAmount),
                    QualifyingOrders = g.Count(s => s.OriginalTotalAmount >= OrderThreshold),
                    HasDiscount = g.Any(s => s.DiscountAmount > 0),
                    LargestSubtotal = g.Max(s => s.OriginalTotalAmount),
                })
                .ToListAsync(cancellationToken);

            var customerIds = salesGrouped.Select(g => g.CustomerId).ToList();
            var customers = customerIds.Count == 0
                ? new Dictionary<int, Domain.Entities.Customer>()
                : await _db.Customers
                    .AsNoTracking()
                    .Where(c => customerIds.Contains(c.Id))
                    .ToDictionaryAsync(c => c.Id, cancellationToken);

            var rows = new List<LoyaltyProgramCustomerRowDto>();
            var goldPlusCount = 0;
            var goldCount = 0;
            var silverCount = 0;
            var eligibleCustomers = 0;

            foreach (var g in salesGrouped)
            {
                var isEligible = g.QualifyingOrders > 0 || g.HasDiscount;
                var progressPercent = g.LargestSubtotal > 0
                    ? (int)Math.Min(100, Math.Round(g.LargestSubtotal / OrderThreshold * 100))
                    : 0;
                var tier = ResolveTier(isEligible, g.QualifyingOrders, progressPercent);
                var loyaltyPoints = (int)Math.Round(g.TotalSpent * 0.2184m) + g.QualifyingOrders * 200;

                if (isEligible)
                {
                    eligibleCustomers++;
                }

                switch (tier)
                {
                    case "GOLD PLUS":
                        goldPlusCount++;
                        break;
                    case "GOLD":
                        goldCount++;
                        break;
                    case "SILVER":
                        silverCount++;
                        break;
                }

                customers.TryGetValue(g.CustomerId, out var customer);
                rows.Add(new LoyaltyProgramCustomerRowDto
                {
                    CustomerId = g.CustomerId,
                    CustomerName = customer?.Name ?? "Unknown",
                    Email = customer?.Email ?? string.Empty,
                    Tier = tier,
                    LoyaltyPoints = loyaltyPoints,
                    TotalSpent = g.TotalSpent,
                    QualifyingOrderCount = g.QualifyingOrders,
                    IsEligible = isEligible,
                });
            }

            var memberCount = totalCustomers - goldPlusCount - goldCount - silverCount;
            if (memberCount < 0)
            {
                memberCount = 0;
            }

            rows = rows
                .OrderByDescending(r => r.IsEligible)
                .ThenByDescending(r => r.LoyaltyPoints)
                .ThenBy(r => r.CustomerName)
                .ToList();

            return new LoyaltyProgramSummaryDto
            {
                TotalCustomers = totalCustomers,
                EligibleCustomers = eligibleCustomers,
                GoldPlusCount = goldPlusCount,
                GoldCount = goldCount,
                SilverCount = silverCount,
                MemberCount = memberCount,
                OrderThreshold = OrderThreshold,
                DiscountPercent = DiscountPercent,
                Customers = rows,
            };
        }

        private static string ResolveTier(bool isEligible, int qualifyingOrderCount, int progressPercent)
        {
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
    }
}
