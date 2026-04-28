using System.Collections.Generic;
using VehiclePartsManagementSystem.Domain.Entities;

namespace VehiclePartsManagementSystem.Application.DTOs
{
    public class ReportDto
    {
        public int TotalCustomers { get; set; }
        public int TotalSales { get; set; }
        public int TotalPurchases { get; set; }
        public decimal TotalRevenue { get; set; }
        public List<Part> LowStockParts { get; set; } = new();
    }
}
