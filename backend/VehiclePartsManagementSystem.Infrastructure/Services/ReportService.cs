using Microsoft.EntityFrameworkCore;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;
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

        public async Task<ReportDto> GetDashboardAsync()
        {
            var totalCustomers = await _db.Customers.CountAsync();
            var totalSales = await _db.Sales.CountAsync();
            var totalPurchases = await _db.PurchaseInvoices.CountAsync();
            var totalRevenue = await _db.Sales.SumAsync(s => (decimal?)s.TotalAmount) ?? 0m;

            var lowStockParts = await _db.Parts
                .Where(p => p.Quantity < 5)
                .OrderBy(p => p.Quantity)
                .ThenBy(p => p.Name)
                .ToListAsync();

            return new ReportDto
            {
                TotalCustomers = totalCustomers,
                TotalSales = totalSales,
                TotalPurchases = totalPurchases,
                TotalRevenue = totalRevenue,
                LowStockParts = lowStockParts
            };
        }
    }
}
