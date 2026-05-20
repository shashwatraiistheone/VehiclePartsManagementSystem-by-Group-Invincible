using System;
using System.Collections.Generic;

namespace VehiclePartsManagementSystem.Application.DTOs
{
    public class FinancialReportDto
    {
        public string Period { get; set; } = "custom";
        public DateTime From { get; set; }
        public DateTime To { get; set; }
        public decimal Revenue { get; set; }
        public decimal PurchaseCost { get; set; }
        public decimal GrossProfit { get; set; }
        public int SalesCount { get; set; }
        public int PurchaseCount { get; set; }
        public List<FinancialPeriodBreakdownDto> Breakdown { get; set; } = new();
    }

    public class FinancialPeriodBreakdownDto
    {
        public string Label { get; set; } = string.Empty;
        public DateTime From { get; set; }
        public DateTime To { get; set; }
        public decimal Revenue { get; set; }
        public decimal PurchaseCost { get; set; }
        public decimal GrossProfit { get; set; }
    }
}
