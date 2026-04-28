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
            var totalCustomersTask = _db.Customers.CountAsync();
            var totalSalesTask = _db.Sales.CountAsync();
            var totalRevenueTask = _db.Sales.SumAsync(s => (decimal?)s.TotalAmount);
            var lowStockPartsCountTask = _db.Parts.CountAsync(p => p.Quantity < 5);

            await Task.WhenAll(totalCustomersTask, totalSalesTask, totalRevenueTask, lowStockPartsCountTask);

            return new ReportDto
            {
                TotalCustomers = await totalCustomersTask,
                TotalSales = await totalSalesTask,
                TotalRevenue = await totalRevenueTask ?? 0m,
                LowStockPartsCount = await lowStockPartsCountTask
            };
        }
    }
}
