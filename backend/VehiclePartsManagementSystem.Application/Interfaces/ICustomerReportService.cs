using VehiclePartsManagementSystem.Application.DTOs;

namespace VehiclePartsManagementSystem.Application.Interfaces
{
    public interface ICustomerReportService
    {
        Task<CustomerReportsDto> GetReportsAsync(CancellationToken cancellationToken = default);

        Task<CustomerReportsDashboardDto> GetDashboardAsync(
            DateTime? from,
            DateTime? to,
            CancellationToken cancellationToken = default);

        Task<List<TopSpenderReportRowDto>> GetTopSpendersAsync(
            DateTime? from,
            DateTime? to,
            string? search,
            CancellationToken cancellationToken = default);

        Task<List<RegularCustomerReportRowDto>> GetRegularCustomersAsync(
            DateTime? from,
            DateTime? to,
            string? search,
            CancellationToken cancellationToken = default);

        Task<PendingCreditsReportDto> GetPendingCreditsAsync(
            DateTime? from,
            DateTime? to,
            string? search,
            string? overdueStatus = null,
            CancellationToken cancellationToken = default);
    }
}
