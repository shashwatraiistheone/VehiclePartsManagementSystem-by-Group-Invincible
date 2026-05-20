using System.Collections.Generic;

namespace VehiclePartsManagementSystem.Application.DTOs
{
    public class DashboardAnalyticsDto
    {
        public List<string> Labels { get; set; } = new();
        public List<decimal> MonthlyRevenue { get; set; } = new();
        public List<int> MonthlySalesCount { get; set; } = new();
        public List<int> MonthlyUnitsSold { get; set; } = new();
        public int PendingCreditsCount { get; set; }
        public decimal PendingCreditsAmount { get; set; }
        public decimal RevenueTrendPercent { get; set; }
        public decimal CustomersTrendPercent { get; set; }
        public decimal SalesTrendPercent { get; set; }
        public decimal LowStockTrendPercent { get; set; }
        public decimal PendingCreditsTrendPercent { get; set; }
    }
}
